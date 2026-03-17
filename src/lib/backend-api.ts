import type { AuditEntry, AuthUser, RequestRecord } from "@/lib/app-types";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? "/api" : "http://127.0.0.1:4000");

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
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

  if (!response.ok) {
    const error = new Error(data?.message ?? `HTTP ${response.status}`) as Error & {
      status?: number;
      body?: unknown;
    };
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data as T;
}

export async function login(username: string, password: string) {
  return request<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function createRequest(payload: {
  clientName: string;
  phone: string;
  address: string;
  problemText: string;
}) {
  return request<RequestRecord>("/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchDispatcherRequests(token: string, status: string) {
  const suffix = status === "all" ? "" : `?status=${status}`;
  return request<RequestRecord[]>(`/requests${suffix}`, undefined, token);
}

export async function fetchMasters(token: string) {
  return request<Array<{ id: string; username: string; display_name: string }>>("/users/masters", undefined, token);
}

export async function assignRequest(token: string, requestId: string, masterId: string, version: number) {
  return request<RequestRecord>(`/requests/${requestId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ masterId, version }),
  }, token);
}

export async function cancelRequest(token: string, requestId: string, version: number) {
  return request<RequestRecord>(`/requests/${requestId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ version }),
  }, token);
}

export async function fetchMyRequests(token: string) {
  return request<RequestRecord[]>("/requests/mine", undefined, token);
}

export async function updateMasterRequest(token: string, requestId: string, action: "take" | "complete", version: number) {
  return request<RequestRecord>(`/requests/${requestId}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({ version }),
  }, token);
}

export async function fetchAuditLog(token: string, requestId: string) {
  return request<AuditEntry[]>(`/requests/${requestId}/audit`, undefined, token);
}
