import { supabase } from "./supabase";

export interface ChromeBookmark {
  id: string;
  title: string;
  url?: string;
  children?: ChromeBookmark[];
  parentId?: string;
}

export async function getAllChromeBookmarks(): Promise<ChromeBookmark[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(bookmarkTreeNodes);
      }
    });
  });
}

export function flattenBookmarks(
  bookmarks: ChromeBookmark[],
  result: Array<ChromeBookmark & { category?: string }> = [],
  parentCategory = ""
): Array<ChromeBookmark & { category?: string }> {
  for (const bookmark of bookmarks) {
    if (!bookmark.url && bookmark.children) {
      const folderName =
        bookmark.title === "Bookmarks Bar" || bookmark.title === "其他书签"
          ? ""
          : bookmark.title;
      const newCategory = parentCategory
        ? `${parentCategory} > ${folderName}`.trim()
        : folderName;

      flattenBookmarks(bookmark.children, result, newCategory || parentCategory);
    } else if (bookmark.url) {
      const category = parentCategory || "未分类";
      result.push({ ...bookmark, category });
    } else if (bookmark.children) {
      flattenBookmarks(bookmark.children, result, parentCategory);
    }
  }

  return result;
}

export async function syncChromeBookmarks(userId: string) {
  try {
    const bookmarkTree = await getAllChromeBookmarks();
    const flatBookmarks = flattenBookmarks(bookmarkTree);

    const { data: existingBookmarks } = await supabase
      .from("bookmarks")
      .select("url")
      .eq("user_id", userId);

    const existingUrls = new Set(existingBookmarks?.map((bookmark) => bookmark.url) || []);
    const uniqueIncoming = new Map<
      string,
      {
        user_id: string;
        title: string;
        url: string;
        description: string;
        tags: string[];
        category: string;
        favicon: string;
      }
    >();

    for (const bookmark of flatBookmarks) {
      if (!bookmark.url || existingUrls.has(bookmark.url)) continue;

      uniqueIncoming.set(bookmark.url, {
        user_id: userId,
        title: bookmark.title,
        url: bookmark.url,
        description: "",
        tags: [],
        category: bookmark.category || "未分类",
        favicon: `https://www.google.com/s2/favicons?domain=${
          new URL(bookmark.url).hostname
        }&sz=32`,
      });
    }

    const newBookmarks = Array.from(uniqueIncoming.values());

    if (newBookmarks.length > 0) {
      const { error } = await supabase
        .from("bookmarks")
        .upsert(newBookmarks, { onConflict: "user_id,url", ignoreDuplicates: true });

      if (error) throw error;
    }

    return { synced: newBookmarks.length, total: flatBookmarks.length };
  } catch (error) {
    console.error("同步书签失败:", error);
    throw error;
  }
}
