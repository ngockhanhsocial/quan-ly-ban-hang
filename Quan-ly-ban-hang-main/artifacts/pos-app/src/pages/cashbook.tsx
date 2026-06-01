import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function Cashbook() {
  const { cashEntries, addCashEntry } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<"thu" | "chi">("thu");

  const [formData, setFormData] = useState({ amount: "", category: "", note: "" });

  const incomeCategories = ["Bán lẻ", "Thu nợ", "Vốn đầu tư", "Khác"];
  const expenseCategories = ["Tiền điện", "Tiền nước", "Thuê mặt bằng", "Lương nhân viên", "Nhập hàng", "Trả nợ NCC", "Khác"];

  const handleOpenDialog = (type: "thu" | "chi") => {
    setEntryType(type);
    setFormData({ amount: "", category: "Khác", note: "" });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    if (!formData.category) {
      toast.error("Vui lòng chọn hạng mục");
      return;
    }
    addCashEntry({ type: entryType, amount, category: formData.category, note: formData.note });
    toast.success(`Đã tạo phiếu ${entryType === "thu" ? "thu" : "chi"} thành công`);
    setIsDialogOpen(false);
  };

  const totalThu = cashEntries.filter((e) => e.type === "thu").reduce((sum, e) => sum + e.amount, 0);
  const totalChi = cashEntries.filter((e) => e.type === "chi").reduce((sum, e) => sum + e.amount, 0);
  const balance = totalThu - totalChi;

  let currentBalance = 0;
  const entriesWithBalance = cashEntries
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry) => {
      if (entry.type === "thu") currentBalance += entry.amount;
      else currentBalance -= entry.amount;
      return { ...entry, runningBalance: currentBalance };
    })
    .reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Sổ Quỹ Tiền Mặt</h1>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-800"
            onClick={() => handleOpenDialog("thu")}
            data-testid="btn-create-receipt"
          >
            <Plus className="mr-2 h-4 w-4" /> Lập phiếu thu
          </Button>
          <Button
            variant="outline"
            className="border-red-500 text-red-700 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-800"
            onClick={() => handleOpenDialog("chi")}
            data-testid="btn-create-expense"
          >
            <Minus className="mr-2 h-4 w-4" /> Lập phiếu chi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Tổng Thu</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalThu)}</p>
              </div>
              <ArrowUpRight className="h-7 w-7 text-green-500 opacity-40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Tổng Chi</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totalChi)}</p>
              </div>
              <ArrowDownRight className="h-7 w-7 text-red-500 opacity-40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Tồn Quỹ Hiện Tại</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="whitespace-nowrap">Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="hidden sm:table-cell">Hạng mục</TableHead>
                <TableHead className="hidden md:table-cell">Ghi chú</TableHead>
                <TableHead className="text-right whitespace-nowrap">Số tiền</TableHead>
                <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">Tồn quỹ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Sổ quỹ trống
                  </TableCell>
                </TableRow>
              ) : (
                entriesWithBalance.map((entry) => (
                  <TableRow key={entry.id} data-testid={`row-cash-${entry.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                          entry.type === "thu"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                        }`}
                      >
                        {entry.type === "thu" ? "Phiếu Thu" : "Phiếu Chi"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium hidden sm:table-cell">{entry.category}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate hidden md:table-cell">
                      {entry.note}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold whitespace-nowrap ${
                        entry.type === "thu" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {entry.type === "thu" ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary whitespace-nowrap hidden sm:table-cell">
                      {formatCurrency(entry.runningBalance)}
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
              {entryType === "thu" ? "Lập Phiếu Thu" : "Lập Phiếu Chi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Số tiền *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-lg font-bold"
                placeholder="0"
                data-testid="input-cash-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hạng mục *</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger data-testid="select-cash-category">
                  <SelectValue placeholder="Chọn hạng mục" />
                </SelectTrigger>
                <SelectContent>
                  {(entryType === "thu" ? incomeCategories : expenseCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Lý do thu/chi..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={handleSave}
              className={
                entryType === "thu"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              Lưu phiếu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
