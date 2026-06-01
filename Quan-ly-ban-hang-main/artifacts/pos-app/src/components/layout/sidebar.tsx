import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Package,
  PackagePlus,
  Users,
  Truck,
  CreditCard,
  Banknote,
  BookOpen,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  LogOut,
  User,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

type NavItem = {
  name: string;
  path: string;
  icon: typeof ShoppingCart;
  roles: string[];
  badge?: number;
  accent?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Bán Hàng",
    items: [{ name: "Bán Hàng POS", path: "/app", icon: ShoppingCart, roles: ["admin", "sales"], accent: "text-sky-500" }],
  },
  {
    title: "Hàng Hóa",
    items: [
      { name: "Sản Phẩm", path: "/app/products", icon: Package, roles: ["admin", "sales", "warehouse"], accent: "text-violet-500" },
      { name: "Nhập Hàng", path: "/app/inventory", icon: PackagePlus, roles: ["admin", "warehouse"], accent: "text-amber-500" },
    ],
  },
  {
    title: "Đối Tác",
    items: [
      { name: "Khách Hàng", path: "/app/customers", icon: Users, roles: ["admin", "sales", "accountant"], accent: "text-emerald-500" },
      { name: "Nhà Cung Cấp", path: "/app/suppliers", icon: Truck, roles: ["admin", "warehouse", "accountant"], accent: "text-orange-500" },
    ],
  },
  {
    title: "Tài Chính",
    items: [
      { name: "Công Nợ KH", path: "/app/customer-debts", icon: CreditCard, roles: ["admin", "accountant"], accent: "text-rose-500" },
      { name: "Công Nợ NCC", path: "/app/supplier-debts", icon: Banknote, roles: ["admin", "accountant"], accent: "text-pink-500" },
      { name: "Sổ Quỹ / Thu Chi", path: "/app/cashbook", icon: BookOpen, roles: ["admin", "accountant"], accent: "text-teal-500" },
    ],
  },
  {
    title: "Thống Kê",
    items: [{ name: "Báo Cáo", path: "/app/reports", icon: BarChart3, roles: ["admin", "accountant"], accent: "text-indigo-500" }],
  },
  {
    title: "Hệ Thống",
    items: [
      { name: "Nhân Viên", path: "/app/staff", icon: UserCheck, roles: ["admin"], accent: "text-blue-500" },
      { name: "Cài Đặt", path: "/app/settings", icon: Settings, roles: ["admin"], accent: "text-slate-500" },
    ],
  },
];

function getRoleLabel(role?: string) {
  switch (role) {
    case "sales":
      return "Bán hàng";
    case "warehouse":
      return "Thủ kho";
    case "accountant":
      return "Kế toán";
    default:
      return "Chủ shop";
  }
}

function getRoleColor(role?: string) {
  switch (role) {
    case "sales":
      return "bg-sky-500/10 text-sky-600 border-sky-500/20";
    case "warehouse":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "accountant":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

const NavLink = memo(function NavLink({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const content = (
    <div
      className={cn(
        "group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2.5"
      )}
      onClick={onNavigate}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
          isActive ? "bg-white/15" : "bg-muted/60 group-hover/nav:bg-muted"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : item.accent)} />
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {item.badge}
            </span>
          )}
          {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
        </>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.path}>{content}</Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.name}
          {item.badge !== undefined && item.badge > 0 ? ` · ${item.badge} cảnh báo` : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <Link href={item.path}>{content}</Link>;
});

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const products = useStore((s) => s.products);
  const { session, logout, users } = useAuthStore();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const staffCount = useMemo(
    () => users.filter((u) => u.ownerId === session?.userId).length,
    [users, session?.userId]
  );

  const currentUserRole = session?.role || "admin";

  const filteredNavGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items
        .filter((item) => item.roles.includes(currentUserRole))
        .map((item) => {
          if (item.path === "/app/products" && lowStockCount > 0) {
            return { ...item, badge: lowStockCount };
          }
          if (item.path === "/app/staff" && staffCount > 0) {
            return { ...item, badge: staffCount };
          }
          return item;
        }),
    })).filter((group) => group.items.length > 0);
  }, [currentUserRole, lowStockCount, staffCount]);

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
  };

  return (
    <aside
      className={cn(
        "sidebar-shell flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]",
        collapsed ? "w-[76px]" : "w-[272px]",
        className
      )}
    >
      {/* Brand + Shop */}
      <div className="shrink-0 border-b border-sidebar-border p-3">
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/25">
                  <Store className="h-[18px] w-[18px] text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">POS Pro</p>
                  <p className="truncate text-sm font-bold text-foreground">{session?.shopName || "Cửa hàng"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600">
              <Store className="h-[18px] w-[18px] text-white" />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-sidebar-accent md:flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && session?.role === "admin" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[11px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">{staffCount + 1}</span> thành viên · dữ liệu đồng bộ chung
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-scroll flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {filteredNavGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  location === item.path || (item.path !== "/app" && location.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-sm">
                {session?.name ? session.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{session?.name}</p>
                <span className={cn("mt-0.5 inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", getRoleColor(session?.role))}>
                  {getRoleLabel(session?.role)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-start rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Đăng xuất · {session?.name}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
