// 子表管理器组件
function SubTableManager({ projectId, form, fields, forms, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 1: 选择截取方式, 2: 配置横向, 3: 配置纵向, 4: 确认
  const [sourceFormId, setSourceFormId] = React.useState('');
  const [subType, setSubType] = React.useState(''); // 'horizontal', 'vertical', 'mixed'
  
  // 横向截取配置
  const [selectedFields, setSelectedFields] = React.useState([]);
  
  // 纵向截取配置
  const [criteriaFieldId, setCriteriaFieldId] = React.useState('');
  const [operator, setOperator] = React.useState('equals'); // 'equals' (单选/多选), 'range' (范围)
  const [selectedValues, setSelectedValues] = React.useState([]);
  const [rangeMin, setRangeMin] = React.useState('');
  const [rangeMax, setRangeMax] = React.useState('');
  
  // 表单名称
  const [tableName, setTableName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // 过滤出对象表单
  const objectForms = forms.filter(f => f.type === '对象表单' && !f.subType);
  const sourceForm = sourceFormId ? forms.find(f => f.id === sourceFormId) : null;
  
  // 获取源表单的字段（排除主键）
  const sourceFormFields = React.useMemo(() => {
    if (!sourceForm) return [];
    const formFieldIds = (sourceForm.structure?.fields || []).map(f => f.fieldId);
    return fields.filter(f => formFieldIds.includes(f.id) && f.id !== sourceForm.structure?.primaryKey);
  }, [sourceForm, fields]);

  // 属性字段列表
  const attributeFields = React.useMemo(() => {
    return sourceFormFields.filter(f => f.type === '属性表单');
  }, [sourceFormFields]);

  // 非主键非属性字段列表
  const nonAttributeFields = React.useMemo(() => {
    return sourceFormFields.filter(f => f.type !== '属性表单');
  }, [sourceFormFields]);

  // 处理横向字段选择
  const handleFieldToggle = (fieldId) => {
    const field = sourceFormFields.find(f => f.id === fieldId);
    
    if (field.type === '属性表单') {
      // 属性字段需要遵循一体化原则
      const attributeLevels = window.dndDB.getAttributeFieldLevels(fieldId, fields);
      const allLevelFieldIds = attributeLevels.map(l => l.fieldId);
      
      if (selectedFields.includes(fieldId)) {
        // 取消选择，取消所有层级
        setSelectedFields(prev => prev.filter(id => !allLevelFieldIds.includes(id)));
      } else {
        // 选中，选中所有层级
        setSelectedFields(prev => {
          const newSelected = [...prev];
          allLevelFieldIds.forEach(fid => {
            if (!newSelected.includes(fid)) {
              newSelected.push(fid);
            }
          });
          return newSelected;
        });
      }
    } else {
      // 非属性字段单独处理
      setSelectedFields(prev =>
        prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
      );
    }
  };

  // 处理纵向字段选择
  const handleCriteriaFieldChange = (fieldId) => {
    setCriteriaFieldId(fieldId);
    setOperator('equals');
    setSelectedValues([]);
    setRangeMin('');
    setRangeMax('');
  };

  // 获取纵向字段的所有可能值
  const criteriaFieldValues = React.useMemo(() => {
    if (!sourceForm || !criteriaFieldId) return [];
    const uniqueValues = [...new Set(
      (sourceForm.data || []).map(record => record[criteriaFieldId]).filter(v => v !== undefined && v !== null)
    )].sort();
    return uniqueValues;
  }, [sourceForm, criteriaFieldId]);

  // 处理值的选择
  const handleValueToggle = (value) => {
    setSelectedValues(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  // 生成默认表单名称
  React.useEffect(() => {
    if (sourceForm && subType === 'vertical' && criteriaFieldId) {
      const criteriaField = sourceFormFields.find(f => f.id === criteriaFieldId);
      if (criteriaField) {
        const defaultName = window.dndDB.generateSubTableName(
          sourceForm.name,
          { field: criteriaField, values: selectedValues.length > 0 ? selectedValues : criteriaFieldValues }
        );
        setTableName(defaultName);
      }
    } else if (sourceForm) {
      setTableName(`${sourceForm.name}-子表`);
    }
  }, [sourceForm, subType, criteriaFieldId, selectedValues, criteriaFieldValues, sourceFormFields]);

  // 提交创建子表
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    try {
      const config = {
        sourceFormId,
        subType,
        selectedFields: subType === 'vertical' ? (sourceForm.structure?.fields || []).map(f => f.fieldId).filter(id => id !== sourceForm.structure?.primaryKey) : selectedFields,
        criteria: subType === 'horizontal' ? null : {
          fieldId: criteriaFieldId,
          operator,
          values: operator === 'equals' ? selectedValues : [Number(rangeMin), Number(rangeMax)]
        },
        tableName
      };

      const newForm = await window.dndDB.createSubTable(projectId, config);
      
      if (onSuccess) {
        onSuccess(newForm);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || '创建子表失败');
    } finally {
      setLoading(false);
    }
  };

  // 下一步
  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!sourceFormId) {
        setError('请选择操作目标表');
        return;
      }
      if (!subType) {
        setError('请选择截取方式');
        return;
      }
      
      if (subType === 'horizontal') {
        setStep(2);
      } else if (subType === 'vertical') {
        setStep(3);
      } else {
        setStep(2); // 混合截取，先横向
      }
    } else if (step === 2) {
      if ((subType === 'horizontal' || subType === 'mixed') && selectedFields.length === 0) {
        setError('请至少选择一个字段');
        return;
      }
      if (subType === 'mixed') {
        setStep(3);
      } else {
        setStep(4);
      }
    } else if (step === 3) {
      if (subType === 'vertical' || subType === 'mixed') {
        if (!criteriaFieldId) {
          setError('请选择标准字段');
          return;
        }
        if (operator === 'equals' && selectedValues.length === 0) {
          setError('请至少选择一个值');
          return;
        }
        if (operator === 'range' && (rangeMin === '' || rangeMax === '')) {
          setError('请输入范围');
          return;
        }
      }
      setStep(4);
    }
  };

  // 上一步
  const handlePrev = () => {
    setError('');
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      if (subType === 'mixed') {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 4) {
      if (subType === 'mixed') {
        setStep(3);
      } else if (subType === 'vertical') {
        setStep(3);
      } else {
        setStep(2);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            创建子表 - 步骤 {step}/4
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && '选择操作目标表和截取方式'}
            {step === 2 && '选择横向截取字段'}
            {step === 3 && '选择纵向截取标准'}
            {step === 4 && '确认信息'}
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 第1步：选择截取方式 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作目标表 <span className="text-red-500">*</span>
                </label>
                <select
                  value={sourceFormId}
                  onChange={(e) => setSourceFormId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">请选择表单</option>
                  {objectForms.map(f =>
                    <option key={f.id} value={f.id}>{f.name}</option>
                  )}
                </select>
              </div>

              {sourceForm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    截取方式 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subType === 'horizontal' || subType === 'mixed'}
                        onChange={(e) => setSubType(e.target.checked ? (subType === 'vertical' ? 'mixed' : 'horizontal') : '')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm">横向截取</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subType === 'vertical' || subType === 'mixed'}
                        onChange={(e) => setSubType(e.target.checked ? (subType === 'horizontal' ? 'mixed' : 'vertical') : '')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm">纵向截取</span>
                    </label>
                  </div>
                </div>
              )}

              {sourceForm && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700">
                    <strong>子表说明：</strong>
                  </p>
                  <ul className="text-sm text-purple-600 mt-2 list-disc list-inside space-y-1">
                    <li>横向截取：选择部分字段</li>
                    <li>纵向截取：按字段值筛选数据</li>
                    <li>混合截取：既有横向又有纵向</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 第2步：配置横向截取 */}
          {step === 2 && (
            <div className="space-y-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">选择横向截取字段</h4>
              
              {nonAttributeFields.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-2">普通字段</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {nonAttributeFields.map(f =>
                      <label key={f.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(f.id)}
                          onChange={() => handleFieldToggle(f.id)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm">{f.name} ({f.type})</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
              
              {attributeFields.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-2">属性字段（需全选整个属性表）</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {attributeFields.map(f =>
                      <label key={f.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(f.id)}
                          onChange={() => handleFieldToggle(f.id)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm">{f.name} (属性表单)</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 第3步：配置纵向截取 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标准字段 <span className="text-red-500">*</span>
                </label>
                <select
                  value={criteriaFieldId}
                  onChange={(e) => handleCriteriaFieldChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">请选择字段</option>
                  {[...(sourceForm.structure?.fields || [])].map(f => {
                    const fieldDef = fields.find(fld => fld.id === f.fieldId);
                    return {
                      id: f.fieldId,
                      name: fieldDef?.name || f.fieldId,
                      type: fieldDef?.type || ''
                    };
                  }).map(f =>
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  )}
                </select>
              </div>

              {criteriaFieldId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择方式 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="operator"
                        value="equals"
                        checked={operator === 'equals'}
                        onChange={(e) => setOperator(e.target.value)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm">等于（单选或多选）</span>
                    </label>
                  </div>
                </div>
              )}

              {operator === 'equals' && criteriaFieldId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择值 <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {criteriaFieldValues.length > 0 ? criteriaFieldValues.map((v, i) =>
                      <label key={i} className="flex items-center space-x-2 cursor-pointer mb-1">
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(v)}
                          onChange={() => handleValueToggle(v)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm">{v}</span>
                      </label>
                    ) : (
                      <p className="text-sm text-gray-500">该字段暂无数据</p>
                    )}
                  </div>
                  <div className="flex space-x-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedValues(criteriaFieldValues)}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedValues([])}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                    >
                      清空
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 第4步：确认 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p><strong>源表单：</strong>{sourceForm?.name}</p>
                <p><strong>截取方式：</strong>{
                  subType === 'horizontal' ? '横向截取' :
                  subType === 'vertical' ? '纵向截取' : '混合截取'
                }</p>
                {(subType === 'horizontal' || subType === 'mixed') && (
                  <p><strong>选中字段数：</strong>{selectedFields.length}</p>
                )}
                {(subType === 'vertical' || subType === 'mixed') && (
                  <p><strong>标准字段：</strong>{sourceFormFields.find(f => f.id === criteriaFieldId)?.name}</p>
                )}
                {(subType === 'vertical' || subType === 'mixed') && operator === 'equals' && (
                  <p><strong>选中值数：</strong>{selectedValues.length}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  子表名称（10汉字以内）<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value.slice(0, 10))}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step >= 2 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
                onClick={handleNext}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={!subType}
              >
                下一步 →
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={(subType === 'horizontal' || subType === 'mixed') && selectedFields.length === 0}
              >
                下一步 →
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={!criteriaFieldId || (operator === 'equals' && selectedValues.length === 0)}
              >
                下一步 →
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={!tableName.trim() || loading}
              >
                {loading ? '创建中...' : '确定创建'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.SubTableManager = SubTableManager;
