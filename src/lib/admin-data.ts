/* ------------------------------------------------------------------ */
/*  CryptoWise — Administration backoffice seed data              */
/*  Replicated 1:1 from the platform's admin panel                    */
/* ------------------------------------------------------------------ */

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string; // "—" when empty
  balance: number; // exact balance in USD
  status: "ACTIVE" | "SUSPENDED";
  transactions: number;
  agent: string; // "—" when none
  credits: number;
  debits: number;
  joinedDaysAgo: number;
}

export const CLIENTS: AdminClient[] = [
  { id: "cmu17qlbz001kksrjcmizek47", name: "جميل باعاد", email: "Jamalabaabad@cryptowiseuk.com", phone: "966655444511", country: "Saudi Arabia", balance: 630093.15, status: "ACTIVE", transactions: 1, agent: "Super Admin", credits: 630015.0, debits: 0, joinedDaysAgo: 1 },
  { id: "cmu12en3o0017ksrj5f2ew7sm", name: "Mohammad zakaria Almairi", email: "mzalmyri@gmail.com", phone: "967712345678", country: "—", balance: 1647314.64, status: "ACTIVE", transactions: 1, agent: "Super Admin", credits: 1662000.0, debits: 0, joinedDaysAgo: 1 },
  { id: "cmu0wcfw2000jksrj6zsjppcz", name: "Abdalkafi M", email: "abdalkafi11@cryptowiseuk.com", phone: "249912345678", country: "Saudi Arabia", balance: 230697.3, status: "ACTIVE", transactions: 1, agent: "Super Admin", credits: 230665.0, debits: 0, joinedDaysAgo: 2 },
  { id: "cmu0xcb3x000hksrjxd9gt4nq", name: "Charlie Williams (Joint A/C - No: 35d2c6sd52)", email: "charliew12@gmail.com", phone: "447700900123", country: "United Kingdom", balance: 652103.61, status: "ACTIVE", transactions: 3, agent: "Super Admin", credits: 652000.0, debits: 0, joinedDaysAgo: 2 },
  { id: "cmu0yd9z000gksrjq2pf8wxk", name: "John John", email: "john1@gmail.com", phone: "—", country: "—", balance: 0.0, status: "ACTIVE", transactions: 0, agent: "Super Admin", credits: 0, debits: 0, joinedDaysAgo: 3 },
  { id: "cmu0zr4w000fksrju8hn3v2m", name: "سيد محمد محمود", email: "h6939411@gmail.com", phone: "—", country: "السعودية", balance: 0.0, status: "ACTIVE", transactions: 0, agent: "—", credits: 0, debits: 0, joinedDaysAgo: 4 },
  { id: "cmtyzus0r000aksrjgsnsegbh", name: "محسن ذيب الفقاطيني", email: "Mohsen@cryptowiseuk.com", phone: "962790000000", country: "—", balance: 2856800.62, status: "ACTIVE", transactions: 1, agent: "—", credits: 2856332.0, debits: 0, joinedDaysAgo: 4 },
  { id: "cmtvd6b3z000jksrjy0ql8d2", name: "عزيز الزهراني", email: "alzhrany@cryptowiseuk.com", phone: "966501234567", country: "—", balance: 179679.35, status: "ACTIVE", transactions: 1, agent: "—", credits: 179679.35, debits: 0, joinedDaysAgo: 4 },
  { id: "cmtvdbf10000iksrj4xw2n7q", name: "محمد النبريصي", email: "mhmdalnbryst214@gmail.com", phone: "—", country: "—", balance: 62088.96, status: "ACTIVE", transactions: 1, agent: "—", credits: 62088.96, debits: 0, joinedDaysAgo: 4 },
  { id: "cmtve5k80000hksrjq3xn9w2", name: "Salem Hadi", email: "Salem12@cryptowiseuk.com", phone: "967734567890", country: "—", balance: 120009.96, status: "ACTIVE", transactions: 1, agent: "—", credits: 120009.96, debits: 0, joinedDaysAgo: 5 },
  { id: "cmtv9p2w00007ksrjum3dx4k", name: "Paula Louise Mole", email: "paula.mole@outlook.com", phone: "447700900456", country: "United Kingdom", balance: 18810.58, status: "ACTIVE", transactions: 2, agent: "—", credits: 21000.0, debits: 2189.42, joinedDaysAgo: 5 },
  { id: "cmtvczfiy0006ksrjb5rs8e2d", name: "Najah Nubraisii", email: "najah.n@gmail.com", phone: "—", country: "—", balance: 60000.0, status: "ACTIVE", transactions: 1, agent: "—", credits: 60000.0, debits: 0, joinedDaysAgo: 6 },
  { id: "cmtvda7w00004ksrjk9lm3f8q", name: "ALY ABDELMOULA", email: "aly.abdelmoula@gmail.com", phone: "21620123456", country: "—", balance: 120525.0, status: "ACTIVE", transactions: 1, agent: "—", credits: 120525.0, debits: 0, joinedDaysAgo: 6 },
  { id: "cmtvd4a1z0005ksrjm2xt7v3n", name: "عزيز جمال الزهراني", email: "aziz.jalal@gmail.com", phone: "—", country: "—", balance: 1.0, status: "ACTIVE", transactions: 1, agent: "—", credits: 1.0, debits: 0, joinedDaysAgo: 6 },
  { id: "cmtt8k3w00002ksrjp6vh9x4d", name: "marc John", email: "marc.john@gmail.com", phone: "—", country: "—", balance: 65983.91, status: "ACTIVE", transactions: 1, agent: "—", credits: 65983.91, debits: 0, joinedDaysAgo: 8 },
  { id: "cmtt5r9w00001ksrjw4yq2f6n", name: "John Anderson", email: "john.anderson@proton.me", phone: "—", country: "—", balance: 65983.92, status: "ACTIVE", transactions: 1, agent: "—", credits: 65983.92, debits: 0, joinedDaysAgo: 8 },
];

