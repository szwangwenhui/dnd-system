/**
 * 统计模块 - 组件入口文件
 * 
 * 依赖文件（需按顺序加载）：
 * 
 * 工具类：
 * - src/utils/statistics/timeUtils.js
 * - src/utils/statistics/core.js
 * - src/utils/statistics/verticalStats.js
 * - src/utils/statistics/horizontalStats.js
 * - src/utils/statistics/exporter.js
 * - src/utils/statistics/validator.js
 * - src/utils/statistics/index.js
 * 
 * 组件：
 * 1. SearchFilterPanel.jsx   - 检索筛选面板
 * 2. StatisticsChart.jsx     - 图表组件
 * 3. StatisticsDependency.jsx - 依赖关系管理
 * 4. StatisticsPreview.jsx   - 虚表预览组件
 * 5. StatisticsWizard.jsx    - 配置向导
 * 6. StatisticsViewer.jsx    - 结果查看器
 * 7. StatisticsModule.jsx    - 主组件
 * 8. index.jsx               - 本文件（最后加载）
 */

// 统一导出所有组件
window.StatisticsComponents = {
  Module: window.StatisticsModule,
  Wizard: window.StatisticsWizard,
  Viewer: window.StatisticsViewer,
  Chart: window.StatisticsChart,
  Dependency: window.StatisticsDependency,
  Preview: window.StatisticsPreview,
  SearchFilterPanel: window.SearchFilterPanel
};

// 统一导出工具类
window.StatisticsUtils = {
  Engine: window.StatisticsEngine,
  Exporter: window.StatisticsExporter,
  Validator: window.StatisticsValidator,
  TimeUtils: window.StatisticsTimeUtils,
  Core: window.StatisticsCore
};

console.log('[Statistics] 统计模块加载完成（含图表、导出、校验、依赖管理、预览）');
