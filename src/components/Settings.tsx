import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, LogOut, User, Mail } from 'lucide-react'

interface SettingsProps {
  userId: string | null
  onUserIdChange: (userId: string | null) => void
}

export function Settings({ onUserIdChange }: SettingsProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    // 检查当前登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        // 使用Supabase用户ID
        onUserIdChange(session.user.id)
      }
    })

    // 监听认证状态变化
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        onUserIdChange(session.user.id)
      } else {
        setUser(null)
      }
    })
  }, [onUserIdChange])

  const handleSignIn = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        onUserIdChange(data.user.id)
        setEmail('')
        setPassword('')
      }
    } catch (error: any) {
      alert(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        alert('注册成功！请检查邮箱验证链接。')
        setEmail('')
        setPassword('')
      }
    } catch (error: any) {
      alert(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      // 生成新的匿名用户ID
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      chrome.storage.local.set({ userId: newUserId }, () => {
        onUserIdChange(newUserId)
      })
    } catch (error: any) {
      alert(error.message || '登出失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">设置</h2>
        <p className="text-muted-foreground">管理您的账户和偏好设置</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            账户
          </CardTitle>
          <CardDescription>
            {user ? `已登录: ${user.email}` : '登录以同步您的书签到云端'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <Button
                onClick={handleSignOut}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!isSignUp ? "default" : "outline"}
                  onClick={() => setIsSignUp(false)}
                  className="flex-1"
                >
                  登录
                </Button>
                <Button
                  variant={isSignUp ? "default" : "outline"}
                  onClick={() => setIsSignUp(true)}
                  className="flex-1"
                >
                  注册
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">邮箱</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">密码</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={isSignUp ? handleSignUp : handleSignIn}
                  disabled={loading || !email || !password}
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isSignUp ? '注册' : '登录'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
          <CardDescription>智能书签管理器 v1.0.0</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            帮助您整理和发现收藏的网页。支持分类管理、智能搜索和云端同步。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

