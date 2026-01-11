// 再造表管理器组件
function RebuildTableManager({ projectId, form, fields, forms, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 1: 选择配置, 2: 确认
  const [sourceFormId, setSourceFormId] = React.useState('');
  const [targetFieldId, setTargetFieldId] = React.useState(''); // 标的字段
  const [aggregationType, setAggregationType] = React.useState('count'); // 聚合方式
  const [tableName, setTableName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // 过滤出对象表单（排除子表和再造表本身，避免循环引用）
  const objectForms = forms.filter(f => f.type === '对象表单' && !['子表', '再造表'].includes(f.subType));
  const sourceForm = sourceFormId ? forms.find(f => f.id === sourceFormId) : null;

  // 获取源表单的所有字段
  const sourceFormFields = React.useMemo(() => {
    if (!sourceForm) return [];
    const formFieldIds = (sourceForm.structure?.fields || []).map(f => f.fieldId);
    return fields.filter(f => formFieldIds.includes(f.id));
  }, [sourceForm, fields]);

  // 标的字段候选列表（通常选择属性字段）
  const targetFieldCandidates = React.useMemo(() => {
    // 可以是所有字段，但通常选择属性字段或文本类型字段
    return sourceFormFields.filter(f => f.type === '属性表单' || ['文本', '选项'].includes(f.type));
  }, [sourceFormFields]);

  // 数值类字段（用于聚合运算）- 支持多种数值类型
  const numericFields = React.useMemo(() => {
    return sourceFormFields.filter(f =>
      ['数字', '金额', '数量', '整数', '小数', '浮点数'].includes(f.type)
    );
  }, [sourceFormFields]);

  // 聚合方式选项
  const aggregationOptions = [
    { value: 'count', label: '计数' },
    { value: 'sum', label: '求和' },
    { value: 'avg', label: '平均值' },
    { value: 'max', label: '最大值' },
    { value: 'min', label: '最小值' },
    { value: 'median', label: '中位数' }
  ];

  // 生成默认表单名称
  React.useEffect(() => {
    if (sourceForm && targetFieldId && aggregationType) {
      const targetField = sourceFormFields.find(f => f.id === targetFieldId);
      const aggLabel = aggregationOptions.find(opt => opt.value === aggregationType)?.label || '';
      const defaultName = `${sourceForm.name}-${targetField?.name || ''}-${aggLabel}`;
      setTableName(defaultName);
    } else if (sourceForm) {
      setTableName(`${sourceForm.name}-再造表`);
    }
  }, [sourceForm, targetFieldId, aggregationType, sourceFormFields]);

  // 提交创建再造表
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    try {
      const config = {
        sourceFormId,
        targetFieldId,
        aggregationType,
        tableName
      };

      const newForm = await window.dndDB.createRebuildTable(projectId, config);
      
      if (onSuccess) {
        onSuccess(newForm);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || '创建再造表失败');
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
      if (!targetFieldId) {
        setError('请选择标的字段');
        return;
      }
      if (!aggregationType) {
        setError('请选择再造方式');
        return;
      }
      setStep(2);
    }
  };

  // 上一步
  const handlePrev = () => {
    setError('');
    if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            创建再造表 - 步骤 {step}/2
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && '选择操作目标表和配置'}
            {step === 2 && '确认信息'}
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 第1步：选择配置 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作目标表 <span className="text-red-500">*</span>
                </label>
                <select
                  value={sourceFormId}
                  onChange={(e) => setSourceFormId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    标的字段（用于分组）<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={targetFieldId}
                    onChange={(e) => setTargetFieldId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">请选择字段</option>
                    {sourceFormFields.map(f =>
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type})
                      </option>
                    )}
                  </select>
                </div>
              )}

              {sourceForm && targetFieldId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    再造方式（聚合运算）<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aggregationType}
                    onChange={(e) => setAggregationType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {aggregationOptions.map(opt =>
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )}
                  </select>
                </div>
              )}

              {sourceForm && targetFieldId && aggregationType && numericFields.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>将参与聚合运算的数值字段：</strong>
                  </p>
                  <ul className="text-sm text-blue-600 mt-2 list-disc list-inside">
                    {numericFields.map(f =>
                      <li key={f.id}>{f.name}</li>
                    )}
                  </ul>
                </div>
              )}

              {sourceForm && targetFieldId && aggregationType && numericFields.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    ⚠️ 警告：该表单没有数值类型字段，无法进行聚合运算！
                  </p>
                </div>
              )}

              {sourceForm && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-700">
                    <strong>再造表说明：</strong>
                  </p>
                  <ul className="text-sm text-orange-600 mt-2 list-disc list-inside space-y-1">
                    <li>系统将按标的字段的不同取值分组</li>
                    <li>对每组的数值字段进行聚合运算</li>
                    <li>生成以标的字段为主键的新表</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 第2步：确认 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p><strong>源表单：</strong>{sourceForm?.name}</p>
                <p><strong>标的字段：</strong>{sourceFormFields.find(f => f.id === targetFieldId)?.name}</p>
                <p><strong>再造方式：</strong>{aggregationOptions.find(opt => opt.value === aggregationType)?.label}</p>
                <p><strong>聚合字段数：</strong>{numericFields.length}</p>
              </div>

              {numericFields.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-700 mb-2">预览：</h5>
                  <p className="text-sm text-blue-600">
                    系统将按标的字段的不同取值分组，对每组的数值字段进行
                    <strong>{aggregationOptions.find(opt => opt.value === aggregationType)?.label}</strong>
                    运算，生成新的再造表。
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  再造表名称（10汉字以内）<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value.slice(0, 10))}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                disabled={!sourceFormId || !targetFieldId || !aggregationType || numericFields.length === 0}
              >
                下一步 →
              </button>
            )}

            {step === 2 && (
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

window.DNDComponents.RebuildTableManager = RebuildTableManager;
