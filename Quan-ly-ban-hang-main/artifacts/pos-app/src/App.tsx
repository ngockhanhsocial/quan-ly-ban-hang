import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/auth-store";
import { useShopSync } from "@/lib/shop-sync";
import { Layout } from "@/components/layout/layout";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

import POS from "@/pages/pos";
import Products from "@/pages/products";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import CustomerDebts from "@/pages/customer-debts";
import Suppliers from "@/pages/suppliers";
import SupplierDebts from "@/pages/supplier-debts";
import Cashbook from "@/pages/cashbook";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Staff from "@/pages/staff";

const queryClient = new QueryClient();

function ShopSyncProvider({ children }: { children: React.ReactNode }) {
  useShopSync();
  return <>{children}</>;
}

function ProtectedRoute({
  component: Component,
  allowedRoles = ["admin", "sales", "warehouse", "accountant"],
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { session } = useAuthStore();
  if (!session) return <Redirect to="/login" />;

  const userRole = session.role || "admin";

  if (!allowedRoles.includes(userRole)) {
    if (userRole === "warehouse") {
      return <Redirect to="/app/products" />;
    } else if (userRole === "accountant") {
      return <Redirect to="/app/reports" />;
    } else {
      return <Redirect to="/app" />;
    }
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/app" component={() => <ProtectedRoute component={POS} allowedRoles={["admin", "sales"]} />} />
      <Route path="/app/products" component={() => <ProtectedRoute component={Products} allowedRoles={["admin", "sales", "warehouse"]} />} />
      <Route path="/app/inventory" component={() => <ProtectedRoute component={Inventory} allowedRoles={["admin", "warehouse"]} />} />
      <Route path="/app/customers" component={() => <ProtectedRoute component={Customers} allowedRoles={["admin", "sales", "accountant"]} />} />
      <Route path="/app/customer-debts" component={() => <ProtectedRoute component={CustomerDebts} allowedRoles={["admin", "accountant"]} />} />
      <Route path="/app/suppliers" component={() => <ProtectedRoute component={Suppliers} allowedRoles={["admin", "warehouse", "accountant"]} />} />
      <Route path="/app/supplier-debts" component={() => <ProtectedRoute component={SupplierDebts} allowedRoles={["admin", "accountant"]} />} />
      <Route path="/app/cashbook" component={() => <ProtectedRoute component={Cashbook} allowedRoles={["admin", "accountant"]} />} />
      <Route path="/app/reports" component={() => <ProtectedRoute component={Reports} allowedRoles={["admin", "accountant"]} />} />
      <Route path="/app/staff" component={() => <ProtectedRoute component={Staff} allowedRoles={["admin"]} />} />
      <Route path="/app/settings" component={() => <ProtectedRoute component={Settings} allowedRoles={["admin"]} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ShopSyncProvider>
            <Router />
          </ShopSyncProvider>
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
