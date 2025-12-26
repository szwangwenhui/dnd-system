# DND2 方法索引表

> 本文档记录DND2系统已开发的核心方法和数据结构，供开发时查阅，避免重复开发。
> 
> **更新日期**：2024-12-26

---

## 一、区块系统

### 1.1 区块类型
| 类型 | 说明 | 文件位置 |
|------|------|----------|
| 显示 | 静态展示内容 | BlockList.jsx |
| 交互 | 表单输入 | BlockList.jsx |
| 按钮 | 可点击操作 | BlockList.jsx |

### 1.2 弹窗区块
| 属性/方法 | 说明 | 文件位置 |
|-----------|------|----------|
| `isPopup: true` | 标记为弹窗区块 | 区块数据 |
| `style.zIndex: -1` | 隐藏弹窗 | 区块style |
| `style.zIndex: 0` | 显示弹窗 | 区块style |
| `handleOpenPopup()` | 打开弹窗事件处理 | Preview.jsx 第103行 |
| `handleClosePopup()` | 关闭弹窗事件处理 | Preview.jsx 第175行 |
| `openPopup` 事件 | 触发打开弹窗 | `window.dispatchEvent(new CustomEvent('openPopup', {detail: {blockId}}))` |
| `closePopup` 事件 | 触发关闭弹窗 | `window.dispatchEvent(new CustomEvent('closePopup', {detail: {blockId}}))` |

### 1.3 父子区块关系
| 属性/方法 | 说明 | 文件位置 |
|-----------|------|----------|
| `parentId` | 子区块指向父区块的ID | 区块数据 |
| `getAllDescendants()` | 获取所有子孙区块 | Preview.jsx 第116行 |
| 坐标关系 | 子区块坐标相对于画布，父子通过parentId关联 | - |
| 联动隐藏 | 父区块隐藏时，子区块一起隐藏（通过zIndex） | handleOpenPopup/handleClosePopup |

### 1.4 区块渲染
| 方法 | 说明 | 文件位置 |
|------|------|----------|
| `renderBlock()` | 区块渲染入口 | Preview.jsx |
| `renderButtonBlock()` | 按钮区块渲染 | Preview.jsx 第2292行 |
| `renderAuthBlock()` | 用户账号区块渲染 | Preview.jsx 第2374行 |

---

## 二、按钮系统

### 2.1 按钮数据结构
```javascript
{
  type: '按钮',
  buttonType: 'openPopup',  // 按钮类型，顶层属性
  buttonText: '按钮文字',    // 按钮显示文字，顶层属性
  buttonConfig: {           // 按钮配置，根据buttonType不同而不同
    targetBlockId: '',      // openPopup类型需要
    // ...其他配置
  }
}
```

### 2.2 按钮类型注册
| 文件位置 | 说明 |
|----------|------|
| `src/designer/buttons/ButtonRegistry.js` | 按钮注册中心 |
| `src/designer/buttons/types/` | 各类型按钮实现 |

### 2.3 已注册的按钮类型
| buttonType | 说明 | 配置文件 |
|------------|------|----------|
| `openPopup` | 打开弹窗 | PopupButton.jsx |
| `submitForm` | 提交表单 | - |
| `pageJump` | 页面跳转 | PageJumpButton.jsx |
| `dataEntry` | 数据录入 | DataEntryButton.jsx |
| `neutral` | 中性按钮（触发流程） | - |

### 2.4 按钮执行
```javascript
// 执行按钮操作
window.ButtonRegistry.execute(buttonType, buttonConfig, context);

// context包含
{
  projectId,
  pageId,
  roleId,
  blockId,
  pages,
  forms,
  fields
}
```

---

## 三、表单/交互系统

### 3.1 交互区块数据结构
```javascript
{
  type: '交互',
  contentType: '表单',
  formConfig: {
    formId: 'SYS-FORM-USER',      // 绑定的表单ID
    formName: '用户管理',          // 表单名称
    displayFields: ['SYS-FLD-002', 'SYS-FLD-009'],  // 显示的字段ID
    hideSubmitButton: true         // 是否隐藏默认提交按钮
  }
}
```

### 3.2 系统表单
| 表单ID | 名称 | 说明 |
|--------|------|------|
| `SYS-FORM-USER` | 用户管理 | 系统内置用户表 |

### 3.3 系统字段（用户管理表）
| 字段ID | 名称 | 类型 |
|--------|------|------|
| `SYS-FLD-001` | 用户ID | 数字 |
| `SYS-FLD-002` | 账号 | 文本 |
| `SYS-FLD-009` | 密码 | 密码 |
| `SYS-FLD-003` | 昵称 | 文本 |
| `SYS-FLD-004` | 头像 | 文本 |
| `SYS-FLD-005` | 角色 | 文本 |
| `SYS-FLD-006` | 状态 | 文本 |
| `SYS-FLD-007` | 注册时间 | 文本 |
| `SYS-FLD-008` | 最后登录 | 文本 |

