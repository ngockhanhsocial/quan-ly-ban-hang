import { useState } from "react";
import { useStore, Product } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const { stockImports, suppliers, products, createStockImport } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [supplierId, setSupplierId] = useState<string>("guest");
  const [items, setItems] = useState<Array<{ product: Product; qty: number; costPrice: number }>>([]);
  const [amountPaidStr, setAmountPaidStr] = useState("");
  const [note, setNote] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts =
    productSearch.length > 1
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.barcode.includes(productSearch)
        )
      : [];

  const addItem = (product: Product) => {
    if (items.find((i) => i.product.id === product.id)) {
      toast.info("Sản phẩm đã có trong phiếu nhập");
      return;
    }
    setItems([...items, { product, qty: 1, costPrice: product.costPrice }]);
    setProductSearch("");
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product.id !== productId));
  };

  const updateItem = (productId: string, field: "qty" | "costPrice", value: number) => {
    setItems(items.map((i) => (i.product.id === productId ? { ...i, [field]: value } : i)));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.costPrice, 0);
  const amountPaid = amountPaidStr ? parseInt(amountPaidStr.replace(/\D/g, "")) || 0 : 0;
  const debtAmount = Math.max(0, totalAmount - amountPaid);

  const handleSave = () => {
    if (items.length === 0) {
      toast.error("Vui lòng thêm sản phẩm vào phiếu nhập");
      return;
    }
    if (debtAmount > 0 && supplierId === "guest") {
      toast.error("Vui lòng chọn nhà cung cấp để ghi nợ");
      return;
    }

    const supplier = suppliers.find((s) => s.id === supplierId);

    createStockImport({
      supplierId: supplierId === "guest" ? null : supplierId,
      supplierName: supplier?.name || "Khách lẻ",
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        qty: item.qty,
        costPrice: item.costPrice,
        subtotal: item.qty * item.costPrice,
      })),
      totalAmount,
      amountPaid,
      debtAmount,
      note,
    });

    toast.success("Tạo phiếu nhập thành công");
    setIsDialogOpen(false);
    setSupplierId("guest");
    setItems([]);
    setAmountPaidStr("");
    setNote("");
  };

  const handleOpenDialog = () => {
    setSupplierId("guest");
    setItems([]);
    setAmountPaidStr("");
    setNote("");
    setProductSearch("");
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử nhập hàng</h1>
        <Button onClick={handleOpenDialog} data-testid="btn-create-import">
          <Plus className="mr-2 h-4 w-4" /> Lập phiếu nhập
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="whitespace-nowrap">Ngày nhập</TableHead>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tổng tiền</TableHead>
                <TableHead className="text-right whitespace-nowrap">Đã TT</TableHead>
                <TableHead className="text-right whitespace-nowrap">Còn nợ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockImports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Chưa có lịch sử nhập hàng
                  </TableCell>
                </TableRow>
              ) : (
                stockImports
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateTime(doc.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{doc.importNumber}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{doc.supplierName}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatCurrency(doc.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                        {formatCurrency(doc.amountPaid)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {doc.debtAmount > 0 ? (
                          <Badge variant="destructive">{formatCurrency(doc.debtAmount)}</Badge>
                        ) : (
                          <span className="text-green-600 font-medium">Đủ</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Lập Phiếu Nhập Hàng</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="mb-1.5 block text-sm">Nhà cung cấp</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Nhà cung cấp lẻ</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 relative">
                <Label className="mb-1.5 block text-sm">Tìm sản phẩm nhập</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tên hoặc mã vạch..."
                    className="pl-9"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {filteredProducts.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg max-h-44 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between text-sm"
                          onClick={() => addItem(p)}
                        >
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">Kho: {p.stock}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead className="w-20 text-center">SL</TableHead>
                      <TableHead className="w-28">Giá nhập</TableHead>
                      <TableHead className="w-28 text-right">Thành tiền</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-sm">
                          Chưa chọn sản phẩm nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="font-medium text-sm">{item.product.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="h-8 text-center"
                              value={item.qty || ""}
                              onChange={(e) =>
                                updateItem(item.product.id, "qty", Number(e.target.value))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="h-8"
                              value={item.costPrice || ""}
                              onChange={(e) =>
                                updateItem(item.product.id, "costPrice", Number(e.target.value))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary text-sm whitespace-nowrap">
                            {formatCurrency(item.qty * item.costPrice)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeItem(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm">Ghi chú</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú phiếu nhập..."
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm gap-3">
                  <span className="shrink-0">Thanh toán NCC:</span>
                  <Input
                    value={amountPaidStr}
                    onChange={(e) => setAmountPaidStr(e.target.value)}
                    placeholder="Số tiền đã trả..."
                    className="w-32 text-right h-8"
                  />
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t font-medium">
                  <span>Tính vào công nợ:</span>
                  <span className={debtAmount > 0 ? "text-destructive" : "text-green-600"}>
                    {formatCurrency(debtAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={items.length === 0}>
              Hoàn tất phiếu nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
