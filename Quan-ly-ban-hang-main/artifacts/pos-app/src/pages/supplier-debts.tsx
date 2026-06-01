import { useState } from "react";
import { useStore, Supplier } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, Banknote, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SupplierDebts() {
  const { suppliers, debtRecords, paySupplierDebt } = useStore();
  const [search, setSearch] = useState("");
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payNote, setPayNote] = useState("");

  const suppliersWithDebt = suppliers.filter((s) => s.totalDebt > 0);
  const filteredSuppliers = suppliersWithDebt.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  const handleOpenPayDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPayAmountStr(supplier.totalDebt.toString());
    setPayNote(`Trả nợ NCC ${supplier.name}`);
    setIsPayDialogOpen(true);
  };

  const handlePay = () => {
    if (!selectedSupplier) return;
    const amount = parseInt(payAmountStr.replace(/\D/g, "")) || 0;
    if (amount <= 0) {
      toast.error("Số tiền thanh toán phải lớn hơn 0");
      return;
    }
    if (amount > selectedSupplier.totalDebt) {
      toast.error("Số tiền trả lớn hơn số nợ hiện tại");
      return;
    }
    paySupplierDebt(selectedSupplier.id, amount, payNote);
    toast.success("Thanh toán nợ NCC thành công");
    setIsPayDialogOpen(false);
  };

  const getSupplierDebts = (supplierId: string) =>
    debtRecords
      .filter((d) => d.type === "supplier" && d.entityId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Công Nợ Nhà Cung Cấp</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tổng nợ cần trả:{" "}
            <span className="font-bold text-destructive text-base">
              {formatCurrency(suppliersWithDebt.reduce((s, sup) => s + sup.totalDebt, 0))}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
        <Input
          placeholder="Tìm nhà cung cấp..."
          className="border-0 focus-visible:ring-0 shadow-none h-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-supplier-debts"
        />
      </div>

      <div className="space-y-3">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl shadow-sm text-sm">
            {suppliersWithDebt.length === 0
              ? "Không có nhà cung cấp nào đang nợ"
              : "Không tìm thấy nhà cung cấp"}
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Collapsible
              key={supplier.id}
              className="border bg-card rounded-xl shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/20 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                    </Button>
                  </CollapsibleTrigger>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{supplier.name}</h3>
                    <div className="text-xs text-muted-foreground">{supplier.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground hidden sm:block">Còn nợ NCC</div>
                    <div className="font-bold text-destructive text-sm sm:text-lg">
                      {formatCurrency(supplier.totalDebt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenPayDialog(supplier)}
                    data-testid={`btn-pay-supplier-debt-${supplier.id}`}
                  >
                    <Banknote className="mr-1 h-3.5 w-3.5" /> Trả nợ
                  </Button>
                </div>
              </div>
              <CollapsibleContent>
                <div className="p-3 sm:p-4 border-t bg-background">
                  <h4 className="text-xs font-semibold mb-3 mt-1 text-muted-foreground uppercase tracking-wider">
                    Lịch sử giao dịch
                  </h4>
                  <div className="space-y-2">
                    {getSupplierDebts(supplier.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có lịch sử</p>
                    ) : (
                      getSupplierDebts(supplier.id).map((record) => (
                        <div
                          key={record.id}
                          className="flex justify-between items-start py-2 border-b last:border-0 gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{record.note}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(record.createdAt)}
                            </div>
                          </div>
                          <div
                            className={`font-bold text-sm shrink-0 ${
                              record.amount > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {record.amount > 0 ? "+" : ""}
                            {formatCurrency(Math.abs(record.amount))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>

      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Trả Nợ Nhà Cung Cấp</DialogTitle>
            <DialogDescription>
              Nhà cung cấp:{" "}
              <strong className="text-foreground">{selectedSupplier?.name}</strong>
              <br />
              Nợ hiện tại:{" "}
              <strong className="text-destructive">
                {selectedSupplier ? formatCurrency(selectedSupplier.totalDebt) : ""}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Số tiền thanh toán</Label>
              <Input
                value={payAmountStr}
                onChange={(e) => setPayAmountStr(e.target.value)}
                className="text-lg font-bold"
                data-testid="input-pay-supplier-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Hủy</Button>
            <Button onClick={handlePay}>Xác nhận thanh toán</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