---

## 四、数据流程系统

### 4.1 节点类型
| 节点类型 | 说明 | 文件位置 |
|----------|------|----------|
| `start` | 开始节点 | primitives/index.js |
| `end` | 结束节点 | primitives/index.js |
| `binaryBranch` | 是非分叉 | primitives/index.js |
| `multiBranch` | 多条件分叉 | primitives/index.js |
| `propCheck` | 属性校验 | primitives/index.js |
| `formatCheck` | 备注节点 | primitives/index.js |
| `jump` | 流程跳转 | primitives/index.js |

### 4.2 开始节点触发方式
| triggerType | 说明 |
|-------------|------|
| `button` | 按钮触发 |
| `schedule` | 定时触发 |
| `dataChange` | 数据变化 |
| `condition` | 条件满足 |
| `flowTrigger` | 其它流程跳转触发 |

**注意**：开始节点支持多选触发方式，使用 `triggerTypes` 数组

### 4.3 节点配置表单
| 节点类型 | 配置表单文件 |
|----------|-------------|
| start | StartNodeConfigForm.jsx |
| end | EndNodeConfigForm.jsx |
| binaryBranch | BinaryBranchConfigForm.jsx |
| multiBranch | MultiBranchConfigForm.jsx |
| propCheck | PropCheckConfigForm.jsx |
| formatCheck | FormatCheckConfigForm.jsx |
| jump | JumpConfigForm.jsx |

---

## 五、角色/页面系统

### 5.1 新建角色
| 方法 | 说明 | 文件位置 |
|------|------|----------|
| `addRole()` | 创建角色并自动创建首页 | supabaseDB.js 第461行 |

**自动创建的内置区块（4个）**：
| 区块ID后缀 | 名称 | 类型 | 说明 |
|------------|------|------|------|
| BLK-001 | 登录/注册 | 按钮 | 右上角，打开弹窗 |
| BLK-002 | 登录注册表单 | 交互 | 弹窗，账号密码输入 |
| BLK-003 | 登录 | 按钮 | 子区块，存在性校验 |
| BLK-004 | 注册 | 按钮 | 子区块，直接存储 |

### 5.2 页面操作
| 方法 | 说明 | 文件位置 |
|------|------|----------|
| `getPagesByRoleId()` | 获取角色的所有页面 | supabaseDB.js |
| `updatePage()` | 更新页面 | supabaseDB.js |
| `addPage()` | 添加页面 | supabaseDB.js |
| `deletePage()` | 删除页面 | supabaseDB.js |

---

## 六、认证系统

### 6.1 DND用户认证（开发者）
| 方法 | 说明 | 文件位置 |
|------|------|----------|
| `window.supabaseAuth.signIn()` | 登录 | authService.js |
| `window.supabaseAuth.signUp()` | 注册 | authService.js |
| `window.supabaseAuth.signOut()` | 登出 | authService.js |
| `window.supabaseAuth.getCurrentUser()` | 获取当前用户 | authService.js |

### 6.2 终端用户认证（项目用户）
- 使用项目的"用户管理表"验证
- 不使用Supabase Auth
- 账号密码存储在 SYS-FORM-USER 表中

---

## 七、数据库操作

### 7.1 核心数据库对象
```javascript
window.dndDB  // 数据库操作入口
```

### 7.2 常用方法
| 方法 | 说明 |
|------|------|
| `getProjectById(projectId)` | 获取项目 |
| `updateProject(project)` | 更新项目 |
| `getRolesByProjectId(projectId)` | 获取角色列表 |
| `addRole(projectId, role)` | 添加角色 |
| `getPagesByRoleId(projectId, roleId)` | 获取页面列表 |
| `updatePage(projectId, roleId, pageId, page)` | 更新页面 |
| `getFormDataList(projectId, formId)` | 获取表单数据 |

---

## 八、样式系统

### 8.1 画布配置
| 方法 | 说明 | 文件位置 |
|------|------|----------|
| `window.StyleUtils.getCanvasConfig(canvasType)` | 获取画布配置 | styleUtils.js |

### 8.2 画布类型
| canvasType | 宽度 | 说明 |
|------------|------|------|
| `PC` | 1200px | PC端 |
| `Mobile` | 360px | 手机端 |

---

## 九、流程编辑器

### 9.1 节点尺寸
| 属性 | 值 | 说明 |
|------|-----|------|
| NODE_WIDTH | 84px | 节点宽度（原120px的70%） |
| NODE_HEIGHT | 50px | 节点高度 |

### 9.2 连接点位置
| 分支类型 | "是"输出点 | "否"输出点 |
|----------|-----------|-----------|
| 是非分叉 | 左侧20% | 右侧80% |

