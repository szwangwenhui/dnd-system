-- ============================================
-- 新系统页面表 (pages_v2)
-- DND2 页面设计系统V2
-- ============================================

-- 创建表
CREATE TABLE IF NOT EXISTS pages_v2 (
  -- 基本信息
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  role_id TEXT NOT NULL,

  -- 页面属性
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '固定页',
  level INTEGER DEFAULT 0,
  parent_id TEXT,
  design_progress INTEGER DEFAULT 0,

  -- 新系统页面结构
  layout JSONB DEFAULT '{}',
  -- 示例结构:
  -- {
  --   width: 1200,
  --   height: 800,
  --   containerWidth: 1000,
  --   containerHeight: 750,
  --   gridSize: 10,
  --   scale: 1.0
  -- }

  css JSONB DEFAULT '{}',
  -- 示例结构:
  -- {
  --   global: '.page-container { background: #f5f5f5; }',
  --   container: '.canvas-container',
  --   block: {
  --     'btn-primary': 'background: #3b82f6; color: white;',
  --     'card': 'background: white; border-radius: 8px;'
  --   }
  -- }

  components JSONB DEFAULT '[]',
  -- 示例结构:
  -- [
  --   {
  --     id: 'comp-001',
  --     type: 'button',
  --     props: {
  --       text: '提交',
  --       styleClass: 'btn-primary'
  --     },
  --     children: []
  --   }
  -- ]

  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 外键约束
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT unique_page_per_role UNIQUE (id, project_id, role_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pages_v2_project_role ON pages_v2(project_id, role_id);
CREATE INDEX IF NOT EXISTS idx_pages_v2_project ON pages_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_v2_role ON pages_v2(role_id);
CREATE INDEX IF NOT EXISTS idx_pages_v2_level ON pages_v2(level);
CREATE INDEX IF NOT EXISTS idx_pages_v2_category ON pages_v2(category);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_v2_updated_at
    BEFORE UPDATE ON pages_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE pages_v2 IS '新系统页面设计数据表，与 projects 表平级，完全独立于旧系统';
COMMENT ON COLUMN pages_v2.id IS '页面唯一标识符';
COMMENT ON COLUMN pages_v2.project_id IS '所属项目ID，关联 projects 表';
COMMENT ON COLUMN pages_v2.role_id IS '所属角色ID，对应 projects.roles[].id';
COMMENT ON COLUMN pages_v2.name IS '页面名称';
COMMENT ON COLUMN pages_v2.category IS '页面分类：固定页/列表页/详情页/功能页';
COMMENT ON COLUMN pages_v2.level IS '页面级别：0级/1级/2级等';
COMMENT ON COLUMN pages_v2.parent_id IS '父页面ID，用于层级关系';
COMMENT ON COLUMN pages_v2.design_progress IS '设计完成度 0-100';
COMMENT ON COLUMN pages_v2.layout IS '页面布局配置（JSONB）';
COMMENT ON COLUMN pages_v2.css IS 'CSS样式配置（JSONB）';
COMMENT ON COLUMN pages_v2.components IS '页面组件树（JSONB）';
COMMENT ON COLUMN pages_v2.created_at IS '创建时间';
COMMENT ON COLUMN pages_v2.updated_at IS '最后更新时间';
