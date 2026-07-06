import { Router } from "express";
import { z } from "zod";
import type { Db } from "@paperclipai/db";
import { validate } from "../middleware/validate.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { logActivity } from "../services/activity-log.js";
import { atlasKnowledgeService, AtlasPolicyError } from "../atlas/knowledge-service.js";
import { getAtlasToolManifest, ATLAS_AGENT_TOOLS } from "../atlas/tools.js";
import { atlasGoalBridge } from "../atlas/goal-bridge.js";
import { openGitHubPullRequest, AtlasExternalError } from "../atlas/external/github.js";
import { getSlackChannelInfo } from "../atlas/external/slack.js";
import { appendAuditEvent, DEFAULT_TRAVERSE_MAX_DEPTH } from "../atlas/knowledge-service.js";
import { renderEntityPage } from "../atlas/entity-page.js";
import { buildCanonBrowseIndex } from "../atlas/public-read.js";

const createRecordSchema = z.object({
  record_type: z.string().min(1),
  lifecycle: z.string().optional(),
  review_state: z.string().optional(),
  visibility: z.string().optional(),
  title: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
  source_refs: z.array(z.string()).optional(),
});

const patchRecordSchema = z.object({
  lifecycle: z.string().optional(),
  review_state: z.string().optional(),
  visibility: z.string().optional(),
  title: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
  source_refs: z.array(z.string()).optional(),
});

const createLinkSchema = z.object({
  from_record_id: z.string().min(1),
  to_record_id: z.string().min(1),
  link_type: z.string().min(1),
});

const permissionCheckSchema = z.object({
  action: z.string().min(1),
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
});

