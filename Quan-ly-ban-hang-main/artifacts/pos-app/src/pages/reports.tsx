import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { Package, TrendingUp, ShoppingBag, ReceiptText, Landmark } from "lucide-react";
import { PageShell, StatGrid } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

type Range = "today" | "week" | "month";

export default function Reports() {
  const { orders, products } = useStore();
  const [range, setRange] = useState<Range>("week");

  const now = new Date();

  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    if (range === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (range === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (range === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const grossProfit = filteredOrders.reduce((sum, order) => {
    const cost = order.items.reduce((c, item) => c + item.costPrice * item.qty, 0);
    return sum + (order.subtotal - cost - order.discount);
  }, 0);

  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = productSales.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
      productSales.set(item.productId, {
        name: item.productName,
        qty: existing.qty + item.qty,
        revenue: existing.revenue + item.subtotal,
      });
    });
  });
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map((dateStr) => {
    const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    const cost = dayOrders.reduce(
      (sum, o) => sum + o.items.reduce((c, item) => c + item.costPrice * item.qty, 0),
      0
    );
    return {
      name: dateStr.split("-").slice(1).join("/"),
      doanhThu: revenue,
      loiNhuan: revenue - cost - dayOrders.reduce((s, o) => s + o.discount, 0),
    };
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const kpis = [
    {
      label: "Tổng Doanh Thu",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Lợi Nhuận Gộp",
      value: formatCurrency(grossProfit),
      icon: Landmark,
      color: "text-green-600",
    },
    {
      label: "Tổng Số Hóa Đơn",
      value: totalOrders.toString(),
      icon: ReceiptText,
      color: "text-foreground",
    },
    {
      label: "Trung Bình Đơn",
      value: formatCurrency(avgOrderValue),
      icon: ShoppingBag,
      color: "text-foreground",
    },
  ];

  return (
    <PageShell
      title="Báo Cáo Thống Kê"
      description="Theo dõi doanh thu, lợi nhuận và sản phẩm bán chạy."
      actions={
        <div className="flex w-full gap-1 rounded-lg bg-muted p-1 sm:w-auto">
          {([["today", "Hôm nay"], ["week", "7 ngày"], ["month", "Tháng này"]] as [Range, string][]).map(
            ([key, label]) => (
              <Button
                key={key}
                variant={range === key ? "default" : "ghost"}
                size="sm"
                className="h-9 flex-1 px-2 text-xs sm:flex-none sm:px-3"
                onClick={() => setRange(key)}
                data-testid={`btn-range-${key}`}
              >
                {label}
              </Button>
            )
          )}
        </div>
      }
    >
      <StatGrid>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug">
                    {kpi.label}
                  </p>
                  <Icon className={`h-4 w-4 shrink-0 ${kpi.color} opacity-70`} />
                </div>
                <div className={`text-lg sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Doanh thu & Lợi nhuận 7 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[320px] pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${val >= 1000000 ? `${val / 1000000}tr` : val >= 1000 ? `${val / 1000}k` : val}`}
                  width={45}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="doanhThu" name="Doanh Thu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loiNhuan" name="Lợi Nhuận" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top 5 Sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu bán hàng</p>
                ) : (
                  topProducts.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {i + 1}
                        </div>
                        <div className="font-medium text-sm truncate">{item.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold">{item.qty} SP</div>
                        <div className="text-[11px] text-muted-foreground">{formatCurrency(item.revenue)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={lowStockCount > 0 ? "border-destructive/40" : ""}>
            <CardContent className="p-5 flex items-center gap-4">
              <div
                className={`p-3 rounded-full shrink-0 ${
                  lowStockCount > 0 ? "bg-destructive/10" : "bg-muted"
                }`}
              >
                <Package
                  className={`h-5 w-5 ${
                    lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cảnh báo Tồn Kho</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold ${
                      lowStockCount > 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {lowStockCount}
                  </span>
                  <span className="text-sm text-muted-foreground">sản phẩm sắp hết</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
