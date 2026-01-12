-- ============================================
-- pages_v2 表测试查询
-- ============================================

-- 1. 查看表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pages_v2'
ORDER BY ordinal_position;

-- 2. 查看表的所有数据
SELECT * FROM pages_v2 ORDER BY created_at DESC LIMIT 10;

-- 3. 查看索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pages_v2';

-- 4. 统计页面数量
SELECT
  COUNT(*) as total_pages,
  COUNT(DISTINCT project_id) as projects,
  COUNT(DISTINCT role_id) as roles
FROM pages_v2;

-- 5. 按分类统计
SELECT
  category,
  COUNT(*) as count,
  AVG(design_progress) as avg_progress
FROM pages_v2
GROUP BY category
ORDER BY count DESC;

-- 6. 按级别统计
SELECT
  level,
  COUNT(*) as count
FROM pages_v2
GROUP BY level
ORDER BY level;

-- 7. 查询特定项目的页面
SELECT
  id,
  name,
  category,
  level,
  design_progress,
  created_at
FROM pages_v2
WHERE project_id = 'test-project-001'
  AND role_id = 'test-role-001'
ORDER BY level, created_at;

-- 8. 查看页面的组件数量
SELECT
  id,
  name,
  jsonb_array_length(components) as component_count
FROM pages_v2
ORDER BY component_count DESC;

-- 9. 查看页面的布局配置
SELECT
  id,
  name,
  layout
FROM pages_v2
LIMIT 5;

-- 10. 查看页面的CSS配置
SELECT
  id,
  name,
  css
FROM pages_v2
LIMIT 5;

-- 11. 插入测试页面
INSERT INTO pages_v2 (
  id,
  project_id,
  role_id,
  name,
  category,
  level,
  layout,
  css,
  components
) VALUES (
  'test-page-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
  'test-project-001',
  'test-role-001',
  '测试页面',
  '固定页',
  0,
  '{"width": 1200, "height": 800, "containerWidth": 1000, "containerHeight": 750, "gridSize": 10, "scale": 1.0}'::JSONB,
  '{"global": "", "container": ".canvas-container", "block": {}}'::JSONB,
  '[]'::JSONB
) RETURNING *;

-- 12. 更新测试页面
UPDATE pages_v2
SET
  name = '测试页面（已更新）',
  design_progress = 50,
  updated_at = NOW()
WHERE id = 'test-page-xxx'
RETURNING *;

-- 13. 删除测试页面
DELETE FROM pages_v2
WHERE id = 'test-page-xxx'
RETURNING *;

-- 14. 清空所有测试数据
DELETE FROM pages_v2
WHERE project_id = 'test-project-001'
RETURNING COUNT(*);

-- 15. 检查外键约束
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'pages_v2'
  AND tc.constraint_type = 'FOREIGN KEY';
