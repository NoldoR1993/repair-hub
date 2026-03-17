import test from "node:test";
import assert from "node:assert/strict";
import { canDispatcherAssign, canDispatcherCancel } from "../src/request-transition-rules.js";

test("dispatcher can assign only new or already assigned requests", () => {
  assert.equal(canDispatcherAssign("new"), true);
  assert.equal(canDispatcherAssign("assigned"), true);
  assert.equal(canDispatcherAssign("in_progress"), false);
  assert.equal(canDispatcherAssign("done"), false);
  assert.equal(canDispatcherAssign("canceled"), false);
});

test("dispatcher can cancel only new or assigned requests", () => {
  assert.equal(canDispatcherCancel("new"), true);
  assert.equal(canDispatcherCancel("assigned"), true);
  assert.equal(canDispatcherCancel("in_progress"), false);
  assert.equal(canDispatcherCancel("done"), false);
  assert.equal(canDispatcherCancel("canceled"), false);
});
