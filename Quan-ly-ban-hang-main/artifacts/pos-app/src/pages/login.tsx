import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success("Đăng nhập thành công!");
      navigate("/app");
    } else {
      toast.error(result.error || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">QuanLy Bán Hàng</h1>
          <p className="text-slate-400 mt-1 text-sm">Đăng nhập vào tài khoản của bạn</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-slate-200">Email</Label>
              <Input
                type="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                autoComplete="email"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-200">Mật khẩu</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary pr-10"
                  autoComplete="current-password"
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

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
              disabled={loading}
              data-testid="btn-login"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng nhập...</>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Chưa có tài khoản?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Đăng ký miễn phí
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Dữ liệu lưu trữ an toàn trên thiết bị của bạn
        </p>

        <button
          onClick={() => navigate("/")}
          className="block mx-auto mt-4 text-slate-500 hover:text-slate-400 text-xs"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}
