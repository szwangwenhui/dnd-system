// 流程选择器组件 - 用于多项选择方式
// 监听 showFlowSelection 事件，显示选择界面，收集用户选择后执行流程
// 支持三种形式：勾选框、按钮组、级联下拉

function FlowSelectionRenderer({ projectId }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectionConfig, setSelectionConfig] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [cascadeData, setCascadeData] = React.useState({});
  const [selected, setSelected] = React.useState([]);
  const [cascadeSelected, setCascadeSelected] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // 监听显示选择器事件
  React.useEffect(() => {
    const handleShowSelection = async (event) => {
      const config = event.detail;
      setSelectionConfig(config);
      setSelected([]);
      setCascadeSelected({});
      setIsOpen(true);

      // 加载选项数据
      await loadOptions(config);
    };

    window.addEventListener('showFlowSelection', handleShowSelection);
    return () => window.removeEventListener('showFlowSelection', handleShowSelection);
  }, [projectId]);

  // 加载选项
  const loadOptions = async (config) => {
    if (!config.attrTableId || !window.dndDB) return;

    setLoading(true);
    try {
      // 获取属性表数据
      const tableData = await window.dndDB.getFormDataList(projectId, config.attrTableId);

      if (config.selectStyle === 'cascade') {
        // 级联下拉：构建层级数据
        const cascadeInfo = buildCascadeData(tableData, config);
        setCascadeData(cascadeInfo);
        setOptions([]);
      } else {
        // 单级选择：提取字段的所有取值
        const fieldId = config.attrFieldId;
        const uniqueValues = [...new Set(tableData.map(item => item[fieldId]).filter(Boolean))];
        const optionList = uniqueValues.map(value => ({
          id: value,
          label: value,
          value: value
        }));
        setOptions(optionList);
        setCascadeData({});
      }
    } catch (error) {
      console.error('加载选项失败:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 构建级联数据
  const buildCascadeData = (tableData, config) => {
    // 获取字段列表（从起始到结束）
    const allFields = []; // 需要从配置中获取字段顺序
    
    // 简化处理：假设 cascadeFromField 和 cascadeToField 之间的字段是连续的
    // 实际使用时需要根据属性表的结构来处理
    const result = {
      levels: [],
      data: tableData
    };

    // 提取第一级的唯一值
    if (config.cascadeFromField) {
      const firstLevelValues = [...new Set(tableData.map(item => item[config.cascadeFromField]).filter(Boolean))];
      result.levels.push({
        fieldId: config.cascadeFromField,
        fieldName: config.cascadeFromFieldName,
        options: firstLevelValues.map(v => ({ id: v, label: v, value: v }))
      });
    }

    // 如果有结束字段且不同于起始字段，添加更多级别
    if (config.cascadeToField && config.cascadeToField !== config.cascadeFromField) {
      // 这里需要根据实际的属性表结构来动态构建
      // 简化处理：假设只有两级
      result.levels.push({
        fieldId: config.cascadeToField,
        fieldName: config.cascadeToFieldName,
        options: [] // 根据上一级选择动态加载
      });
    }

    return result;
  };

  // 获取级联下一级的选项
  const getCascadeOptions = (levelIndex) => {
    if (!cascadeData.levels || levelIndex >= cascadeData.levels.length) return [];
    
    const level = cascadeData.levels[levelIndex];
    
    if (levelIndex === 0) {
      return level.options;
    }

    // 根据上一级的选择过滤
    const prevLevelField = cascadeData.levels[levelIndex - 1]?.fieldId;
    const prevValue = cascadeSelected[prevLevelField];
    
    if (!prevValue) return [];

    const filteredData = cascadeData.data.filter(item => item[prevLevelField] === prevValue);
    const currentField = level.fieldId;
    const uniqueValues = [...new Set(filteredData.map(item => item[currentField]).filter(Boolean))];
    
    return uniqueValues.map(v => ({ id: v, label: v, value: v }));
  };

  // 处理单选/多选
  const handleSelect = (option) => {
    if (selectionConfig?.selectMode === 'multiple') {
      // 多选
      setSelected(prev => {
        const exists = prev.find(s => s.id === option.id);
        if (exists) {
          return prev.filter(s => s.id !== option.id);
        } else {
          return [...prev, option];
        }
      });
    } else {
      // 单选
      setSelected([option]);
      
      // 如果是按钮组且单选，直接提交
      if (selectionConfig?.selectStyle === 'buttons') {
        handleSubmitWithSelection([option]);
      }
    }
  };

  // 处理级联选择
  const handleCascadeSelect = (levelIndex, option) => {
    const level = cascadeData.levels[levelIndex];
    const fieldId = level.fieldId;
    
    // 更新选择
    setCascadeSelected(prev => {
      const newSelected = { ...prev, [fieldId]: option.value };
      // 清除后续级别的选择
      for (let i = levelIndex + 1; i < cascadeData.levels.length; i++) {
        delete newSelected[cascadeData.levels[i].fieldId];
      }
      return newSelected;
    });
  };

  // 提交选择
  const handleSubmit = () => {
    handleSubmitWithSelection(selected);
  };

  const handleSubmitWithSelection = async (selectionData) => {
    if (!selectionConfig) return;

    setSubmitting(true);
    try {
      let params;
      
      if (selectionConfig.selectStyle === 'cascade') {
        // 级联下拉的结果
        params = { selection: cascadeSelected };
      } else if (selectionConfig.selectMode === 'multiple') {
        // 多选结果
        params = { selection: selectionData };
      } else {
        // 单选结果
        params = { selection: selectionData[0] || null };
      }

      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: selectionConfig.flowId,
          flowName: selectionConfig.flowName,
          params: params,
          context: selectionConfig.context,
          showLoading: selectionConfig.showLoading,
          showResult: selectionConfig.showResult
        }
      }));

      setIsOpen(false);
    } catch (error) {
      console.error('执行流程失败:', error);
      alert('执行失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 关闭选择器
  const handleClose = () => {
    setIsOpen(false);
    setSelectionConfig(null);
    setSelected([]);
    setCascadeSelected({});
  };

  // 检查是否选中
  const isSelected = (option) => {
    return selected.some(s => s.id === option.id);
  };

  // 渲染勾选框形式
  const renderCheckboxStyle = () => (
    <div className="space-y-2">
      {options.map(option => (
        <label
          key={option.id}
          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
            isSelected(option)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleSelect(option)}
        >
          <input
            type={selectionConfig?.selectMode === 'multiple' ? 'checkbox' : 'radio'}
            checked={isSelected(option)}
            onChange={() => {}}
            className="w-4 h-4 text-blue-600 mr-3"
          />
          <span className="text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );

  // 渲染按钮组形式
  const renderButtonsStyle = () => (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option.id}
          onClick={() => handleSelect(option)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            isSelected(option)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  // 渲染级联下拉形式
  const renderCascadeStyle = () => (
    <div className="space-y-4">
      {cascadeData.levels?.map((level, index) => (
        <div key={level.fieldId}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {level.fieldName || `第${index + 1}级`}
          </label>
          <select
            value={cascadeSelected[level.fieldId] || ''}
            onChange={(e) => {
              const option = getCascadeOptions(index).find(o => o.value === e.target.value);
              if (option) {
                handleCascadeSelect(index, option);
              }
            }}
            disabled={index > 0 && !cascadeSelected[cascadeData.levels[index - 1]?.fieldId]}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">-- 请选择 --</option>
            {getCascadeOptions(index).map(opt => (
              <option key={opt.id} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  // 渲染选择内容
  const renderSelectionContent = () => {
    if (loading) {
      return <div className="text-center py-8 text-gray-500">加载中...</div>;
    }

    if (selectionConfig?.selectStyle === 'cascade') {
      if (!cascadeData.levels || cascadeData.levels.length === 0) {
        return <div className="text-center py-8 text-gray-500">暂无选项</div>;
      }
      return renderCascadeStyle();
    }

    if (options.length === 0) {
      return <div className="text-center py-8 text-gray-500">暂无选项</div>;
    }

    switch (selectionConfig?.selectStyle) {
      case 'buttons':
        return renderButtonsStyle();
      case 'checkbox':
      default:
        return renderCheckboxStyle();
    }
  };

  // 获取选择摘要
  const getSelectionSummary = () => {
    if (selectionConfig?.selectStyle === 'cascade') {
      const values = Object.values(cascadeSelected).filter(Boolean);
      return values.length > 0 ? values.join(' → ') : '未选择';
    }
    
    if (selected.length === 0) return '未选择';
    return selected.map(s => s.label).join(', ');
  };

  // 判断是否可以提交
  const canSubmit = () => {
    if (selectionConfig?.selectStyle === 'cascade') {
      // 级联下拉：至少选择到最后一级
      const lastLevel = cascadeData.levels?.[cascadeData.levels.length - 1];
      return lastLevel && cascadeSelected[lastLevel.fieldId];
    }
    return selected.length > 0;
  };

  if (!isOpen) return null;

  // 按钮组单选模式不需要确认按钮，直接点击即执行
  const needConfirmButton = selectionConfig?.selectStyle !== 'buttons' || selectionConfig?.selectMode === 'multiple';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {selectionConfig?.selectMode === 'multiple' ? '请选择（多选）' : '请选择'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectionConfig?.attrFieldName || selectionConfig?.attrTableName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 选择内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderSelectionContent()}
        </div>

        {/* 已选择提示 */}
        {(selected.length > 0 || Object.keys(cascadeSelected).length > 0) && (
          <div className="px-6 py-2 bg-blue-50 border-t border-blue-100">
            <div className="text-sm text-blue-700">
              <span className="font-medium">已选择：</span>
              {getSelectionSummary()}
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        {needConfirmButton && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading || !canSubmit()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {submitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              确定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.FlowSelectionRenderer = FlowSelectionRenderer;
