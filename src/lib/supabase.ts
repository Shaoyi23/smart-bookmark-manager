import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 书签类型定义
export interface Bookmark {
  id?: string
  user_id?: string
  title: string
  url: string
  description?: string
  tags?: string[]
  category?: string
  favicon?: string
  created_at?: string
  updated_at?: string
  last_visited?: string
  visit_count?: number
}

// 书签数据库操作
export const bookmarkService = {
  // 获取所有书签
  async getBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Bookmark[]
  },

  // 添加书签
  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([bookmark])
      .select()
      .single()
    
    if (error) throw error
    return data as Bookmark
  },

  // 更新书签
  async updateBookmark(id: string, updates: Partial<Bookmark>) {
    const { data, error } = await supabase
      .from('bookmarks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Bookmark
  },

  // 删除书签
  async deleteBookmark(id: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 搜索书签（文本搜索）
  async searchBookmarks(userId: string, query: string) {
    const searchTerm = `%${query}%`;
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike."${searchTerm}",url.ilike."${searchTerm}",description.ilike."${searchTerm}"`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('搜索错误:', error);
      // 如果or查询失败，尝试分别查询
      const { data: titleData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', searchTerm)
        .order('created_at', { ascending: false });
      
      const { data: urlData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .ilike('url', searchTerm)
        .order('created_at', { ascending: false });
      
      const { data: descData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .ilike('description', searchTerm)
        .order('created_at', { ascending: false });
      
      // 合并结果并去重
      const allResults = [...(titleData || []), ...(urlData || []), ...(descData || [])];
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      );
      return uniqueResults as Bookmark[];
    }
    return data as Bookmark[]
  },

  // 语义搜索（向量搜索）- 需要启用pgvector扩展
  async semanticSearch(userId: string, query: string) {
    try {
      // 首先尝试文本搜索作为后备
      const textResults = await this.searchBookmarks(userId, query);
      
      // 如果启用了向量搜索，可以在这里调用RPC函数
      // 注意：需要在Supabase中创建向量列和搜索函数
      // const { data, error } = await supabase.rpc('search_bookmarks_semantic', {
      //   user_id: userId,
      //   query_text: query,
      //   match_threshold: 0.7,
      //   match_count: 20
      // });
      
      return textResults;
    } catch (error) {
      console.error('语义搜索失败，使用文本搜索:', error);
      // 如果向量搜索失败，回退到文本搜索
      return this.searchBookmarks(userId, query);
    }
  },

  // 按分类获取书签
  async getBookmarksByCategory(userId: string, category: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Bookmark[]
  },
}

