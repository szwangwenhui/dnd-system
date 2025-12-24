// 读取节点配置表单 - 重构版
// 支持：1.确定读取范围（横向选字段+竖向选记录）2.选择读取方式

function ReadNodeConfigForm({ config, onChange, projectId, flowId, flowName, nodeId, forms, fields, pages, blocks }) {
  const defaultConfig = {
    sourceType: 'form',
    // 页面输入框模式（保持兼容）
    pageSource: { 
      pageId: '', 
      pageName: '', 
      blockId: '', 
      blockName: '',
      formId: '',
      formName: '',
      fieldId: '',
      fieldName: '',
      fieldIds: [],
      fieldNames: []
    },
    // 后台表单模式（重构）
    formSource: {
      formId: '',
      formName: '',
      
      // ===== 第一步：确定读取范围 =====
      // 横向：选取字段
      selectedFields: [],  // [{fieldId, fieldName}]
      
      // 竖向：选取记录（三种方式可组合）
      rangeConditions: {
        // 指定主键
        primaryKeys: {
          enabled: false,
          values: []  // 主键值列表
        },
        // 离散属性
        discreteAttr: {
          enabled: false,
          attrTableId: '',
          attrTableName: '',
          selectedPaths: []  // [{id, levels: [{fieldId, fieldName, value}]}]
        },
        // 连续变量（分段）
        continuous: {
          enabled: false,
          fieldId: '',
          fieldName: '',
          segments: []  // [{id, min, max, selected}]
        }
      },
      
      // ===== 第二步：读取方式 =====
      readMode: 'batch',  // batch=整体读取, loop=逐条读取, cell=读取单元
      
      // 整体读取配置
      batchConfig: {
        maxCount: 1000,
        sortField: '',
        sortOrder: 'asc'
      },
      
      // 逐条读取配置
      loopConfig: {
        itemVariable: '$item',
        indexVariable: '$index'
      },
      
      // 读取单元配置
      cellConfig: {
        primaryKeySource: 'variable',
        primaryKeyVariable: '',
        targetFieldId: '',
        targetFieldName: ''
      },
      
      // 旧配置兼容
      primaryKey: {
        mode: 'static',
        staticValue: '',
        dynamicType: 'variable',
        dynamicValue: { variable: '', pageId: '', blockId: '', urlParam: '' }
      },
      conditions: [],
      cellField: ''
    },
    outputVar: '',
    outputVarName: ''
  };

  const [localConfig, setLocalConfig] = React.useState(() => {
    // 深度合并配置
    const merged = {
      ...defaultConfig,
      ...config,
      pageSource: { ...defaultConfig.pageSource, ...(config?.pageSource || {}) },
      formSource: { 
        ...defaultConfig.formSource, 
        ...(config?.formSource || {}),
        rangeConditions: {
          ...defaultConfig.formSource.rangeConditions,
          ...(config?.formSource?.rangeConditions || {}),
          primaryKeys: {
            ...defaultConfig.formSource.rangeConditions.primaryKeys,
            ...(config?.formSource?.rangeConditions?.primaryKeys || {})
          },
          discreteAttr: {
            ...defaultConfig.formSource.rangeConditions.discreteAttr,
            ...(config?.formSource?.rangeConditions?.discreteAttr || {})
          },
          continuous: {
            ...defaultConfig.formSource.rangeConditions.continuous,
            ...(config?.formSource?.rangeConditions?.continuous || {})
          }
        },
        batchConfig: {
          ...defaultConfig.formSource.batchConfig,
          ...(config?.formSource?.batchConfig || {})
        },
        loopConfig: {
          ...defaultConfig.formSource.loopConfig,
          ...(config?.formSource?.loopConfig || {})
        },
        cellConfig: {
          ...defaultConfig.formSource.cellConfig,
          ...(config?.formSource?.cellConfig || {})
        },
        primaryKey: { 
          ...defaultConfig.formSource.primaryKey, 
          ...(config?.formSource?.primaryKey || {}) 
        }
      }
    };
    return merged;
  });

  // 状态
  const [currentVariable, setCurrentVariable] = React.useState(null);
  const [variableName, setVariableName] = React.useState(config?.outputVarName || '');
  const [isCreatingVar, setIsCreatingVar] = React.useState(false);
  const [flowVariables, setFlowVariables] = React.useState([]);
  const [formData, setFormData] = React.useState([]);  // 表单数据（用于主键选择）
  const [attrTables, setAttrTables] = React.useState([]);  // 属性表列表
  const [attrTableData, setAttrTableData] = React.useState([]);  // 属性表数据
  const [attrTableFields, setAttrTableFields] = React.useState([]);  // 属性表字段

  // 加载流程变量
  React.useEffect(() => {
    if (projectId && flowId) {
      loadFlowVariables();
    }
  }, [projectId, flowId]);

  const loadFlowVariables = async () => {
    try {
      const allVars = await window.dndDB.getVariables(projectId);
      const vars = (allVars || []).filter(v => v.flowId === flowId);
      vars.push(
        { id: '$item', name: '当前项（循环）', dataType: 'object', isLoopVar: true },
        { id: '$index', name: '循环索引', dataType: 'number', isLoopVar: true }
      );
      setFlowVariables(vars);
    } catch (error) {
      console.error('加载流程变量失败:', error);
    }
  };

  // 加载已有变量信息
  React.useEffect(() => {
    if (localConfig.outputVar && projectId) {
      loadVariable();
    }
  }, [localConfig.outputVar, projectId]);

  const loadVariable = async () => {
    try {
      const variable = await window.dndDB.getVariableById(projectId, localConfig.outputVar);
      setCurrentVariable(variable);
      if (variable) {
        setVariableName(variable.name || '');
      }
    } catch (error) {
      console.error('加载变量失败:', error);
    }
  };

  // 加载属性表列表
  React.useEffect(() => {
    if (projectId && forms) {
      const attrForms = forms.filter(f => 
        f.type === '属性表单' || f.formType === 'attribute' || f.isAttributeTable
      );
      setAttrTables(attrForms);
    }
  }, [projectId, forms]);

  // 当选择表单后，加载表单数据（用于主键选择）
  React.useEffect(() => {
    const loadFormData = async () => {
      if (localConfig.formSource.formId && projectId) {
        try {
          const data = await window.dndDB.getFormDataList(projectId, localConfig.formSource.formId);
          setFormData(data || []);
        } catch (error) {
          console.error('加载表单数据失败:', error);
        }
      } else {
        setFormData([]);
      }
    };
    loadFormData();
  }, [projectId, localConfig.formSource.formId]);

  // 当选择属性表后，加载属性表数据和字段
  React.useEffect(() => {
    const loadAttrTableData = async () => {
      const attrTableId = localConfig.formSource.rangeConditions.discreteAttr.attrTableId;
      if (attrTableId && projectId) {
        try {
          const data = await window.dndDB.getFormDataList(projectId, attrTableId);
          setAttrTableData(data || []);
          
          // 获取属性表字段
          const attrTable = attrTables.find(t => t.id === attrTableId);
          if (attrTable && attrTable.structure) {
            const levelFields = attrTable.structure.levelFields || [];
            setAttrTableFields(levelFields.map(lf => ({
              fieldId: lf.fieldId,
              fieldName: fields?.find(f => f.id === lf.fieldId)?.name || lf.fieldId
            })));
          }
        } catch (error) {
          console.error('加载属性表数据失败:', error);
        }
      } else {
        setAttrTableData([]);
        setAttrTableFields([]);
      }
    };
    loadAttrTableData();
  }, [projectId, localConfig.formSource.rangeConditions.discreteAttr.attrTableId, attrTables]);

  // 更新配置
  const updateConfig = (path, value) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      onChange(newConfig);
      return newConfig;
    });
  };

  // 批量更新
  const updateConfigBatch = (updates) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      for (const { path, value } of updates) {
        const keys = path.split('.');
        let obj = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      }
      onChange(newConfig);
      return newConfig;
    });
  };

  // 获取选中表单的字段
  const getFormFields = (formId) => {
    if (!formId || !forms) return [];
    const form = forms.find(f => f.id === formId);
    if (!form || !form.structure) return [];
    
    const structFields = form.structure.fields || [];
    return structFields.map(sf => {
      const fieldDef = fields?.find(f => f.id === sf.fieldId);
      return {
        id: sf.fieldId,
        name: fieldDef?.name || sf.fieldId,
        type: fieldDef?.type || 'text'
      };
    });
  };

  // 获取主键字段
  const getPrimaryKeyField = () => {
    const formId = localConfig.formSource.formId;
    if (!formId || !forms) return null;
    const form = forms.find(f => f.id === formId);
    if (!form || !form.structure) return null;
    return form.structure.primaryKey || null;
  };

  // 获取主键值列表
  const getPrimaryKeyValues = () => {
    const pkField = getPrimaryKeyField();
    if (!pkField || !formData.length) return [];
    return formData.map(item => item[pkField]).filter(Boolean);
  };

  // 计算数据类型
  const getDataType = () => {
    if (localConfig.sourceType === 'page') {
      const fieldIds = localConfig.pageSource?.fieldIds || [];
      const fieldId = localConfig.pageSource?.fieldId;
      const fieldCount = fieldIds.length > 0 ? fieldIds.length : (fieldId ? 1 : 0);
      if (fieldCount > 1) return 'object';
      return 'value';
    }
    const readMode = localConfig.formSource?.readMode || 'batch';
    if (readMode === 'batch') return 'array';
    if (readMode === 'loop') return 'array';  // 逐条读取也是数组，只是处理方式不同
    if (readMode === 'cell') return 'value';
    return 'unknown';
  };

  const getDataTypeText = () => {
    const type = getDataType();
    switch (type) {
      case 'array': return '多条记录（数组）';
      case 'object': return '单条记录（对象）';
      case 'value': return '单个值';
      default: return '未知';
    }
  };

  // 创建新变量
  const handleCreateVariable = async () => {
    if (!projectId || !flowId || !nodeId) {
      alert('缺少必要参数，无法创建变量');
      return;
    }

    setIsCreatingVar(true);
    try {
      let formId, formName;
      if (localConfig.sourceType === 'page') {
        formId = localConfig.pageSource?.formId;
        formName = localConfig.pageSource?.formName;
      } else {
        formId = localConfig.formSource?.formId;
        formName = localConfig.formSource?.formName;
      }
      
      const newVariable = await window.dndDB.addVariable(projectId, {
        name: variableName,
        sourceNodeId: nodeId,
        sourceNodeType: 'read',
        sourceFormId: formId || null,
        sourceFormName: formName || null,
        dataType: getDataType(),
        flowId: flowId,
        flowName: flowName
      });

      setCurrentVariable(newVariable);
      updateConfig('outputVar', newVariable.id);
      updateConfig('outputVarName', variableName);
    } catch (error) {
      console.error('创建变量失败:', error);
      alert('创建变量失败: ' + error.message);
    } finally {
      setIsCreatingVar(false);
    }
  };

  // 更新变量名称
  const handleUpdateVariableName = async () => {
    if (!currentVariable || !projectId) return;
    
    try {
      let formId, formName;
      if (localConfig.sourceType === 'page') {
        formId = localConfig.pageSource?.formId;
        formName = localConfig.pageSource?.formName;
      } else {
        formId = localConfig.formSource?.formId;
        formName = localConfig.formSource?.formName;
      }
      
      await window.dndDB.updateVariable(projectId, currentVariable.id, {
        name: variableName,
        dataType: getDataType(),
        sourceFormId: formId || currentVariable.sourceFormId,
        sourceFormName: formName || currentVariable.sourceFormName
      });
      updateConfig('outputVarName', variableName);
      await loadVariable();
    } catch (error) {
      console.error('更新变量名称失败:', error);
    }
  };

  // 获取页面的区块
  const getPageBlocks = (pageId) => {
    if (!pageId || !blocks) return [];
    return blocks.filter(b => b.pageId === pageId);
  };

  // 当前表单字段
  const currentFormFields = getFormFields(localConfig.formSource.formId);

  // 切换字段选择
  const toggleFieldSelection = (fieldId, fieldName) => {
    const selected = localConfig.formSource.selectedFields || [];
    const exists = selected.find(f => f.fieldId === fieldId);
    
    let newSelected;
    if (exists) {
      newSelected = selected.filter(f => f.fieldId !== fieldId);
    } else {
      newSelected = [...selected, { fieldId, fieldName }];
    }
    
    updateConfig('formSource.selectedFields', newSelected);
  };

  // 检查字段是否选中
  const isFieldSelected = (fieldId) => {
    const selected = localConfig.formSource.selectedFields || [];
    return selected.some(f => f.fieldId === fieldId);
  };

  // 切换主键选择
  const togglePrimaryKeySelection = (pkValue) => {
    const values = localConfig.formSource.rangeConditions.primaryKeys.values || [];
    let newValues;
    if (values.includes(pkValue)) {
      newValues = values.filter(v => v !== pkValue);
    } else {
      newValues = [...values, pkValue];
    }
    updateConfig('formSource.rangeConditions.primaryKeys.values', newValues);
  };

  // 级联选择相关
  const [cascadeSelections, setCascadeSelections] = React.useState({});

  // 获取级联选项
  const getCascadeOptions = (levelIndex) => {
    if (!attrTableFields.length || levelIndex >= attrTableFields.length) return [];
    
    const currentField = attrTableFields[levelIndex];
    let filteredData = [...attrTableData];
    
    // 根据上级选择过滤
    for (let i = 0; i < levelIndex; i++) {
      const prevField = attrTableFields[i];
      const prevValue = cascadeSelections[prevField.fieldId];
      if (prevValue) {
        filteredData = filteredData.filter(item => item[prevField.fieldId] === prevValue);
      }
    }
    
    // 获取当前级别的唯一值
    const uniqueValues = [...new Set(filteredData.map(item => item[currentField.fieldId]).filter(Boolean))];
    return uniqueValues;
  };

  // 处理级联选择变化
  const handleCascadeChange = (levelIndex, value) => {
    const field = attrTableFields[levelIndex];
    const newSelections = { ...cascadeSelections };
    
    // 设置当前级别的值
    newSelections[field.fieldId] = value;
    
    // 清除后续级别的选择
    for (let i = levelIndex + 1; i < attrTableFields.length; i++) {
      delete newSelections[attrTableFields[i].fieldId];
    }
    
    setCascadeSelections(newSelections);
  };

  // 添加离散属性条件
  const addDiscreteCondition = () => {
    // 检查是否所有级别都已选择
    const allSelected = attrTableFields.every(f => cascadeSelections[f.fieldId]);
    if (!allSelected) {
      alert('请完成所有级别的选择');
      return;
    }
    
    const newPath = {
      id: Date.now(),
      levels: attrTableFields.map(f => ({
        fieldId: f.fieldId,
        fieldName: f.fieldName,
        value: cascadeSelections[f.fieldId]
      }))
    };
    
    const currentPaths = localConfig.formSource.rangeConditions.discreteAttr.selectedPaths || [];
    updateConfig('formSource.rangeConditions.discreteAttr.selectedPaths', [...currentPaths, newPath]);
    
    // 清空选择
    setCascadeSelections({});
  };

  // 删除离散属性条件
  const removeDiscreteCondition = (pathId) => {
    const currentPaths = localConfig.formSource.rangeConditions.discreteAttr.selectedPaths || [];
    updateConfig(
      'formSource.rangeConditions.discreteAttr.selectedPaths',
      currentPaths.filter(p => p.id !== pathId)
    );
  };

  // 添加分段
  const addSegment = () => {
    const segments = localConfig.formSource.rangeConditions.continuous.segments || [];
    const lastSegment = segments[segments.length - 1];
    const newMin = lastSegment ? lastSegment.max : 0;
    
    const newSegment = {
      id: Date.now(),
      min: newMin,
      max: newMin + 1000,
      selected: false
    };
    
    updateConfig('formSource.rangeConditions.continuous.segments', [...segments, newSegment]);
  };

  // 更新分段
  const updateSegment = (segmentId, updates) => {
    const segments = localConfig.formSource.rangeConditions.continuous.segments || [];
    const newSegments = segments.map(s => 
      s.id === segmentId ? { ...s, ...updates } : s
    );
    updateConfig('formSource.rangeConditions.continuous.segments', newSegments);
  };

  // 删除分段
  const removeSegment = (segmentId) => {
    const segments = localConfig.formSource.rangeConditions.continuous.segments || [];
    updateConfig(
      'formSource.rangeConditions.continuous.segments',
      segments.filter(s => s.id !== segmentId)
    );
  };

  return (
    <div className="space-y-4">
      {/* 数据来源类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">数据来源</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={localConfig.sourceType === 'form'}
              onChange={() => updateConfig('sourceType', 'form')}
              className="text-blue-500"
            />
            <span className="text-gray-200 text-sm">后台表单</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={localConfig.sourceType === 'page'}
              onChange={() => updateConfig('sourceType', 'page')}
              className="text-blue-500"
            />
            <span className="text-gray-200 text-sm">页面输入框</span>
          </label>
        </div>
      </div>

      {/* ===== 页面输入框模式（保持原有逻辑） ===== */}
      {localConfig.sourceType === 'page' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">页面输入框配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">选择页面</label>
            <select
              value={localConfig.pageSource.pageId}
              onChange={(e) => {
                const page = pages?.find(p => p.id === e.target.value);
                updateConfigBatch([
                  { path: 'pageSource.pageId', value: e.target.value },
                  { path: 'pageSource.pageName', value: page?.name || '' },
                  { path: 'pageSource.blockId', value: '' },
                  { path: 'pageSource.blockName', value: '' },
                  { path: 'pageSource.formId', value: '' },
                  { path: 'pageSource.formName', value: '' },
                  { path: 'pageSource.fieldIds', value: [] },
                  { path: 'pageSource.fieldNames', value: [] }
                ]);
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
            >
              <option value="">-- 选择页面 --</option>
              {pages?.map(p => (
                <option key={p.id} value={p.id}>[{p.roleName}] {p.name}</option>
              ))}
            </select>
          </div>

          {localConfig.pageSource.pageId && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">选择区块</label>
              <select
                value={localConfig.pageSource.blockId}
                onChange={(e) => {
                  const block = getPageBlocks(localConfig.pageSource.pageId).find(b => b.id === e.target.value);
                  const targetFormId = block?.targetFormId || block?.formId || '';
                  const targetForm = forms?.find(f => f.id === targetFormId);
                  
                  updateConfigBatch([
                    { path: 'pageSource.blockId', value: e.target.value },
                    { path: 'pageSource.blockName', value: block?.name || '' },
                    { path: 'pageSource.formId', value: targetFormId },
                    { path: 'pageSource.formName', value: targetForm?.name || '' },
                    { path: 'pageSource.fieldIds', value: [] },
                    { path: 'pageSource.fieldNames', value: [] }
                  ]);
                }}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
              >
                <option value="">-- 选择区块 --</option>
                {getPageBlocks(localConfig.pageSource.pageId).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id} {b.name ? `(${b.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {localConfig.pageSource.blockId && localConfig.pageSource.formId && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">选择字段（可多选）</label>
              <div className="bg-gray-600 rounded p-2 max-h-40 overflow-y-auto border border-gray-500">
                {getFormFields(localConfig.pageSource.formId).map(f => {
                  const selected = (localConfig.pageSource.fieldIds || []).includes(f.id);
                  return (
                    <label key={f.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-500/30 px-1 rounded">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const fieldIds = localConfig.pageSource.fieldIds || [];
                          const fieldNames = localConfig.pageSource.fieldNames || [];
                          let newIds, newNames;
                          
                          if (selected) {
                            const idx = fieldIds.indexOf(f.id);
                            newIds = fieldIds.filter((_, i) => i !== idx);
                            newNames = fieldNames.filter((_, i) => i !== idx);
                          } else {
                            newIds = [...fieldIds, f.id];
                            newNames = [...fieldNames, f.name];
                          }
                          
                          updateConfigBatch([
                            { path: 'pageSource.fieldIds', value: newIds },
                            { path: 'pageSource.fieldNames', value: newNames }
                          ]);
                        }}
                        className="text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-200">{f.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 后台表单模式（重构） ===== */}
      {localConfig.sourceType === 'form' && (
        <div className="space-y-4">
          {/* 选择表单 */}
          <div className="bg-gray-700 rounded-lg p-4">
            <label className="block text-xs text-gray-400 mb-1">选择表单</label>
            <select
              value={localConfig.formSource.formId}
              onChange={(e) => {
                const form = forms?.find(f => f.id === e.target.value);
                updateConfigBatch([
                  { path: 'formSource.formId', value: e.target.value },
                  { path: 'formSource.formName', value: form?.name || '' },
                  { path: 'formSource.selectedFields', value: [] },
                  { path: 'formSource.rangeConditions.primaryKeys.values', value: [] }
                ]);
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
            >
              <option value="">-- 选择表单 --</option>
              {forms?.filter(f => f.type !== '属性表单').map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {localConfig.formSource.formId && (
            <>
              {/* ===== 第一步：确定读取范围 ===== */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium text-blue-400 flex items-center">
                  <span className="mr-2">📊</span>
                  第一步：确定读取范围
                </h4>

                {/* 横向：选取字段 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    横向：选取字段（多选）
                  </label>
                  <div className="bg-gray-600 rounded p-2 max-h-40 overflow-y-auto border border-gray-500">
                    {currentFormFields.map(f => (
                      <label key={f.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-500/30 px-1 rounded">
                        <input
                          type="checkbox"
                          checked={isFieldSelected(f.id)}
                          onChange={() => toggleFieldSelection(f.id, f.name)}
                          className="text-blue-500 rounded"
                        />
                        <span className="text-sm text-gray-200">{f.name}</span>
                        <span className="text-xs text-gray-500">({f.id})</span>
                      </label>
                    ))}
                  </div>
                  {(localConfig.formSource.selectedFields || []).length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      已选 {localConfig.formSource.selectedFields.length} 个字段
                    </div>
                  )}
                </div>

                {/* 竖向：选取记录 */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-400">
                    竖向：选取记录（条件可叠加）
                  </label>

                  {/* 指定主键选取 */}
                  <div className="border border-gray-600 rounded p-3">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={localConfig.formSource.rangeConditions.primaryKeys.enabled}
                        onChange={(e) => updateConfig('formSource.rangeConditions.primaryKeys.enabled', e.target.checked)}
                        className="text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-200">指定主键选取</span>
                    </label>
                    
                    {localConfig.formSource.rangeConditions.primaryKeys.enabled && (
                      <div className="ml-6">
                        <div className="bg-gray-600 rounded p-2 max-h-32 overflow-y-auto">
                          {getPrimaryKeyValues().length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-2">暂无数据</div>
                          ) : (
                            getPrimaryKeyValues().map(pk => (
                              <label key={pk} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-500/30 px-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={(localConfig.formSource.rangeConditions.primaryKeys.values || []).includes(pk)}
                                  onChange={() => togglePrimaryKeySelection(pk)}
                                  className="text-green-500 rounded"
                                />
                                <span className="text-sm text-gray-200">{pk}</span>
                              </label>
                            ))
                          )}
                        </div>
                        {(localConfig.formSource.rangeConditions.primaryKeys.values || []).length > 0 && (
                          <div className="text-xs text-green-400 mt-1">
                            已选 {localConfig.formSource.rangeConditions.primaryKeys.values.length} 个主键
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 离散属性选取 */}
                  <div className="border border-gray-600 rounded p-3">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={localConfig.formSource.rangeConditions.discreteAttr.enabled}
                        onChange={(e) => updateConfig('formSource.rangeConditions.discreteAttr.enabled', e.target.checked)}
                        className="text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-200">离散属性选取</span>
                    </label>
                    
                    {localConfig.formSource.rangeConditions.discreteAttr.enabled && (
                      <div className="ml-6 space-y-2">
                        {/* 选择属性表 */}
                        <select
                          value={localConfig.formSource.rangeConditions.discreteAttr.attrTableId}
                          onChange={(e) => {
                            const table = attrTables.find(t => t.id === e.target.value);
                            updateConfigBatch([
                              { path: 'formSource.rangeConditions.discreteAttr.attrTableId', value: e.target.value },
                              { path: 'formSource.rangeConditions.discreteAttr.attrTableName', value: table?.name || '' },
                              { path: 'formSource.rangeConditions.discreteAttr.selectedPaths', value: [] }
                            ]);
                            setCascadeSelections({});
                          }}
                          className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                        >
                          <option value="">-- 选择属性表 --</option>
                          {attrTables.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>

                        {/* 级联下拉选择 */}
                        {localConfig.formSource.rangeConditions.discreteAttr.attrTableId && attrTableFields.length > 0 && (
                          <div className="space-y-2">
                            {attrTableFields.map((field, index) => (
                              <div key={field.fieldId}>
                                <label className="block text-xs text-gray-500 mb-1">{field.fieldName}</label>
                                <select
                                  value={cascadeSelections[field.fieldId] || ''}
                                  onChange={(e) => handleCascadeChange(index, e.target.value)}
                                  disabled={index > 0 && !cascadeSelections[attrTableFields[index - 1]?.fieldId]}
                                  className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500 disabled:opacity-50"
                                >
                                  <option value="">-- 选择 --</option>
                                  {getCascadeOptions(index).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                            
                            <button
                              onClick={addDiscreteCondition}
                              className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white"
                            >
                              + 添加条件
                            </button>
                          </div>
                        )}

                        {/* 已添加的条件 */}
                        {(localConfig.formSource.rangeConditions.discreteAttr.selectedPaths || []).length > 0 && (
                          <div className="space-y-1 mt-2">
                            <div className="text-xs text-gray-400">已添加条件：</div>
                            {localConfig.formSource.rangeConditions.discreteAttr.selectedPaths.map(path => (
                              <div key={path.id} className="flex items-center justify-between bg-purple-900/30 rounded px-2 py-1">
                                <span className="text-xs text-purple-300">
                                  {path.levels.map(l => l.value).join(' → ')}
                                </span>
                                <button
                                  onClick={() => removeDiscreteCondition(path.id)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 连续变量选取 */}
                  <div className="border border-gray-600 rounded p-3">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={localConfig.formSource.rangeConditions.continuous.enabled}
                        onChange={(e) => updateConfig('formSource.rangeConditions.continuous.enabled', e.target.checked)}
                        className="text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-200">连续变量选取</span>
                    </label>
                    
                    {localConfig.formSource.rangeConditions.continuous.enabled && (
                      <div className="ml-6 space-y-2">
                        {/* 选择划分字段 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">划分字段</label>
                          <select
                            value={localConfig.formSource.rangeConditions.continuous.fieldId}
                            onChange={(e) => {
                              const field = currentFormFields.find(f => f.id === e.target.value);
                              updateConfigBatch([
                                { path: 'formSource.rangeConditions.continuous.fieldId', value: e.target.value },
                                { path: 'formSource.rangeConditions.continuous.fieldName', value: field?.name || '' }
                              ]);
                            }}
                            className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                          >
                            <option value="">-- 选择字段 --</option>
                            {currentFormFields.filter(f => f.type === 'number' || f.type === 'integer' || f.type === 'decimal').map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* 分段配置 */}
                        {localConfig.formSource.rangeConditions.continuous.fieldId && (
                          <div className="space-y-2">
                            {(localConfig.formSource.rangeConditions.continuous.segments || []).map(segment => (
                              <div key={segment.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={segment.selected}
                                  onChange={(e) => updateSegment(segment.id, { selected: e.target.checked })}
                                  className="text-orange-500 rounded"
                                />
                                <input
                                  type="number"
                                  value={segment.min}
                                  onChange={(e) => updateSegment(segment.id, { min: parseFloat(e.target.value) || 0 })}
                                  className="w-20 bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                                />
                                <span className="text-gray-400">~</span>
                                <input
                                  type="number"
                                  value={segment.max}
                                  onChange={(e) => updateSegment(segment.id, { max: parseFloat(e.target.value) || 0 })}
                                  className="w-20 bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                                />
                                <button
                                  onClick={() => removeSegment(segment.id)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            
                            <button
                              onClick={addSegment}
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm text-white"
                            >
                              + 添加分段
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== 第二步：选择读取方式 ===== */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-green-400 flex items-center">
                  <span className="mr-2">⚙️</span>
                  第二步：选择读取方式
                </h4>

                <div className="space-y-2">
                  {/* 整体读取 */}
                  <label className="flex items-start space-x-2 cursor-pointer p-2 rounded border border-gray-600 hover:bg-gray-600/50">
                    <input
                      type="radio"
                      checked={localConfig.formSource.readMode === 'batch'}
                      onChange={() => updateConfig('formSource.readMode', 'batch')}
                      className="text-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm text-gray-200">整体读取</span>
                      <p className="text-xs text-gray-500">一次返回所有符合条件的记录</p>
                    </div>
                  </label>

                  {/* 逐条读取 */}
                  <label className="flex items-start space-x-2 cursor-pointer p-2 rounded border border-gray-600 hover:bg-gray-600/50">
                    <input
                      type="radio"
                      checked={localConfig.formSource.readMode === 'loop'}
                      onChange={() => updateConfig('formSource.readMode', 'loop')}
                      className="text-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm text-gray-200">逐条读取</span>
                      <p className="text-xs text-gray-500">循环处理每条记录，$item 指向当前记录</p>
                    </div>
                  </label>

                  {/* 读取单元 */}
                  <label className="flex items-start space-x-2 cursor-pointer p-2 rounded border border-gray-600 hover:bg-gray-600/50">
                    <input
                      type="radio"
                      checked={localConfig.formSource.readMode === 'cell'}
                      onChange={() => updateConfig('formSource.readMode', 'cell')}
                      className="text-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm text-gray-200">读取单元</span>
                      <p className="text-xs text-gray-500">在范围内，动态读取某条记录的某个字段值</p>
                    </div>
                  </label>
                </div>

                {/* 整体读取配置 */}
                {localConfig.formSource.readMode === 'batch' && (
                  <div className="ml-6 space-y-2 border-l-2 border-blue-500 pl-3">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">最大读取条数</label>
                        <input
                          type="number"
                          value={localConfig.formSource.batchConfig.maxCount}
                          onChange={(e) => updateConfig('formSource.batchConfig.maxCount', parseInt(e.target.value) || 1000)}
                          min="1"
                          max="10000"
                          className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">排序字段</label>
                        <select
                          value={localConfig.formSource.batchConfig.sortField}
                          onChange={(e) => updateConfig('formSource.batchConfig.sortField', e.target.value)}
                          className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                        >
                          <option value="">不排序</option>
                          {currentFormFields.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      {localConfig.formSource.batchConfig.sortField && (
                        <div className="w-24">
                          <label className="block text-xs text-gray-400 mb-1">顺序</label>
                          <select
                            value={localConfig.formSource.batchConfig.sortOrder}
                            onChange={(e) => updateConfig('formSource.batchConfig.sortOrder', e.target.value)}
                            className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                          >
                            <option value="asc">升序</option>
                            <option value="desc">降序</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 读取单元配置 */}
                {localConfig.formSource.readMode === 'cell' && (
                  <div className="ml-6 space-y-2 border-l-2 border-blue-500 pl-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">主键来源（变量）</label>
                      <select
                        value={localConfig.formSource.cellConfig.primaryKeyVariable}
                        onChange={(e) => updateConfig('formSource.cellConfig.primaryKeyVariable', e.target.value)}
                        className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                      >
                        <option value="">-- 选择变量 --</option>
                        {flowVariables.map(v => (
                          <option key={v.id} value={v.id}>{v.name || v.id}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">目标字段</label>
                      <select
                        value={localConfig.formSource.cellConfig.targetFieldId}
                        onChange={(e) => {
                          const field = currentFormFields.find(f => f.id === e.target.value);
                          updateConfigBatch([
                            { path: 'formSource.cellConfig.targetFieldId', value: e.target.value },
                            { path: 'formSource.cellConfig.targetFieldName', value: field?.name || '' }
                          ]);
                        }}
                        className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                      >
                        <option value="">-- 选择字段 --</option>
                        {currentFormFields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 输出变量 */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">输出变量</label>
          <span className="text-xs text-gray-500">{getDataTypeText()}</span>
        </div>
        
        {currentVariable ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-600 rounded px-3 py-2">
              <div>
                <span className="text-xs text-gray-400">变量ID: </span>
                <span className="font-mono text-blue-400">{currentVariable.id}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-600 rounded text-white">
                {currentVariable.dataType === 'array' ? '数组' : currentVariable.dataType === 'object' ? '对象' : '单值'}
              </span>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">描述名称</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  placeholder="例如：订单列表"
                  className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                />
                <button
                  onClick={handleUpdateVariableName}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              placeholder="输入变量描述名称"
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
            />
            
            <button
              onClick={handleCreateVariable}
              disabled={isCreatingVar}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-white disabled:opacity-50"
            >
              {isCreatingVar ? '创建中...' : '➕ 创建输出变量'}
            </button>
          </div>
        )}
      </div>

      {/* 配置预览 */}
      {localConfig.formSource.formId && (
        <div className="text-xs text-green-400 bg-green-900/30 rounded p-3 space-y-1">
          <div className="font-medium">配置预览</div>
          <div className="text-gray-300">
            表单：{localConfig.formSource.formName}
          </div>
          {(localConfig.formSource.selectedFields || []).length > 0 && (
            <div className="text-gray-300">
              字段：{localConfig.formSource.selectedFields.map(f => f.fieldName).join('、')}
            </div>
          )}
          <div className="text-gray-300">
            方式：{
              localConfig.formSource.readMode === 'batch' ? '整体读取' :
              localConfig.formSource.readMode === 'loop' ? '逐条读取' :
              localConfig.formSource.readMode === 'cell' ? '读取单元' : '未知'
            }
          </div>
          {currentVariable && (
            <div className="text-gray-300">
              输出：<span className="font-mono text-blue-400">{currentVariable.id}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.ReadNodeConfigForm = ReadNodeConfigForm;
