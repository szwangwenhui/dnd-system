// DND2 预览模块 - 工具函数
// 原文件: src/preview/Preview.jsx 第424-479行, 507-511行
// 
// 提取的纯函数（不依赖组件状态）:
// - evaluateExpression(expr, record, allDerivedFields, derivedFieldConfig, form, fields)
// - evaluatePiecewise(record, config)
// - getFieldName(fieldId, fields)
// - getAllDescendants(targetId, allBlocks)

window.PreviewUtils = {
  /**
   * 计算表达式（简化版）
   * @param {string} expr - 表达式
   * @param {Object} record - 数据记录
   * @param {Array} allDerivedFields - 所有衍生字段
   * @param {Object} derivedFieldConfig - 衍生字段配置
   * @param {Object} form - 表单对象
   * @param {Array} fields - 字段列表
   * @returns {*} 计算结果
   */
  evaluateExpression: function(expr, record, allDerivedFields, derivedFieldConfig, form, fields) {
    try {
      if (!expr) return '';
      
      // 检查是否是分段函数
      if (expr.startsWith('PIECEWISE(') || expr.startsWith('PIECEWISE_DISCRETE(')) {
        return this.evaluatePiecewise(record, derivedFieldConfig);
      }

      let evalExpr = expr;
      
      // 替换字段引用为实际值
      const fieldRefs = expr.match(/\[([^\]]+)\]/g) || [];
      for (const ref of fieldRefs) {
        const fieldName = ref.slice(1, -1);
        
        // 查找源表字段
        const sourceFields = form.structure?.fields?.filter(f => f.isSourceField) || [];
        for (const sf of sourceFields) {
          const fieldInfo = fields.find(f => f.id === sf.fieldId);
          if (fieldInfo && fieldInfo.name === fieldName) {
            const value = record[sf.fieldId];
            evalExpr = evalExpr.replace(ref, value !== undefined && value !== '' ? value : 0);
            break;
          }
        }
        
        // 查找衍生字段
        const derivedField = allDerivedFields.find(df => df.name === fieldName);
        if (derivedField) {
          const derivedValue = this.evaluateExpression(derivedField.expression, record, allDerivedFields, derivedField, form, fields);
          evalExpr = evalExpr.replace(ref, derivedValue);
        }
      }

      // 将 ^ 转换为 **
      evalExpr = evalExpr.replace(/\^/g, '**');

      // 安全性检查
      if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(evalExpr)) {
        return 'ERROR';
      }

      const result = eval(evalExpr);
      return typeof result === 'number' ? (Number.isInteger(result) ? result : parseFloat(result.toFixed(2))) : 'ERROR';
    } catch (e) {
      return 'ERROR';
    }
  },

  /**
   * 计算分段函数
   * @param {Object} record - 数据记录
   * @param {Object} config - 配置
   * @returns {string} 计算结果
   */
  evaluatePiecewise: function(record, config) {
    // 简化实现，完整逻辑可从FormViewer复用
    return '-';
  },

  /**
   * 获取字段名称
   * @param {string} fieldId - 字段ID
   * @param {Array} fields - 字段列表
   * @returns {string} 字段名称
   */
  getFieldName: function(fieldId, fields) {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  },

  /**
   * 获取所有子区块（递归）
   * @param {string} targetId - 目标区块ID
   * @param {Array} allBlocks - 所有区块
   * @returns {Array} 子区块列表
   */
  getAllDescendants: function(targetId, allBlocks) {
    const descendants = [];
    const directChildren = allBlocks.filter(b => b.parentId === targetId);
    directChildren.forEach(child => {
      descendants.push(child);
      descendants.push(...this.getAllDescendants(child.id, allBlocks));
    });
    return descendants;
  },

  /**
   * 获取画布配置
   * @param {string} canvasType - 画布类型 'PC' | 'Mobile'
   * @returns {Object} 画布配置
   */
  getCanvasConfig: function(canvasType) {
    return window.StyleUtils?.getCanvasConfig(canvasType) || {
      width: canvasType === 'Mobile' ? 360 : 1200,
      minHeight: canvasType === 'Mobile' ? 640 : 800
    };
  },

  /**
   * 计算画布高度
   * @param {Array} blocks - 区块列表
   * @param {number} minHeight - 最小高度
   * @returns {number} 画布高度
   */
  calculateCanvasHeight: function(blocks, minHeight) {
    if (window.StyleUtils?.calculateCanvasHeight) {
      return window.StyleUtils.calculateCanvasHeight(blocks, minHeight);
    }
    // 回退：本地计算
    if (blocks.length === 0) return minHeight;
    const maxBottom = blocks.reduce((max, block) => {
      const bottom = block.y + block.height + 50;
      return bottom > max ? bottom : max;
    }, minHeight);
    return maxBottom;
  }
};

console.log('[DND2] preview/previewUtils.js 加载完成');
