---
name: POS App Architecture
description: Key decisions for the QuanLy Bán Hàng POS app — client-only, two Zustand stores, localStorage
---

## Core Architecture

**Client-only — no backend.** All data in localStorage via Zustand `persist` middleware.

**Two Zustand stores:**
- `useStore` (key: `qlbh-pos`) — POS data: products, customers, suppliers, orders, stockImports, cashEntries, debtRecords, settings
- `useAuthStore` (key: `qlbh-auth`) — auth: users array + session. Password hashed via `crypto.subtle.digest("SHA-256")` with userId+salt.

**Why separate auth store:** POS data is per-device, auth is per-user. Keeping them separate allows future multi-user support without refactoring POS store.

**Password hashing:** `SHA-256(password + userId + "qlbh-secure-2024")`. No backend = no bcrypt. Web Crypto API only.

**PWA:** manual setup (no vite-plugin-pwa). sw.js in public/, registered in main.tsx via `import.meta.env.BASE_URL + "sw.js"`. manifest.json references icon.svg (SVG icons work on Chrome/Edge/Android; iOS uses apple-touch-icon meta tag).

**How to apply:** When adding new data to the POS, add to `useStore`. When adding user-account features, add to `useAuthStore`.
