/**
 * 统计模块 - 检索筛选面板组件
 * 提供数据检索和筛选功能
 */

function SearchFilterPanel({ 
  projectId, sourceFormId, sourceType, fields, forms, statistics, filters, onFiltersChange 
}) {
  const [sourceData, setSourceData] = React.useState([]);
  const [fieldUniqueValues, setFieldUniqueValues] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [previewCount, setPreviewCount] = React.useState(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewData, setPreviewData] = React.useState([]);
  const [expandedFilters, setExpandedFilters] = React.useState({});

  // 加载源数据
  React.useEffect(() => {
    if (sourceFormId) {
      loadSourceData();
    }
  }, [sourceFormId, sourceType]);

  // 当过滤条件变化时，更新预览计数
  React.useEffect(() => {
    if (sourceData.length > 0) {
      calculatePreviewCount();
    }
  }, [filters, sourceData]);

  const loadSourceData = async () => {
    setLoading(true);
    try {
      let data = [];
      
      if (sourceType === '统计表') {
        const stat = statistics.find(s => s.id === sourceFormId);
        data = stat?.data || [];
      } else {
        data = await window.dndDB.getFormDataList(projectId, sourceFormId);
      }
      
      setSourceData(data || []);
      
      // 计算每个字段的唯一值
      const uniqueValues = {};
      const sourceFields = getSourceFields();
      
      sourceFields.forEach(field => {
        const values = new Set();
        (data || []).forEach(record => {
          const value = record[field.id];
          if (value !== null && value !== undefined && value !== '') {
            values.add(value);
          }
        });
        uniqueValues[field.id] = Array.from(values).sort();
      });
      
      setFieldUniqueValues(uniqueValues);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  // 获取源字段列表
  const getSourceFields = () => {
    if (sourceType === '统计表') {
      const stat = statistics.find(s => s.id === sourceFormId);
      if (!stat || !stat.data || stat.data.length === 0) return [];
      
      return Object.keys(stat.data[0])
        .filter(key => key !== 'id' && key !== 'createdAt')
        .map(key => ({
          id: key,
          name: key,
          type: typeof stat.data[0][key] === 'number' ? '数值' : '文本',
          nature: '基础字段'
        }));
    }
    
    const form = forms.find(f => f.id === sourceFormId);
    if (!form || !form.structure || !form.structure.fields) return [];
    
    return form.structure.fields.map(sf => {
      const fieldInfo = fields.find(f => f.id === sf.fieldId);
      return {
        id: sf.fieldId,
        name: fieldInfo?.name || sf.fieldId,
        type: fieldInfo?.type || '未知',
        nature: fieldInfo?.nature || '基础字段',
        attributeFormId: fieldInfo?.attributeFormId
      };
    });
  };

  // 计算预览计数
  const calculatePreviewCount = () => {
    if (!filters || filters.length === 0) {
      setPreviewCount(sourceData.length);
      return;
    }

    const filtered = applyFilters(sourceData, filters);
    setPreviewCount(filtered.length);
  };

  // 应用过滤条件
  const applyFilters = (data, filterList) => {
    if (!filterList || filterList.length === 0) return data;

    return data.filter(record => {
      return filterList.every(filter => {
        if (!filter.fieldId) return true;
        
        const value = record[filter.fieldId];
        
        if (filter.type === '指定') {
          if (!filter.values || filter.values.length === 0) return true;
          return filter.values.includes(value) || filter.values.includes(String(value));
        } else if (filter.type === '范围') {
          if (!filter.value && filter.value !== 0) return true;
          
          const numValue = Number(value);
          const filterValue = Number(filter.value);
          
          switch (filter.operator) {
            case '=': return value == filter.value || numValue === filterValue;
            case '≠': return value != filter.value && numValue !== filterValue;
            case '>': return numValue > filterValue;
            case '≥': return numValue >= filterValue;
            case '<': return numValue < filterValue;
            case '≤': return numValue <= filterValue;
            default: return true;
          }
        }
        
        return true;
      });
    });
  };

  // 预览数据
  const handlePreview = () => {
    const filtered = applyFilters(sourceData, filters);
    setPreviewData(filtered.slice(0, 10));
    setShowPreview(true);
  };

  // 添加条件
  const addFilter = () => {
    onFiltersChange([
      ...filters, 
      { 
        id: `filter-${Date.now()}`,
        fieldId: '', 
        fieldName: '',
        type: '指定', 
        values: [], 
        operator: '=', 
        value: '' 
      }
    ]);
  };

  // 删除条件
  const removeFilter = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  // 更新条件
  const updateFilter = (index, updates) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onFiltersChange(newFilters);
  };

  // 切换展开状态
  const toggleExpand = (filterId) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  // 获取字段信息
  const getFieldInfo = (fieldId) => {
    return getSourceFields().find(f => f.id === fieldId);
  };

  // 渲染指定检索的值选择器
  const renderSpecifyValueSelector = (filter, index) => {
    const fieldId = filter.fieldId;
    const uniqueValues = fieldUniqueValues[fieldId] || [];
    const selectedValues = filter.values || [];
    const isExpanded = expandedFilters[filter.id];

    if (uniqueValues.length === 0) {
      return <div className="text-sm text-gray-500 italic">该字段暂无数据</div>;
    }

    const displayValues = isExpanded ? uniqueValues : uniqueValues.slice(0, 10);
    const hasMore = uniqueValues.length > 10;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={() => updateFilter(index, { values: [...uniqueValues] })} className="text-xs text-blue-600 hover:text-blue-800">全选</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => updateFilter(index, { values: [] })} className="text-xs text-blue-600 hover:text-blue-800">清空</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => {
              const inverted = uniqueValues.filter(v => !selectedValues.includes(v));
              updateFilter(index, { values: inverted });
            }} className="text-xs text-blue-600 hover:text-blue-800">反选</button>
          </div>
          <span className="text-xs text-gray-500">已选 {selectedValues.length}/{uniqueValues.length}</span>
        </div>
        
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
          <div className="flex flex-wrap gap-2">
            {displayValues.map((value, vIndex) => (
              <label key={vIndex} className={`inline-flex items-center px-2 py-1 rounded cursor-pointer text-sm ${
                selectedValues.includes(value)
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={(e) => {
                    let newValues;
                    if (e.target.checked) {
                      newValues = [...selectedValues, value];
                    } else {
                      newValues = selectedValues.filter(v => v !== value);
                    }
                    updateFilter(index, { values: newValues });
                  }}
                  className="mr-1.5 h-3 w-3"
                />
                {String(value)}
              </label>
            ))}
          </div>
          
          {hasMore && (
            <button onClick={() => toggleExpand(filter.id)} className="mt-2 text-xs text-blue-600 hover:text-blue-800">
              {isExpanded ? '收起' : `显示全部 ${uniqueValues.length} 个值...`}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 渲染范围检索的值输入
  const renderRangeValueInput = (filter, index) => {
    const field = getFieldInfo(filter.fieldId);
    const isDateField = field && (field.type === '日期' || field.type === '时间' || field.type === '日期时间');

    return (
      <div className="flex items-center space-x-2">
        <select
          value={filter.operator}
          onChange={(e) => updateFilter(index, { operator: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="=">=（等于）</option>
          <option value="≠">≠（不等于）</option>
          <option value=">">＞（大于）</option>
          <option value="≥">≥（大于等于）</option>
          <option value="<">＜（小于）</option>
          <option value="≤">≤（小于等于）</option>
        </select>
        <input
          type={isDateField ? 'date' : 'text'}
          value={filter.value}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          placeholder={isDateField ? '' : '输入数值...'}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
    );
  };

  const sourceFields = getSourceFields();

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700">检索条件（可选）</label>
          <p className="text-xs text-gray-500 mt-1">通过检索条件筛选需要统计的数据范围</p>
        </div>
        <button onClick={addFilter} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center">
          <span className="mr-1">+</span>添加条件
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">正在加载数据...</span>
        </div>
      )}

      {/* 无条件提示 */}
      {!loading && filters.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <div className="text-gray-500">暂无检索条件</div>
          <div className="text-sm text-gray-400 mt-1">将使用全部 {sourceData.length} 条数据进行统计</div>
        </div>
      )}

      {/* 条件列表 */}
      {!loading && filters.length > 0 && (
        <div className="space-y-4">
          {filters.map((filter, index) => (
            <div key={filter.id || index} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              {/* 条件头部 */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">条件 {index + 1}</span>
                  
                  {/* 字段选择 */}
                  <select
                    value={filter.fieldId}
                    onChange={(e) => {
                      const selectedField = sourceFields.find(f => f.id === e.target.value);
                      updateFilter(index, { 
                        fieldId: e.target.value,
                        fieldName: selectedField?.name || '',
                        values: [],
                        value: ''
                      });
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">选择字段...</option>
                    {sourceFields.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                    ))}
                  </select>

                  {/* 检索类型选择 */}
                  {filter.fieldId && (
                    <select
                      value={filter.type}
                      onChange={(e) => updateFilter(index, { type: e.target.value, values: [], value: '' })}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="指定">指定检索</option>
                      <option value="范围">范围检索</option>
                    </select>
                  )}
                </div>
                
                <button onClick={() => removeFilter(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除条件">✕</button>
              </div>

              {/* 条件内容 */}
              {filter.fieldId && (
                <div className="px-4 py-3">
                  {filter.type === '指定' ? renderSpecifyValueSelector(filter, index) : renderRangeValueInput(filter, index)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 预览区域 */}
      {!loading && sourceData.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-700">
                <strong>检索结果：</strong>
                {previewCount !== null && (
                  <span>
                    符合条件 <span className="text-blue-900 font-bold">{previewCount}</span> 条 / 共 {sourceData.length} 条数据
                    {filters.length > 0 && previewCount < sourceData.length && (
                      <span className="text-blue-600 ml-2">（已过滤 {sourceData.length - previewCount} 条）</span>
                    )}
                  </span>
                )}
              </span>
            </div>
            <button onClick={handlePreview} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">预览数据</button>
          </div>
        </div>
      )}

      {/* 数据预览弹窗 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">数据预览（显示前10条）</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh]">
              {previewData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">没有符合条件的数据</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {sourceFields.slice(0, 8).map(field => (
                        <th key={field.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{field.name}</th>
                      ))}
                      {sourceFields.length > 8 && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">...</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {sourceFields.slice(0, 8).map(field => (
                          <td key={field.id} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {row[field.id] !== undefined ? String(row[field.id]) : '-'}
                          </td>
                        ))}
                        {sourceFields.length > 8 && <td className="px-4 py-2 text-sm text-gray-500">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {filters.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
          <strong>💡 提示：</strong>多个检索条件之间为 <span className="font-medium text-blue-600">AND（且）</span> 关系，即数据需要同时满足所有条件
        </div>
      )}
    </div>
  );
}

// 导出到全局
window.SearchFilterPanel = SearchFilterPanel;
