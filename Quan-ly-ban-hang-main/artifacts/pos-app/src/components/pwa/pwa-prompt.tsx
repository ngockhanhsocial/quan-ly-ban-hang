import { useState, useEffect } from "react";
import { Download, Share, Plus, MoreVertical, Smartphone, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
});

function getDevice(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

interface PWAPromptProps {
  variant?: "button" | "card" | "banner";
  className?: string;
}

export function PWAPrompt({ variant = "button", className = "" }: PWAPromptProps) {
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const device = getDevice();

  useEffect(() => {
    if (deferredPrompt) setCanInstall(true);

    const handler = () => setCanInstall(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (device === "ios") {
      setShowIosGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setCanInstall(false);
        deferredPrompt = null;
      }
    }
  };

  if (installed) {
    return (
      <div className={`text-center text-sm text-green-600 font-medium ${className}`}>
        Ứng dụng đã được cài đặt trên thiết bị của bạn.
      </div>
    );
  }

  const isVisible = device === "ios" || canInstall;

  if (!isVisible && variant !== "card") return null;

  const buttonContent = (
    <>
      <Download className="h-4 w-4 mr-2" />
      {device === "ios"
        ? "Thêm vào Màn hình chính"
        : device === "android"
        ? "Cài đặt ứng dụng"
        : "Cài đặt trên máy tính"}
    </>
  );

  return (
    <>
      {variant === "button" && (
        <Button onClick={handleInstall} className={className}>
          {buttonContent}
        </Button>
      )}

      {variant === "card" && (
        <div
          className={`border rounded-xl p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl shrink-0">
              {device === "desktop" ? (
                <Monitor className="h-6 w-6 text-primary" />
              ) : (
                <Smartphone className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">Cài ứng dụng lên thiết bị</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {device === "ios"
                  ? "Dùng Safari → Chia sẻ → Thêm vào màn hình chính để cài app"
                  : device === "android"
                  ? "Nhấn nút bên dưới để cài app lên màn hình chính Android"
                  : "Cài đặt như app thật trên Chrome hoặc Edge — không cần App Store"}
              </p>
              <Button size="sm" onClick={handleInstall} disabled={!isVisible}>
                {buttonContent}
              </Button>
            </div>
          </div>
        </div>
      )}

      {variant === "banner" && (
        <div className="flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 shrink-0" />
            <span>
              {device === "ios"
                ? "Thêm vào màn hình chính để dùng offline"
                : "Cài đặt app để trải nghiệm tốt nhất"}
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 h-7 text-xs"
            onClick={handleInstall}
          >
            Cài đặt
          </Button>
        </div>
      )}

      <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Cài đặt trên iPhone / iPad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Safari mới hỗ trợ cài PWA. Làm theo 3 bước đơn giản sau:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Nhấn nút Chia sẻ</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tìm biểu tượng{" "}
                    <Share className="inline h-3.5 w-3.5 text-blue-500" /> ở thanh dưới (Safari trên
                    iPhone) hoặc thanh địa chỉ (iPad)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Chọn "Thêm vào Màn hình chính"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cuộn xuống trong menu chia sẻ và tìm{" "}
                    <Plus className="inline h-3 w-3" />{" "}
                    <strong>Thêm vào Màn hình chính</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Nhấn "Thêm" để xác nhận</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    App <strong>QuanLy</strong> sẽ xuất hiện trên màn hình chính như app từ App Store
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                App sẽ hoạt động offline hoàn toàn — không cần internet sau khi cài đặt.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
