import test from "node:test";
import assert from "node:assert/strict";
import { createOntologyStore } from "../src/ontology-store.js";

test("store creates deterministic ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const objectType = store.createObjectType(workspace.id, {
    name: "Build",
    schema_json: {
      type: "object",
      required: ["version"],
      properties: {
        version: { type: "string" }
      }
    }
  });
  const objectInstance = store.createObjectInstance(workspace.id, {
    object_type_id: objectType.id,
    properties_json: {
      version: "v0.1"
    }
  });

  assert.equal(workspace.id, "workspace_001");
  assert.equal(objectType.id, "object_type_001");
  assert.equal(objectInstance.id, "object_001");
});

test("store creates deterministic link ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const buildType = store.createObjectType(workspace.id, {
    name: "Build",
    schema_json: {
      type: "object",
      required: ["version"],
      properties: {
        version: { type: "string" }
      }
    }
  });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" }
      }
    }
  });
  const build = store.createObjectInstance(workspace.id, {
    object_type_id: buildType.id,
    properties_json: {
      version: "v0.1"
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall"
    }
  });
  const linkType = store.createLinkType(workspace.id, {
    name: "Bug affects Build",
    from_object_type_id: bugType.id,
    to_object_type_id: buildType.id
  });
  const link = store.createLinkInstance(workspace.id, {
    link_type_id: linkType.id,
    from_object_id: bug.id,
    to_object_id: build.id
  });

  assert.equal(linkType.id, "link_type_001");
  assert.equal(link.id, "link_001");
});

test("store creates deterministic object set ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      properties: {
        status: { type: "string" }
      }
    }
  });
  const objectSet = store.createObjectSet(workspace.id, {
    name: "Open bugs",
    object_type_id: bugType.id,
    filter_expression: {
      property_equals: {
        status: "open"
      }
    }
  });

  assert.equal(objectSet.id, "object_set_001");
});
