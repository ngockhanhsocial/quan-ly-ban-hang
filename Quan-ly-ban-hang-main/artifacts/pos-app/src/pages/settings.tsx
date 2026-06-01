import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Download, Upload, Trash2, ShieldAlert, Wifi, WifiOff, HardDrive, User, Smartphone } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { PWAPrompt } from "@/components/pwa/pwa-prompt";
import { PageShell, ContentGrid } from "@/components/layout/page-shell";

export default function Settings() {
  const { settings, updateSettings, exportData, importData, clearAllData } = useStore();
  const { session, updateProfile } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [shopForm, setShopForm] = useState(settings);
  const [profileForm, setProfileForm] = useState({
    name: session?.name || "",
    shopName: session?.shopName || "",
    phone: session?.phone || "",
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) totalSize += localStorage.getItem(key)?.length || 0;
    }
    setStorageUsed(totalSize);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSaveShop = () => {
    updateSettings(shopForm);
    toast.success("Đã lưu thông tin cửa hàng");
  };

  const handleSaveProfile = () => {
    updateProfile(profileForm);
    updateSettings({ shopName: profileForm.shopName, phone: profileForm.phone });
    setShopForm((prev) => ({ ...prev, shopName: profileForm.shopName, phone: profileForm.phone }));
    toast.success("Đã cập nhật hồ sơ tài khoản");
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file sao lưu");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        toast.success("Khôi phục dữ liệu thành công!");
        window.location.reload();
      } else {
        toast.error("File sao lưu không hợp lệ");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success("Đã xóa toàn bộ dữ liệu hệ thống");
    setIsClearDialogOpen(false);
    window.location.reload();
  };

  const MAX_STORAGE = 5 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageUsed / MAX_STORAGE) * 100));

  return (
    <PageShell
      title="Cài Đặt Hệ Thống"
      description="Quản lý hồ sơ, hóa đơn, giao diện và sao lưu dữ liệu cửa hàng."
      narrow
    >
      <ContentGrid>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              Hồ sơ tài khoản
            </CardTitle>
            <CardDescription>Thông tin cá nhân và tên cửa hàng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Họ tên</Label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={session?.email || ""}
                disabled
                className="h-10 truncate opacity-60"
                title={session?.email}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tên cửa hàng</Label>
              <Input
                value={profileForm.shopName}
                onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                placeholder="Tên cửa hàng"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="0901234567"
                type="tel"
                inputMode="tel"
                className="h-10"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 sm:flex-row">
            <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
              Lưu hồ sơ
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Thông tin hóa đơn</CardTitle>
            <CardDescription>Hiển thị trên hóa đơn in cho khách hàng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên cửa hàng (in hóa đơn)</Label>
              <Input
                value={shopForm.shopName}
                onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Điện thoại</Label>
              <Input
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="h-10"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Địa chỉ</Label>
              <Input
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                className="h-10"
                placeholder="Số nhà, đường, quận..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveShop} className="w-full sm:w-auto">
              Lưu thay đổi
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              Cài đặt ứng dụng (PWA)
            </CardTitle>
            <CardDescription>Cài app lên điện thoại hoặc máy tính để dùng như app thật</CardDescription>
          </CardHeader>
          <CardContent>
            <PWAPrompt variant="card" />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label>Giao diện Tối</Label>
                <p className="text-sm text-muted-foreground">Chế độ hiển thị Dark mode</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label>Mạng kết nối</Label>
                <p className="text-sm text-muted-foreground">App hoạt động 100% offline</p>
              </div>
              <div
                className={`flex shrink-0 items-center gap-1.5 text-sm font-medium ${
                  isOnline ? "text-green-600" : "text-amber-600"
                }`}
              >
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <HardDrive className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Bộ nhớ LocalStorage
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {(storageUsed / 1024).toFixed(1)} KB / 5 MB
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full transition-all ${storagePercent > 80 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </ContentGrid>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Sao lưu & Phục hồi</CardTitle>
          <CardDescription>Bảo vệ dữ liệu bằng cách tải file JSON về máy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="h-11 flex-1 justify-start" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4 shrink-0" />
              Xuất file dữ liệu (.json)
            </Button>

            <div className="relative flex-1">
              <Input
                type="file"
                accept=".json"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleImport}
              />
              <Button variant="outline" className="h-11 w-full justify-start border-dashed">
                <Upload className="mr-2 h-4 w-4 shrink-0" />
                Khôi phục từ file
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-11 flex-1 justify-start border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setIsClearDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 shrink-0" />
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Cảnh báo nguy hiểm
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu bao gồm: Sản phẩm, Khách hàng, Hóa đơn, Công nợ?
              <br />
              <br />
              <strong>Hành động này KHÔNG THỂ hoàn tác!</strong> Hãy xuất file sao lưu trước khi thực hiện.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsClearDialogOpen(false)} className="w-full sm:w-auto">
              Hủy bỏ
            </Button>
            <Button variant="destructive" onClick={handleClearAll} className="w-full sm:w-auto">
              Đồng ý Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
