import { useState } from "react";
import { useStore, Supplier } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useStore();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ name: supplier.name, phone: supplier.phone, address: supplier.address });
    } else {
      setEditingSupplier(null);
      setFormData({ name: "", phone: "", address: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Tên nhà cung cấp là bắt buộc");
      return;
    }
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      toast.success("Cập nhật nhà cung cấp thành công");
    } else {
      addSupplier(formData);
      toast.success("Thêm nhà cung cấp thành công");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const s = suppliers.find((x) => x.id === id);
    if (s && s.totalDebt > 0) {
      toast.error("Không thể xóa nhà cung cấp đang có dư nợ");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      deleteSupplier(id);
      toast.success("Đã xóa nhà cung cấp");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhà Cung Cấp</h1>
        <Button onClick={() => handleOpenDialog()} data-testid="btn-add-supplier">
          <Plus className="mr-2 h-4 w-4" /> Thêm NCC
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
        <Input
          placeholder="Tìm theo tên, số điện thoại..."
          className="border-0 focus-visible:ring-0 shadow-none h-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-suppliers"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead className="hidden md:table-cell">Địa chỉ</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tổng nợ NCC</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-medium">
                      <div>{supplier.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{supplier.phone}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{supplier.phone}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {supplier.address || "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">
                      {supplier.totalDebt > 0 ? (
                        <span className="text-destructive">{formatCurrency(supplier.totalDebt)}</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">0đ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(supplier)}
                          data-testid={`btn-edit-supplier-${supplier.id}`}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(supplier.id)}
                          data-testid={`btn-delete-supplier-${supplier.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Cập nhật NCC" : "Thêm nhà cung cấp mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Tên nhà cung cấp *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Công ty TNHH Thành Phát"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 02812345678"
                type="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Địa chỉ</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: Q5, TP.HCM"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu thông tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
