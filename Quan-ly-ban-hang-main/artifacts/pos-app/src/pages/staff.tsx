import { useMemo, useState } from "react";
import { useAuthStore, User, StaffRole } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  KeyRound,
  Search,
  HelpCircle,
  Store,
  Users,
  Crown,
  Briefcase,
  Package,
  Calculator,
} from "lucide-react";

const ROLE_META = {
  sales: { label: "Bán hàng", icon: Briefcase, color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  warehouse: { label: "Thủ kho", icon: Package, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  accountant: { label: "Kế toán", icon: Calculator, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
} as const;

export default function Staff() {
  const { session, users, addStaff, updateStaff, deleteStaff } = useAuthStore();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "sales" as StaffRole,
    password: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "sales" as StaffRole,
    password: "",
    isActive: true,
  });

  if (!session || session.role !== "admin") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Shield className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">Trang này chỉ dành cho Chủ cửa hàng (Admin).</p>
      </div>
    );
  }

  const staffList = users.filter((u) => u.ownerId === session.userId);
  const adminUser = users.find((u) => u.id === session.userId);

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const roleStats = useMemo(() => {
    return {
      sales: staffList.filter((s) => s.role === "sales").length,
      warehouse: staffList.filter((s) => s.role === "warehouse").length,
      accountant: staffList.filter((s) => s.role === "accountant").length,
      active: staffList.filter((s) => s.isActive !== false).length,
    };
  }, [staffList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (addForm.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const result = await addStaff(addForm);
    if (result.success) {
      toast.success(`Đã thêm nhân viên ${addForm.name} — có thể đăng nhập và xem dữ liệu chung`);
      setIsAddOpen(false);
      setAddForm({ name: "", email: "", phone: "", role: "sales", password: "" });
    } else {
      toast.error(result.error || "Không thể thêm nhân viên");
    }
  };

  const handleEditClick = (staff: User) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      phone: staff.phone,
      role: (staff.role as StaffRole) || "sales",
      password: "",
      isActive: staff.isActive !== false,
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!editForm.name) {
      toast.error("Vui lòng điền họ tên nhân viên");
      return;
    }

    const result = await updateStaff(selectedStaff.id, {
      name: editForm.name,
      phone: editForm.phone,
      role: editForm.role,
      password: editForm.password || undefined,
      isActive: editForm.isActive,
    });

    if (result.success) {
      toast.success("Cập nhật thông tin nhân viên thành công!");
      setIsEditOpen(false);
      setSelectedStaff(null);
    } else {
      toast.error(result.error || "Không thể cập nhật nhân viên");
    }
  };

  const handleDeleteClick = (staff: User) => {
    setSelectedStaff(staff);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    const result = await deleteStaff(selectedStaff.id);
    if (result.success) {
      toast.success(`Đã xóa nhân viên ${selectedStaff.name}`);
      setIsDeleteOpen(false);
      setSelectedStaff(null);
    } else {
      toast.error(result.error || "Không thể xóa nhân viên");
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === "sales" || role === "warehouse" || role === "accountant") {
      const meta = ROLE_META[role];
      const Icon = meta.icon;
      return (
        <Badge variant="outline" className={cnBadge(meta.color)}>
          <Icon className="mr-1 h-3 w-3" />
          {meta.label}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
        <Crown className="mr-1 h-3 w-3" />
        Chủ cửa hàng
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Store className="h-3.5 w-3.5" />
              {session.shopName}
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Quản Lý Nhân Viên</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Thêm nhân viên cửa hàng, phân quyền theo vai trò. Tất cả nhân viên cùng xem và làm việc trên dữ liệu chung của shop.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} size="lg" className="shrink-0 gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" />
            Thêm nhân viên mới
          </Button>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Tổng thành viên", value: staffList.length + 1, icon: Users, tone: "text-primary" },
          { label: "Bán hàng", value: roleStats.sales, icon: Briefcase, tone: "text-sky-500" },
          { label: "Thủ kho", value: roleStats.warehouse, icon: Package, tone: "text-amber-500" },
          { label: "Kế toán", value: roleStats.accountant, icon: Calculator, tone: "text-emerald-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-muted/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cnBadge("rounded-xl bg-muted/50 p-2.5", stat.tone)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Permission guide */}
        <Card className="h-fit border-muted/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <HelpCircle className="h-4 w-4 text-primary" />
              Ma trận phân quyền
            </CardTitle>
            <CardDescription className="text-xs">Mỗi vai trò chỉ thấy menu và chức năng phù hợp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <PermissionRow role="Bán hàng" desc="POS, sản phẩm (ẩn giá vốn), khách hàng" color="border-sky-500/30 bg-sky-500/5" />
            <PermissionRow role="Thủ kho" desc="Sản phẩm CRUD, nhập hàng, nhà cung cấp" color="border-amber-500/30 bg-amber-500/5" />
            <PermissionRow role="Kế toán" desc="Báo cáo, sổ quỹ, công nợ KH & NCC" color="border-emerald-500/30 bg-emerald-500/5" />
            <div className="rounded-lg border border-dashed p-2.5 text-[11px] leading-relaxed">
              Dữ liệu sản phẩm, đơn hàng, khách hàng được <strong className="text-foreground">đồng bộ chung</strong> cho toàn bộ nhân viên cùng cửa hàng.
            </div>
          </CardContent>
        </Card>

        {/* Staff table */}
        <Card className="border-muted/60 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>Danh sách thành viên ({staffList.length + 1})</CardTitle>
            <CardDescription>
              Chủ shop và nhân viên cùng truy cập dữ liệu của <strong>{session.shopName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUser && !search && (
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {adminUser.name.charAt(0)}
                          </div>
                          <div>
                            <p>{adminUser.name}</p>
                            <p className="text-[10px] text-muted-foreground">Bạn · Chủ shop</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{adminUser.email}</TableCell>
                      <TableCell>{adminUser.phone || "—"}</TableCell>
                      <TableCell>{getRoleBadge("admin")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                          Hoạt động
                        </Badge>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}

                  {filteredStaff.length === 0 && search ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Không tìm thấy nhân viên phù hợp
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                      <TableRow key={staff.id} className={staff.isActive === false ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                              {staff.name.charAt(0)}
                            </div>
                            {staff.name}
                          </div>
                        </TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.phone || "—"}</TableCell>
                        <TableCell>{getRoleBadge(staff.role)}</TableCell>
                        <TableCell>
                          {staff.isActive !== false ? (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-muted bg-muted text-muted-foreground">
                              Vô hiệu
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(staff)} title="Chỉnh sửa">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteClick(staff)} title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {!search && staffList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        Chưa có nhân viên — bấm <strong className="text-foreground">Thêm nhân viên mới</strong> để phân quyền bán hàng, kho, kế toán.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Thêm nhân viên cửa hàng
            </DialogTitle>
            <DialogDescription>
              Nhân viên đăng nhập bằng email riêng và xem dữ liệu chung của <strong>{session.shopName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <FormField label="Họ tên nhân viên *" id="add-name">
              <Input id="add-name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Nguyễn Văn A" required />
            </FormField>
            <FormField label="Email đăng nhập *" id="add-email">
              <Input id="add-email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="nv.a@gmail.com" required />
            </FormField>
            <FormField label="Số điện thoại" id="add-phone">
              <Input id="add-phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="0987654321" />
            </FormField>
            <FormField label="Mật khẩu khởi tạo *" id="add-password">
              <Input id="add-password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" required />
            </FormField>
            <FormField label="Phân quyền vai trò" id="add-role">
              <Select value={addForm.role} onValueChange={(val: StaffRole) => setAddForm({ ...addForm, role: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Nhân viên Bán hàng</SelectItem>
                  <SelectItem value="warehouse">Thủ kho</SelectItem>
                  <SelectItem value="accountant">Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
              <Button type="submit">Thêm nhân viên</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Sửa thông tin nhân viên
            </DialogTitle>
            <DialogDescription>Cập nhật vai trò và trạng thái của {selectedStaff?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <FormField label="Họ tên *" id="edit-name">
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </FormField>
            <FormField label="Email (không đổi)">
              <Input value={selectedStaff?.email || ""} disabled className="bg-muted" />
            </FormField>
            <FormField label="Số điện thoại" id="edit-phone">
              <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </FormField>
            <FormField label="Mật khẩu mới" id="edit-password">
              <div className="relative">
                <Input id="edit-password" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Để trống nếu không đổi" className="pr-9" />
                <KeyRound className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </FormField>
            <FormField label="Vai trò" id="edit-role">
              <Select value={editForm.role} onValueChange={(val: StaffRole) => setEditForm({ ...editForm, role: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Nhân viên Bán hàng</SelectItem>
                  <SelectItem value="warehouse">Thủ kho</SelectItem>
                  <SelectItem value="accountant">Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Cho phép đăng nhập</p>
                <p className="text-xs text-muted-foreground">Tắt để tạm khóa quyền truy cập</p>
              </div>
              <Switch checked={editForm.isActive} onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
              <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Xác nhận xóa nhân viên
            </DialogTitle>
            <DialogDescription className="pt-2">
              Xóa tài khoản <strong>{selectedStaff?.name}</strong> ({selectedStaff?.email})?
              Nhân viên sẽ mất quyền truy cập dữ liệu cửa hàng ngay lập tức.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa nhân viên</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cnBadge(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function PermissionRow({ role, desc, color }: { role: string; desc: string; color: string }) {
  return (
    <div className={cnBadge("rounded-lg border p-2.5", color)}>
      <p className="font-semibold text-foreground">{role}</p>
      <p className="mt-0.5 leading-relaxed">{desc}</p>
    </div>
  );
}

function FormField({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
