import type { AdminAction, AdminSnapshot } from "@/lib/shared-types";

export type AdminPage =
  | "dashboard"
  | "clients"
  | "client-detail"
  | "transactions"
  | "deposits"
  | "withdrawals"
  | "balances"
  | "financial"
  | "market"
  | "audit"
  | "notifications"
  | "staff"
  | "profile";

export type AdminState = AdminSnapshot;

export interface AdminCtx {
  state: AdminState;
  page: AdminPage;
  selectedClientId: string | null;
  unreadCount: number;
  navigate: (page: AdminPage, clientId?: string) => void;
  /** Run a server action; on success the WHOLE state is replaced with the
      returned snapshot so every tab stays perfectly in sync. */
  runAction: (action: AdminAction, successToast?: { title: string; description?: string }) => Promise<boolean>;
  refresh: () => Promise<void>;
  toast: (title: string, description?: string) => void;
}