export type TxType = "CREDIT" | "DEBIT";
export type TxStatus = "COMPLETED" | "PENDING" | "FAILED";

export interface AdminTx {
  id: string;
  date: string; // display date
  dateISO: string;
  clientId: string;
  clientName: string;
  type: TxType;
  amount: number;
  status: TxStatus;
  balanceAfter: number;
  reference: string;
  method: string;
  notes: string;
}

export const TRANSACTIONS: AdminTx[] = [
  { id: "cmu0wdwtq000mksrjs2bq8x7t", date: "Sep 14, 2026", dateISO: "2026-09-14", clientId: "cmu0wcfw2000jksrj6zsjppcz", clientName: "Abdalkafi M", type: "CREDIT", amount: 230665.0, status: "COMPLETED", balanceAfter: 230665.0, reference: "TXN-2026-0914-01", method: "Bank Transfer", notes: "—" },
  { id: "cmu0xcb3x000hksrjxd9gt4nq", date: "Sep 14, 2026", dateISO: "2026-09-14", clientId: "cmu0xcb3x000hksrjxd9gt4nq", clientName: "Charlie Williams (Joint A/C - No: 35d2c6sd52)", type: "CREDIT", amount: 380000.0, status: "COMPLETED", balanceAfter: 380000.0, reference: "TXN-2026-0914-02", method: "Bank Transfer", notes: "—" },
  { id: "cmu0xd3uk000iksrjne7cv5qz", date: "Sep 14, 2026", dateISO: "2026-09-14", clientId: "cmu0xcb3x000hksrjxd9gt4nq", clientName: "Charlie Williams (Joint A/C - No: 35d2c6sd52)", type: "CREDIT", amount: 122000.0, status: "COMPLETED", balanceAfter: 502000.0, reference: "TXN-2026-0914-03", method: "Bank Transfer", notes: "—" },
  { id: "cmu12rhxx000jksrjo9ab4w6e", date: "Sep 14, 2026", dateISO: "2026-09-14", clientId: "cmu12en3o0017ksrj5f2ew7sm", clientName: "Mohammad zakaria Almairi", type: "CREDIT", amount: 1662000.0, status: "COMPLETED", balanceAfter: 1662000.0, reference: "TXN-2026-0914-04", method: "Bank Transfer", notes: "—" },
  { id: "cmu17r8cw000lksrjv3df7y2m", date: "Sep 14, 2026", dateISO: "2026-09-14", clientId: "cmu17qlbz001kksrjcmizek47", clientName: "جميل باعاد", type: "CREDIT", amount: 630015.0, status: "COMPLETED", balanceAfter: 630015.0, reference: "TXN-2026-0914-05", method: "Bank Transfer", notes: "—" },
  { id: "cmu18cvt0000nksrjk8hg3w4p", date: "Sep 14, 2026", dateISO: "2026-09-14", clientId: "cmu0xcb3x000hksrjxd9gt4nq", clientName: "Charlie Williams (Joint A/C - No: 35d2c6sd52)", type: "CREDIT", amount: 150000.0, status: "COMPLETED", balanceAfter: 652000.0, reference: "TXN-2026-0914-06", method: "Bank Transfer", notes: "—" },
  { id: "cmtvczfiy0006ksrjb5rs8e2d", date: "Sep 10, 2026", dateISO: "2026-09-10", clientId: "cmtvczfiy0006ksrjb5rs8e2d", clientName: "Najah Nubraisii", type: "CREDIT", amount: 60000.0, status: "COMPLETED", balanceAfter: 60000.0, reference: "TXN-2026-0910-01", method: "Bank Transfer", notes: "—" },
  { id: "cmtvd4a1z0005ksrjm2xt7v3n", date: "Sep 10, 2026", dateISO: "2026-09-10", clientId: "cmtvd4a1z0005ksrjm2xt7v3n", clientName: "عزيز جمال الزهراني", type: "CREDIT", amount: 1.0, status: "COMPLETED", balanceAfter: 1.0, reference: "TXN-2026-0910-02", method: "Bank Transfer", notes: "Test deposit" },
  { id: "cmtvd6b3z000jksrjy0ql8d2", date: "Sep 10, 2026", dateISO: "2026-09-10", clientId: "cmtvd6b3z000jksrjy0ql8d2", clientName: "عزيز الزهراني", type: "CREDIT", amount: 1.0, status: "COMPLETED", balanceAfter: 1.0, reference: "TXN-2026-0910-03", method: "Bank Transfer", notes: "Test deposit" },
  { id: "cmtvdbf10000iksrj4xw2n7q", date: "Sep 10, 2026", dateISO: "2026-09-10", clientId: "cmtvdbf10000iksrj4xw2n7q", clientName: "ALY ABDELMOULA", type: "CREDIT", amount: 120525.0, status: "COMPLETED", balanceAfter: 120525.0, reference: "TXN-2026-0910-04", method: "Bank Transfer", notes: "—" },
  { id: "cmtve3k90000gksrjr6pt2w8x", date: "Sep 9, 2026", dateISO: "2026-09-09", clientId: "cmtve5k80000hksrjq3xn9w2", clientName: "Salem Hadi", type: "CREDIT", amount: 120009.96, status: "COMPLETED", balanceAfter: 120009.96, reference: "TXN-2026-0909-01", method: "Bank Transfer", notes: "—" },
  { id: "cmtve9p20000fksrjx7cl4v6b", date: "Sep 9, 2026", dateISO: "2026-09-09", clientId: "cmtv9p2w00007ksrjum3dx4k", clientName: "Paula Louise Mole", type: "CREDIT", amount: 20000.0, status: "COMPLETED", balanceAfter: 20000.0, reference: "TXN-2026-0909-02", method: "Bank Transfer", notes: "—" },
  { id: "cmtve8o10000eksrjb8kn2v5q", date: "Sep 9, 2026", dateISO: "2026-09-09", clientId: "cmtv9p2w00007ksrjum3dx4k", clientName: "Paula Louise Mole", type: "CREDIT", amount: 1.0, status: "COMPLETED", balanceAfter: 21000.0, reference: "TXN-2026-0909-03", method: "Bank Transfer", notes: "Micro test deposit" },
  { id: "cmtvf2w80000eksrjq9mn5x3d", date: "Sep 8, 2026", dateISO: "2026-09-08", clientId: "cmtyzus0r000aksrjgsnsegbh", clientName: "محسن ذيب الفقاطيني", type: "CREDIT", amount: 2856332.0, status: "COMPLETED", balanceAfter: 2856332.0, reference: "TXN-2026-0908-01", method: "Bank Transfer", notes: "—" },
  { id: "cmtvf7x30000dksrjw2kl9v4n", date: "Sep 8, 2026", dateISO: "2026-09-08", clientId: "cmtvdbf10000iksrj4xw2n7q", clientName: "محمد النبريصي", type: "CREDIT", amount: 62088.96, status: "COMPLETED", balanceAfter: 62088.96, reference: "TXN-2026-0908-02", method: "Bank Transfer", notes: "—" },
  { id: "cmtvf8y40000cksrjt5hq7w2m", date: "Sep 8, 2026", dateISO: "2026-09-08", clientId: "cmtvd6b3z000jksrjy0ql8d2", clientName: "عزيز الزهراني", type: "CREDIT", amount: 179678.35, status: "COMPLETED", balanceAfter: 179679.35, reference: "TXN-2026-0908-03", method: "Bank Transfer", notes: "—" },
  { id: "cmtse4t800009ksrjb3vd6y9w", date: "Sep 4, 2026", dateISO: "2026-09-04", clientId: "cmtt8k3w00002ksrjp6vh9x4d", clientName: "marc John", type: "CREDIT", amount: 65983.91, status: "COMPLETED", balanceAfter: 65983.91, reference: "TXN-2026-0904-01", method: "Bank Transfer", notes: "—" },
  { id: "cmtsd3s700008ksrjm7xk2v4q", date: "Sep 4, 2026", dateISO: "2026-09-04", clientId: "cmtt5r9w00001ksrjw4yq2f6n", clientName: "John Anderson", type: "CREDIT", amount: 65983.92, status: "COMPLETED", balanceAfter: 65983.92, reference: "TXN-2026-0904-02", method: "Bank Transfer", notes: "—" },
];