function handleAtlasError(res: import("express").Response, error: unknown) {
  if (error instanceof AtlasPolicyError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  throw error;
}

function actorFromReq(req: Parameters<typeof getActorInfo>[0]) {
  const info = getActorInfo(req);
  return {
    type: req.actor.type,
    actorId: info.actorId,
    agentId: info.agentId,
  };
}

function keyScopeSatisfiesToolScope(req: Parameters<typeof getActorInfo>[0], requiredScope: string) {
  if (req.actor.type !== "agent" || req.actor.source !== "agent_key") {
    return true;
  }
  if (!requiredScope) return true;
  return req.actor.keyScope?.kind === "standard";
}

export function atlasRoutes(db: Db) {
  const router = Router();
  const knowledge = atlasKnowledgeService(db);
  const goals = atlasGoalBridge(db);

  router.get("/companies/:companyId/atlas/manifest", (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    res.json(getAtlasToolManifest());
  });

  router.post("/companies/:companyId/atlas/tools/:tool", async (req, res) => {
    const companyId = req.params.companyId as string;
    const tool = req.params.tool as string;
    assertCompanyAccess(req, companyId);
    const toolDefinition = ATLAS_AGENT_TOOLS.find((candidate) => candidate.name === tool);
    if (toolDefinition && !keyScopeSatisfiesToolScope(req, toolDefinition.required_scope)) {
      res.status(403).json({
        error: "tool_scope_denied",
        message: `Atlas tool ${tool} requires scope ${toolDefinition.required_scope}`,
        details: {
          component: "atlas.tool_router",
          root_cause: "request key scope does not satisfy the tool manifest required_scope",
          failure_type: "authorization",
          required_scope: toolDefinition.required_scope,
          key_scope_kind: req.actor.keyScope?.kind ?? "missing",
        },
      });
      return;
    }
    const actor = actorFromReq(req);
    const input = (req.body ?? {}) as Record<string, unknown>;

    try {
      switch (tool) {
        case "get_workspace_overview":
          res.json(await knowledge.getOverview(companyId));
          return;
        case "query_object": {
          const objectId = String(input.object_id ?? "");
          const record = await knowledge.getRecord(companyId, objectId);
          if (!record) {
            res.status(404).json({ error: "record_not_found" });
            return;
          }
          res.json(record);
          return;
        }
        case "list_objects":
          res.json(
            await knowledge.listRecords(companyId, {
              recordType: typeof input.object_type_id === "string" ? input.object_type_id : undefined,
            }),
          );
          return;
        case "search_records":
          res.json(
            await knowledge.searchRecords(
              companyId,
              String(input.query ?? ""),
              typeof input.object_type_id === "string" ? input.object_type_id : undefined,
            ),
          );
          return;
        case "traverse_graph": {
          const depthRaw = input.depth;
          const depth =
            typeof depthRaw === "number" && Number.isFinite(depthRaw)
              ? depthRaw
              : DEFAULT_TRAVERSE_MAX_DEPTH;
          res.json(await knowledge.traverseGraph(companyId, String(input.object_id ?? ""), depth));
          return;
        }
        case "verify_audit_chain":
          res.json(await knowledge.verifyAuditChain(companyId));
          return;
        case "attach_evidence": {
          const targetId = String(input.target_object_id ?? "");
          const evidence = await knowledge.createRecord(
            companyId,
            {
              record_type: "evidence",
              title: String(input.title ?? "Evidence"),
              properties: {
                statement_id: targetId,
                source_id: typeof input.uri === "string" ? input.uri : targetId,
                evidence_kind: "attachment",
                summary: typeof input.summary === "string" ? input.summary : undefined,
                target_object_id: targetId,
              },
              source_refs: [targetId],
            },
            actor,
          );
          await knowledge.createLink(
            companyId,
            { from_record_id: evidence.id, to_record_id: targetId, link_type: "evidence_for" },
            actor,
          );
          res.status(201).json(evidence);
          return;
        }
        case "github.open_pr": {
          try {
            const result = await openGitHubPullRequest({
              repository: String(input.repository ?? ""),
              title: String(input.title ?? ""),
              body: String(input.body ?? ""),
              head_branch: String(input.head_branch ?? ""),
              base_branch: typeof input.base_branch === "string" ? input.base_branch : undefined,
              dry_run: input.dry_run === true,
            });
            await appendAuditEvent(db, {
              companyId,
              actor: actor.agentId ?? actor.actorId ?? "agent",
              eventType: "external.github.open_pr",
              resourceType: "github_pull_request",
              resourceId: result.external_id,
              metadata: { repository: input.repository, url: result.url },
            });
            res.status(201).json(result);
          } catch (error) {
            if (error instanceof AtlasExternalError) {
              res.status(error.status).json({ error: error.code, message: error.message, details: error.details });
              return;
            }
            throw error;
          }
          return;
        }
        default:
          res.status(404).json({
            error: "tool_not_found",
            message: `Unknown Atlas tool ${tool}`,
            available_tools: ATLAS_AGENT_TOOLS.map((t) => t.name),
          });
      }
    } catch (error) {
      handleAtlasError(res, error);
    }
  });

  router.get("/companies/:companyId/atlas/records", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const recordType = typeof req.query.record_type === "string" ? req.query.record_type : undefined;
    res.json(await knowledge.listRecords(companyId, { recordType }));
  });

  router.post("/companies/:companyId/atlas/records", validate(createRecordSchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    try {
      const record = await knowledge.createRecord(companyId, req.body, actorFromReq(req));
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "atlas.record.created",
        entityType: "atlas_knowledge_record",
        entityId: record.id,
        details: { record_type: record.record_type },
      });
      res.status(201).json(record);
    } catch (error) {
      handleAtlasError(res, error);
    }
  });

  router.get("/companies/:companyId/atlas/records/:recordId", async (req, res) => {
    const companyId = req.params.companyId as string;
    const recordId = req.params.recordId as string;
    assertCompanyAccess(req, companyId);
    const record = await knowledge.getRecord(companyId, recordId);
    if (!record) {
      res.status(404).json({ error: "record_not_found" });
      return;
    }
    res.json(record);
  });

  router.patch("/companies/:companyId/atlas/records/:recordId", validate(patchRecordSchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    const recordId = req.params.recordId as string;
    assertCompanyAccess(req, companyId);
    try {
      const record = await knowledge.patchRecord(companyId, recordId, req.body, actorFromReq(req));
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "atlas.record.updated",
        entityType: "atlas_knowledge_record",
        entityId: recordId,
        details: { lifecycle: record.lifecycle },
      });
      res.json(record);
    } catch (error) {
      handleAtlasError(res, error);
    }
  });

  router.get("/companies/:companyId/atlas/records/:recordId/links", async (req, res) => {
    const companyId = req.params.companyId as string;
    const recordId = req.params.recordId as string;
    assertCompanyAccess(req, companyId);
    const depthRaw = Number(req.query.depth ?? DEFAULT_TRAVERSE_MAX_DEPTH);
    const depth = Number.isFinite(depthRaw) ? depthRaw : DEFAULT_TRAVERSE_MAX_DEPTH;
    try {
      res.json(await knowledge.traverseGraph(companyId, recordId, depth));
    } catch (error) {
      handleAtlasError(res, error);
    }
  });

  router.get("/companies/:companyId/atlas/public/canon", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const allRecords = await knowledge.listRecords(companyId);
    res.json(buildCanonBrowseIndex(companyId, allRecords));
  });

  router.get("/companies/:companyId/atlas/entities/:recordId/page", async (req, res) => {
    const companyId = req.params.companyId as string;
    const recordId = req.params.recordId as string;
    assertCompanyAccess(req, companyId);
    const record = await knowledge.getRecord(companyId, recordId);
    if (!record) {
      res.status(404).json({ error: "record_not_found" });
      return;
    }
    const allRecords = await knowledge.listRecords(companyId);
    const format = req.query.format === "markdown" ? "markdown" : "json";
    res.json(renderEntityPage(record, allRecords, format, { companyId }));
  });

  router.post("/companies/:companyId/atlas/links", validate(createLinkSchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    try {
      const link = await knowledge.createLink(companyId, req.body, actorFromReq(req));
      res.status(201).json(link);
    } catch (error) {
      handleAtlasError(res, error);
    }
  });

  router.get("/companies/:companyId/atlas/audit/verify", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    res.json(await knowledge.verifyAuditChain(companyId));
  });

  router.get("/companies/:companyId/atlas/audit-events", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const limit = Number(req.query.limit ?? 50);
    res.json(await knowledge.listAuditEvents(companyId, Number.isFinite(limit) ? limit : 50));
  });

  router.get("/companies/:companyId/atlas/goal-contracts", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    res.json(await goals.listGoalContracts(companyId));
  });

  router.get("/companies/:companyId/atlas/review-packets", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    res.json(await goals.listReviewPackets(companyId));
  });

  router.get("/companies/:companyId/atlas/overview", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    res.json(await knowledge.getOverview(companyId));
  });

  router.post("/companies/:companyId/atlas/bootstrap", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const config = await knowledge.ensureCompanyConfig(companyId);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "atlas.bootstrap",
      entityType: "company",
      entityId: companyId,
      details: { governed: config.governed === "true" },
    });
    res.json({
      company_id: companyId,
      workspace_id: companyId,
      governed: config.governed === "true",
      bootstrapped: true,
    });
  });

  router.get("/companies/:companyId/atlas/policies", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const config = await knowledge.ensureCompanyConfig(companyId);
    res.json({
      workspace_id: companyId,
      governed: config.governed === "true",
      policies: config.policies,
    });
  });

  router.post("/companies/:companyId/atlas/permission-checks", validate(permissionCheckSchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const config = await knowledge.ensureCompanyConfig(companyId);
    const allowed = config.governed !== "true" || req.actor.type === "board" || req.actor.type === "agent";
    res.status(201).json({
      id: `perm_${Date.now()}`,
      workspace_id: companyId,
      action: req.body.action,
      resource_type: req.body.resource_type ?? null,
      resource_id: req.body.resource_id ?? null,
      allowed,
      reason: allowed ? "within_delegation" : "denied",
    });
  });

  router.get("/companies/:companyId/atlas/slack/channel", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const channelId = String(req.query.channel_id ?? "");
    if (!channelId) {
      res.status(400).json({ error: "channel_id_required" });
      return;
    }
    try {
      res.json(await getSlackChannelInfo({ channel_id: channelId, include_num_members: req.query.include_num_members === "true" }));
    } catch (error) {
      if (error instanceof AtlasExternalError) {
        res.status(error.status).json({ error: error.code, message: error.message, details: error.details });
        return;
      }
      throw error;
    }
  });

  return router;
}
