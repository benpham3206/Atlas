import type { Db } from "@paperclipai/db";
import { goalService } from "../services/goals.js";
import { approvalService } from "../services/approvals.js";

/** Map Paperclip goals → legacy GoalContract shape (PA-P2M4). */
export function atlasGoalBridge(db: Db) {
  const goals = goalService(db);
  const approvals = approvalService(db);

  return {
    async listGoalContracts(companyId: string) {
      const rows = await goals.list(companyId);
      return rows.map((goal) => ({
        id: goal.id,
        workspace_id: companyId,
        title: goal.title,
        status: goal.status,
        level: goal.level,
        objective: goal.description ?? goal.title,
        allowed_actions: [],
        blocked_actions: [],
        risk_class: "medium",
        source: "paperclip_goal",
        created_at: goal.createdAt?.toISOString?.() ?? null,
      }));
    },

    async listReviewPackets(companyId: string) {
      const rows = await approvals.list(companyId);
      return rows.map((approval) => ({
        id: approval.id,
        workspace_id: companyId,
        title: approval.type,
        status: approval.status,
        entity_type: approval.type,
        entity_id:
          typeof approval.payload === "object" && approval.payload && "entityId" in approval.payload
            ? String((approval.payload as Record<string, unknown>).entityId)
            : null,
        source: "paperclip_approval",
        created_at: approval.createdAt?.toISOString?.() ?? null,
      }));
    },
  };
}
