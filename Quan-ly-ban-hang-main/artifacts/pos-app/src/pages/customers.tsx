import { useState } from "react";
import { useStore, Customer } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageShell, TableShell } from "@/components/layout/page-shell";
import { toast } from "sonner";

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const { session } = useAuthStore();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const currentUserRole = session?.role || "admin";
  const canDelete = currentUserRole === "admin" || currentUserRole === "accountant";

  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ name: customer.name, phone: customer.phone, address: customer.address });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", address: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Tên khách hàng là bắt buộc");
      return;
    }
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
      toast.success("Cập nhật khách hàng thành công");
    } else {
      addCustomer(formData);
      toast.success("Thêm khách hàng thành công");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    const c = customers.find((x) => x.id === id);
    if (c && c.totalDebt > 0) {
      toast.error("Không thể xóa khách hàng đang có dư nợ");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      deleteCustomer(id);
      toast.success("Đã xóa khách hàng");
    }
  };

  return (
    <PageShell
      title="Quản lý Khách Hàng"
      description="Danh sách khách hàng và theo dõi công nợ."
      actions={
        <Button onClick={() => handleOpenDialog()} data-testid="btn-add-customer" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm khách hàng
        </Button>
      }
    >
      <div className="flex w-full max-w-full items-center gap-2 rounded-xl border bg-card p-2 shadow-sm sm:max-w-md">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, số điện thoại..."
          className="h-10 border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>

      <TableShell>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tên khách hàng</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead className="hidden md:table-cell">Địa chỉ</TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap">Ngày tạo</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tổng nợ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-medium">
                      <div>{customer.name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{customer.phone}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{customer.phone}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[180px] truncate hidden md:table-cell">
                      {customer.address || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell whitespace-nowrap">
                      {formatDateTime(customer.createdAt).split(" ")[0]}
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">
                      {customer.totalDebt > 0 ? (
                        <span className="text-destructive">{formatCurrency(customer.totalDebt)}</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">0đ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(customer)}
                          data-testid={`btn-edit-customer-${customer.id}`}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer.id)}
                            data-testid={`btn-delete-customer-${customer.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </TableShell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Tên khách hàng *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Anh Tuấn"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0901234567"
                type="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Địa chỉ</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: Q1, TP.HCM"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu thông tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
