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
import { Settings } from "@/components/Settings";
import {
  BookMarked,
  Bookmark as BookmarkIcon,
  Cloud,
  ExternalLink,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

const lineClampStyles = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};

type Section = "bookmarks" | "settings";

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("bookmarks");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalBookmarks, setTotalBookmarks] = useState(0);

  const mode = document.body.getAttribute("data-mode") || "drawer";
  const isDrawer = mode === "drawer";

  const loadBookmarks = useCallback(
    async (uid: string) => {
      try {
        setLoading(true);

        let data: Bookmark[];
        if (selectedCategory) {
          data = await bookmarkService.getBookmarksByCategory(uid, selectedCategory);
        } else if (searchQuery.trim()) {
          data = await bookmarkService.searchBookmarks(uid, searchQuery);
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
    [searchQuery, selectedCategory]
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

  const handleCloseDrawer = () => {
    if (!isDrawer) return;
    window.parent.postMessage(
      { source: "smart-bookmark-manager", type: "close-drawer" },
      "*"
    );
  };

  const visibleCount = bookmarks.length;
  const categoryCount = categories.length;
  const statusText = selectedCategory
    ? `当前分类：${selectedCategory}`
    : searchQuery
      ? `搜索 “${searchQuery}”`
      : "已连接云端书签库";

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#f5efe7] text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(228,181,146,0.22),_transparent_72%)]" />
        <div className="absolute bottom-[-12%] left-[28%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(154,180,181,0.18),_transparent_72%)]" />
      </div>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col border-r border-[#e7ddd2] bg-[rgba(255,252,247,0.92)]">
        <header className="border-b border-[#eee4d8] px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#355e66,#21434a)] text-white shadow-[0_12px_20px_rgba(53,94,102,0.18)]">
                <BookmarkIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[17px] font-semibold tracking-[-0.03em] text-[#1f2625]">
                  智能书签管理器
                </h1>
                <p className="mt-0.5 text-[11px] text-[#6f6b65]">
                  {totalBookmarks} 条书签 · {categoryCount} 个分类
                </p>
              </div>
            </div>

            {isDrawer && (
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#645e59] shadow-[0_8px_18px_rgba(88,70,52,0.07)] transition-colors hover:bg-[#faf4ed]"
                title="关闭"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </header>

        {activeSection === "bookmarks" ? (
          <section className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
            <Card className="rounded-[20px] border-none bg-[#f6f0e8] shadow-none">
              <CardContent className="space-y-2.5 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c877f]" />
                    <Input
                      type="text"
                      placeholder="搜索标题、链接或描述..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-10 rounded-[14px] border-none bg-white pl-11 text-sm shadow-none placeholder:text-[#a09a94] focus-visible:ring-2 focus-visible:ring-[#355e66]/15"
                    />
                  </div>
                  <Button
                    onClick={handleSync}
                    disabled={loading}
                    className="h-10 shrink-0 rounded-[14px] bg-[#355e66] px-4 text-white shadow-[0_10px_24px_rgba(53,94,102,0.18)] hover:bg-[#2a4f56]"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    同步
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 text-[12px] text-[#76706a]">
                  <span>{statusText}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#6f6b65]">
                      已展示 {visibleCount}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#6f6b65]">
                      分类 {categoryCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {categories.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={`h-9 shrink-0 rounded-full border-none px-4 ${
                    selectedCategory === null
                      ? "bg-[#355e66] text-white hover:bg-[#2a4f56]"
                      : "bg-[#f0ebe4] text-[#6e6963] hover:bg-[#eae4dc]"
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
                    className={`h-9 shrink-0 rounded-full border-none px-4 ${
                      selectedCategory === category
                        ? "bg-[#355e66] text-white hover:bg-[#2a4f56]"
                        : "bg-[#f0ebe4] text-[#6e6963] hover:bg-[#eae4dc]"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}

            <div className="mt-3 flex min-h-0 flex-1 flex-col">
              {loading && bookmarks.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[26px] bg-[#f6f0e8]">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#8d887f]" />
                </div>
              ) : bookmarks.length === 0 ? (
                <Card className="flex h-full flex-col items-center justify-center rounded-[26px] border-none bg-[#f6f0e8] text-center shadow-none">
                  <CardContent className="px-8 py-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-white text-[#9b948b]">
                      <BookmarkIcon className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 text-[19px] font-semibold tracking-[-0.03em] text-[#292521]">
                      {searchQuery ? "没有找到匹配结果" : "暂无书签内容"}
                    </h2>
                    <p className="mx-auto mt-3 max-w-[260px] text-sm leading-6 text-[#7a746d]">
                      {searchQuery
                        ? "可以试试更短的关键词，或者切换到其他分类查看。"
                        : "同步 Chrome 书签后，这里会成为你的收藏整理抽屉。"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-hidden">
                  <div className="space-y-3 pb-2">
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
                          className="rounded-[20px] border-none bg-[#f6f0e8] shadow-none transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <CardHeader className="p-3.5 pb-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#8c877f]">
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
                                    <span className="text-sm font-semibold uppercase text-[#355e66]">
                                      {hostname.slice(0, 1)}
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <CardTitle
                                    className="text-[15px] leading-6 text-[#282521]"
                                    style={{ ...lineClampStyles, WebkitLineClamp: 1 }}
                                  >
                                    {bookmark.title}
                                  </CardTitle>
                                  <CardDescription
                                    className="mt-0.5 text-xs text-[#7b756e]"
                                    style={{ ...lineClampStyles, WebkitLineClamp: 1 }}
                                  >
                                    {bookmark.url}
                                  </CardDescription>
                                  {bookmark.description && (
                                    <p
                                      className="mt-2 text-sm leading-6 text-[#67615a]"
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
                                  className="h-9 w-9 rounded-full bg-white text-[#65615b] hover:bg-[#efe8df]"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(bookmark.id!)}
                                  title="删除"
                                  className="h-9 w-9 rounded-full bg-white text-[#b8665f] hover:bg-[#faece8]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="px-3.5 pb-3.5 pt-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {bookmark.category && (
                                <Badge className="rounded-full border-none bg-white px-3 py-1 text-[#355e66] hover:bg-white">
                                  {bookmark.category}
                                </Badge>
                              )}
                              {bookmark.tags?.map((tag, index) => (
                                <Badge
                                  key={`${bookmark.id}-${tag}-${index}`}
                                  variant="outline"
                                  className="rounded-full border-none bg-[#ece4da] px-3 py-1 text-[#76706a]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {bookmark.visit_count !== undefined && bookmark.visit_count > 0 && (
                                <span className="text-xs text-[#84807a]">
                                  访问 {bookmark.visit_count} 次
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden">
            <Settings userId={userId} onUserIdChange={handleUserIdChange} />
          </div>
        )}
      </main>

      <aside className="relative z-10 flex w-[64px] shrink-0 flex-col items-center gap-3 border-l border-white/40 bg-[rgba(244,236,226,0.9)] px-2.5 py-4">
        <button
          type="button"
          onClick={() => setActiveSection("bookmarks")}
          className={`flex h-11 w-11 items-center justify-center rounded-[15px] transition-colors ${
            activeSection === "bookmarks"
              ? "bg-white text-[#355e66] shadow-[0_10px_22px_rgba(88,70,52,0.08)]"
              : "bg-[#ede4d9] text-[#7c766f] hover:bg-white"
          }`}
          title="书签库"
        >
          <BookMarked className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("settings")}
          className={`flex h-11 w-11 items-center justify-center rounded-[15px] transition-colors ${
            activeSection === "settings"
              ? "bg-white text-[#355e66] shadow-[0_10px_22px_rgba(88,70,52,0.08)]"
              : "bg-[#ede4d9] text-[#7c766f] hover:bg-white"
          }`}
          title="设置"
        >
          <Settings2 className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#ede4d9] text-[#7c766f]">
          <Cloud className="h-5 w-5" />
        </div>

        <div className="mt-auto w-full rounded-[16px] bg-white/75 px-2 py-2.5 text-center shadow-[0_10px_18px_rgba(88,70,52,0.06)]">
          <p className="text-[10px] text-[#847d76]">当前</p>
          <p className="mt-1 text-base font-semibold leading-none tracking-[-0.03em] text-[#2a2621]">
            {visibleCount}
          </p>
        </div>
      </aside>
    </div>
  );
}

export default App;
