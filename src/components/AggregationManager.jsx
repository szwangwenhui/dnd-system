/**
 * 聚合运算管理组件
 * 用于对表单数据进行聚合运算（求记录数、求和、平均值、最大值、最小值、中位数、排序）
 */

function AggregationManager({ projectId, form, fields, onAggregationResult, onSortResult, onClose }) {
  const [selectedType, setSelectedType] = React.useState('');
  const [sortField, setSortField] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState('asc');
  const [showSortFieldSelect, setShowSortFieldSelect] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // 获取表单字段
  const getFormFields = () => {
    const formFields = form.structure?.fields || [];
    return formFields.map(f => {
      const field = fields.find(field => field.id === f.fieldId);
      return {
        fieldId: f.fieldId,
        fieldName: field?.name || f.fieldId,
        fieldType: field?.type || '未知',
        isNumeric: window.dndDB.isNumericField(field)
      };
    });
  };

  const formFields = getFormFields();
  const numericFields = formFields.filter(f => f.isNumeric);
  const sortableFields = formFields.filter(f => window.dndDB.isSortableField(fields.find(fd => fd.id === f.fieldId)));

  // 聚合类型配置
  const aggregationTypes = [
    { id: 'count', label: '求记录数', icon: '📊' },
    { id: 'sum', label: '求和', icon: '➕' },
    { id: 'avg', label: '求平均值', icon: '📈' },
    { id: 'max', label: '求最大值', icon: '⬆️' },
    { id: 'min', label: '求最小值', icon: '⬇️' },
    { id: 'median', label: '求中位数', icon: '📉' },
    { id: 'sort', label: '排序', icon: '🔄' }
  ];

  // 执行聚合运算
  const executeAggregation = async (type) => {
    setLoading(true);
    try {
      window.dndDB.setCurrentProjectId(projectId);
      const results = {};

      for (const field of numericFields) {
        switch (type) {
          case 'count':
            results[field.fieldId] = await window.dndDB.countFormRecords(form.id);
            break;
          case 'sum':
            results[field.fieldId] = await window.dndDB.sumFormField(form.id, field.fieldId);
            break;
          case 'avg':
            results[field.fieldId] = await window.dndDB.avgFormField(form.id, field.fieldId);
            break;
          case 'max':
            results[field.fieldId] = await window.dndDB.maxFormField(form.id, field.fieldId);
            break;
          case 'min':
            results[field.fieldId] = await window.dndDB.minFormField(form.id, field.fieldId);
            break;
          case 'median':
            results[field.fieldId] = await window.dndDB.medianFormField(form.id, field.fieldId);
            break;
        }
      }

      onAggregationResult({
        type,
        results,
        label: aggregationTypes.find(t => t.id === type)?.label
      });
    } catch (error) {
      alert('聚合运算失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 执行排序
  const executeSort = async () => {
    if (!sortField) {
      alert('请选择排序字段');
      return;
    }

    setLoading(true);
    try {
      window.dndDB.setCurrentProjectId(projectId);
      const sortedData = await window.dndDB.sortFormRecords(form.id, sortField, sortOrder);
      onSortResult({
        fieldId: sortField,
        order: sortOrder,
        data: sortedData
      });
    } catch (error) {
      alert('排序失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理聚合类型选择
  const handleTypeSelect = (type) => {
    if (type === 'sort') {
      setSelectedType(type);
      setShowSortFieldSelect(true);
    } else {
      setSelectedType(type);
      executeAggregation(type);
    }
  };

  // 处理排序字段选择
  const handleSortFieldSelect = () => {
    if (sortField) {
      executeSort();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <h3 className="text-lg font-semibold text-white">聚合运算</h3>
          <p className="text-sm text-blue-100 mt-1">请选择一种聚合运算类型</p>
        </div>

        {/* 内容区 */}
        <div className="p-6">
          {/* 聚合类型选择 */}
          {!showSortFieldSelect ? (
            <div className="grid grid-cols-2 gap-3">
              {aggregationTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  disabled={loading}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {numericFields.length > 0 ? `${numericFields.length} 个数值字段` : '暂无数值字段'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* 排序字段选择 */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  请选择排序字段
                </label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- 请选择 --</option>
                  {sortableFields.map(field => (
                    <option key={field.fieldId} value={field.fieldId}>
                      {field.fieldName} ({field.fieldType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  排序方式
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={sortOrder === 'asc'}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">升序</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={sortOrder === 'desc'}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">降序</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">排序说明</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 数值型字段：按数值大小排序</li>
                  <li>• 字符串字段：按字母序（英文）或拼音序（中文）排序</li>
                  <li>• 排序后可以点击右上角"另存为"按钮保存为新表单</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => {
              if (showSortFieldSelect) {
                setShowSortFieldSelect(false);
                setSelectedType('');
              } else {
                onClose();
              }
            }}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {showSortFieldSelect ? '返回' : '取消'}
          </button>
          {showSortFieldSelect && (
            <button
              onClick={handleSortFieldSelect}
              disabled={loading || !sortField}
              className={`px-4 py-2 rounded-lg text-white ${
                loading || !sortField
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '处理中...' : '执行排序'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

window.AggregationManager = AggregationManager;
