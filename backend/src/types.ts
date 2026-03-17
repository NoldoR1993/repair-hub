export type UserRole = "dispatcher" | "master";
export type RequestStatus = "new" | "assigned" | "in_progress" | "done" | "canceled";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
}