export type WithdrawalStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";

export interface AdminWithdrawal {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  coin: string;
  amount: string; // exact 8-decimal string like the platform
  status: WithdrawalStatus;
  address: string;
  network: string;
  notes: string;
}

export const WITHDRAWALS: AdminWithdrawal[] = [
  { id: "wdw_01j5x9k2", date: "Sep 11, 2026", clientId: "cmtv9p2w00007ksrjum3dx4k", clientName: "Paula Louise Mole", coin: "USDT", amount: "20000.00000000", status: "PENDING", address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5oNj4yE", network: "Tron (TRC-20)", notes: "" },
  { id: "wdw_01j5x8m2", date: "Sep 10, 2026", clientId: "cmtve5k80000hksrjq3xn9w2", clientName: "Salem Hadi", coin: "USDT", amount: "10000.00000000", status: "PENDING", address: "0x8fA7b4C23E9105D6ea7B3190cD425f6E8a90D123", network: "Ethereum (ERC-20)", notes: "" },
  { id: "wdw_01j5x7k1", date: "Sep 9, 2026", clientId: "cmu0yd9z000gksrjq2pf8wxk", clientName: "john john", coin: "BTC", amount: "0.12636634", status: "PENDING", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", network: "Bitcoin", notes: "" },
];

export type AuditAction = "Create Transaction" | "Create Client" | "Update Client" | "Update Withdrawal" | "Create Withdrawal" | "Update Staff" | "Create Staff" | "Update Role" | "Create Role" | "Delete Role" | "Sign In" | "Update Portal Client" | "Delete Portal Client" | "Create Portal Transaction" | "Delete Portal Transaction" | "Update Portal Request";

export interface AuditEntry {
  id: string;
  date: string; // "Sep 14, 2026, 01:39 PM"
  admin: string;
  action: AuditAction;
  entity: "TRANSACTION" | "USER" | "WITHDRAWAL" | "STAFF" | "ROLE" | "SESSION";
  detailsNew: string;
  detailsOld?: string;
  ip: string; // "—" when empty
}

const IP_DASH = "—";

export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: "a57", date: "Sep 14, 2026, 01:39 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtyzus0r000aksrjgsnsegbh","type":"CREDIT","amount":2856332,"reference":"TXN-2026-0908-01"}', ip: IP_DASH },
  { id: "a56", date: "Sep 14, 2026, 01:22 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu17qlbz001kksrjcmizek47","type":"CREDIT","amount":630015,"reference":"TXN-2026-0914-05"}', ip: IP_DASH },
  { id: "a55", date: "Sep 14, 2026, 01:22 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Jamalabaabad@cryptowiseuk.com","name":"جميل باعاد","country":"Saudi Arabia"}', ip: IP_DASH },
  { id: "a54", date: "Sep 14, 2026, 11:06 AM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"name":null,"email":"Abdalkafi11@cryptowiseuk.com"}', detailsNew: '{"name":"Abdalkafi M","email":"abdalkafi11@cryptowiseuk.com"}', ip: IP_DASH },
  { id: "a53", date: "Sep 14, 2026, 11:03 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu12en3o0017ksrj5f2ew7sm","type":"CREDIT","amount":1662000,"reference":"TXN-2026-0914-04"}', ip: IP_DASH },
  { id: "a52", date: "Sep 14, 2026, 08:31 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtyzus0r000aksrjgsnsegbh","type":"CREDIT","amount":2856332,"reference":"TXN-2026-0908-01"}', ip: IP_DASH },
  { id: "a51", date: "Sep 14, 2026, 08:31 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtyzus0r000aksrjgsnsegbh","type":"CREDIT","amount":2856332,"reference":"TXN-2026-0908-01"}', ip: IP_DASH },
  { id: "a50", date: "Sep 14, 2026, 08:04 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu0wcfw2000jksrj6zsjppcz","type":"CREDIT","amount":230665,"reference":"TXN-2026-0914-01"}', ip: IP_DASH },
  { id: "a49", date: "Sep 14, 2026, 08:03 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Abdalkafi11@cryptowiseuk.com","name":"Abdalkafi M","country":"Saudi Arabia"}', ip: IP_DASH },
  { id: "a48", date: "Sep 13, 2026, 04:29 PM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"name":"Charile Williams","email":"charliew12@gmail.com"}', detailsNew: '{"name":"Charlie Williams (Joint A/C - No: 35d2c6sd52)","email":"charliew12@gmail.com"}', ip: IP_DASH },
  // --- older entries (pages 2-6) ---
  { id: "a47", date: "Sep 13, 2026, 02:11 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu0xcb3x000hksrjxd9gt4nq","type":"CREDIT","amount":150000,"reference":"TXN-2026-0914-06"}', ip: IP_DASH },
  { id: "a46", date: "Sep 13, 2026, 11:47 AM", admin: "Super Admin", action: "Create Withdrawal", entity: "WITHDRAWAL", detailsNew: '{"clientName":"Paula Louise Mole","coin":"USDT","amount":"20000.00000000"}', ip: IP_DASH },
  { id: "a45", date: "Sep 12, 2026, 09:38 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"paula.mole@outlook.com","name":"Paula Louise Mole","country":"United Kingdom"}', ip: IP_DASH },
  { id: "a44", date: "Sep 12, 2026, 09:15 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtvczfiy0006ksrjb5rs8e2d","type":"CREDIT","amount":60000,"reference":"TXN-2026-0910-01"}', ip: IP_DASH },
  { id: "a43", date: "Sep 11, 2026, 05:52 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtvd4a1z0005ksrjm2xt7v3n","type":"CREDIT","amount":1,"reference":"TXN-2026-0910-02"}', ip: IP_DASH },
  { id: "a42", date: "Sep 11, 2026, 05:50 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"aziz.jalal@gmail.com","name":"عزيز جمال الزهراني"}', ip: IP_DASH },
  { id: "a41", date: "Sep 11, 2026, 04:33 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtvd6b3z000jksrjy0ql8d2","type":"CREDIT","amount":1,"reference":"TXN-2026-0910-03"}', ip: IP_DASH },
  { id: "a40", date: "Sep 11, 2026, 04:31 PM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"phone":null}', detailsNew: '{"phone":"966501234567"}', ip: IP_DASH },
  { id: "a39", date: "Sep 11, 2026, 03:18 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtvdbf10000iksrj4xw2n7q","type":"CREDIT","amount":120525,"reference":"TXN-2026-0910-04"}', ip: IP_DASH },
  { id: "a38", date: "Sep 11, 2026, 03:02 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"aly.abdelmoula@gmail.com","name":"ALY ABDELMOULA"}', ip: IP_DASH },
  { id: "a37", date: "Sep 10, 2026, 06:44 PM", admin: "Super Admin", action: "Create Withdrawal", entity: "WITHDRAWAL", detailsNew: '{"clientName":"Salem Hadi","coin":"USDT","amount":"10000.00000000"}', ip: IP_DASH },
  { id: "a36", date: "Sep 10, 2026, 02:27 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtve5k80000hksrjq3xn9w2","type":"CREDIT","amount":120009.96,"reference":"TXN-2026-0909-01"}', ip: IP_DASH },
  { id: "a35", date: "Sep 10, 2026, 01:12 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Salem12@cryptowiseuk.com","name":"Salem Hadi"}', ip: IP_DASH },
  { id: "a34", date: "Sep 10, 2026, 10:05 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtv9p2w00007ksrjum3dx4k","type":"CREDIT","amount":20000,"reference":"TXN-2026-0909-02"}', ip: IP_DASH },
  { id: "a33", date: "Sep 9, 2026, 07:21 PM", admin: "Super Admin", action: "Create Withdrawal", entity: "WITHDRAWAL", detailsNew: '{"clientName":"john john","coin":"BTC","amount":"0.12636634"}', ip: IP_DASH },
  { id: "a32", date: "Sep 9, 2026, 03:49 PM", admin: "Super Admin", action: "Update Staff", entity: "STAFF", detailsNew: '{"email":"bouabidbeegrowth@gmail.com","role":"Super Admin","status":"ACTIVE"}', ip: IP_DASH },
  { id: "a31", date: "Sep 9, 2026, 11:30 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtyzus0r000aksrjgsnsegbh","type":"CREDIT","amount":2856332,"reference":"TXN-2026-0908-01"}', ip: IP_DASH },
  { id: "a30", date: "Sep 8, 2026, 09:58 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtvdbf10000iksrj4xw2n7q","type":"CREDIT","amount":62088.96,"reference":"TXN-2026-0908-02"}', ip: IP_DASH },
  { id: "a29", date: "Sep 8, 2026, 09:44 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtvd6b3z000jksrjy0ql8d2","type":"CREDIT","amount":179678.35,"reference":"TXN-2026-0908-03"}', ip: IP_DASH },
  { id: "a28", date: "Sep 7, 2026, 08:17 PM", admin: "Super Admin", action: "Update Withdrawal", entity: "WITHDRAWAL", detailsOld: '{"status":"PENDING"}', detailsNew: '{"status":"COMPLETED"}', ip: IP_DASH },
  { id: "a27", date: "Sep 7, 2026, 04:02 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"najah.n@gmail.com","name":"Najah Nubraisii"}', ip: IP_DASH },
  { id: "a26", date: "Sep 6, 2026, 12:40 PM", admin: "Super Admin", action: "Create Role", entity: "ROLE", detailsNew: '{"name":"Agent","permissions":["view","create","edit","delete","manage","send"]}', ip: IP_DASH },
  { id: "a25", date: "Sep 5, 2026, 06:19 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu0yd9z000gksrjq2pf8wxk","type":"CREDIT","amount":0,"reference":"TXN-2026-0905-01"}', ip: IP_DASH },
  { id: "a24", date: "Sep 5, 2026, 09:03 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"h6939411@gmail.com","name":"سيد محمد محمود","country":"السعودية"}', ip: IP_DASH },
  { id: "a23", date: "Sep 4, 2026, 08:47 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtt8k3w00002ksrjp6vh9x4d","type":"CREDIT","amount":1,"reference":"TXN-2026-0904-01"}', ip: IP_DASH },
  { id: "a22", date: "Sep 4, 2026, 07:33 PM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"status":"PENDING"}', detailsNew: '{"status":"ACTIVE"}', ip: IP_DASH },
  { id: "a21", date: "Sep 4, 2026, 07:41 AM", admin: "Super Admin", action: "Sign In", entity: "SESSION", detailsNew: '{"method":"password","mfa":true}', ip: IP_DASH },
  { id: "a20", date: "Sep 4, 2026, 07:30 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtt5r9w00001ksrjw4yq2f6n","type":"CREDIT","amount":500,"reference":"TXN-2026-0904-02"}', ip: IP_DASH },
  { id: "a19", date: "Sep 4, 2026, 07:12 AM", admin: "Super Admin", action: "Create Staff", entity: "STAFF", detailsNew: '{"email":"bouabidbeegrowth@gmail.com","role":"Super Admin"}', ip: IP_DASH },
  { id: "a18", date: "Sep 3, 2026, 05:26 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"john.anderson@proton.me","name":"John Anderson"}', ip: IP_DASH },
  { id: "a17", date: "Sep 3, 2026, 05:04 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"marc.john@gmail.com","name":"marc John"}', ip: IP_DASH },
  { id: "a16", date: "Sep 2, 2026, 02:15 PM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"agent":"—"}', detailsNew: '{"agent":"Super Admin"}', ip: IP_DASH },
  { id: "a15", date: "Sep 2, 2026, 11:48 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"john1@gmail.com","name":"John John"}', ip: IP_DASH },
  { id: "a14", date: "Sep 1, 2026, 09:36 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"charliew12@gmail.com","name":"Charlie Williams","country":"United Kingdom"}', ip: IP_DASH },
  { id: "a13", date: "Aug 31, 2026, 06:52 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu12en3o0017ksrj5f2ew7sm","type":"CREDIT","amount":1662000,"reference":"TXN-2026-0914-04"}', ip: IP_DASH },
  { id: "a12", date: "Aug 31, 2026, 10:20 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"mzalmyri@gmail.com","name":"Mohammad zakaria Almairi"}', ip: IP_DASH },
  { id: "a11", date: "Aug 30, 2026, 03:44 PM", admin: "Super Admin", action: "Update Staff", entity: "STAFF", detailsOld: '{"role":"Agent"}', detailsNew: '{"role":"Super Admin"}', ip: IP_DASH },
  { id: "a10", date: "Aug 29, 2026, 01:09 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Mohsen@cryptowiseuk.com","name":"محسن ذيب الفقاطيني"}', ip: IP_DASH },
  { id: "a09", date: "Aug 28, 2026, 04:27 PM", admin: "Super Admin", action: "Sign In", entity: "SESSION", detailsNew: '{"method":"password","mfa":true}', ip: IP_DASH },
  { id: "a08", date: "Aug 27, 2026, 11:35 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"alzhrany@cryptowiseuk.com","name":"عزيز الزهراني"}', ip: IP_DASH },
  { id: "a07", date: "Aug 26, 2026, 09:14 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"mhmdalnbryst214@gmail.com","name":"محمد النبريصي"}', ip: IP_DASH },
  { id: "a06", date: "Aug 25, 2026, 02:58 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu17qlbz001kksrjcmizek47","type":"CREDIT","amount":630015,"reference":"TXN-2026-0914-05"}', ip: IP_DASH },
  { id: "a05", date: "Aug 24, 2026, 10:41 AM", admin: "Super Admin", action: "Update Role", entity: "ROLE", detailsOld: '{"permissions":["view"]}', detailsNew: '{"permissions":["view","create","edit","delete","manage","send"]}', ip: IP_DASH },
  { id: "a04", date: "Aug 23, 2026, 08:23 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Jamalabaabad@cryptowiseuk.com","name":"جميل باعاد"}', ip: IP_DASH },
  { id: "a03", date: "Aug 22, 2026, 05:37 PM", admin: "Super Admin", action: "Create Staff", entity: "STAFF", detailsNew: '{"email":"admin@cryptowiseuk.com","role":"Super Admin"}', ip: IP_DASH },
  { id: "a02", date: "Aug 22, 2026, 05:35 PM", admin: "Super Admin", action: "Create Role", entity: "ROLE", detailsNew: '{"name":"Super Admin","permissions":["all"]}', ip: IP_DASH },
  { id: "a01", date: "Aug 22, 2026, 05:30 PM", admin: "Super Admin", action: "Sign In", entity: "SESSION", detailsNew: '{"method":"password","mfa":false}', ip: IP_DASH },
];

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: "registration" | "withdrawal";
}

export const NOTIFICATIONS: AdminNotification[] = [
  { id: "n1", title: "New Client Registration", body: "Mohammad zakaria Almairi has registered on the platform.", time: "20h ago", unread: true, kind: "registration" },
  { id: "n2", title: "New Client Registration", body: "Charlie Williams has registered on the platform.", time: "1d ago", unread: true, kind: "registration" },
  { id: "n3", title: "New Client Registration", body: "Charlie Williams has registered on the platform.", time: "2d ago", unread: true, kind: "registration" },
  { id: "n4", title: "New Client Registration", body: "John John has registered on the platform.", time: "3d ago", unread: true, kind: "registration" },
  { id: "n5", title: "New Withdrawal Request", body: "Paula Louise Mole requested a withdrawal of 20000 USDT.", time: "3d ago", unread: true, kind: "withdrawal" },
  { id: "n6", title: "New Withdrawal Request", body: "Salem Hadi requested a withdrawal of 10000 USDT.", time: "4d ago", unread: true, kind: "withdrawal" },
  { id: "n7", title: "New Client Registration", body: "عزيز النبريصي has registered on the platform.", time: "4d ago", unread: true, kind: "registration" },
  { id: "n8", title: "New Client Registration", body: "Najah Nubraisii has registered on the platform.", time: "4d ago", unread: false, kind: "registration" },
  { id: "n9", title: "New Client Registration", body: "عزيز الزهراني has registered on the platform.", time: "4d ago", unread: false, kind: "registration" },
  { id: "n10", title: "New Client Registration", body: "عزيز جمال الزهراني has registered on the platform.", time: "4d ago", unread: false, kind: "registration" },
  { id: "n11", title: "New Client Registration", body: "ALY ABDELMOULA has registered on the platform.", time: "4d ago", unread: false, kind: "registration" },
  { id: "n12", title: "New Client Registration", body: "John John has registered on the platform.", time: "5d ago", unread: false, kind: "registration" },
  { id: "n13", title: "New Withdrawal Request", body: "john john requested a withdrawal of 0.126366360080874 BTC.", time: "5d ago", unread: false, kind: "withdrawal" },
  { id: "n14", title: "New Client Registration", body: "john john has registered on the platform.", time: "5d ago", unread: false, kind: "registration" },
  { id: "n15", title: "New Client Registration", body: "marc John has registered on the platform.", time: "1w ago", unread: false, kind: "registration" },
  { id: "n16", title: "New Client Registration", body: "John AnDerson has registered on the platform.", time: "1w ago", unread: false, kind: "registration" },
  { id: "n17", title: "New Client Registration", body: "John Anderson has registered on the platform.", time: "1w ago", unread: false, kind: "registration" },
  { id: "n18", title: "New Client Registration", body: "ef has registered on the platform.", time: "1w ago", unread: false, kind: "registration" },
];

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE";
  lastLogin: string;
  you?: boolean;
}

export const STAFF: AdminStaff[] = [
  { id: "st1", name: "Super Admin", email: "admin@cryptowiseuk.com", role: "Super Admin", status: "ACTIVE", lastLogin: "Sep 15, 2026", you: true },
  { id: "st2", name: "Super Admin", email: "bouabidbeegrowth@gmail.com", role: "Super Admin", status: "ACTIVE", lastLogin: "Sep 14, 2026" },
];

export interface AdminRole {
  id: string;
  name: string;
  allAccess?: boolean;
  permissions: string[];
  staffCount: number;
}

export const ROLES: AdminRole[] = [
  { id: "r1", name: "Super Admin", allAccess: true, permissions: [], staffCount: 2 },
  { id: "r2", name: "Agent", permissions: ["View", "Create", "Edit", "Delete", "Create", "View", "Delete", "View", "Edit", "Create", "Delete", "View", "Manage", "View", "Send"], staffCount: 0 },
];

export interface AdminComment {
  id: string;
  author: string;
  time: string;
  body: string;
}

/* ---------------- Market Overview coins (static snapshot) ---------------- */

export interface AdminCoin {
  name: string;
  symbol: string;
  price: string; // exact display price
  change: number | null; // percent, null = flat "—"
  color: string; // badge background
  glyph: string;
}

export const ADMIN_MARKET_COINS: AdminCoin[] = [
  { name: "Bitcoin", symbol: "BTC", price: "$77,413.00", change: -0.34, color: "#f7931a", glyph: "₿" },
  { name: "Ethereum", symbol: "ETH", price: "$2,487.92", change: -1.25, color: "#627eea", glyph: "Ξ" },
  { name: "Tether", symbol: "USDT", price: "$1.00", change: 0.01, color: "#26a17b", glyph: "₮" },
  { name: "BNB", symbol: "BNB", price: "$719.06", change: -0.67, color: "#f3ba2f", glyph: "◇" },
  { name: "XRP", symbol: "XRP", price: "$1.40", change: 1.26, color: "#23292f", glyph: "✕" },
  { name: "USDC", symbol: "USDC", price: "$1.00", change: 0.01, color: "#2775ca", glyph: "$" },
  { name: "Solana", symbol: "SOL", price: "$101.03", change: -0.61, color: "#9945ff", glyph: "◎" },
  { name: "TRON", symbol: "TRX", price: "$0.34", change: -0.38, color: "#ef0027", glyph: "T" },
  { name: "Figure Heloc", symbol: "FIGR_HELOC", price: "$1.03", change: null, color: "#7b5cf5", glyph: "F" },
  { name: "Zcash", symbol: "ZEC", price: "$1,142.79", change: 0.49, color: "#f4b728", glyph: "Z" },
  { name: "Hyperliquid", symbol: "HYPE", price: "$79.28", change: -0.72, color: "#0f3d2e", glyph: "H" },
  { name: "Dogecoin", symbol: "DOGE", price: "$0.08", change: -1.83, color: "#c2a633", glyph: "Ð" },
  { name: "USDS", symbol: "USDS", price: "$1.00", change: 0.02, color: "#ff7f2a", glyph: "S" },
  { name: "Monero", symbol: "XMR", price: "$511.57", change: -0.17, color: "#ff6600", glyph: "M" },
  { name: "Rain", symbol: "RAIN", price: "$0.01", change: -11.58, color: "#ffd200", glyph: "R" },
  { name: "WhiteBIT Coin", symbol: "WBT", price: "$80.05", change: -0.61, color: "#1c1c28", glyph: "W" },
  { name: "Chainlink", symbol: "LINK", price: "$11.44", change: -0.09, color: "#2a5ada", glyph: "⬡" },
  { name: "LEO Token", symbol: "LEO", price: "$8.96", change: -0.46, color: "#2b2b2b", glyph: "L" },
  { name: "Cardano", symbol: "ADA", price: "$0.21", change: -1.93, color: "#0d1e30", glyph: "₳" },
  { name: "Stellar", symbol: "XLM", price: "$0.19", change: 5.08, color: "#3e3bcc", glyph: "✷" },
];

/* ---------------- formatting helpers ---------------- */

export function usd(n: number, opts?: { signed?: boolean; cents?: boolean }): string {
  const cents = opts?.cents ?? true;
  const abs = Math.abs(n);
  const str = abs.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const sign = opts?.signed ? (n < 0 ? "-" : "+") : n < 0 ? "-" : "";
  return `${sign}$${str}`;
}

export function cents(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const GROWTH_MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
export const GROWTH_VALUES = [7, 8, 9.5, 12, 14, 16]; // clients over 6 months
