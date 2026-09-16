# CryptoWise — Website Replica + Super Admin Backoffice

Clean-room Next.js 16 replica of cryptowiseuk.com (public site) with a complete
Super Admin backoffice (client-side demo data).

## Quick Start

```bash
npm install        # or: bun install
npm run dev        # or: bun run dev
```

Open http://localhost:3000

## Public Website

- Single-route app with client views: Home / Login / Register
- English + Arabic with full RTL support (toggle in header)
- Simulated live market prices (random walk, stablecoins pegged to $1.00)
- Interactive swap widget, trust stats, security badges, testimonials, FAQ

## Super Admin Backoffice — How to Access

**Three ways:**

1. **From the site footer** — click the bordered **"Super Admin"** button (bottom right of the footer)
2. **Direct URL** — append `#admin` to the site URL:
   ```
   http://localhost:3000/#admin
   ```
3. **From the regular client login** — type the Super Admin credentials below and you are
   taken straight to the backoffice (a "Super Admin" shortcut button is also available on
   the login card)

**Demo credentials:**

| Field    | Value                    |
| -------- | ------------------------ |
| Email    | `super@cryptowiseuk.com` |
| Password | `Super@2026`             |

(The credentials are also displayed on the admin login screen itself.)

## Backoffice Features

- **Dashboard** — stat cards, client growth chart, recent transactions
- **Clients** — searchable/paginated list, client detail with editable form, financial summary, comments
- **Transactions** — expandable rows (reference/method/notes), create new transaction (updates balances + audit)
- **Withdrawals** — pending queue, update status modal (updates audit + notifications)
- **Financial Overview** — bar chart, credits donut, top-5 clients
- **Market Overview** — 20 coins with range-switchable sparklines
- **Audit Logs** — numbered pagination, JSON diff details (red old / green new)
- **Notifications** — unread badge, mark all read
- **Staff & Roles** — permission chips, create staff
- **Profile** — password change

All admin actions update data, balances, audit trail and notifications live.

## Project Structure

```
src/
  app/page.tsx               # Composition root (view state: home/login/register/admin)
  components/site/           # Public site sections + auth + admin gate
  components/admin/          # Backoffice (shell, dashboard, clients, ledger, misc, ui)
  lib/market.ts              # Coin data + price simulation
  lib/i18n.ts                # EN/AR dictionary
  lib/admin-data.ts          # Backoffice mock data (16 clients, transactions, audit, ...)
```

## Notes

- All data is mocked client-side — no database or backend is required for the demo.
- Prices are simulated for demonstration only; not financial advice.
- FCA references mirror the original site's public footer claims (agent of Western Union
  Payment Services GB Limited).
