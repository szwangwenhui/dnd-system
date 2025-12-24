// 表达式构建组件 - 支持多种函数类型
function ExpressionBuilder({ 
  fields,           // 可用的源字段列表
  derivedFields,    // 已定义的衍生字段（可引用）
  forms,            // 所有表单（用于获取属性表）
  allFields,        // 所有字段定义（用于判断字段类型）
  sourceForm,       // 选中的源表（用于获取离散字段的唯一值）
  onSave,          // 保存回调 (expression, expressionType, expressionConfig) => void
  onCancel         // 取消回调
}) {
  // 表达式类型
  const [expressionType, setExpressionType] = React.useState('');
  
  // 加法配置：{ constant: number, terms: [{ coefficient: number, fieldId: string }] }
  const [additionConfig, setAdditionConfig] = React.useState({
    constant: 0,
    terms: [{ coefficient: 1, fieldId: '' }]
  });

  // 减法配置：{ minuend: string, subtrahend: string }
  const [subtractionConfig, setSubtractionConfig] = React.useState({
    minuend: '',
    subtrahend: ''
  });

  // 乘法配置：{ factors: [fieldId, ...] }
  const [multiplicationConfig, setMultiplicationConfig] = React.useState({
    factors: ['', '']
  });

  // 除法配置：{ dividend: string, divisor: string }
  const [divisionConfig, setDivisionConfig] = React.useState({
    dividend: '',
    divisor: ''
  });

  // 指数配置：{ base: string, exponent: string | number, exponentType: 'number' | 'field' }
  const [powerConfig, setPowerConfig] = React.useState({
    base: '',
    exponent: 2,
    exponentType: 'number'
  });

  // 分段函数配置
  const [piecewiseConfig, setPiecewiseConfig] = React.useState({
    segmentField: '',           // 分段对象字段
    segmentFieldType: '',       // 分段对象类型：'continuous' | 'discrete'
    valueType: 'number',        // 取值方式：'number' | 'attribute' | 'text'
    attributeFormId: '',        // 属性表ID（当valueType为attribute时）
    attributeFieldId: '',       // 赋值字段ID
    // 连续分段用
    anchors: [],                // 锚点列表：[{ value, belong, leftValue, equalValue }]
    rightmostValue: '',         // 最右侧区间的取值
    // 离散分段用
    discreteGroups: [],         // 离散分组：[{ values: [], mappedValue: '' }]
    defaultValue: ''            // 默认值（未匹配到任何分组时）
  });

  // 分段函数构建步骤
  const [piecewiseStep, setPiecewiseStep] = React.useState(1); // 1:选字段, 2:选取值方式, 3:设锚点/分组, 4:完成

  // 监听分段函数保存事件
  React.useEffect(() => {
    const handlePiecewiseSave = () => {
      if (expressionType === 'piecewise') {
        handleSave();
      }
    };
    window.addEventListener('piecewiseSave', handlePiecewiseSave);
    return () => window.removeEventListener('piecewiseSave', handlePiecewiseSave);
  }, [expressionType, piecewiseConfig]);

  // 获取可用于计算的数值字段（整数或浮点数）
  const getNumericFields = () => {
    return fields.filter(f => f.type === '整数' || f.type === '小数');
  };

  // 获取所有源字段（用于分段函数）
  const getAllSourceFields = () => {
    return fields.map(f => ({
      id: f.fieldId || f.id,
      name: f.fieldName || f.name,
      type: f.type,
      isAttributeField: f.isAttributeField,
      attributeFormId: f.attributeFormId,
      level: f.level
    }));
  };

  // 获取属性表列表
  const getAttributeForms = () => {
    if (!forms) return [];
    return forms.filter(f => f.type === '属性表单');
  };

  // 获取属性表的字段列表
  const getAttributeFormFields = (formId) => {
    if (!forms || !formId) return [];
    const form = forms.find(f => f.id === formId);
    if (!form || !form.structure) return [];
    
    // 属性表的字段在levelFields中
    const levelFields = form.structure.levelFields || [];
    return levelFields.map(lf => ({
      id: lf.fieldId,
      name: allFields?.find(f => f.id === lf.fieldId)?.name || lf.fieldId,
      level: lf.level
    }));
  };

  // 获取属性表某字段的所有取值
  const getAttributeFieldValues = (formId, fieldId) => {
    if (!forms || !formId || !fieldId) return [];
    const form = forms.find(f => f.id === formId);
    if (!form || !form.data) return [];
    
    const values = new Set();
    form.data.forEach(record => {
      if (record[fieldId] !== undefined && record[fieldId] !== '') {
        values.add(record[fieldId]);
      }
    });
    return Array.from(values);
  };

  // 获取源表某字段的所有唯一取值（用于离散分段）
  const getSourceFieldUniqueValues = (fieldId) => {
    if (!fieldId) return [];
    
    const values = new Set();
    
    // 优先从sourceForm获取数据
    if (sourceForm && sourceForm.data && Array.isArray(sourceForm.data)) {
      sourceForm.data.forEach(record => {
        if (record[fieldId] !== undefined && record[fieldId] !== null && record[fieldId] !== '') {
          values.add(String(record[fieldId]));
        }
      });
    }
    
    // 如果sourceForm没有数据，尝试从forms中查找
    if (values.size === 0 && forms) {
      forms.forEach(form => {
        if (form.data && Array.isArray(form.data)) {
          form.data.forEach(record => {
            if (record[fieldId] !== undefined && record[fieldId] !== null && record[fieldId] !== '') {
              values.add(String(record[fieldId]));
            }
          });
        }
      });
    }
    
    return Array.from(values).sort();
  };

  // 判断字段类型是否为连续（整数或小数）
  const isFieldContinuous = (fieldId) => {
    const field = getAllSourceFields().find(f => f.id === fieldId);
    return field && (field.type === '整数' || field.type === '小数');
  };

  // 获取所有可用字段（源字段 + 已定义的衍生字段）
  const getAllAvailableFields = () => {
    const numericFields = getNumericFields().map(f => ({
      id: f.fieldId || f.id,
      name: f.fieldName || f.name,
      type: f.type,
      isDerived: false
    }));

    const derivedList = (derivedFields || []).map(df => ({
      id: df.id,
      name: df.name,
      type: '小数',
      isDerived: true
    }));

    return [...numericFields, ...derivedList];
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const allFieldsList = getAllAvailableFields();
    const field = allFieldsList.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 获取源字段名称（用于分段函数）
  const getSourceFieldName = (fieldId) => {
    const field = getAllSourceFields().find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 生成表达式字符串（用于显示和计算）
  const generateExpression = () => {
    switch (expressionType) {
      case 'addition':
        return generateAdditionExpression();
      case 'subtraction':
        return generateSubtractionExpression();
      case 'multiplication':
        return generateMultiplicationExpression();
      case 'division':
        return generateDivisionExpression();
      case 'power':
        return generatePowerExpression();
      case 'piecewise':
        return generatePiecewiseExpression();
      default:
        return '';
    }
  };

  // 生成分段函数表达式（用于显示）
  const generatePiecewiseExpression = () => {
    const { segmentField, segmentFieldType, anchors, rightmostValue, discreteGroups, defaultValue } = piecewiseConfig;
    if (!segmentField) return '';
    
    const fieldName = getSourceFieldName(segmentField);

    // 离散分段
    if (segmentFieldType === 'discrete') {
      if (discreteGroups.length === 0) return '';
      
      let parts = discreteGroups.map(group => 
        `{${group.values.join(',')}} → ${group.mappedValue}`
      );
      if (defaultValue) {
        parts.push(`DEFAULT → ${defaultValue}`);
      }
      return `PIECEWISE_DISCRETE(${fieldName}: ${parts.join('; ')})`;
    }

    // 连续分段
    if (anchors.length === 0) return '';
    
    let parts = [];
    
    anchors.forEach((anchor, idx) => {
      const prevAnchor = idx > 0 ? anchors[idx - 1] : null;
      const prevBelongRight = prevAnchor?.belong === 'right';
      
      if (idx === 0) {
        // 第一个锚点的左侧区间
        if (anchor.belong === 'left') {
          parts.push(`${fieldName}≤${anchor.value} → ${anchor.leftValue}`);
        } else if (anchor.belong === 'independent') {
          parts.push(`${fieldName}<${anchor.value} → ${anchor.leftValue}`);
          parts.push(`${fieldName}=${anchor.value} → ${anchor.equalValue}`);
        } else {
          parts.push(`${fieldName}<${anchor.value} → ${anchor.leftValue}`);
        }
      } else {
        // 后续锚点
        const leftOp = prevBelongRight ? '≥' : '>';
        const prevVal = prevAnchor.value;
        
        if (anchor.belong === 'left') {
          parts.push(`${prevVal}${leftOp}${fieldName}≤${anchor.value} → ${anchor.leftValue}`);
        } else if (anchor.belong === 'independent') {
          parts.push(`${prevVal}${leftOp}${fieldName}<${anchor.value} → ${anchor.leftValue}`);
          parts.push(`${fieldName}=${anchor.value} → ${anchor.equalValue}`);
        } else {
          parts.push(`${prevVal}${leftOp}${fieldName}<${anchor.value} → ${anchor.leftValue}`);
        }
      }
    });
    
    // 最右侧区间
    const lastAnchor = anchors[anchors.length - 1];
    const rightOp = lastAnchor.belong === 'right' ? '≥' : '>';
    parts.push(`${fieldName}${rightOp}${lastAnchor.value} → ${rightmostValue}`);
    
    return `PIECEWISE(${parts.join('; ')})`;
  };

  // 生成加法表达式
  const generateAdditionExpression = () => {
    let expr = '';
    const { constant, terms } = additionConfig;
    
    if (constant !== 0) {
      expr = String(constant);
    }

    terms.forEach((term, idx) => {
      if (term.fieldId) {
        const fieldName = getFieldName(term.fieldId);
        const coef = term.coefficient;
        
        if (expr === '') {
          if (coef === 1) {
            expr = `[${fieldName}]`;
          } else if (coef === -1) {
            expr = `-[${fieldName}]`;
          } else {
            expr = `${coef} * [${fieldName}]`;
          }
        } else {
          if (coef === 1) {
            expr += ` + [${fieldName}]`;
          } else if (coef === -1) {
            expr += ` - [${fieldName}]`;
          } else if (coef > 0) {
            expr += ` + ${coef} * [${fieldName}]`;
          } else {
            expr += ` - ${Math.abs(coef)} * [${fieldName}]`;
          }
        }
      }
    });

    return expr || '0';
  };

  // 生成减法表达式
  const generateSubtractionExpression = () => {
    const { minuend, subtrahend } = subtractionConfig;
    if (!minuend || !subtrahend) return '';
    return `[${getFieldName(minuend)}] - [${getFieldName(subtrahend)}]`;
  };

  // 生成乘法表达式
  const generateMultiplicationExpression = () => {
    const { factors } = multiplicationConfig;
    const validFactors = factors.filter(f => f);
    if (validFactors.length < 2) return '';
    return validFactors.map(f => `[${getFieldName(f)}]`).join(' * ');
  };

  // 生成除法表达式
  const generateDivisionExpression = () => {
    const { dividend, divisor } = divisionConfig;
    if (!dividend || !divisor) return '';
    return `[${getFieldName(dividend)}] / [${getFieldName(divisor)}]`;
  };

  // 生成指数表达式
  const generatePowerExpression = () => {
    const { base, exponent, exponentType } = powerConfig;
    if (!base) return '';
    if (exponentType === 'number') {
      return `[${getFieldName(base)}] ^ ${exponent}`;
    } else {
      if (!exponent) return '';
      return `[${getFieldName(base)}] ^ [${getFieldName(exponent)}]`;
    }
  };

  // 验证表达式
  const validateExpression = () => {
    switch (expressionType) {
      case 'addition': {
        const validTerms = additionConfig.terms.filter(t => t.fieldId);
        if (validTerms.length === 0 && additionConfig.constant === 0) {
          return { valid: false, error: '请至少添加一个字段或设置常数项' };
        }
        return { valid: true };
      }
      case 'subtraction':
        if (!subtractionConfig.minuend || !subtractionConfig.subtrahend) {
          return { valid: false, error: '请选择被减数和减数' };
        }
        return { valid: true };
      case 'multiplication': {
        const validFactors = multiplicationConfig.factors.filter(f => f);
        if (validFactors.length < 2) {
          return { valid: false, error: '请至少选择两个乘数' };
        }
        return { valid: true };
      }
      case 'division':
        if (!divisionConfig.dividend || !divisionConfig.divisor) {
          return { valid: false, error: '请选择被除数和除数' };
        }
        return { valid: true };
      case 'power':
        if (!powerConfig.base) {
          return { valid: false, error: '请选择底数' };
        }
        if (powerConfig.exponentType === 'field' && !powerConfig.exponent) {
          return { valid: false, error: '请选择指数字段' };
        }
        return { valid: true };
      case 'piecewise': {
        if (!piecewiseConfig.segmentField) {
          return { valid: false, error: '请选择分段对象字段' };
        }
        // 离散分段验证
        if (piecewiseConfig.segmentFieldType === 'discrete') {
          if (piecewiseConfig.discreteGroups.length === 0) {
            return { valid: false, error: '请至少添加一个分组' };
          }
          return { valid: true };
        }
        // 连续分段验证
        if (piecewiseConfig.anchors.length === 0) {
          return { valid: false, error: '请至少添加一个锚点' };
        }
        if (!piecewiseConfig.rightmostValue && piecewiseConfig.rightmostValue !== 0) {
          return { valid: false, error: '请设置最右侧区间的取值' };
        }
        return { valid: true };
      }
      default:
        return { valid: false, error: '请选择表达式类型' };
    }
  };

  // 保存表达式
  const handleSave = () => {
    const validation = validateExpression();
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const expression = generateExpression();
    let config = {};

    switch (expressionType) {
      case 'addition':
        config = { ...additionConfig };
        break;
      case 'subtraction':
        config = { ...subtractionConfig };
        break;
      case 'multiplication':
        config = { ...multiplicationConfig };
        break;
      case 'division':
        config = { ...divisionConfig };
        break;
      case 'power':
        config = { ...powerConfig };
        break;
      case 'piecewise':
        config = { ...piecewiseConfig };
        break;
    }

    onSave(expression, expressionType, config);
  };

  // 添加加法项
  const addAdditionTerm = () => {
    setAdditionConfig({
      ...additionConfig,
      terms: [...additionConfig.terms, { coefficient: 1, fieldId: '' }]
    });
  };

  // 移除加法项
  const removeAdditionTerm = (index) => {
    const newTerms = additionConfig.terms.filter((_, i) => i !== index);
    setAdditionConfig({ ...additionConfig, terms: newTerms });
  };

  // 更新加法项
  const updateAdditionTerm = (index, field, value) => {
    const newTerms = [...additionConfig.terms];
    newTerms[index] = { ...newTerms[index], [field]: value };
    setAdditionConfig({ ...additionConfig, terms: newTerms });
  };

  // 添加乘法因子
  const addMultiplicationFactor = () => {
    setMultiplicationConfig({
      factors: [...multiplicationConfig.factors, '']
    });
  };

  // 移除乘法因子
  const removeMultiplicationFactor = (index) => {
    const newFactors = multiplicationConfig.factors.filter((_, i) => i !== index);
    setMultiplicationConfig({ factors: newFactors });
  };

  // 渲染字段选择下拉
  const renderFieldSelect = (value, onChange, placeholder = '选择字段') => {
    const allFields = getAllAvailableFields();
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
      >
        <option value="">{placeholder}</option>
        {allFields.map(f => (
          <option key={f.id} value={f.id}>
            {f.name} {f.isDerived ? '(衍生)' : `(${f.type})`}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="space-y-6">
      {/* 表达式类型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择函数类型 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { type: 'addition', label: '加法', desc: 'Y = A₀ + A₁X₁ + A₂X₂ + ...' },
            { type: 'subtraction', label: '减法', desc: 'Y = X₁ - X₂' },
            { type: 'multiplication', label: '乘法', desc: 'Y = X₁ × X₂ × ...' },
            { type: 'division', label: '除法', desc: 'Y = X₁ ÷ X₂' },
            { type: 'power', label: '指数', desc: 'Y = Xⁿ' },
            { type: 'piecewise', label: '分段函数', desc: '条件映射' }
          ].map(item => (
            <button
              key={item.type}
              onClick={() => {
                setExpressionType(item.type);
                if (item.type === 'piecewise') {
                  setPiecewiseStep(1);
                  setPiecewiseConfig({
                    segmentField: '',
                    segmentFieldType: '',
                    valueType: 'number',
                    attributeFormId: '',
                    attributeFieldId: '',
                    anchors: [],
                    rightmostValue: '',
                    discreteGroups: [],
                    defaultValue: ''
                  });
                }
              }}
              className={`p-3 text-left border-2 rounded-lg transition-all ${
                expressionType === item.type
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="font-medium text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 加法配置 */}
      {expressionType === 'addition' && (
        <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
          <h4 className="text-sm font-medium text-pink-700 mb-4">加法函数配置</h4>
          
          {/* 常数项 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">常数项 (A₀)</label>
            <input
              type="number"
              value={additionConfig.constant}
              onChange={(e) => setAdditionConfig({ ...additionConfig, constant: parseFloat(e.target.value) || 0 })}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* 各项 */}
          <div className="space-y-3">
            {additionConfig.terms.map((term, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                <span className="text-gray-500 text-sm">第{index + 1}项：</span>
                <input
                  type="number"
                  value={term.coefficient}
                  onChange={(e) => updateAdditionTerm(index, 'coefficient', parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="系数"
                />
                <span className="text-gray-500">×</span>
                {renderFieldSelect(
                  term.fieldId,
                  (value) => updateAdditionTerm(index, 'fieldId', value),
                  '选择字段'
                )}
                {additionConfig.terms.length > 1 && (
                  <button
                    onClick={() => removeAdditionTerm(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    移除
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addAdditionTerm}
            className="mt-3 px-3 py-1 text-sm text-pink-600 hover:text-pink-800"
          >
            + 添加新字段
          </button>
        </div>
      )}

      {/* 减法配置 */}
      {expressionType === 'subtraction' && (
        <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
          <h4 className="text-sm font-medium text-pink-700 mb-4">减法函数配置</h4>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">被减数</label>
              {renderFieldSelect(
                subtractionConfig.minuend,
                (value) => setSubtractionConfig({ ...subtractionConfig, minuend: value })
              )}
            </div>
            <span className="text-2xl text-gray-400 mt-5">−</span>
            <div>
              <label className="block text-xs text-gray-600 mb-1">减数</label>
              {renderFieldSelect(
                subtractionConfig.subtrahend,
                (value) => setSubtractionConfig({ ...subtractionConfig, subtrahend: value })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 乘法配置 */}
      {expressionType === 'multiplication' && (
        <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
          <h4 className="text-sm font-medium text-pink-700 mb-4">乘法函数配置</h4>
          
          <div className="space-y-3">
            {multiplicationConfig.factors.map((factor, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                <span className="text-gray-500 text-sm">第{index + 1}个乘数：</span>
                {renderFieldSelect(
                  factor,
                  (value) => {
                    const newFactors = [...multiplicationConfig.factors];
                    newFactors[index] = value;
                    setMultiplicationConfig({ factors: newFactors });
                  }
                )}
                {multiplicationConfig.factors.length > 2 && (
                  <button
                    onClick={() => removeMultiplicationFactor(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    移除
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addMultiplicationFactor}
            className="mt-3 px-3 py-1 text-sm text-pink-600 hover:text-pink-800"
          >
            + 添加新乘数
          </button>
        </div>
      )}

      {/* 除法配置 */}
      {expressionType === 'division' && (
        <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
          <h4 className="text-sm font-medium text-pink-700 mb-4">除法函数配置</h4>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">被除数</label>
              {renderFieldSelect(
                divisionConfig.dividend,
                (value) => setDivisionConfig({ ...divisionConfig, dividend: value })
              )}
            </div>
            <span className="text-2xl text-gray-400 mt-5">÷</span>
            <div>
              <label className="block text-xs text-gray-600 mb-1">除数</label>
              {renderFieldSelect(
                divisionConfig.divisor,
                (value) => setDivisionConfig({ ...divisionConfig, divisor: value })
              )}
            </div>
          </div>
          
          <p className="text-xs text-yellow-600 mt-3">
            注意：除数为0时计算结果将显示为 ERROR
          </p>
        </div>
      )}

      {/* 指数配置 */}
      {expressionType === 'power' && (
        <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
          <h4 className="text-sm font-medium text-pink-700 mb-4">指数函数配置</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">底数</label>
              {renderFieldSelect(
                powerConfig.base,
                (value) => setPowerConfig({ ...powerConfig, base: value })
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">指数类型</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={powerConfig.exponentType === 'number'}
                    onChange={() => setPowerConfig({ ...powerConfig, exponentType: 'number', exponent: 2 })}
                    className="form-radio text-pink-600"
                  />
                  <span className="ml-2 text-sm">数值</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={powerConfig.exponentType === 'field'}
                    onChange={() => setPowerConfig({ ...powerConfig, exponentType: 'field', exponent: '' })}
                    className="form-radio text-pink-600"
                  />
                  <span className="ml-2 text-sm">字段</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">指数值</label>
              {powerConfig.exponentType === 'number' ? (
                <input
                  type="number"
                  value={powerConfig.exponent}
                  onChange={(e) => setPowerConfig({ ...powerConfig, exponent: parseFloat(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              ) : (
                renderFieldSelect(
                  powerConfig.exponent,
                  (value) => setPowerConfig({ ...powerConfig, exponent: value })
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* 分段函数配置 */}
      {expressionType === 'piecewise' && (
        <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
          <h4 className="text-sm font-medium text-pink-700 mb-4">
            分段函数配置 - 步骤 {piecewiseStep}/3
          </h4>

          {/* 步骤1：选择分段对象 */}
          {piecewiseStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  选择分段对象字段 <span className="text-red-500">*</span>
                </label>
                <select
                  value={piecewiseConfig.segmentField}
                  onChange={(e) => {
                    const fieldId = e.target.value;
                    const isContinuous = isFieldContinuous(fieldId);
                    setPiecewiseConfig({
                      ...piecewiseConfig,
                      segmentField: fieldId,
                      segmentFieldType: isContinuous ? 'continuous' : 'discrete',
                      valueType: isContinuous ? 'number' : 'text'  // 根据类型设置默认取值方式
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">请选择字段</option>
                  {getAllSourceFields().map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>

              {piecewiseConfig.segmentField && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    字段类型：
                    <span className={`ml-2 px-2 py-0.5 rounded text-sm ${
                      piecewiseConfig.segmentFieldType === 'continuous' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {piecewiseConfig.segmentFieldType === 'continuous' ? '连续（数值）' : '离散（枚举）'}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!piecewiseConfig.segmentField) {
                    alert('请选择分段对象字段');
                    return;
                  }
                  setPiecewiseStep(2);
                }}
                className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
              >
                下一步：设置取值方式 →
              </button>
            </div>
          )}

          {/* 步骤2：选择取值方式 */}
          {piecewiseStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">取值方式</label>
                <div className="flex flex-wrap gap-4">
                  {piecewiseConfig.segmentFieldType === 'continuous' && (
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={piecewiseConfig.valueType === 'number'}
                        onChange={() => setPiecewiseConfig({ 
                          ...piecewiseConfig, 
                          valueType: 'number',
                          attributeFormId: '',
                          attributeFieldId: ''
                        })}
                        className="form-radio text-pink-600"
                      />
                      <span className="ml-2 text-sm">数值（手动输入）</span>
                    </label>
                  )}
                  {piecewiseConfig.segmentFieldType === 'discrete' && (
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={piecewiseConfig.valueType === 'text'}
                        onChange={() => setPiecewiseConfig({ 
                          ...piecewiseConfig, 
                          valueType: 'text',
                          attributeFormId: '',
                          attributeFieldId: ''
                        })}
                        className="form-radio text-pink-600"
                      />
                      <span className="ml-2 text-sm">文本（手动输入）</span>
                    </label>
                  )}
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={piecewiseConfig.valueType === 'attribute'}
                      onChange={() => setPiecewiseConfig({ 
                        ...piecewiseConfig, 
                        valueType: 'attribute' 
                      })}
                      className="form-radio text-pink-600"
                    />
                    <span className="ml-2 text-sm">属性值（从属性表选择）</span>
                  </label>
                </div>
              </div>

              {piecewiseConfig.valueType === 'attribute' && (
                <div className="space-y-3 bg-white rounded-lg p-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">选择属性表</label>
                    <select
                      value={piecewiseConfig.attributeFormId}
                      onChange={(e) => setPiecewiseConfig({
                        ...piecewiseConfig,
                        attributeFormId: e.target.value,
                        attributeFieldId: ''
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">请选择属性表</option>
                      {getAttributeForms().map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {piecewiseConfig.attributeFormId && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">选择赋值字段</label>
                      <select
                        value={piecewiseConfig.attributeFieldId}
                        onChange={(e) => setPiecewiseConfig({
                          ...piecewiseConfig,
                          attributeFieldId: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="">请选择字段</option>
                        {getAttributeFormFields(piecewiseConfig.attributeFormId).map(f => (
                          <option key={f.id} value={f.id}>{f.name} (第{f.level}级)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setPiecewiseStep(1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  ← 返回
                </button>
                <button
                  onClick={() => {
                    // 检查是否选择了取值方式
                    if (piecewiseConfig.segmentFieldType === 'continuous' && piecewiseConfig.valueType !== 'number' && piecewiseConfig.valueType !== 'attribute') {
                      alert('请选择取值方式');
                      return;
                    }
                    if (piecewiseConfig.segmentFieldType === 'discrete' && piecewiseConfig.valueType !== 'text' && piecewiseConfig.valueType !== 'attribute') {
                      alert('请选择取值方式');
                      return;
                    }
                    if (piecewiseConfig.valueType === 'attribute') {
                      if (!piecewiseConfig.attributeFormId || !piecewiseConfig.attributeFieldId) {
                        alert('请选择属性表和赋值字段');
                        return;
                      }
                    }
                    setPiecewiseStep(3);
                  }}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  下一步：{piecewiseConfig.segmentFieldType === 'continuous' ? '设置锚点' : '设置分组'} →
                </button>
              </div>
            </div>
          )}

          {/* 步骤3：设置锚点（连续）或分组（离散） */}
          {piecewiseStep === 3 && piecewiseConfig.segmentFieldType === 'continuous' && (
            <PiecewiseAnchorBuilder
              config={piecewiseConfig}
              setConfig={setPiecewiseConfig}
              getAttributeFieldValues={getAttributeFieldValues}
              getSourceFieldName={getSourceFieldName}
              onBack={() => setPiecewiseStep(2)}
            />
          )}

          {piecewiseStep === 3 && piecewiseConfig.segmentFieldType === 'discrete' && (
            <PiecewiseDiscreteBuilder
              config={piecewiseConfig}
              setConfig={setPiecewiseConfig}
              getAttributeFieldValues={getAttributeFieldValues}
              getSourceFieldName={getSourceFieldName}
              getSourceFieldUniqueValues={getSourceFieldUniqueValues}
              onBack={() => setPiecewiseStep(2)}
            />
          )}
        </div>
      )}

      {/* 表达式预览 */}
      {expressionType && expressionType !== 'piecewise' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">表达式预览</h4>
          <code className="block px-3 py-2 bg-white border border-gray-200 rounded text-pink-600 font-mono">
            {generateExpression() || '(请完成配置)'}
          </code>
        </div>
      )}

      {/* 按钮 - 分段函数有自己的按钮逻辑 */}
      {expressionType !== 'piecewise' && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!expressionType}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            确认保存
          </button>
        </div>
      )}
    </div>
  );
}

// 子组件已拆分到 expressionBuilder/ 目录：
// - PiecewiseAnchorBuilder.jsx - 分段函数锚点构建
// - PiecewiseDiscreteBuilder.jsx - 离散分段构建
// 这些组件通过 window.PiecewiseAnchorBuilder 和 window.PiecewiseDiscreteBuilder 引用

window.ExpressionBuilder = ExpressionBuilder;

console.log('[DND2] ExpressionBuilder.jsx 加载完成（子组件已拆分）');
