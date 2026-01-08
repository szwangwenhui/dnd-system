// 表达式评估和工具函数
// 提供表达式计算、页面导航、字段名称获取等工具函数

export const createExpressionUtils = (props) => {
  const {
    fields,
    pages,
    projectId,
    roleId,
    forms,
    setCurrentPage,
    setBlocks,
    loadAllFormData
  } = props;

  // 评估表达式
  const evaluateExpression = (expr, record, allDerivedFields, derivedFieldConfig, form) => {
    try {
      if (!expr) return '';

      // 检查是否是分段函数
      if (expr.startsWith('PIECEWISE(') || expr.startsWith('PIECEWISE_DISCRETE(')) {
        return evaluatePiecewise(record, derivedFieldConfig);
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
          const derivedValue = evaluateExpression(derivedField.expression, record, allDerivedFields, derivedField, form);
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
  };

  // 计算分段函数
  const evaluatePiecewise = (record, config) => {
    // 简化实现，完整逻辑可从FormViewer复用
    return '-';
  };

  // 跳转到其他页面
  const navigateToPage = (targetPageId) => {
    const targetPage = pages.find(p => p.id === targetPageId);
    if (targetPage) {
      // 更新URL并重新加载
      const newUrl = `${window.location.pathname}?projectId=${projectId}&roleId=${roleId}&pageId=${targetPageId}`;
      window.history.pushState({}, '', newUrl);

      // 更新当前页面
      setCurrentPage(targetPage);
      setBlocks(targetPage.design?.blocks || []);
      document.title = `预览 - ${targetPage.name}`;

      // 重新加载表单数据
      loadAllFormData(targetPage.design?.blocks || [], forms);
    }
  };

  // 跳转到首页
  const navigateToHome = () => {
    const homePage = pages.find(p => p.level === 0);
    if (homePage) {
      navigateToPage(homePage.id);
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  return {
    evaluateExpression,
    evaluatePiecewise,
    navigateToPage,
    navigateToHome,
    getFieldName
  };
};
