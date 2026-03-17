export type AppRole = "dispatcher" | "master";

export type RequestStatus = "new" | "assigned" | "in_progress" | "done" | "canceled";

export interface Staff {
  id: string;
  username: string;
  name: string;
  role: AppRole;
}

export interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
  displayName: string;
}

export interface RequestRecord {
  id: string;
  client_name: string;
  phone: string;
  address: string;
  problem_text: string;
  status: RequestStatus;
  version: number;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string | null;
}

export interface AuditEntry {
  id: string;
  old_status: RequestStatus | null;
  new_status: RequestStatus;
  note: string | null;
  created_at: string;
  changed_by_name?: string | null;
}
