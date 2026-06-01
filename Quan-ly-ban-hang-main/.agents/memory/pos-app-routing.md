---
name: POS App Routing
description: Route structure for QuanLy Bán Hàng — public routes + /app/* protected routes
---

## Route Structure (wouter, base = BASE_URL)

| Path | Component | Auth |
|------|-----------|------|
| `/` | Landing page | public |
| `/login` | Login | public |
| `/register` | Register | public |
| `/app` | POS (BanHang) | protected |
| `/app/products` | Sản Phẩm | protected |
| `/app/inventory` | Nhập Hàng | protected |
| `/app/customers` | Khách Hàng | protected |
| `/app/customer-debts` | Công Nợ KH | protected |
| `/app/suppliers` | Nhà Cung Cấp | protected |
| `/app/supplier-debts` | Công Nợ NCC | protected |
| `/app/cashbook` | Sổ Quỹ | protected |
| `/app/reports` | Báo Cáo | protected |
| `/app/settings` | Cài Đặt | protected |

**Auth guard:** `ProtectedRoute` component in App.tsx checks `useAuthStore().session`, redirects to `/login` if null.

**Sidebar links** all prefixed with `/app/`. Active check: `location === item.path || (item.path !== "/app" && location.startsWith(item.path))`.

**How to apply:** New POS pages go under `/app/<name>`. Add route in App.tsx and nav item in sidebar.tsx with `/app/` prefix.
