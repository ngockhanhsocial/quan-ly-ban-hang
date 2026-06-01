import { useState } from "react";
import { useStore, Customer } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, ChevronDown, ChevronRight, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function CustomerDebts() {
  const { customers, debtRecords, payCustomerDebt } = useStore();
  const [search, setSearch] = useState("");
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payNote, setPayNote] = useState("");

  const customersWithDebt = customers.filter((c) => c.totalDebt > 0);
  const filteredCustomers = customersWithDebt.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleOpenPayDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPayAmountStr(customer.totalDebt.toString());
    setPayNote(`Thu nợ khách hàng ${customer.name}`);
    setIsPayDialogOpen(true);
  };

  const handlePay = () => {
    if (!selectedCustomer) return;
    const amount = parseInt(payAmountStr.replace(/\D/g, "")) || 0;
    if (amount <= 0) {
      toast.error("Số tiền thu nợ phải lớn hơn 0");
      return;
    }
    if (amount > selectedCustomer.totalDebt) {
      toast.error("Số tiền thu lớn hơn số nợ hiện tại");
      return;
    }
    payCustomerDebt(selectedCustomer.id, amount, payNote);
    toast.success("Thu nợ thành công");
    setIsPayDialogOpen(false);
  };

  const getCustomerDebts = (customerId: string) =>
    debtRecords
      .filter((d) => d.type === "customer" && d.entityId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Công Nợ Khách Hàng</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tổng nợ cần thu:{" "}
            <span className="font-bold text-destructive text-base">
              {formatCurrency(customersWithDebt.reduce((s, c) => s + c.totalDebt, 0))}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
        <Input
          placeholder="Tìm khách hàng..."
          className="border-0 focus-visible:ring-0 shadow-none h-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-customer-debts"
        />
      </div>

      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl shadow-sm text-sm">
            {customersWithDebt.length === 0
              ? "Không có khách hàng nào đang nợ"
              : "Không tìm thấy khách hàng"}
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Collapsible
              key={customer.id}
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
                    <h3 className="font-semibold text-sm sm:text-base truncate">{customer.name}</h3>
                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground">Tổng nợ</div>
                    <div className="font-bold text-destructive sm:text-lg">
                      {formatCurrency(customer.totalDebt)}
                    </div>
                  </div>
                  <div className="text-right sm:hidden">
                    <div className="font-bold text-destructive text-sm">
                      {formatCurrency(customer.totalDebt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenPayDialog(customer)}
                    data-testid={`btn-pay-debt-${customer.id}`}
                  >
                    <Banknote className="mr-1 h-3.5 w-3.5" /> Thu nợ
                  </Button>
                </div>
              </div>
              <CollapsibleContent>
                <div className="p-3 sm:p-4 border-t bg-background">
                  <h4 className="text-xs font-semibold mb-3 mt-1 text-muted-foreground uppercase tracking-wider">
                    Lịch sử giao dịch
                  </h4>
                  <div className="space-y-2">
                    {getCustomerDebts(customer.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có lịch sử</p>
                    ) : (
                      getCustomerDebts(customer.id).map((record) => (
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
            <DialogTitle>Thu Nợ Khách Hàng</DialogTitle>
            <DialogDescription>
              Khách hàng:{" "}
              <strong className="text-foreground">{selectedCustomer?.name}</strong>
              <br />
              Nợ hiện tại:{" "}
              <strong className="text-destructive">
                {selectedCustomer ? formatCurrency(selectedCustomer.totalDebt) : ""}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Số tiền thu</Label>
              <Input
                value={payAmountStr}
                onChange={(e) => setPayAmountStr(e.target.value)}
                className="text-lg font-bold"
                data-testid="input-pay-amount"
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
            <Button onClick={handlePay}>Xác nhận thu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
