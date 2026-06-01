import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ShoppingCart, Package, Warehouse, Users, BookOpen, BarChart3,
  Wifi, WifiOff, Shield, Smartphone, Monitor, CheckCircle, ArrowRight,
  Star, Zap, Store, Download, Share, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { PWAPrompt } from "@/components/pwa/pwa-prompt";

function getDevice(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

const features = [
  {
    icon: ShoppingCart,
    title: "Bán Hàng POS",
    desc: "Giao diện bán hàng nhanh với tìm kiếm, quét mã vạch, giỏ hàng và in hóa đơn",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Package,
    title: "Quản Lý Hàng Hóa",
    desc: "Thêm sản phẩm, theo dõi tồn kho, cảnh báo hàng sắp hết tự động",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Warehouse,
    title: "Nhập Kho Dễ Dàng",
    desc: "Lập phiếu nhập hàng từ nhà cung cấp, tự động cập nhật tồn kho",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Users,
    title: "Quản Lý Công Nợ",
    desc: "Theo dõi nợ khách hàng và nợ nhà cung cấp, ghi nhận thanh toán",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BookOpen,
    title: "Sổ Quỹ Thu Chi",
    desc: "Quản lý dòng tiền vào ra, xem tồn quỹ theo thời gian thực",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: BarChart3,
    title: "Báo Cáo Thống Kê",
    desc: "Biểu đồ doanh thu, lợi nhuận, top sản phẩm bán chạy theo ngày/tuần/tháng",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

const platforms = [
  {
    key: "ios" as const,
    icon: Smartphone,
    title: "iPhone & iPad",
    subtitle: "Qua Safari",
    steps: [
      { icon: Share, text: "Nhấn nút Chia sẻ ở thanh Safari" },
      { icon: Plus, text: 'Chọn "Thêm vào Màn hình chính"' },
      { icon: CheckCircle, text: 'Nhấn "Thêm" để cài đặt' },
    ],
  },
  {
    key: "android" as const,
    icon: Smartphone,
    title: "Android",
    subtitle: "Qua Chrome",
    steps: [
      { icon: Download, text: 'Nhấn nút "Cài đặt ứng dụng" bên dưới' },
      { icon: CheckCircle, text: 'Hoặc vào menu Chrome → "Thêm vào màn hình chính"' },
      { icon: Star, text: "App xuất hiện ngay trên màn hình chính" },
    ],
  },
  {
    key: "desktop" as const,
    icon: Monitor,
    title: "PC & Mac",
    subtitle: "Chrome / Edge",
    steps: [
      { icon: Download, text: 'Nhấn biểu tượng Cài đặt ở thanh địa chỉ Chrome/Edge' },
      { icon: CheckCircle, text: 'Hoặc nhấn nút "Cài đặt" bên dưới' },
      { icon: Star, text: "App mở như cửa sổ riêng, không cần trình duyệt" },
    ],
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const { session } = useAuthStore();
  const device = getDevice();
  const [activePlatform, setActivePlatform] = useState<"ios" | "android" | "desktop">(device);

  useEffect(() => {
    if (session) navigate("/app");
  }, [session]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Store className="h-4.5 w-4.5 text-white h-5 w-5" />
            </div>
            <span className="font-bold text-lg">QuanLy Bán Hàng</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
            <Button size="sm" onClick={() => navigate("/register")}>
              Dùng miễn phí
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="h-3.5 w-3.5" />
            Hoạt động 100% Offline — Không cần internet
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Quản lý bán hàng
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              {" "}thông minh
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Ứng dụng POS dành cho tiểu thương Việt Nam — bán hàng, quản lý kho, công nợ, báo cáo.
            Miễn phí mãi mãi, dữ liệu lưu trên máy của bạn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-blue-500 hover:bg-blue-600"
              onClick={() => navigate("/register")}
            >
              Bắt đầu miễn phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={() => navigate("/login")}
            >
              Đã có tài khoản
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { label: "Miễn phí mãi mãi", icon: Star },
              { label: "100% Offline", icon: WifiOff },
              { label: "Dữ liệu an toàn", icon: Shield },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Icon className="h-5 w-5 text-blue-300" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Đầy đủ tính năng quản lý</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Mọi thứ bạn cần để vận hành cửa hàng hiệu quả — từ bán hàng đến báo cáo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`h-5.5 w-5.5 h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PWA INSTALL */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Cài đặt như app thật
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Không cần App Store hay CH Play — cài trực tiếp lên màn hình chính của bất kỳ thiết bị nào
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.key}
                  onClick={() => setActivePlatform(p.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activePlatform === p.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {p.title}
                </button>
              );
            })}
          </div>

          {/* Active Platform Instructions */}
          {platforms
            .filter((p) => p.key === activePlatform)
            .map((platform) => (
              <div
                key={platform.key}
                className="max-w-lg mx-auto bg-card border rounded-2xl p-8 shadow-sm"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <platform.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">{platform.title}</h3>
                  <p className="text-muted-foreground text-sm">{platform.subtitle}</p>
                </div>

                <div className="space-y-5 mb-8">
                  {platform.steps.map((step, i) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium">{step.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {platform.key !== "ios" && (
                  <div className="text-center">
                    <PWAPrompt variant="button" className="w-full" />
                  </div>
                )}

                {platform.key === "ios" && (
                  <div className="text-center">
                    <PWAPrompt variant="button" className="w-full" />
                  </div>
                )}
              </div>
            ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-violet-700 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Bắt đầu quản lý ngay hôm nay
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Đăng ký miễn phí trong 30 giây — không cần thẻ tín dụng, không quảng cáo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => navigate("/register")}
            >
              Tạo tài khoản miễn phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base border-white/40 text-white hover:bg-white/10"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Store className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-foreground">QuanLy Bán Hàng</span>
          </div>
          <p>Ứng dụng POS Offline miễn phí dành cho tiểu thương Việt Nam</p>
        </div>
      </footer>
    </div>
  );
}
