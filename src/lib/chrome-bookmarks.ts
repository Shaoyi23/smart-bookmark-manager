// Chrome书签API封装
import { supabase } from "./supabase";

export interface ChromeBookmark {
  id: string;
  title: string;
  url?: string;
  children?: ChromeBookmark[];
  parentId?: string;
}

// 获取所有Chrome书签
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

// 扁平化书签树，保留分类信息
export function flattenBookmarks(
  bookmarks: ChromeBookmark[],
  result: Array<ChromeBookmark & { category?: string }> = [],
  parentCategory: string = ""
): Array<ChromeBookmark & { category?: string }> {
  for (const bookmark of bookmarks) {
    // 如果是文件夹，更新分类路径
    if (!bookmark.url && bookmark.children) {
      const folderName = bookmark.title === "Bookmarks Bar" || bookmark.title === "其他书签" 
        ? "" 
        : bookmark.title;
      const newCategory = parentCategory 
        ? `${parentCategory} > ${folderName}`.trim()
        : folderName;
      
      if (bookmark.children) {
        flattenBookmarks(bookmark.children, result, newCategory || parentCategory);
      }
    } else if (bookmark.url) {
      // 如果是书签，添加分类信息
      const category = parentCategory || "未分类";
      result.push({ ...bookmark, category });
    } else if (bookmark.children) {
      // 处理其他情况
      flattenBookmarks(bookmark.children, result, parentCategory);
    }
  }
  return result;
}

// 同步Chrome书签到Supabase
export async function syncChromeBookmarks(userId: string) {
  try {
    const bookmarkTree = await getAllChromeBookmarks();
    const flatBookmarks = flattenBookmarks(bookmarkTree);

    // 获取已存在的书签URL
    const { data: existingBookmarks } = await supabase
      .from("bookmarks")
      .select("url")
      .eq("user_id", userId);

    const existingUrls = new Set(existingBookmarks?.map((b) => b.url) || []);

    // 过滤出新书签
    const newBookmarks = flatBookmarks
      .filter((b) => b.url && !existingUrls.has(b.url))
      .map((bookmark) => ({
        user_id: userId,
        title: bookmark.title,
        url: bookmark.url!,
        description: "",
        tags: [],
        category: bookmark.category || "未分类",
        favicon: `https://www.google.com/s2/favicons?domain=${
          new URL(bookmark.url!).hostname
        }&sz=32`,
      }));

    if (newBookmarks.length > 0) {
      const { error } = await supabase.from("bookmarks").insert(newBookmarks);

      if (error) throw error;
    }

    return { synced: newBookmarks.length, total: flatBookmarks.length };
  } catch (error) {
    console.error("同步书签失败:", error);
    throw error;
  }
}

