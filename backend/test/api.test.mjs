import test from "node:test";
import assert from "node:assert/strict";

const API_URL = process.env.TEST_API_URL;

async function api(path, init = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
  };
}

async function login(username, password) {
  const response = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  assert.equal(response.status, 200, `login failed for ${username}`);
  return response.data;
}

const maybeTest = API_URL ? test : test.skip;

maybeTest("request lifecycle completes successfully", async () => {
  const dispatcher = await login("admin", "admin");
  const master = await login("worker1", "password");

  const masters = await api("/users/masters", { method: "GET" }, dispatcher.token);
  assert.equal(masters.status, 200);
  const worker1 = masters.data.find((item) => item.username === "worker1");
  assert.ok(worker1);

  const created = await api("/requests", {
    method: "POST",
    body: JSON.stringify({
      clientName: "API Test Client",
      phone: "+79990001122",
      address: "Test avenue 10",
      problemText: "Lifecycle integration test",
    }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.status, "new");

  const assigned = await api(`/requests/${created.data.id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ masterId: worker1.id, version: created.data.version }),
  }, dispatcher.token);
  assert.equal(assigned.status, 200);
  assert.equal(assigned.data.status, "assigned");

  const taken = await api(`/requests/${created.data.id}/take`, {
    method: "PATCH",
    body: JSON.stringify({ version: assigned.data.version }),
  }, master.token);
  assert.equal(taken.status, 200);
  assert.equal(taken.data.status, "in_progress");

  const completed = await api(`/requests/${created.data.id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ version: taken.data.version }),
  }, master.token);
  assert.equal(completed.status, 200);
  assert.equal(completed.data.status, "done");
});

maybeTest("optimistic locking returns conflict for stale version", async () => {
  const dispatcher = await login("admin", "admin");
  const master = await login("worker1", "password");

  const masters = await api("/users/masters", { method: "GET" }, dispatcher.token);
  const worker1 = masters.data.find((item) => item.username === "worker1");
  assert.ok(worker1);

  const created = await api("/requests", {
    method: "POST",
    body: JSON.stringify({
      clientName: "Race Test Client",
      phone: "+79990002233",
      address: "Concurrent street 5",
      problemText: "Concurrent integration test",
    }),
  });
  assert.equal(created.status, 201);

  const assigned = await api(`/requests/${created.data.id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ masterId: worker1.id, version: created.data.version }),
  }, dispatcher.token);
  assert.equal(assigned.status, 200);

  const attempts = await Promise.all([
    api(`/requests/${created.data.id}/take`, {
      method: "PATCH",
      body: JSON.stringify({ version: assigned.data.version }),
    }, master.token),
    api(`/requests/${created.data.id}/take`, {
      method: "PATCH",
      body: JSON.stringify({ version: assigned.data.version }),
    }, master.token),
    api(`/requests/${created.data.id}/take`, {
      method: "PATCH",
      body: JSON.stringify({ version: assigned.data.version }),
    }, master.token),
  ]);

  const successCount = attempts.filter((item) => item.status === 200).length;
  const conflictCount = attempts.filter((item) => item.status === 409).length;

  assert.equal(successCount, 1);
  assert.equal(conflictCount, 2);
});

maybeTest("invalid dispatcher transitions are rejected", async () => {
  const dispatcher = await login("admin", "admin");
  const master = await login("worker1", "password");

  const masters = await api("/users/masters", { method: "GET" }, dispatcher.token);
  const worker1 = masters.data.find((item) => item.username === "worker1");
  assert.ok(worker1);

  const created = await api("/requests", {
    method: "POST",
    body: JSON.stringify({
      clientName: "Transition Guard Client",
      phone: "+79990003344",
      address: "Guard avenue 7",
      problemText: "Transition guard integration test",
    }),
  });
  assert.equal(created.status, 201);

  const assigned = await api(`/requests/${created.data.id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ masterId: worker1.id, version: created.data.version }),
  }, dispatcher.token);
  assert.equal(assigned.status, 200);

  const taken = await api(`/requests/${created.data.id}/take`, {
    method: "PATCH",
    body: JSON.stringify({ version: assigned.data.version }),
  }, master.token);
  assert.equal(taken.status, 200);

  const completed = await api(`/requests/${created.data.id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ version: taken.data.version }),
  }, master.token);
  assert.equal(completed.status, 200);

  const cancelDone = await api(`/requests/${created.data.id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ version: completed.data.version }),
  }, dispatcher.token);
  assert.equal(cancelDone.status, 409);

  const canceledDraft = await api("/requests", {
    method: "POST",
    body: JSON.stringify({
      clientName: "Canceled Request Client",
      phone: "+79990004455",
      address: "Canceled avenue 3",
      problemText: "Canceled request integration test",
    }),
  });
  assert.equal(canceledDraft.status, 201);

  const canceled = await api(`/requests/${canceledDraft.data.id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ version: canceledDraft.data.version }),
  }, dispatcher.token);
  assert.equal(canceled.status, 200);

  const assignCanceled = await api(`/requests/${canceledDraft.data.id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ masterId: worker1.id, version: canceled.data.version }),
  }, dispatcher.token);
  assert.equal(assignCanceled.status, 409);
});
