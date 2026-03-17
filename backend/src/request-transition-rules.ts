import type { RequestStatus } from "./types.js";

export const dispatcherTransitionRules = {
  assign: ["new", "assigned"] as RequestStatus[],
  cancel: ["new", "assigned"] as RequestStatus[],
} as const satisfies Record<string, RequestStatus[]>;

export function canDispatcherAssign(status: RequestStatus) {
  return dispatcherTransitionRules.assign.includes(status);
}

export function canDispatcherCancel(status: RequestStatus) {
  return dispatcherTransitionRules.cancel.includes(status);
}
