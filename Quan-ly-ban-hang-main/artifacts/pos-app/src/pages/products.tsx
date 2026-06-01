import { useState } from "react";
import { useStore, Product } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PageShell, TableShell } from "@/components/layout/page-shell";

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const { session } = useAuthStore();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const currentUserRole = session?.role || "admin";
  const isSales = currentUserRole === "sales";
  const isAccountant = currentUserRole === "accountant";
  const canModify = !isSales && !isAccountant; // Only admin and warehouse can modify products

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    category: "",
    unit: "",
    costPrice: "",
    sellPrice: "",
    stock: "",
    minStock: "5",
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (!canModify) return;
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        unit: product.unit,
        costPrice: product.costPrice.toString(),
        sellPrice: product.sellPrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: "",
        name: "",
        category: "",
        unit: "Cái",
        costPrice: "",
        sellPrice: "",
        stock: "0",
        minStock: "5",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!canModify) return;
    if (!formData.name || !formData.barcode || !formData.sellPrice) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const payload = {
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category || "Chưa phân loại",
      unit: formData.unit || "Cái",
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      toast.success("Cập nhật sản phẩm thành công");
    } else {
      addProduct(payload);
      toast.success("Thêm sản phẩm thành công");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canModify) return;
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProduct(id);
      toast.success("Đã xóa sản phẩm");
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <PageShell
      title="Danh sách sản phẩm"
      description={
        lowStockCount > 0
          ? `${lowStockCount} sản phẩm sắp hết hàng — cần nhập thêm kho.`
          : "Quản lý hàng hóa, giá bán và tồn kho."
      }
      actions={
        canModify ? (
          <Button onClick={() => handleOpenDialog()} data-testid="btn-add-product" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        ) : undefined
      }
    >
      {lowStockCount > 0 && (
        <p className="-mt-2 flex items-center gap-1.5 text-sm text-destructive sm:hidden">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {lowStockCount} sản phẩm sắp hết hàng
        </p>
      )}

      <div className="flex w-full max-w-full items-center gap-2 rounded-xl border bg-card p-2 shadow-sm sm:max-w-md">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, mã vạch, danh mục..."
          className="h-10 border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-products"
        />
      </div>

      <TableShell>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="whitespace-nowrap">Mã vạch</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead className="hidden sm:table-cell">Danh mục</TableHead>
                <TableHead className="hidden md:table-cell">ĐVT</TableHead>
                {!isSales && (
                  <TableHead className="text-right hidden md:table-cell whitespace-nowrap">Giá vốn</TableHead>
                )}
                <TableHead className="text-right whitespace-nowrap">Giá bán</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tồn kho</TableHead>
                {canModify && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canModify ? 8 : 7} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {product.barcode}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{product.name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{product.category}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{product.category}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.unit}</TableCell>
                    {!isSales && (
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {formatCurrency(product.costPrice)}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-medium text-primary whitespace-nowrap">
                      {formatCurrency(product.sellPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.stock <= product.minStock ? "destructive" : "secondary"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    {canModify && (
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(product)}
                            data-testid={`btn-edit-product-${product.id}`}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            data-testid={`btn-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </TableShell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Mã vạch *</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="VD: 8931234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tên sản phẩm *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Cà phê G7 3in1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Danh mục</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="VD: Đồ uống"
                  list="category-list"
                />
                <datalist id="category-list">
                  {Array.from(new Set(products.map((p) => p.category))).map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Đơn vị tính</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="VD: Hộp, Lon, Cái"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Giá vốn (đ)</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giá bán (đ) *</Label>
                <Input
                  type="number"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tồn kho ban đầu</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  disabled={!!editingProduct}
                  placeholder="0"
                />
                {editingProduct && (
                  <p className="text-xs text-muted-foreground">Dùng Nhập Hàng để tăng kho</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Tồn kho tối thiểu</Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu thông tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