---

## 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2024-12-26 | 创建索引表，记录区块、按钮、表单、流程、认证等核心方法 |
| 2024-12-26 | 补充计算表达式模块和统计模块 |
| 2024-12-26 | 预览页真实化改造：去掉画布样式、弹窗悬停关闭按钮、字段名显示 |

---

## 十、计算表达式模块

### 10.1 文件位置
```
src/utils/expressions.js
```

### 10.2 全局对象
| 对象/方法 | 说明 |
|-----------|------|
| `window.ExpressionTypes` | 表达式类型配置 |
| `window.getExpressionType(typeCode)` | 根据代码获取表达式类型 |
| `window.getAllExpressionTypes()` | 获取所有表达式类型 |
| `window.evaluateExpression(expression, data, fields)` | 验证并计算表达式 |

### 10.3 已实现的表达式类型
| 类型代码 | 名称 | 说明 |
|----------|------|------|
| `addition` | 加法 | 对多个数值型字段求和 |

### 10.4 表达式数据结构
```javascript
{
  type: 'addition',           // 表达式类型代码
  variables: ['fieldId1', 'fieldId2']  // 参与计算的字段ID
}
```

### 10.5 表达式计算
```javascript
// 计算表达式
const result = window.evaluateExpression(expression, dataRow, fields);
// 返回: { success: boolean, result: any, error: string }
```

### 10.6 待扩展的表达式类型
- `subtraction` - 减法
- `multiplication` - 乘法
- `division` - 除法
- `average` - 平均值
- `condition` - 条件判断

---

## 十一、统计模块

### 11.1 文件结构
```
src/utils/statistics/
├── index.js           - 入口文件，整合所有子模块
├── core.js            - 聚合函数和数据过滤
├── timeUtils.js       - 时间处理工具
├── verticalStats.js   - 纵向统计
├── horizontalStats.js - 横向统计
├── validator.js       - 配置验证
└── exporter.js        - 导出功能
```

### 11.2 全局对象
| 对象 | 说明 |
|------|------|
| `window.StatisticsEngine` | 统计引擎实例（主入口） |
| `window.StatisticsModules` | 子模块引用集合 |
| `window.StatisticsTimeUtils` | 时间工具 |
| `window.StatisticsCore` | 核心聚合函数 |
| `window.VerticalStatistics` | 纵向统计 |
| `window.HorizontalStatistics` | 横向统计 |

### 11.3 聚合函数
| 方法 | 说明 | 调用方式 |
|------|------|----------|
| `sum` | 求和 | `StatisticsCore.sum(values)` |
| `avg` | 平均值 | `StatisticsCore.avg(values)` |
| `count` | 计数 | `StatisticsCore.count(values)` |
| `max` | 最大值 | `StatisticsCore.max(values)` |
| `min` | 最小值 | `StatisticsCore.min(values)` |
| `aggregate` | 通用聚合 | `StatisticsCore.aggregate(values, method)` |

### 11.4 数据过滤
```javascript
// 应用检索条件过滤数据
const filteredData = StatisticsCore.applyFilters(data, filters);

// filters 格式
[
  { fieldId: 'xxx', type: '指定', values: ['a', 'b'] },
  { fieldId: 'yyy', type: '范围', operator: '>', value: 100 }
]

// 范围操作符: =, ≠, >, ≥, <, ≤
```

### 11.5 统计执行
```javascript
// 执行完整统计
const result = window.StatisticsEngine.execute(sourceData, statisticConfig);
// 返回: { data: Array, dataRange: Object }

// 执行纵向统计
const data = window.StatisticsEngine.executeVerticalStatistics(data, config);

// 执行横向统计
const data = window.StatisticsEngine.executeHorizontalStatistics(data, config);
```

### 11.6 时间工具方法
| 方法 | 说明 |
|------|------|
| `getGranularityValue(date, granularity)` | 获取时间粒度值 |
| `getPreviousPeriod(periodValue, granularity)` | 获取上一期 |
| `getComparePeriod(periodValue, granularity, compareType)` | 获取对比期（同比/环比） |
| `getPeriodDisplayName(periodValue, granularity)` | 获取期间显示名称 |
| `getCurrentPeriod(granularity)` | 获取当前期间 |
| `isPeriodComplete(periodValue, granularity)` | 判断期间是否完整 |

### 11.7 时间粒度
| 粒度 | 说明 |
|------|------|
| 年 | 按年统计 |
| 季 | 按季度统计 |
| 月 | 按月统计 |
| 周 | 按周统计 |
| 日 | 按日统计 |

### 11.8 统计方向
| 方向 | 说明 | 实现文件 |
|------|------|----------|
| 纵向 | 按时间维度统计 | verticalStats.js |
| 横向 | 按分组维度统计 | horizontalStats.js |
