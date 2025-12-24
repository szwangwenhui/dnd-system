// 中间变量选择器组件
// 用途：
// 1. 产出变量时：显示系统分配的变量ID，允许填写描述名称
// 2. 使用变量时：显示变量列表供选择，带有来源信息

function VariableSelector({ 
  projectId,
  flowId,
  flowName,
  nodeId,
  mode = 'select',  // 'create' = 创建新变量, 'select' = 选择已有变量
  value,            // 当前选中的变量ID
  onChange,         // 变量变化回调
  sourceNodeType,   // 产出变量时的节点类型（create模式）
  sourceFormId,     // 产出变量时的来源表单ID（如果是读取节点）
  sourceFormName,   // 产出变量时的来源表单名称
  dataType,         // 数据类型：array/object/value
  filterSourceTypes = [], // 筛选变量来源类型（select模式）
  label = '变量',
  required = false
}) {
  const [variables, setVariables] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [variableName, setVariableName] = React.useState('');
  const [selectedVariable, setSelectedVariable] = React.useState(null);

  // 加载变量列表（select模式）
  React.useEffect(() => {
    if (mode === 'select' && projectId) {
      loadVariables();
    }
  }, [mode, projectId, filterSourceTypes.join(',')]);

  // 加载当前选中的变量信息
  React.useEffect(() => {
    if (value && projectId) {
      loadSelectedVariable();
    }
  }, [value, projectId]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      let vars;
      if (filterSourceTypes.length > 0) {
        vars = await window.dndDB.getVariablesBySourceType(projectId, filterSourceTypes);
      } else {
        vars = await window.dndDB.getVariables(projectId);
      }
      setVariables(vars);
    } catch (error) {
      console.error('加载变量列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedVariable = async () => {
    try {
      const variable = await window.dndDB.getVariableById(projectId, value);
      setSelectedVariable(variable);
      if (variable && mode === 'create') {
        setVariableName(variable.name || '');
      }
    } catch (error) {
      console.error('加载变量信息失败:', error);
    }
  };

  // 创建新变量
  const handleCreateVariable = async () => {
    if (!projectId || !flowId || !nodeId) {
      console.error('缺少必要参数');
      return;
    }

    try {
      const newVariable = await window.dndDB.addVariable(projectId, {
        name: variableName,
        sourceNodeId: nodeId,
        sourceNodeType: sourceNodeType,
        sourceFormId: sourceFormId,
        sourceFormName: sourceFormName,
        dataType: dataType,
        flowId: flowId,
        flowName: flowName
      });

      setSelectedVariable(newVariable);
      onChange(newVariable.id, newVariable);
      console.log('变量创建成功:', newVariable);
    } catch (error) {
      console.error('创建变量失败:', error);
      alert('创建变量失败: ' + error.message);
    }
  };

  // 更新变量描述名称
  const handleUpdateVariableName = async () => {
    if (!value || !projectId) return;

    try {
      const updated = await window.dndDB.updateVariable(projectId, value, {
        name: variableName
      });
      setSelectedVariable(updated);
      onChange(value, updated);
    } catch (error) {
      console.error('更新变量名称失败:', error);
    }
  };

  // 选择变量
  const handleSelectVariable = async (variableId) => {
    if (!variableId) {
      setSelectedVariable(null);
      onChange(null, null);
      return;
    }

    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setSelectedVariable(variable);
      
      // 记录变量使用
      if (nodeId && flowId) {
        await window.dndDB.addVariableUsage(projectId, variableId, nodeId, flowId);
      }
      
      onChange(variableId, variable);
    } catch (error) {
      console.error('选择变量失败:', error);
    }
  };

  // 获取数据类型显示文本
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '多条记录';
      case 'object': return '单条记录';
      case 'value': return '单值';
      default: return '未知';
    }
  };

  // 获取来源类型显示文本
  const getSourceTypeText = (type) => {
    switch (type) {
      case 'read': return '读取节点';
      case 'calculate': return '计算节点';
      case 'aggregate': return '聚合节点';
      default: return type || '未知';
    }
  };

  // 创建模式 - 显示系统分配的变量ID和描述名称输入框
  if (mode === 'create') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        {selectedVariable ? (
          // 已有变量，显示信息和编辑
          <div className="bg-gray-700 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">变量ID</span>
              <span className="font-mono text-blue-400">{selectedVariable.id}</span>
            </div>
            <div>
              <span className="text-sm text-gray-400 block mb-1">描述名称（可选）</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  placeholder="例如：读取的用户数据"
                  className="flex-1 px-3 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                />
                <button
                  onClick={handleUpdateVariableName}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  保存
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              类型: {getDataTypeText(selectedVariable.dataType)}
              {selectedVariable.sourceFormName && ` | 来源: ${selectedVariable.sourceFormName}`}
            </div>
          </div>
        ) : (
          // 没有变量，显示创建按钮
          <div className="bg-gray-700 rounded p-3 space-y-2">
            <div>
              <span className="text-sm text-gray-400 block mb-1">描述名称（可选）</span>
              <input
                type="text"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                placeholder="例如：读取的用户数据"
                className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm text-white"
              />
            </div>
            <button
              onClick={handleCreateVariable}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>创建输出变量</span>
            </button>
            <div className="text-xs text-gray-500">
              系统将自动分配变量ID
            </div>
          </div>
        )}
      </div>
    );
  }

  // 选择模式 - 显示变量列表供选择
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {loading ? (
        <div className="text-sm text-gray-400">加载中...</div>
      ) : variables.length === 0 ? (
        <div className="bg-gray-700 rounded p-3 text-sm text-gray-400 text-center">
          暂无可用变量
          <div className="text-xs mt-1">请先在读取/计算节点中创建变量</div>
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={value || ''}
            onChange={(e) => handleSelectVariable(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          >
            <option value="">-- 请选择变量 --</option>
            {variables.map(v => (
              <option key={v.id} value={v.id}>
                {v.id} {v.name ? `(${v.name})` : ''} - {getSourceTypeText(v.sourceNodeType)}
              </option>
            ))}
          </select>

          {/* 选中变量后显示详情 */}
          {selectedVariable && (
            <div className="bg-gray-700 rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">变量ID</span>
                <span className="font-mono text-blue-400">{selectedVariable.id}</span>
              </div>
              {selectedVariable.name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">描述</span>
                  <span className="text-white">{selectedVariable.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">数据类型</span>
                <span className="text-white">{getDataTypeText(selectedVariable.dataType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">来源</span>
                <span className="text-white">{getSourceTypeText(selectedVariable.sourceNodeType)}</span>
              </div>
              {selectedVariable.sourceFormName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">来源表单</span>
                  <span className="text-white">{selectedVariable.sourceFormName}</span>
                </div>
              )}
              {selectedVariable.flowName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">所属流程</span>
                  <span className="text-white">{selectedVariable.flowName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 导出到全局
window.VariableSelector = VariableSelector;
