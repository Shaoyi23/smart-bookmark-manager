import { useCallback, useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "@/components/Settings";
import {
  ExternalLink,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";

const lineClampStyles = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalBookmarks, setTotalBookmarks] = useState(0);

  const loadBookmarks = useCallback(
    async (uid: string) => {
      try {
        setLoading(true);

        let data: Bookmark[];
        if (selectedCategory) {
          data = await bookmarkService.getBookmarksByCategory(uid, selectedCategory);
        } else if (searchQuery.trim()) {
          data = useSemanticSearch
            ? await bookmarkService.semanticSearch(uid, searchQuery)
            : await bookmarkService.searchBookmarks(uid, searchQuery);
        } else {
          data = await bookmarkService.getBookmarks(uid);
        }

        setBookmarks(data);

        const allBookmarks = await bookmarkService.getBookmarks(uid);
        const uniqueCategories = Array.from(
          new Set(allBookmarks.map((bookmark) => bookmark.category).filter(Boolean))
        ) as string[];

        setCategories(uniqueCategories.sort());
        setTotalBookmarks(allBookmarks.length);
      } catch (error) {
        console.error("加载书签失败:", error);
        alert("加载书签失败，请检查网络连接和 Supabase 配置");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory, useSemanticSearch]
  );

  useEffect(() => {
    chrome.storage.local.get(["userId"], (result) => {
      if (result.userId) {
        setUserId(result.userId);
        loadBookmarks(result.userId);
        return;
      }

      const newUserId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;

      chrome.storage.local.set({ userId: newUserId }, () => {
        setUserId(newUserId);
        loadBookmarks(newUserId);
      });
    });
  }, [loadBookmarks]);

  useEffect(() => {
    if (userId) {
      loadBookmarks(userId);
    }
  }, [loadBookmarks, userId]);

  const handleSync = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await syncChromeBookmarks(userId);
      alert(`同步完成：新增 ${result.synced} 个书签，扫描到 ${result.total} 个书签`);
      await loadBookmarks(userId);
    } catch (error) {
      console.error("同步失败:", error);
      alert("同步失败，请检查 Supabase 配置");
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
    if (!newUserId) return;

    chrome.storage.local.set({ userId: newUserId });
    loadBookmarks(newUserId);
  };

  const visibleCount = bookmarks.length;
  const categoryCount = categories.length;
  const statusText = selectedCategory
    ? `当前分类：${selectedCategory}`
    : searchQuery
      ? `搜索 “${searchQuery}”`
      : "已连接云端书签库";

  return (
    <div className="relative flex h-screen min-w-[600px] flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-14%] top-[-12%] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(231,152,114,0.26),_transparent_70%)]" />
        <div className="absolute right-[-18%] top-[6%] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(79,102,112,0.22),_transparent_68%)]" />
        <div className="absolute bottom-[-16%] left-[24%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(213,191,159,0.2),_transparent_72%)]" />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative z-10 flex h-full flex-col"
      >
        <div className="border-b border-white/40 bg-white/70 px-5 pb-5 pt-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="border-white/70 bg-white/60 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#6d554a]"
              >
                Smart Bookmark Cloud
              </Badge>
              <div>
                <h1 className="font-[family:var(--font-display)] text-[30px] leading-none text-[#2b221d]">
                  智能书签管理器
                </h1>
                <p className="mt-2 max-w-[360px] text-sm leading-6 text-[#6c6059]">
                  为你的收藏做一次真正的整理，让同步、筛选和搜索都变得顺手。
                </p>
              </div>
            </div>

            <div className="grid min-w-[170px] grid-cols-2 gap-2 rounded-[24px] border border-white/60 bg-[#fffaf4]/80 p-3 shadow-[0_18px_50px_rgba(78,52,35,0.08)]">
              <div className="rounded-[18px] bg-white/80 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d8473]">
                  Total
                </p>
                <p className="mt-2 font-[family:var(--font-display)] text-2xl text-[#2c241e]">
                  {totalBookmarks}
                </p>
              </div>
              <div className="rounded-[18px] bg-[#f3e5d7]/80 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8b654f]">
                  分类
                </p>
                <p className="mt-2 font-[family:var(--font-display)] text-2xl text-[#3b2a21]">
                  {categoryCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-[18px] border border-white/60 bg-[#f7efe6]/80 p-1.5">
              <TabsTrigger
                value="bookmarks"
                className="rounded-[14px] py-2.5 text-sm data-[state=active]:bg-white"
              >
                书签库
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-[14px] py-2.5 text-sm data-[state=active]:bg-white"
              >
                设置
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="bookmarks" className="mt-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-4 px-5 pb-5 pt-4">
            <Card className="overflow-hidden rounded-[28px] border-white/60 bg-[linear-gradient(135deg,rgba(255,249,241,0.95),rgba(245,233,219,0.82))] shadow-[0_24px_80px_rgba(82,57,39,0.1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSync}
                    disabled={loading}
                    className="h-11 flex-1 rounded-[18px] bg-[#2e5d66] text-[#f7f3ed] shadow-[0_12px_30px_rgba(46,93,102,0.24)] hover:bg-[#254e55]"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    同步书签
                  </Button>
                  <Button
                    onClick={() => setUseSemanticSearch(!useSemanticSearch)}
                    variant="outline"
                    className={`h-11 rounded-[18px] border-none px-4 ${
                      useSemanticSearch
                        ? "bg-[#e58c64] text-white hover:bg-[#d97f56]"
                        : "bg-white/75 text-[#5f5148] hover:bg-white"
                    }`}
                    title="切换语义搜索"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/70 bg-white/75 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a786f]" />
                    <Input
                      type="text"
                      placeholder={useSemanticSearch ? "语义搜索书签..." : "搜索标题、链接或描述..."}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-12 rounded-[18px] border-none bg-[#f7f1ea] pl-11 text-sm shadow-none placeholder:text-[#9b8a81] focus-visible:ring-1"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#7c6d64]">
                    <span>{statusText}</span>
                    <span>{useSemanticSearch ? "语义模式" : "文本模式"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 rounded-full border-none px-4 ${
                    selectedCategory === null
                      ? "bg-[#2f5d66] text-white hover:bg-[#284f57]"
                      : "bg-white/70 text-[#6e5f56] hover:bg-white"
                  }`}
                >
                  全部
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSearchQuery("");
                    }}
                    className={`shrink-0 rounded-full border-none px-4 ${
                      selectedCategory === category
                        ? "bg-[#e58c64] text-white hover:bg-[#d97f56]"
                        : "bg-[#f7efe6] text-[#6f6158] hover:bg-white"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Card className="rounded-[24px] border-white/60 bg-white/70 shadow-[0_16px_40px_rgba(90,66,48,0.08)]">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-2xl bg-[#f1dfd2] p-2.5 text-[#855947]">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9c8575]">
                      已展示
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#2e2722]">
                      {visibleCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[24px] border-white/60 bg-white/70 shadow-[0_16px_40px_rgba(90,66,48,0.08)]">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-2xl bg-[#dde7e7] p-2.5 text-[#2f5d66]">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9c8575]">
                      分类数
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#2e2722]">
                      {categoryCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[24px] border-white/60 bg-white/70 shadow-[0_16px_40px_rgba(90,66,48,0.08)]">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-2xl bg-[#f3eadc] p-2.5 text-[#8f6f3c]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9c8575]">
                      搜索模式
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#2e2722]">
                      {useSemanticSearch ? "语义" : "文本"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {loading && bookmarks.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[28px] border border-white/55 bg-white/60">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#7d6f67]" />
                </div>
              ) : bookmarks.length === 0 ? (
                <Card className="flex h-full flex-col items-center justify-center rounded-[32px] border-dashed border-white/70 bg-white/55 px-8 text-center shadow-[0_18px_50px_rgba(95,70,55,0.06)]">
                  <CardContent className="py-12">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f0dfd1] text-[#8b5948]">
                      <Plus className="h-6 w-6" />
                    </div>
                    <h2 className="mt-5 font-[family:var(--font-display)] text-2xl text-[#2b231f]">
                      {searchQuery ? "没有找到匹配结果" : "先把书签同步进来"}
                    </h2>
                    <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#75675f]">
                      {searchQuery
                        ? "可以试试更短的关键词，或者切换到另一种搜索模式。"
                        : "从 Chrome 一键导入后，这里会成为你的云端书签工作台。"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={handleSync}
                        disabled={loading}
                        className="mt-6 rounded-[18px] bg-[#2e5d66] px-5 text-white hover:bg-[#254e55]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        同步 Chrome 书签
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 pb-1">
                  {bookmarks.map((bookmark) => {
                    const hostname = (() => {
                      try {
                        return new URL(bookmark.url).hostname.replace(/^www\./, "");
                      } catch {
                        return bookmark.url;
                      }
                    })();

                    return (
                      <Card
                        key={bookmark.id}
                        className="overflow-hidden rounded-[28px] border-white/60 bg-white/72 shadow-[0_20px_55px_rgba(90,64,47,0.09)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#f4e4d6]">
                                {bookmark.favicon ? (
                                  <img
                                    src={bookmark.favicon}
                                    alt=""
                                    className="h-5 w-5"
                                    onError={(event) => {
                                      (event.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm font-semibold uppercase text-[#915f4d]">
                                    {hostname.slice(0, 1)}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle
                                    className="text-[17px] leading-6 text-[#2c241f]"
                                    style={{ ...lineClampStyles, WebkitLineClamp: 1 }}
                                  >
                                    {bookmark.title}
                                  </CardTitle>
                                  <Badge
                                    variant="outline"
                                    className="hidden rounded-full border-none bg-[#eef2f2] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#52727a] sm:inline-flex"
                                  >
                                    {hostname}
                                  </Badge>
                                </div>
                                <CardDescription
                                  className="mt-1 text-xs text-[#7c6d64]"
                                  style={{ ...lineClampStyles, WebkitLineClamp: 1 }}
                                >
                                  {bookmark.url}
                                </CardDescription>
                                {bookmark.description && (
                                  <p
                                    className="mt-2 text-sm leading-6 text-[#62564f]"
                                    style={{ ...lineClampStyles, WebkitLineClamp: 2 }}
                                  >
                                    {bookmark.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenBookmark(bookmark.url)}
                                title="打开链接"
                                className="h-10 w-10 rounded-full bg-[#f7efe7] text-[#5a514c] hover:bg-[#ece0d5]"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(bookmark.id!)}
                                title="删除"
                                className="h-10 w-10 rounded-full bg-[#fbefea] text-[#b85d4b] hover:bg-[#f7dfd7]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {bookmark.category && (
                              <Badge className="rounded-full bg-[#2f5d66] px-3 py-1 text-white hover:bg-[#2f5d66]">
                                {bookmark.category}
                              </Badge>
                            )}
                            {bookmark.tags?.map((tag, index) => (
                              <Badge
                                key={`${bookmark.id}-${tag}-${index}`}
                                variant="outline"
                                className="rounded-full border-none bg-[#efe7de] px-3 py-1 text-[#6c5d53]"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {bookmark.visit_count !== undefined && bookmark.visit_count > 0 && (
                              <span className="text-xs text-[#81736a]">
                                访问 {bookmark.visit_count} 次
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <Settings userId={userId} onUserIdChange={handleUserIdChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
