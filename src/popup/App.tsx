import { useState, useEffect } from "react";
import { Bookmark } from "@/lib/supabase";
import { bookmarkService } from "@/lib/supabase";
import { syncChromeBookmarks } from "@/lib/chrome-bookmarks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings } from "@/components/Settings";
import {
  Search,
  RefreshCw,
  ExternalLink,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 初始化：获取或创建用户ID
  useEffect(() => {
    chrome.storage.local.get(["userId"], (result) => {
      if (result.userId) {
        setUserId(result.userId);
        loadBookmarks(result.userId);
      } else {
        // 生成新的用户ID
        const newUserId = `user_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        chrome.storage.local.set({ userId: newUserId }, () => {
          setUserId(newUserId);
          loadBookmarks(newUserId);
        });
      }
    });
  }, []);

  // 加载书签并提取分类
  const loadBookmarks = async (uid: string) => {
    try {
      setLoading(true);
      let data: Bookmark[];

      if (selectedCategory) {
        data = await bookmarkService.getBookmarksByCategory(
          uid,
          selectedCategory
        );
      } else if (searchQuery.trim()) {
        if (useSemanticSearch) {
          data = await bookmarkService.semanticSearch(uid, searchQuery);
        } else {
          data = await bookmarkService.searchBookmarks(uid, searchQuery);
        }
      } else {
        data = await bookmarkService.getBookmarks(uid);
      }

      setBookmarks(data);

      // 提取所有分类
      const allBookmarks = await bookmarkService.getBookmarks(uid);
      const uniqueCategories = Array.from(
        new Set(allBookmarks.map((b) => b.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error("加载书签失败:", error);
      alert("加载书签失败，请检查网络连接和Supabase配置");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadBookmarks(userId);
    }
  }, [searchQuery, userId, selectedCategory, useSemanticSearch]); // loadBookmarks is stable

  const handleSync = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await syncChromeBookmarks(userId);
      alert(
        `同步完成！新增 ${result.synced} 个书签，共 ${result.total} 个书签`
      );
      await loadBookmarks(userId);
    } catch (error) {
      console.error("同步失败:", error);
      alert("同步失败，请检查Supabase配置");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个书签吗？")) return;

    try {
      await bookmarkService.deleteBookmark(id);
      if (userId) {
        await loadBookmarks(userId);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  const handleOpenBookmark = (url: string) => {
    chrome.tabs.create({ url });
  };

  const handleUserIdChange = (newUserId: string | null) => {
    setUserId(newUserId);
    if (newUserId) {
      chrome.storage.local.set({ userId: newUserId });
      loadBookmarks(newUserId);
    }
  };

  return (
    <div className="w-full min-w-[600px] h-screen flex flex-col bg-background">
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">智能书签管理器</h1>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="bookmarks" className="flex-1">
              书签
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              设置
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 书签页面的操作栏 */}
        {activeTab === "bookmarks" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSync}
                disabled={loading}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                同步书签
              </Button>
              <Button
                onClick={() => setUseSemanticSearch(!useSemanticSearch)}
                size="sm"
                variant={useSemanticSearch ? "default" : "outline"}
                title="切换语义搜索"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  useSemanticSearch ? "语义搜索书签..." : "搜索书签..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 分类筛选 */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  全部
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSearchQuery("");
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        {/* 书签列表 */}
        <TabsContent
          value="bookmarks"
          className="flex-1 overflow-y-auto m-0 p-4"
        >
          {loading && bookmarks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "没有找到匹配的书签"
                  : '还没有书签，点击"同步书签"开始使用'}
              </p>
              {!searchQuery && (
                <Button onClick={handleSync} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  同步Chrome书签
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {bookmark.favicon && (
                          <img
                            src={bookmark.favicon}
                            alt=""
                            className="w-5 h-5 mt-1 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1 line-clamp-1">
                            {bookmark.title}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {bookmark.url}
                          </CardDescription>
                          {bookmark.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {bookmark.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenBookmark(bookmark.url)}
                          title="打开链接"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(bookmark.id!)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {bookmark.category && (
                        <Badge variant="secondary">{bookmark.category}</Badge>
                      )}
                      {bookmark.tags &&
                        bookmark.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      {bookmark.visit_count !== undefined &&
                        bookmark.visit_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            访问 {bookmark.visit_count} 次
                          </span>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 设置页面 */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto m-0">
          <Settings userId={userId} onUserIdChange={handleUserIdChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
