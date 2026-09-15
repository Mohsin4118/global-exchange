import type {
  AdminClient,
  AdminComment,
  AdminNotification,
  AdminRole,
  AdminStaff,
  AdminTx,
  AdminWithdrawal,
  AuditEntry,
  TxType,
  WithdrawalStatus,
} from "@/lib/admin-data";

export type AdminPage =
  | "dashboard"
  | "clients"
  | "client-detail"
  | "transactions"
  | "withdrawals"
  | "financial"
  | "market"
  | "audit"
  | "notifications"
  | "staff"
  | "profile";

export interface AdminState {
  clients: AdminClient[];
  transactions: AdminTx[];
  withdrawals: AdminWithdrawal[];
  audit: AuditEntry[];
  notifications: AdminNotification[];
  staff: AdminStaff[];
  roles: AdminRole[];
  comments: Record<string, AdminComment[]>;
}

export interface AdminCtx {
  state: AdminState;
  page: AdminPage;
  selectedClientId: string | null;
  unreadCount: number;
  navigate: (page: AdminPage, clientId?: string) => void;
  addClient: (c: { name: string; email: string; phone: string; country: string; balance: number }) => void;
  updateClient: (id: string, patch: Partial<AdminClient>) => void;
  createTransaction: (args: { clientId: string; type: TxType; amount: number; method: string; notes: string }) => void;
  updateWithdrawal: (id: string, status: WithdrawalStatus, notes: string) => void;
  addComment: (clientId: string, body: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addStaff: (name: string, email: string, role: string) => void;
  removeStaff: (id: string) => void;
  toast: (title: string, description?: string) => void;
}
