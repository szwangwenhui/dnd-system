# Step 1-1: 数据库准备

## 概述

本步骤完成新系统的数据库表创建和连接测试，为后续开发提供数据存储基础。

## 文件说明

- `create_pages_v2_table.sql` - pages_v2 表创建脚本
- `test_queries.sql` - 测试查询脚本
- `../../test-new-system-db.html` - 可视化测试页面

## 执行步骤

### 1. 创建数据库表

1. 打开 Supabase 控制台的 SQL Editor:
   https://supabase.com/dashboard/project/liiibkgarmcqwgcvojrt/sql

2. 复制 `create_pages_v2_table.sql` 的全部内容

3. 粘贴到 SQL Editor 中并执行

4. 确认执行成功，无错误提示

### 2. 验证表创建

在 SQL Editor 中执行以下查询验证：

```sql
-- 查看表结构
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pages_v2'
ORDER BY ordinal_position;
```

应该看到以下列：
- id (TEXT, PRIMARY KEY)
- project_id (TEXT, NOT NULL)
- role_id (TEXT, NOT NULL)
- name (TEXT, NOT NULL)
- category (TEXT, DEFAULT '固定页')
- level (INTEGER, DEFAULT 0)
- parent_id (TEXT)
- design_progress (INTEGER, DEFAULT 0)
- layout (JSONB, DEFAULT '{}')
- css (JSONB, DEFAULT '{}')
- components (JSONB, DEFAULT '[]')
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)

### 3. 测试数据库连接

1. 在浏览器中打开 `test-new-system-db.html`

2. 按照页面提示执行测试步骤：
   - 点击"加载Supabase配置"
   - 点击"加载NewSystemDB"
   - 点击"测试连接"

3. 如果连接成功，继续测试CRUD操作：
   - 创建测试页面
   - 获取页面列表
   - 更新页面
   - 删除页面

### 4. 验证索引创建

在 SQL Editor 中执行：

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pages_v2';
```

应该看到以下索引：
- pages_v2_pkey (主键)
- idx_pages_v2_project_role
- idx_pages_v2_project
- idx_pages_v2_role
- idx_pages_v2_level
- idx_pages_v2_category

### 5. 验证触发器

```sql
-- 插入一条测试数据
INSERT INTO pages_v2 (id, project_id, role_id, name)
VALUES ('trigger-test', 'test-project', 'test-role', '触发器测试');

-- 检查 updated_at 是否自动设置
SELECT created_at, updated_at FROM pages_v2 WHERE id = 'trigger-test';

-- 更新数据
UPDATE pages_v2 SET name = '触发器测试（已更新）' WHERE id = 'trigger-test';

-- 检查 updated_at 是否自动更新
SELECT created_at, updated_at FROM pages_v2 WHERE id = 'trigger-test';

-- 清理测试数据
DELETE FROM pages_v2 WHERE id = 'trigger-test';
```

## 数据表结构

### pages_v2 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 页面唯一标识符 |
| project_id | TEXT | NOT NULL, FK | 所属项目ID，关联 projects 表 |
| role_id | TEXT | NOT NULL | 所属角色ID |
| name | TEXT | NOT NULL | 页面名称 |
| category | TEXT | DEFAULT '固定页' | 页面分类：固定页/列表页/详情页/功能页 |
| level | INTEGER | DEFAULT 0 | 页面级别：0级/1级/2级等 |
| parent_id | TEXT | NULL | 父页面ID，用于层级关系 |
| design_progress | INTEGER | DEFAULT 0 | 设计完成度 0-100 |
| layout | JSONB | DEFAULT '{}' | 页面布局配置 |
| css | JSONB | DEFAULT '{}' | CSS样式配置 |
| components | JSONB | DEFAULT '[]' | 页面组件树 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | AUTO UPDATE | 最后更新时间 |

### JSONB 字段结构

#### layout
```json
{
  "width": 1200,
  "height": 800,
  "containerWidth": 1000,
  "containerHeight": 750,
  "gridSize": 10,
  "scale": 1.0
}
```

#### css
```json
{
  "global": ".page-container { background: #f5f5f5; }",
  "container": ".canvas-container",
  "block": {
    "btn-primary": "background: #3b82f6; color: white;",
    "card": "background: white; border-radius: 8px;"
  }
}
```

#### components
```json
[
  {
    "id": "comp-001",
    "type": "button",
    "props": {
      "text": "提交",
      "styleClass": "btn-primary"
    },
    "children": []
  }
]
```

## 索引说明

- `idx_pages_v2_project_role` - 复合索引，加速项目+角色查询
- `idx_pages_v2_project` - 项目索引
- `idx_pages_v2_role` - 角色索引
- `idx_pages_v2_level` - 级别索引
- `idx_pages_v2_category` - 分类索引

## 外键约束

- `project_id` 引用 `projects(id)` ON DELETE CASCADE
- 删除项目时，自动删除该项目的所有页面

## 注意事项

1. **完全独立**: pages_v2 表与旧系统的 projects.roles[].pages 完全独立
2. **数据隔离**: 新旧系统的页面数据互不干扰
3. **级联删除**: 删除项目时会自动删除对应的页面
4. **唯一约束**: (id, project_id, role_id) 组合唯一
5. **自动更新**: updated_at 字段通过触发器自动更新

## 下一步

完成本步骤后，继续执行 **step1-2: 新系统数据访问层**

## 完成标准

- [x] pages_v2 表创建成功
- [x] 所有索引创建成功
- [x] 触发器正常工作
- [x] 数据库连接测试通过
- [x] CRUD操作测试通过
- [x] 缓存功能正常

## 常见问题

### Q1: 表已存在错误
**A**: 如果表已存在，可以使用 `DROP TABLE IF EXISTS pages_v2 CASCADE;` 删除后重新创建

### Q2: 外键约束错误
**A**: 确保 projects 表存在且有数据，或者临时删除外键约束进行测试

### Q3: 测试页面连接失败
**A**: 检查 Supabase 配置是否正确加载，查看浏览器控制台错误信息

### Q4: JSONB 字段无法查询
**A**: 确保使用正确的 JSONB 语法，参考 test_queries.sql 中的示例
