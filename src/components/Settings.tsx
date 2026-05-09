import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Cloud,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

interface SettingsProps {
  userId: string | null;
  onUserIdChange: (userId: string | null) => void;
}

export function Settings({ userId, onUserIdChange }: SettingsProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      setUser(session.user);
      onUserIdChange(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        onUserIdChange(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [onUserIdChange]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        onUserIdChange(data.user.id);
        setEmail("");
        setPassword("");
      }
    } catch (error: any) {
      alert(error.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        alert("注册成功，请检查邮箱里的验证链接。");
        setEmail("");
        setPassword("");
      }
    } catch (error: any) {
      alert(error.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      const newUserId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;

      chrome.storage.local.set({ userId: newUserId }, () => {
        onUserIdChange(newUserId);
      });
    } catch (error: any) {
      alert(error.message || "登出失败");
    } finally {
      setLoading(false);
    }
  };

  const currentIdentity = user?.email || userId || "未生成";

  return (
    <div className="relative p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 rounded-b-[40px] bg-[radial-gradient(circle_at_top,rgba(231,152,114,0.18),transparent_65%)]" />

      <div className="relative space-y-4">
        <Card className="overflow-hidden rounded-[30px] border-white/60 bg-[linear-gradient(135deg,rgba(255,248,240,0.94),rgba(241,228,214,0.84))] shadow-[0_24px_70px_rgba(86,60,43,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#987b68]">
                  Account Center
                </p>
                <h2 className="mt-3 font-[family:var(--font-display)] text-[30px] leading-none text-[#2f241e]">
                  设置与身份
                </h2>
                <p className="mt-3 max-w-[340px] text-sm leading-6 text-[#6f6158]">
                  可以继续使用本地匿名 ID，也可以登录 Supabase 账号，让书签跨设备同步。
                </p>
              </div>
              <div className="rounded-[24px] bg-white/70 p-4 text-right shadow-[0_16px_44px_rgba(91,66,49,0.08)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#a08573]">
                  当前身份
                </p>
                <p className="mt-2 max-w-[180px] break-all text-sm leading-5 text-[#42352d]">
                  {currentIdentity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-[24px] border-white/60 bg-white/72 shadow-[0_18px_48px_rgba(90,64,47,0.08)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-2xl bg-[#dde9e6] p-3 text-[#2f5d66]">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#9f8677]">
                  同步状态
                </p>
                <p className="mt-1 text-sm font-semibold text-[#302722]">
                  {user ? "已登录云端" : "本地匿名模式"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-white/60 bg-white/72 shadow-[0_18px_48px_rgba(90,64,47,0.08)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-2xl bg-[#f2e3d4] p-3 text-[#8b604a]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#9f8677]">
                  数据归属
                </p>
                <p className="mt-1 text-sm font-semibold text-[#302722]">
                  {user ? "账号隔离" : "本机标识隔离"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[30px] border-white/60 bg-white/72 shadow-[0_22px_60px_rgba(90,64,47,0.1)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-[#2f251f]">
              <User className="h-5 w-5 text-[#855948]" />
              账户
            </CardTitle>
            <CardDescription className="text-[#706158]">
              {user
                ? `当前登录邮箱：${user.email}`
                : "登录 Supabase Auth 后，user_id 会自动切换为真实账号 ID。"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-[#efe1d3] bg-[#faf4ed] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-[#8c5e4c] shadow-sm">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#9c8575]">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm text-[#352b25]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSignOut}
                  disabled={loading}
                  variant="outline"
                  className="h-11 w-full rounded-[18px] border-none bg-[#fbefea] text-[#b25d4b] hover:bg-[#f6e0d8]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-[#f4ebe2] p-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsSignUp(false)}
                    className={`rounded-[16px] ${
                      !isSignUp
                        ? "bg-white text-[#2d251f] shadow-sm hover:bg-white"
                        : "text-[#7d6e66] hover:bg-white/70"
                    }`}
                  >
                    登录
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsSignUp(true)}
                    className={`rounded-[16px] ${
                      isSignUp
                        ? "bg-white text-[#2d251f] shadow-sm hover:bg-white"
                        : "text-[#7d6e66] hover:bg-white/70"
                    }`}
                  >
                    注册
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4f433c]">邮箱</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 rounded-[18px] border-none bg-[#f7f1ea] shadow-none placeholder:text-[#9f8b7d]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4f433c]">密码</label>
                    <Input
                      type="password"
                      placeholder="至少 6 位"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11 rounded-[18px] border-none bg-[#f7f1ea] shadow-none placeholder:text-[#9f8b7d]"
                    />
                  </div>

                  <Button
                    onClick={isSignUp ? handleSignUp : handleSignIn}
                    disabled={loading || !email || !password}
                    className="h-11 w-full rounded-[18px] bg-[#2e5d66] text-white hover:bg-[#254e55]"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {isSignUp ? "创建账号" : "登录账号"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/60 bg-white/68 shadow-[0_18px_50px_rgba(90,64,47,0.08)]">
          <CardHeader>
            <CardTitle className="text-xl text-[#2f251f]">关于</CardTitle>
            <CardDescription className="text-[#706158]">
              智能书签管理器 v1.0.0
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[#655951]">
              这套界面围绕“轻量整理 + 云端同步”重做，保留原本的使用方式，但让扩展更像一个成熟产品而不是开发原型。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
