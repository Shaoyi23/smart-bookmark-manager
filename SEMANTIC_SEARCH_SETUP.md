# 语义搜索设置指南

## 概述

智能书签管理器支持两种搜索模式：
1. **文本搜索**（默认）：基于关键词匹配的快速搜索
2. **语义搜索**：基于向量相似度的智能搜索，可以理解搜索意图

## 当前实现

目前语义搜索功能已集成到代码中，但需要以下步骤来完全启用：

### 1. 在Supabase中启用pgvector扩展

在Supabase SQL编辑器中执行：

```sql
-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为bookmarks表添加向量列
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 创建向量索引（提高搜索性能）
CREATE INDEX IF NOT EXISTS bookmarks_embedding_idx ON bookmarks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 2. 创建向量搜索函数

```sql
-- 创建语义搜索函数
CREATE OR REPLACE FUNCTION search_bookmarks_semantic(
  p_user_id TEXT,
  p_query_text TEXT,
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  title TEXT,
  url TEXT,
  description TEXT,
  tags TEXT[],
  category TEXT,
  favicon TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_visited TIMESTAMPTZ,
  visit_count INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- 这里需要调用OpenAI API生成查询向量
  -- 由于需要在服务器端调用，建议使用Supabase Edge Function
  
  -- 临时实现：使用文本搜索作为后备
  RETURN QUERY
  SELECT 
    b.*,
    1.0::FLOAT as similarity
  FROM bookmarks b
  WHERE b.user_id = p_user_id
    AND (
      b.title ILIKE '%' || p_query_text || '%'
      OR b.url ILIKE '%' || p_query_text || '%'
      OR b.description ILIKE '%' || p_query_text || '%'
    )
  ORDER BY b.created_at DESC
  LIMIT p_match_count;
END;
$$;
```

### 3. 使用Supabase Edge Function生成向量

创建Edge Function来处理向量生成：

1. 在Supabase Dashboard中创建新的Edge Function
2. 使用OpenAI API生成文本的向量表示
3. 将向量存储到bookmarks表的embedding列

### 4. 更新代码以使用向量搜索

在 `src/lib/supabase.ts` 中的 `semanticSearch` 函数中，取消注释RPC调用：

```typescript
async semanticSearch(userId: string, query: string) {
  try {
    const { data, error } = await supabase.rpc('search_bookmarks_semantic', {
      user_id: userId,
      query_text: query,
      match_threshold: 0.7,
      match_count: 20
    });
    
    if (error) throw error;
    return data as Bookmark[];
  } catch (error) {
    console.error('语义搜索失败，使用文本搜索:', error);
    return this.searchBookmarks(userId, query);
  }
}
```

## 简化方案（推荐）

如果暂时不需要完整的向量搜索，可以使用以下优化：

1. **改进文本搜索**：使用全文搜索索引
2. **模糊匹配**：使用PostgreSQL的相似度函数
3. **关键词提取**：提取搜索关键词并匹配标签

## 注意事项

- 向量搜索需要额外的计算资源
- OpenAI API调用会产生费用
- 建议先使用文本搜索，在数据量较大时再启用向量搜索

## 未来改进

- 自动生成书签描述和标签
- 基于用户行为的个性化搜索
- 多语言搜索支持

