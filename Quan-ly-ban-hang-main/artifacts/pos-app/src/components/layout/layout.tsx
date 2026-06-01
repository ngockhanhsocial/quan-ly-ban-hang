import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuthStore();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
  };

  const getRoleLabel = (role?: string) => {
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
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background no-print">
      <Sidebar className="hidden md:flex shrink-0" />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-card/80 px-3 backdrop-blur-md md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-lg">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
              <Sidebar className="h-full w-full border-r-0" onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{session?.shopName || "QuanLy Bán Hàng"}</p>
              <p className="truncate text-[10px] text-muted-foreground">{getRoleLabel(session?.role)}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Main content */}
        <main
          key={location}
          className={cn(
            "page-enter flex-1 bg-gradient-to-b from-background to-muted/20",
            location === "/app"
              ? "flex min-h-0 flex-col overflow-hidden"
              : "app-main-scroll overflow-y-auto overflow-x-hidden"
          )}
        >
          {location === "/app" ? children : <div className="app-main-inner">{children}</div>}
        </main>
      </div>
    </div>
  );
}
