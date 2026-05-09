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
  BookKey,
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
    <div className="p-4">
      <div className="space-y-3">
        <Card className="rounded-[20px] border-none bg-[#f6f0e8] shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#282521]">
                  设置与身份
                </h2>
                <p className="mt-1.5 text-[12px] leading-5 text-[#756f68]">
                  管理当前账号和同步方式
                </p>
              </div>
              <div className="rounded-[16px] bg-white px-3 py-2 text-right">
                <p className="text-[10px] text-[#8b847d]">当前身份</p>
                <p className="mt-1 max-w-[138px] break-all text-[12px] leading-5 text-[#3e372f]">
                  {currentIdentity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-[18px] border-none bg-[#f6f0e8] shadow-none">
            <CardContent className="flex items-center gap-3 p-3.5">
              <div className="rounded-[14px] bg-[#e0ebea] p-2.5 text-[#355e66]">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#8a837c]">
                  同步状态
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2f2a24]">
                  {user ? "已登录云端" : "本地匿名模式"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border-none bg-[#f6f0e8] shadow-none">
            <CardContent className="flex items-center gap-3 p-3.5">
              <div className="rounded-[14px] bg-[#f1e1d4] p-2.5 text-[#9c674f]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#8a837c]">
                  数据归属
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2f2a24]">
                  {user ? "账号隔离" : "本机标识隔离"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[20px] border-none bg-[#f6f0e8] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[17px] text-[#2f251f]">
              <User className="h-4.5 w-4.5 text-[#855948]" />
              账户
            </CardTitle>
            <CardDescription className="text-[12px] text-[#706158]">
              {user
                ? `当前登录邮箱：${user.email}`
                : "登录 Supabase Auth 后，user_id 会自动切换为真实账号 ID。"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="rounded-[18px] bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-[14px] bg-[#f8f2eb] p-2.5 text-[#8c5e4c]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#8a837c]">
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
                  className="h-10 w-full rounded-[14px] border-none bg-[#fbefea] text-[#b25d4b] hover:bg-[#f6e0d8]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-[#efe6dc] p-1">
                  <Button
                    variant="ghost"
                    onClick={() => setIsSignUp(false)}
                    className={`h-10 rounded-[12px] ${
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
                    className={`h-10 rounded-[12px] ${
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
                      className="h-10 rounded-[14px] border-none bg-white shadow-none placeholder:text-[#9f8b7d]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4f433c]">密码</label>
                    <Input
                      type="password"
                      placeholder="至少 6 位"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-10 rounded-[14px] border-none bg-white shadow-none placeholder:text-[#9f8b7d]"
                    />
                  </div>

                  <Button
                    onClick={isSignUp ? handleSignUp : handleSignIn}
                    disabled={loading || !email || !password}
                    className="h-10 w-full rounded-[14px] bg-[#355e66] text-white hover:bg-[#2a4f56]"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {isSignUp ? "创建账号" : "登录账号"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-none bg-[#f6f0e8] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[16px] text-[#2f251f]">
              <BookKey className="h-4.5 w-4.5 text-[#9c674f]" />
              关于
            </CardTitle>
            <CardDescription className="text-[12px] text-[#706158]">
              智能书签管理器 v1.1.0
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[#655951]">
              当前版本以右侧抽屉为主形态，优先提供更稳定的书签浏览、搜索和云端同步体验。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
