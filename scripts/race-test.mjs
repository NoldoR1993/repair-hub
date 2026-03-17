const API_URL = process.env.API_URL ?? "http://localhost:4000";

async function api(path, init, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data };
}

async function login(username, password) {
  const response = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (response.status !== 200) {
    throw new Error(`Login failed for ${username}`);
  }

  return response.data.token;
}

const dispatcherToken = await login("admin", "admin");
const masterToken = await login("worker1", "password");

const created = await api("/requests", {
  method: "POST",
  body: JSON.stringify({
    clientName: "Race Test Client",
    phone: "+79990000000",
    address: "Test street 1",
    problemText: "Race test request",
  }),
});

if (created.status !== 201) {
  throw new Error(`Create request failed: ${created.status}`);
}

const masters = await api("/users/masters", { method: "GET" }, dispatcherToken);
const worker1 = masters.data.find((item) => item.username === "worker1");

const assigned = await api(`/requests/${created.data.id}/assign`, {
  method: "PATCH",
  body: JSON.stringify({ masterId: worker1.id, version: created.data.version }),
}, dispatcherToken);

if (assigned.status !== 200) {
  throw new Error(`Assign request failed: ${assigned.status}`);
}

const attempts = await Promise.all([
  api(`/requests/${created.data.id}/take`, {
    method: "PATCH",
    body: JSON.stringify({ version: assigned.data.version }),
  }, masterToken),
  api(`/requests/${created.data.id}/take`, {
    method: "PATCH",
    body: JSON.stringify({ version: assigned.data.version }),
  }, masterToken),
  api(`/requests/${created.data.id}/take`, {
    method: "PATCH",
    body: JSON.stringify({ version: assigned.data.version }),
  }, masterToken),
]);

const successCount = attempts.filter((item) => item.status === 200).length;
const conflictCount = attempts.filter((item) => item.status === 409).length;

console.log(JSON.stringify({ successCount, conflictCount, attempts }, null, 2));

if (successCount !== 1 || conflictCount !== 2) {
  throw new Error("Race test failed");
}
