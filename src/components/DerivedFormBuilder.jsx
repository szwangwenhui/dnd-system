// 衍生表构建组件（支持结构化表达式）
function DerivedFormBuilder({ projectId, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 1: 名称, 2: 选择源表, 3: 添加衍生字段
  const [formName, setFormName] = React.useState('');
  const [sourceForms, setSourceForms] = React.useState([]); // 可选的源表单
  const [allForms, setAllForms] = React.useState([]); // 所有表单（包括属性表）
  const [selectedSourceForm, setSelectedSourceForm] = React.useState(null);
  const [derivedFields, setDerivedFields] = React.useState([]); // 衍生字段列表
  const [fields, setFields] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // 当前正在编辑的衍生字段
  const [fieldName, setFieldName] = React.useState('');
  const [showExpressionBuilder, setShowExpressionBuilder] = React.useState(false);

  // 操作栏配置
  const [showActionColumn, setShowActionColumn] = React.useState(false);
  const [actionConfig, setActionConfig] = React.useState({
    edit: { enabled: false, text: '修改', color: '#3b82f6' },
    delete: { enabled: false, text: '删除', color: '#ef4444' },
    top: { enabled: false, textOn: '取消置顶', textOff: '置顶', color: '#f59e0b' }
  });

  // 加载数据
  React.useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      // 保存所有表单
      setAllForms(formList);
      // 可作为源表的表单：基础表和合表
      const sourceList = formList.filter(f => 
        f.type === '对象表单' && 
        (f.subType === '独立基础表' || f.subType === '关联基础表' || f.subType === '合表')
      );
      setSourceForms(sourceList);

      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      setFields(fieldList);
    } catch (error) {
      alert('加载数据失败：' + error);
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 获取源表的字段列表
  const getSourceFormFields = () => {
    if (!selectedSourceForm || !selectedSourceForm.structure) return [];
    return selectedSourceForm.structure.fields || [];
  };

  // 获取可用于表达式的数值字段
  const getNumericFields = () => {
    const sourceFields = getSourceFormFields();
    return sourceFields.filter(sf => {
      const fieldInfo = fields.find(f => f.id === sf.fieldId);
      return fieldInfo && (fieldInfo.type === '整数' || fieldInfo.type === '小数');
    });
  };

  // 移除衍生字段
  const handleRemoveDerivedField = (fieldId) => {
    setDerivedFields(derivedFields.filter(f => f.id !== fieldId));
  };

  // 计算表达式的值（用于预览）
  const evaluateExpression = (expr, record, derivedFieldItem = null) => {
    try {
      // 检查是否是分段函数（连续或离散）
      if (expr && (expr.startsWith('PIECEWISE(') || expr.startsWith('PIECEWISE_DISCRETE('))) {
        return evaluatePiecewise(record, derivedFieldItem);
      }

      let evalExpr = expr;
      
      // 替换字段引用为实际值
      const fieldRefs = expr.match(/\[([^\]]+)\]/g) || [];
      for (const ref of fieldRefs) {
        const fieldNameInBracket = ref.slice(1, -1);
        
        // 先查找源表字段
        const sourceField = getSourceFormFields().find(sf => getFieldName(sf.fieldId) === fieldNameInBracket);
        if (sourceField) {
          const value = record[sourceField.fieldId];
          evalExpr = evalExpr.replace(ref, value !== undefined && value !== '' ? value : 0);
          continue;
        }

        // 再查找衍生字段（支持衍生字段引用其他衍生字段）
        const derivedField = derivedFields.find(df => df.name === fieldNameInBracket);
        if (derivedField) {
          const derivedValue = evaluateExpression(derivedField.expression, record, derivedField);
          evalExpr = evalExpr.replace(ref, derivedValue);
        }
      }

      // 将 ^ 转换为 ** (JavaScript指数运算符)
      evalExpr = evalExpr.replace(/\^/g, '**');

      // 验证表达式安全性
      if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(evalExpr)) {
        return 'ERROR';
      }

      const result = eval(evalExpr);
      return typeof result === 'number' ? (Number.isInteger(result) ? result : parseFloat(result.toFixed(2))) : 'ERROR';
    } catch (e) {
      return 'ERROR';
    }
  };

  // 计算分段函数的值（用于预览）
  const evaluatePiecewise = (record, derivedFieldItem) => {
    try {
      console.log('evaluatePiecewise called with:', { record, derivedFieldItem });
      
      if (!derivedFieldItem) {
        console.log('ERROR: derivedFieldItem is null/undefined');
        return 'ERROR';
      }
      
      if (!derivedFieldItem.expressionConfig) {
        console.log('ERROR: expressionConfig is null/undefined', derivedFieldItem);
        return 'ERROR';
      }

      const config = derivedFieldItem.expressionConfig;
      console.log('config:', config);
      
      const { segmentField, segmentFieldType, anchors, rightmostValue, discreteGroups, defaultValue } = config;
      
      let segmentValue = record[segmentField];
      console.log('segmentField:', segmentField, 'segmentValue:', segmentValue);
      
      if (segmentValue === undefined || segmentValue === '') return '-';

      // 离散分段
      if (segmentFieldType === 'discrete') {
        const strValue = String(segmentValue);
        const groups = discreteGroups || [];
        console.log('Discrete mode - strValue:', strValue, 'groups:', groups);
        
        for (const group of groups) {
          console.log('Checking group:', group);
          if (group.values && group.values.includes(strValue)) {
            console.log('Found match! returning:', group.mappedValue);
            return group.mappedValue;
          }
        }
        console.log('No match, returning defaultValue:', defaultValue);
        return defaultValue || '-';
      }

      // 连续分段
      const anchorList = anchors || [];
      if (anchorList.length === 0) return 'ERROR';
      
      segmentValue = parseFloat(segmentValue);

      for (let i = 0; i < anchorList.length; i++) {
        const anchor = anchorList[i];
        const prevAnchor = i > 0 ? anchorList[i - 1] : null;
        const prevBelongRight = prevAnchor?.belong === 'right';

        if (i === 0) {
          if (anchor.belong === 'left' && segmentValue <= anchor.value) return anchor.leftValue;
          if (anchor.belong === 'independent') {
            if (segmentValue < anchor.value) return anchor.leftValue;
            if (segmentValue === anchor.value) return anchor.equalValue;
          }
          if (anchor.belong === 'right' && segmentValue < anchor.value) return anchor.leftValue;
        } else {
          const leftBound = prevAnchor.value;
          const leftInclusive = prevBelongRight;
          const inLeftRange = leftInclusive ? segmentValue >= leftBound : segmentValue > leftBound;

          if (anchor.belong === 'left' && inLeftRange && segmentValue <= anchor.value) return anchor.leftValue;
          if (anchor.belong === 'independent') {
            if (inLeftRange && segmentValue < anchor.value) return anchor.leftValue;
            if (segmentValue === anchor.value) return anchor.equalValue;
          }
          if (anchor.belong === 'right' && inLeftRange && segmentValue < anchor.value) return anchor.leftValue;
        }
      }

      // 最右侧区间
      const lastAnchor = anchorList[anchorList.length - 1];
      const rightInclusive = lastAnchor.belong === 'right';
      if (rightInclusive ? segmentValue >= lastAnchor.value : segmentValue > lastAnchor.value) {
        return rightmostValue;
      }

      return 'ERROR';
    } catch (e) {
      console.error('Piecewise evaluation error:', e);
      return 'ERROR';
    }
  };

  // 提交保存
  const handleSubmit = async () => {
    if (derivedFields.length === 0) {
      alert('请至少添加一个衍生字段');
      return;
    }

    setLoading(true);

    try {
      // 构建衍生表结构
      const sourceFields = getSourceFormFields().map(sf => ({
        ...sf,
        isSourceField: true
      }));

      const derivedFieldsStructure = derivedFields.map(df => ({
        fieldId: df.id,
        fieldName: df.name,
        expression: df.expression,
        expressionType: df.expressionType,
        expressionConfig: df.expressionConfig,
        type: df.type,
        isDerivedField: true
      }));

      const formData = {
        name: formName.trim(),
        type: '对象表单',
        formNature: '衍生表',
        subType: '衍生表',
        structure: {
          sourceFormId: selectedSourceForm.id,
          sourceFormName: selectedSourceForm.name,
          primaryKey: selectedSourceForm.structure?.primaryKey,
          fields: [...sourceFields, ...derivedFieldsStructure],
          derivedFields: derivedFieldsStructure,
          // 操作栏配置
          actionColumn: showActionColumn ? {
            enabled: true,
            title: '操作',
            width: 150,
            buttons: actionConfig
          } : null
        },
        data: null // 衍生表不存储数据
      };

      await window.dndDB.addForm(projectId, formData);
      alert('衍生表创建成功！');
      onSuccess();
      onClose();
    } catch (error) {
      alert('创建衍生表失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取预览数据
  const getPreviewData = () => {
    if (!selectedSourceForm || !selectedSourceForm.data) return [];
    return selectedSourceForm.data.slice(0, 5); // 只预览前5条
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            创建衍生表 - 步骤 {step}/3
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && '设置衍生表名称'}
            {step === 2 && '选择数据源表单'}
            {step === 3 && '添加衍生字段（计算公式）'}
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 步骤1：输入名称 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  衍生表名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：学生成绩统计表"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-pink-700"><strong>衍生表说明：</strong></p>
                    <ul className="text-sm text-pink-600 mt-1 list-disc list-inside">
                      <li>基于源表单数据进行计算，生成新的衍生字段</li>
                      <li>虚拟表，不存储数据，查询时动态计算</li>
                      <li>支持四则运算（+、-、*、/）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤2：选择源表 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择数据源表单 <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {sourceForms.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      没有可用的源表单，请先创建基础表或合表
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {sourceForms.map(form => (
                        <div 
                          key={form.id} 
                          onClick={() => setSelectedSourceForm(form)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            selectedSourceForm?.id === form.id 
                              ? 'bg-pink-50 border-l-4 border-pink-500' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{form.name}</div>
                              <div className="text-xs text-gray-500">
                                {form.subType} | {form.data?.length || 0} 条数据
                              </div>
                            </div>
                            {selectedSourceForm?.id === form.id && (
                              <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 显示选中源表的字段 */}
              {selectedSourceForm && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    源表字段（可用于计算）
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getSourceFormFields().map(sf => {
                      const fieldInfo = fields.find(f => f.id === sf.fieldId);
                      const isNumeric = fieldInfo && (fieldInfo.type === '整数' || fieldInfo.type === '小数');
                      return (
                        <span 
                          key={sf.fieldId}
                          className={`px-2 py-1 text-xs rounded ${
                            isNumeric 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {getFieldName(sf.fieldId)}
                          <span className="text-gray-400 ml-1">({fieldInfo?.type})</span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    绿色标签的数值字段可用于四则运算
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 步骤3：添加衍生字段 */}
          {step === 3 && !showExpressionBuilder && (
            <div className="space-y-6">
              {/* 已添加的衍生字段 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  已添加的衍生字段 ({derivedFields.length} 个)
                </label>
                <div className="border border-gray-300 rounded-lg divide-y divide-gray-200">
                  {derivedFields.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      尚未添加衍生字段，请点击下方按钮添加
                    </div>
                  ) : (
                    derivedFields.map(df => (
                      <div key={df.id} className="px-4 py-3 bg-pink-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{df.name}</span>
                            <span className="px-2 py-0.5 text-xs bg-pink-200 text-pink-700 rounded ml-2">
                              {df.expressionType === 'addition' ? '加法' :
                               df.expressionType === 'subtraction' ? '减法' :
                               df.expressionType === 'multiplication' ? '乘法' :
                               df.expressionType === 'division' ? '除法' :
                               df.expressionType === 'power' ? '指数' : '表达式'}
                            </span>
                            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                              {df.expression}
                            </code>
                          </div>
                          <button
                            onClick={() => handleRemoveDerivedField(df.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 添加新衍生字段 - 输入名称 */}
              <div className="border border-pink-300 rounded-lg p-4 bg-pink-50">
                <h4 className="text-sm font-medium text-pink-700 mb-3">添加衍生字段</h4>
                
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1">字段名称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="例如：总分、平均分、利润率"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 text-sm"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!fieldName.trim()) {
                      alert('请先输入字段名称');
                      return;
                    }
                    if (derivedFields.some(df => df.name === fieldName.trim())) {
                      alert('字段名称已存在');
                      return;
                    }
                    setShowExpressionBuilder(true);
                  }}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  设置计算表达式 →
                </button>
              </div>

              {/* 操作栏设置 */}
              <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-orange-700">📌 设置操作栏</h4>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showActionColumn}
                      onChange={(e) => setShowActionColumn(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span className="text-sm text-gray-700">启用操作栏</span>
                  </label>
                </div>
                
                {showActionColumn && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 mb-2">
                      选择需要在操作栏中显示的按钮，操作将作用于源基础表的数据
                    </p>
                    
                    {/* 修改按钮 */}
                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionConfig.edit.enabled}
                          onChange={(e) => setActionConfig(prev => ({
                            ...prev,
                            edit: { ...prev.edit, enabled: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">✏️ 修改</span>
                        <span className="text-xs text-gray-400">- 编辑该行所有基础字段</span>
                      </label>
                      {actionConfig.edit.enabled && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={actionConfig.edit.text}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              edit: { ...prev.edit, text: e.target.value }
                            }))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                            placeholder="按钮文字"
                          />
                          <input
                            type="color"
                            value={actionConfig.edit.color}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              edit: { ...prev.edit, color: e.target.value }
                            }))}
                            className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
                            title="按钮颜色"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 删除按钮 */}
                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionConfig.delete.enabled}
                          onChange={(e) => setActionConfig(prev => ({
                            ...prev,
                            delete: { ...prev.delete, enabled: e.target.checked }
                          }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm">🗑️ 删除</span>
                        <span className="text-xs text-gray-400">- 删除源表中对应的数据</span>
                      </label>
                      {actionConfig.delete.enabled && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={actionConfig.delete.text}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              delete: { ...prev.delete, text: e.target.value }
                            }))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                            placeholder="按钮文字"
                          />
                          <input
                            type="color"
                            value={actionConfig.delete.color}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              delete: { ...prev.delete, color: e.target.value }
                            }))}
                            className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
                            title="按钮颜色"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 置顶按钮 */}
                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionConfig.top.enabled}
                          onChange={(e) => setActionConfig(prev => ({
                            ...prev,
                            top: { ...prev.top, enabled: e.target.checked }
                          }))}
                          className="w-4 h-4 text-yellow-600 rounded"
                        />
                        <span className="text-sm">📌 置顶/取消置顶</span>
                        <span className="text-xs text-gray-400">- 将该行置于表格顶部</span>
                      </label>
                      {actionConfig.top.enabled && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={actionConfig.top.textOff}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              top: { ...prev.top, textOff: e.target.value }
                            }))}
                            className="w-12 px-1 py-1 border border-gray-300 rounded text-xs text-center"
                            placeholder="置顶"
                            title="未置顶时显示"
                          />
                          <span className="text-gray-400">/</span>
                          <input
                            type="text"
                            value={actionConfig.top.textOn}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              top: { ...prev.top, textOn: e.target.value }
                            }))}
                            className="w-16 px-1 py-1 border border-gray-300 rounded text-xs text-center"
                            placeholder="取消置顶"
                            title="已置顶时显示"
                          />
                          <input
                            type="color"
                            value={actionConfig.top.color}
                            onChange={(e) => setActionConfig(prev => ({
                              ...prev,
                              top: { ...prev.top, color: e.target.value }
                            }))}
                            className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
                            title="按钮颜色"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 操作栏预览 */}
                    {(actionConfig.edit.enabled || actionConfig.delete.enabled || actionConfig.top.enabled) && (
                      <div className="mt-3 p-3 bg-gray-100 rounded">
                        <span className="text-xs text-gray-500 mr-2">预览效果：</span>
                        <div className="inline-flex items-center gap-2 mt-1">
                          {actionConfig.edit.enabled && (
                            <span 
                              className="px-2 py-1 text-xs text-white rounded"
                              style={{ backgroundColor: actionConfig.edit.color }}
                            >
                              {actionConfig.edit.text || '修改'}
                            </span>
                          )}
                          {actionConfig.delete.enabled && (
                            <span 
                              className="px-2 py-1 text-xs text-white rounded"
                              style={{ backgroundColor: actionConfig.delete.color }}
                            >
                              {actionConfig.delete.text || '删除'}
                            </span>
                          )}
                          {actionConfig.top.enabled && (
                            <span 
                              className="px-2 py-1 text-xs text-white rounded"
                              style={{ backgroundColor: actionConfig.top.color }}
                            >
                              {actionConfig.top.textOff || '置顶'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 数据预览 */}
              {derivedFields.length > 0 && getPreviewData().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    数据预览（前5条）
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {getSourceFormFields().map(sf => (
                            <th key={sf.fieldId} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              {getFieldName(sf.fieldId)}
                            </th>
                          ))}
                          {derivedFields.map(df => (
                            <th key={df.id} className="px-3 py-2 text-left text-xs font-medium text-pink-600 bg-pink-50">
                              {df.name}
                            </th>
                          ))}
                          {/* 操作栏表头 */}
                          {showActionColumn && (actionConfig.edit.enabled || actionConfig.delete.enabled || actionConfig.top.enabled) && (
                            <th className="px-3 py-2 text-center text-xs font-medium text-orange-600 bg-orange-50">
                              操作
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPreviewData().map((record, idx) => (
                          <tr key={idx}>
                            {getSourceFormFields().map(sf => (
                              <td key={sf.fieldId} className="px-3 py-2 text-gray-900">
                                {record[sf.fieldId] ?? '-'}
                              </td>
                            ))}
                            {derivedFields.map(df => (
                              <td key={df.id} className="px-3 py-2 text-pink-600 bg-pink-50 font-medium">
                                {evaluateExpression(df.expression, record, df)}
                              </td>
                            ))}
                            {/* 操作栏单元格 */}
                            {showActionColumn && (actionConfig.edit.enabled || actionConfig.delete.enabled || actionConfig.top.enabled) && (
                              <td className="px-3 py-2 bg-orange-50">
                                <div className="flex justify-center gap-1">
                                  {actionConfig.edit.enabled && (
                                    <span 
                                      className="px-2 py-0.5 text-xs text-white rounded cursor-default"
                                      style={{ backgroundColor: actionConfig.edit.color }}
                                    >
                                      {actionConfig.edit.text || '修改'}
                                    </span>
                                  )}
                                  {actionConfig.delete.enabled && (
                                    <span 
                                      className="px-2 py-0.5 text-xs text-white rounded cursor-default"
                                      style={{ backgroundColor: actionConfig.delete.color }}
                                    >
                                      {actionConfig.delete.text || '删除'}
                                    </span>
                                  )}
                                  {actionConfig.top.enabled && (
                                    <span 
                                      className="px-2 py-0.5 text-xs text-white rounded cursor-default"
                                      style={{ backgroundColor: actionConfig.top.color }}
                                    >
                                      {actionConfig.top.textOff || '置顶'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 表达式构建器 */}
          {step === 3 && showExpressionBuilder && (
            <div>
              <div className="mb-4 flex items-center">
                <button
                  onClick={() => setShowExpressionBuilder(false)}
                  className="text-gray-600 hover:text-gray-900 mr-3"
                >
                  ← 返回
                </button>
                <span className="text-lg font-medium text-gray-900">
                  设置「{fieldName}」的计算表达式
                </span>
              </div>
              <ExpressionBuilder
                fields={getSourceFormFields().map(sf => ({
                  ...sf,
                  ...fields.find(f => f.id === sf.fieldId)
                }))}
                derivedFields={derivedFields}
                forms={allForms}
                allFields={fields}
                sourceForm={selectedSourceForm}
                onSave={(expression, expressionType, expressionConfig) => {
                  const newField = {
                    id: `DERIVED-${Date.now()}`,
                    name: fieldName.trim(),
                    expression: expression,
                    expressionType: expressionType,
                    expressionConfig: expressionConfig,
                    type: expressionType === 'piecewise' && expressionConfig.valueType === 'attribute' ? '文本' : '小数'
                  };
                  setDerivedFields([...derivedFields, newField]);
                  setFieldName('');
                  setShowExpressionBuilder(false);
                }}
                onCancel={() => setShowExpressionBuilder(false)}
              />
            </div>
          )}
        </div>

        {/* 底部按钮 - 表达式构建器模式下隐藏 */}
        {!showExpressionBuilder && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <div>
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  ← 返回上一步
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                取消
              </button>

              {step === 1 && (
                <button
                  onClick={() => {
                    if (!formName.trim()) {
                      alert('请输入衍生表名称');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  下一步 →
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={() => {
                    if (!selectedSourceForm) {
                      alert('请选择源表单');
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  下一步 →
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={derivedFields.length === 0 || loading}
                >
                  {loading ? '保存中...' : '确定创建'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DNDComponents.DerivedFormBuilder = DerivedFormBuilder;