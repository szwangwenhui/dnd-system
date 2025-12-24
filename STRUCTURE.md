# DND2 项目结构文档

## 重构版本信息
- 重构日期: 2024-12-23
- 源文件数: 144个
- 重构阶段: Phase 1-8 完成

## 目录结构

```
DND2/
├── index.html              # 主应用入口
├── preview.html            # 预览页面入口
├── STRUCTURE.md            # 本文档
├── INTEGRATION_TEST.md     # 集成测试清单
└── src/
    ├── App.jsx             # 应用主组件
    │
    ├── components/         # 业务组件 (32个文件)
    │   ├── expressionBuilder/     # 表达式构建器子组件 (Phase 8)
    │   │   ├── PiecewiseAnchorBuilder.jsx
    │   │   └── PiecewiseDiscreteBuilder.jsx
    │   ├── statistics/            # 统计模块 (Phase 6)
    │   │   ├── SearchFilterPanel.jsx
    │   │   ├── StatisticsChart.jsx
    │   │   ├── StatisticsDependency.jsx
    │   │   ├── StatisticsModule.jsx
    │   │   ├── StatisticsPreview.jsx
    │   │   ├── StatisticsViewer.jsx
    │   │   ├── StatisticsWizard.jsx
    │   │   └── index.jsx
    │   ├── ExpressionBuilder.jsx
    │   ├── FormDefinition.jsx
    │   ├── FieldDefinition.jsx
    │   ├── PageDefinition.jsx
    │   ├── RoleManagement.jsx
    │   ├── ProjectManagement.jsx
    │   └── ... (其他表单/数据组件)
    │
    ├── designer/           # 页面设计器 (42个文件)
    │   ├── PageDesigner.jsx       # 主组件 (Phase 5)
    │   ├── CloseConfirmModal.jsx
    │   ├── useDesignerState.js
    │   ├── useDragResize.js
    │   ├── designerUtils.js
    │   ├── buttons/               # 按钮组件
    │   │   ├── types/
    │   │   ├── ButtonConfig.jsx
    │   │   └── ButtonRenderer.jsx
    │   ├── components/            # 设计器子组件
    │   │   ├── Canvas.jsx
    │   │   ├── BlockList.jsx
    │   │   ├── StylePanel.jsx
    │   │   └── ...
    │   ├── panels/                # 样式面板
    │   └── styles/                # 预设样式
    │
    ├── flowEditor/         # 流程编辑器 (35个文件)
    │   ├── FlowEditor.jsx
    │   ├── configForms/           # 节点配置表单
    │   ├── components/            # 编辑器子组件
    │   └── shared/                # 共享组件
    │
    ├── flowEngine/         # 流程执行引擎 (Phase 4, 4个文件)
    │   ├── index.js               # 核心类和初始化
    │   ├── dataNodes.js           # 数据操作节点
    │   ├── branchNodes.js         # 分支逻辑节点
    │   └── loopNodes.js           # 循环控制节点
    │
    ├── preview/            # 预览模块 (Phase 3, 5个文件)
    │   ├── Preview.jsx            # 主组件
    │   ├── PreviewToolbar.jsx
    │   ├── PreviewLoadingError.jsx
    │   ├── previewUtils.js
    │   └── previewStyles.js
    │
    ├── primitiveExpr/      # 原语表达式 (4个文件)
    │   ├── PrimitiveEngine.js
    │   ├── PrimitiveExprEditor.jsx
    │   ├── PrimitiveExprTest.jsx
    │   └── primitives.js
    │
    ├── primitives/         # 原语定义 (1个文件)
    │   └── index.js
    │
    ├── shared/             # 共享工具 (1个文件)
    │   └── styleUtils.js
    │
    └── utils/              # 工具模块 (19个文件)
        ├── db/                    # 数据库操作 (Phase 1, 8个文件)
        │   ├── index.js
        │   ├── projectOperations.js
        │   ├── roleOperations.js
        │   ├── formOperations.js
        │   ├── fieldOperations.js
        │   ├── pageOperations.js
        │   ├── flowOperations.js
        │   └── statisticsOperations.js
        ├── statistics/            # 统计工具 (7个文件)
        │   ├── core.js
        │   ├── timeUtils.js
        │   ├── verticalStats.js
        │   ├── horizontalStats.js
        │   ├── exporter.js
        │   ├── validator.js
        │   └── index.js
        ├── StatisticsEngine.js
        ├── expressions.js
        ├── expressionEngine.js
        └── testEnvBuilder.js
```

## 模块依赖关系

```
App.jsx
  ├── ProjectManagement
  ├── RoleManagement
  ├── FieldDefinition
  ├── FormDefinition
  │     └── *FormBuilder (多种表单构建器)
  ├── PageDefinition
  │     └── PageDesigner (设计器)
  ├── DataFlowDefinition
  │     └── FlowEditor (流程编辑器)
  └── StatisticsModule (统计模块)

preview.html
  ├── Preview.jsx
  ├── FlowEngine (流程引擎)
  └── dndDB (数据库)
```

## 全局导出 (window对象)

### 核心模块
- `window.dndDB` - 数据库操作
- `window.FlowEngine` - 流程引擎类
- `window.flowEngine` - 流程引擎实例
- `window.PageDesigner` - 页面设计器
- `window.Preview` - 预览组件
- `window.StatisticsModule` - 统计模块
- `window.ExpressionBuilder` - 表达式构建器

### 工具函数
- `window.initFlowEngine()` - 初始化流程引擎
- `window.destroyFlowEngine()` - 销毁流程引擎
- `window.runFlow()` - 执行流程
- `window.DesignerUtils` - 设计器工具函数

## 加载顺序要求

1. **基础依赖**: React, ReactDOM, Babel, IndexedDB
2. **数据库模块**: db/*.js (8个文件)
3. **工具模块**: utils/, shared/
4. **业务组件**: components/*.jsx
5. **设计器模块**: designer/*.jsx (子组件先于主组件)
6. **流程编辑器**: flowEditor/*.jsx
7. **流程引擎**: flowEngine/*.js
8. **统计模块**: statistics/*.jsx
9. **预览模块**: preview/*.jsx
10. **应用入口**: App.jsx
