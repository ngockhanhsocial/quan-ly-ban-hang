import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    shopName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.shopName || !form.password) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    const result = await register({
      email: form.email,
      name: form.name,
      shopName: form.shopName,
      phone: form.phone,
      password: form.password,
    });
    setLoading(false);

    if (result.success) {
      toast.success(`Chào mừng ${form.name}! Cửa hàng "${form.shopName}" đã sẵn sàng.`);
      navigate("/app");
    } else {
      toast.error(result.error || "Đăng ký thất bại");
    }
  };

  const benefits = [
    "Miễn phí mãi mãi, không quảng cáo",
    "Dữ liệu lưu trên thiết bị của bạn",
    "Hoạt động offline 100%",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Tạo tài khoản miễn phí</h1>
          <p className="text-slate-400 mt-1 text-sm">Bắt đầu quản lý cửa hàng của bạn</p>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mb-7">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-200 text-sm">Họ tên *</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={update("name")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-200 text-sm">Email *</Label>
                <Input
                  type="email"
                  placeholder="ban@example.com"
                  value={form.email}
                  onChange={update("email")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  autoComplete="email"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-200 text-sm">Tên cửa hàng *</Label>
                <Input
                  placeholder="VD: Tạp Hóa Hoa Mai"
                  value={form.shopName}
                  onChange={update("shopName")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  data-testid="input-shop-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-200 text-sm">Số điện thoại</Label>
                <Input
                  type="tel"
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={update("phone")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-200 text-sm">Mật khẩu * (tối thiểu 6 ký tự)</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Mật khẩu bảo mật"
                  value={form.password}
                  onChange={update("password")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary pr-10"
                  autoComplete="new-password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-200 text-sm">Xác nhận mật khẩu *</Label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                autoComplete="new-password"
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 mt-2"
              disabled={loading}
              data-testid="btn-register"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo tài khoản...</>
              ) : (
                "Tạo tài khoản miễn phí"
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-400 text-sm">
              Đã có tài khoản?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="block mx-auto mt-5 text-slate-500 hover:text-slate-400 text-xs"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}
