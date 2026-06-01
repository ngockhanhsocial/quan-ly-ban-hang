import { useState, useMemo, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useStore, Product, Order } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  Landmark,
  Printer,
  ShoppingCart,
  ScanBarcode,
  Package,
  Receipt,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type MobileTab = "products" | "cart";

function getStockStatus(product: Product) {
  if (product.stock <= 0) return { label: "Hết hàng", tone: "destructive" as const };
  if (product.stock <= product.minStock) return { label: "Sắp hết", tone: "warning" as const };
  return { label: `${product.stock} ${product.unit}`, tone: "ok" as const };
}

export default function POS() {
  const { products, customers, createOrder, settings } = useStore();
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tất cả");

  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>([]);
  const [customerId, setCustomerId] = useState<string>("guest");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "card">("cash");
  const [isDebt, setIsDebt] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState("");
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("products");

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(q) || p.barcode.includes(search);
      const matchesCategory = categoryFilter === "Tất cả" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const cartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      toast.error(`Sản phẩm ${product.name} đã hết hàng!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Chỉ còn ${product.stock} ${product.unit} trong kho!`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcode.trim()) {
      const product = products.find((p) => p.barcode === barcode.trim());
      if (product) {
        addToCart(product);
        setBarcode("");
        toast.success(`Đã thêm ${product.name}`);
      } else {
        toast.error("Không tìm thấy sản phẩm có mã vạch này");
      }
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty < 1) return item;
          if (newQty > item.product.stock) {
            toast.error(`Chỉ còn ${item.product.stock} ${item.product.unit} trong kho!`);
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const removeRow = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellPrice * item.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const amountPaid = isDebt
    ? amountPaidStr
      ? parseInt(amountPaidStr.replace(/\D/g, ""), 10) || 0
      : 0
    : paymentMethod === "cash" && amountPaidStr
      ? parseInt(amountPaidStr.replace(/\D/g, ""), 10) || 0
      : total;
  const change = Math.max(0, amountPaid - total);
  const debtAmount = isDebt ? Math.max(0, total - amountPaid) : 0;

  const handleQuickCash = (amount: number) => {
    setAmountPaidStr(amount.toString());
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (isDebt && customerId === "guest") {
      toast.error("Vui lòng chọn khách hàng để ghi nợ");
      return;
    }
    if (isDebt && amountPaid > total) {
      toast.error("Số tiền trả không được lớn hơn tổng hóa đơn khi mua nợ");
      return;
    }

    const orderCustomer = customers.find((c) => c.id === customerId);

    const orderData = {
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        unit: item.product.unit,
        qty: item.qty,
        costPrice: item.product.costPrice,
        sellPrice: item.product.sellPrice,
        subtotal: item.product.sellPrice * item.qty,
      })),
      customerId: customerId === "guest" ? null : customerId,
      customerName: orderCustomer?.name || "Khách lẻ",
      subtotal,
      discount,
      total,
      amountPaid: isDebt ? amountPaid : paymentMethod === "cash" ? amountPaid : total,
      change: isDebt ? 0 : change,
      paymentMethod,
      isDebt,
      debtAmount,
      note: "",
    };

    const orderId = createOrder(orderData);
    const newOrder = useStore.getState().orders.find((o) => o.id === orderId);
    setReceiptOrder(newOrder ?? null);

    setCart([]);
    setDiscount(0);
    setAmountPaidStr("");
    setIsDebt(false);
    setMobileTab("products");
    toast.success("Thanh toán thành công!");
  };

  const printReceipt = () => {
    window.print();
  };

  const ProductSearchBar = (
    <div className="space-y-2.5 shrink-0">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên sản phẩm, mã vạch..."
            className="h-11 rounded-xl border-muted/80 bg-background pl-10 text-base shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-product"
          />
        </div>
        <div className="relative sm:w-44">
          <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            ref={barcodeInputRef}
            placeholder="Quét mã vạch"
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-10 font-mono text-sm shadow-sm focus-visible:ring-primary/30"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeSubmit}
            data-testid="input-barcode"
          />
        </div>
      </div>

      <div className="pos-category-scroll flex gap-2 overflow-x-auto pb-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
              categoryFilter === cat
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-muted bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
            onClick={() => setCategoryFilter(cat)}
            data-testid={`btn-category-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );

  const ProductGrid = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {ProductSearchBar}

      <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{filteredProducts.length}</strong> sản phẩm
        </span>
        {cartQty > 0 && (
          <span className="hidden md:inline">
            Giỏ: <strong className="text-primary">{cartQty}</strong> · {formatCurrency(total)}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid grid-cols-2 gap-2.5 pb-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredProducts.map((product) => {
            const stock = getStockStatus(product);
            const inCart = cart.find((c) => c.product.id === product.id)?.qty ?? 0;
            const outOfStock = product.stock <= 0;

            return (
              <button
                key={product.id}
                type="button"
                disabled={outOfStock}
                className={cn(
                  "pos-product-card group relative flex flex-col rounded-2xl border bg-card p-3 text-left shadow-sm transition-all duration-200",
                  outOfStock
                    ? "cursor-not-allowed opacity-50 grayscale"
                    : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 active:scale-[0.98]"
                )}
                onClick={() => addToCart(product)}
                data-testid={`card-product-${product.id}`}
              >
                {inCart > 0 && (
                  <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                    {inCart}
                  </span>
                )}

                <Badge
                  variant="outline"
                  className="mb-2 w-fit max-w-full truncate border-muted/60 bg-muted/30 px-2 py-0 text-[10px] font-medium"
                >
                  {product.category}
                </Badge>

                <p className="line-clamp-2 min-h-[2.5rem] flex-1 text-sm font-semibold leading-snug text-foreground">
                  {product.name}
                </p>

                <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{product.barcode}</p>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="text-base font-bold text-primary sm:text-lg">{formatCurrency(product.sellPrice)}</p>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      stock.tone === "destructive" && "bg-destructive/10 text-destructive",
                      stock.tone === "warning" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      stock.tone === "ok" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {stock.label}
                  </span>
                </div>

                {!outOfStock && (
                  <div className="mt-2 flex h-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Thêm vào giỏ
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 px-6 text-center sm:py-16">
            <Package className="mb-3 h-12 w-12 text-muted-foreground/30" />
            {products.length === 0 ? (
              <>
                <p className="font-semibold text-foreground">Chưa có sản phẩm trong cửa hàng</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Thêm sản phẩm trước khi bán hàng tại màn hình quản lý hàng hóa.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/app/products">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thêm sản phẩm ngay
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-semibold text-muted-foreground">Không tìm thấy sản phẩm</p>
                <p className="mt-1 text-sm text-muted-foreground/80">Thử đổi từ khóa hoặc danh mục khác</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const CartPanel = (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Cart header */}
      <div className="shrink-0 space-y-3 border-b bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Giỏ hàng</p>
              <p className="text-xs text-muted-foreground">{cartQty} sản phẩm</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Badge variant="secondary" className="font-bold tabular-nums">
              {formatCurrency(total)}
            </Badge>
          )}
        </div>

        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="h-10 rounded-xl bg-background" data-testid="select-customer">
            <SelectValue placeholder="Chọn khách hàng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="guest">Khách lẻ</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cart items */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-muted-foreground">Giỏ hàng trống</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
              Chọn sản phẩm bên trái hoặc quét mã vạch để bắt đầu bán hàng
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="rounded-xl border bg-background p-3 shadow-sm"
                data-testid={`cart-item-${item.product.id}`}
              >
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(item.product.sellPrice)} / {item.product.unit}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(item.product.id)}
                    aria-label="Xóa sản phẩm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => updateQty(item.product.id, -1)}
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">{item.qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => updateQty(item.product.id, 1)}
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-bold text-primary tabular-nums">
                    {formatCurrency(item.product.sellPrice * item.qty)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout footer */}
      <div className="shrink-0 space-y-3 border-t bg-gradient-to-t from-muted/40 to-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-2 rounded-xl border bg-background/80 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tổng tiền hàng</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="shrink-0 text-muted-foreground">Chiết khấu</span>
            <Input
              type="number"
              inputMode="numeric"
              className="h-9 w-28 rounded-lg text-right text-sm tabular-nums"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0"
              data-testid="input-discount"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">Khách cần trả</span>
            <span className="text-xl font-extrabold text-primary tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "cash" as const, label: "Tiền mặt", icon: Banknote },
              { id: "transfer" as const, label: "Chuyển khoản", icon: Landmark },
              { id: "card" as const, label: "Quẹt thẻ", icon: CreditCard },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-semibold transition-all",
                paymentMethod === id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-muted bg-background text-muted-foreground hover:border-primary/30"
              )}
              onClick={() => setPaymentMethod(id)}
              data-testid={`btn-pay-${id}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2.5">
          <Checkbox
            id="debt"
            checked={isDebt}
            onCheckedChange={(c) => setIsDebt(!!c)}
            data-testid="checkbox-debt"
          />
          <label htmlFor="debt" className="cursor-pointer text-sm font-medium">
            Khách mua nợ (trả một phần)
          </label>
        </div>

        {isDebt && (
          <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Khách trả</span>
              <Input
                inputMode="numeric"
                value={amountPaidStr}
                onChange={(e) => setAmountPaidStr(e.target.value)}
                placeholder="0"
                className="h-9 w-32 rounded-lg text-right tabular-nums"
              />
            </div>
            {debtAmount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-amber-700 dark:text-amber-400">
                <span>Ghi nợ còn lại</span>
                <span className="tabular-nums">{formatCurrency(debtAmount)}</span>
              </div>
            )}
          </div>
        )}

        {!isDebt && paymentMethod === "cash" && total > 0 && (
          <div className="space-y-2 rounded-xl border bg-background/80 p-3">
            <p className="text-xs font-medium text-muted-foreground">Tiền khách đưa — chọn nhanh</p>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => handleQuickCash(total)}>
                Vừa đủ
              </Button>
              {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs tabular-nums"
                  onClick={() => handleQuickCash(amt)}
                >
                  {amt >= 1000000 ? `${amt / 1000000}tr` : `${amt / 1000}k`}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-sm font-medium">Khách đưa</span>
              <Input
                inputMode="numeric"
                value={amountPaidStr}
                onChange={(e) => setAmountPaidStr(e.target.value)}
                placeholder={formatCurrency(total)}
                className="h-9 w-32 rounded-lg text-right tabular-nums"
                data-testid="input-amount-paid"
              />
            </div>
            {amountPaid > 0 && change >= 0 && (
              <div className="flex justify-between rounded-lg bg-emerald-500/10 px-2.5 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Tiền thừa trả khách</span>
                <span className="tabular-nums">{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        )}

        <Button
          className="h-12 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
          disabled={cart.length === 0}
          onClick={handleCheckout}
          data-testid="btn-checkout"
        >
          <Receipt className="mr-2 h-5 w-5" />
          Thanh toán
          {cart.length > 0 && (
            <span className="ml-1.5 rounded-md bg-white/20 px-2 py-0.5 text-sm tabular-nums">
              {formatCurrency(total)}
            </span>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="pos-shell flex h-full min-h-0 flex-col">
      {/* Page header — large screens only (sidebar + split needs xl+) */}
      <div className="hidden shrink-0 border-b bg-card/60 px-4 py-3 backdrop-blur-sm xl:block xl:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-md shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Bán Hàng POS</h1>
              <p className="text-xs text-muted-foreground">Chọn sản phẩm · Quét mã vạch · Thanh toán nhanh</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border bg-background px-4 py-2 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Giỏ hàng</p>
              <p className="text-sm font-bold tabular-nums">
                {cartQty} SP · <span className="text-primary">{formatCurrency(total)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: split layout (xl+ when sidebar + cart fit comfortably) */}
      <div className="hidden min-h-0 flex-1 xl:grid xl:grid-cols-[minmax(0,1fr)_min(340px,30%)] xl:gap-4 xl:p-4 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:gap-5 2xl:p-5">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card/80 p-3 shadow-sm backdrop-blur-sm sm:p-4 lg:p-5">
          {ProductGrid}
        </section>
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-lg">
          {CartPanel}
        </aside>
      </div>

      {/* Mobile & tablet: tab layout */}
      <div className="flex min-h-0 flex-1 flex-col xl:hidden">
        <div className="pos-mobile-tabs shrink-0 border-b bg-card px-2 pt-2">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1">
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                mobileTab === "products"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setMobileTab("products")}
            >
              <Package className="h-4 w-4" />
              Sản phẩm
            </button>
            <button
              type="button"
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                mobileTab === "cart" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setMobileTab("cart")}
            >
              <ShoppingCart className="h-4 w-4" />
              Giỏ hàng
              {cartQty > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartQty}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {mobileTab === "products" ? (
            <div className="flex h-full flex-col overflow-hidden p-3">{ProductGrid}</div>
          ) : (
            <div className="h-full overflow-hidden">{CartPanel}</div>
          )}
        </div>

        {/* Floating cart bar on products tab */}
        {mobileTab === "products" && cart.length > 0 && (
          <div className="pos-floating-cart shrink-0 border-t bg-card/95 p-3 backdrop-blur-md">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.99]"
              onClick={() => setMobileTab("cart")}
            >
              <div className="flex items-center gap-3 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
                  {cartQty}
                </span>
                <div>
                  <p className="text-xs opacity-90">Xem giỏ hàng</p>
                  <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 opacity-90" />
            </button>
          </div>
        )}
      </div>

      {/* Receipt modal */}
      <Dialog open={!!receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px]">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Thanh toán thành công
            </DialogTitle>
          </DialogHeader>

          <div id="receipt-modal" className="bg-white p-5 font-mono text-sm text-black">
            <div className="mb-4 border-b border-dashed border-gray-400 pb-4 text-center">
              <h2 className="text-lg font-bold uppercase">{settings.shopName}</h2>
              <div className="text-xs">{settings.address}</div>
              <div className="text-xs">Tel: {settings.phone}</div>
              <h3 className="mt-3 text-base font-bold">HÓA ĐƠN BÁN HÀNG</h3>
              <div className="text-xs">Số: {receiptOrder?.orderNumber}</div>
              <div className="text-xs">
                Ngày: {receiptOrder && new Date(receiptOrder.createdAt).toLocaleString("vi-VN")}
              </div>
              {receiptOrder?.customerId && <div className="text-xs">Khách: {receiptOrder.customerName}</div>}
            </div>

            <table className="mb-3 w-full text-xs">
              <thead>
                <tr className="border-b border-dashed border-gray-400">
                  <th className="py-1 text-left">Tên hàng</th>
                  <th className="w-8 py-1 text-right">SL</th>
                  <th className="w-16 py-1 text-right">Đ.Giá</th>
                  <th className="w-16 py-1 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {receiptOrder?.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-0.5">{item.productName}</td>
                    <td className="py-0.5 text-right">{item.qty}</td>
                    <td className="py-0.5 text-right">{item.sellPrice.toLocaleString()}</td>
                    <td className="py-0.5 text-right">{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-0.5 border-t border-dashed border-gray-400 pt-2 text-xs">
              <div className="flex justify-between">
                <span>Cộng tiền hàng:</span>
                <span>{receiptOrder?.subtotal.toLocaleString()}đ</span>
              </div>
              {(receiptOrder?.discount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>Chiết khấu:</span>
                  <span>{receiptOrder?.discount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="mt-2 flex justify-between text-sm font-bold">
                <span>TỔNG CỘNG:</span>
                <span>{receiptOrder?.total.toLocaleString()}đ</span>
              </div>
              {receiptOrder?.isDebt ? (
                <>
                  <div className="mt-1 flex justify-between">
                    <span>Thanh toán:</span>
                    <span>{receiptOrder.amountPaid.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Ghi nợ:</span>
                    <span>{receiptOrder.debtAmount.toLocaleString()}đ</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-1 flex justify-between">
                    <span>
                      Khách đưa (
                      {receiptOrder?.paymentMethod === "cash"
                        ? "TM"
                        : receiptOrder?.paymentMethod === "transfer"
                          ? "CK"
                          : "Thẻ"}
                      ):
                    </span>
                    <span>{receiptOrder?.amountPaid.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền thừa:</span>
                    <span>{receiptOrder?.change.toLocaleString()}đ</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 text-center text-xs italic">Xin cảm ơn và hẹn gặp lại!</div>
          </div>

          <DialogFooter className="no-print gap-2">
            <Button variant="outline" onClick={() => setReceiptOrder(null)}>
              Đóng
            </Button>
            <Button onClick={printReceipt}>
              <Printer className="mr-2 h-4 w-4" />
              In hóa đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
