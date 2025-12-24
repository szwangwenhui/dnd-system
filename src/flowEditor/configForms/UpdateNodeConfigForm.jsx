// 更新节点配置表单
// 已集成变量管理：主键选择器、条件编辑器、字段映射器都支持从变量管理选择变量
function UpdateNodeConfigForm({ 
  config, 
  onChange, 
  forms, 
  fields, 
  pages, 
  blocks,
  // 变量管理相关参数
  projectId,
  flowId,
  nodeId
}) {
  const defaultConfig = {
    formId: '',
    formName: '',
    locateMode: 'primaryKey',
    primaryKey: {
      mode: 'static',
      staticValue: '',
      dynamicType: 'variable',
      dynamicValue: { variableId: '', variablePath: '', variable: '', pageId: '', blockId: '', urlParam: '' }
    },
    conditions: [],
    fieldMappings: []
  };

  const [localConfig, setLocalConfig] = React.useState({
    ...defaultConfig,
    ...config,
    primaryKey: { ...defaultConfig.primaryKey, ...(config?.primaryKey || {}) }
  });

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

  // 获取选中表单的字段
  const getFormFields = (formId) => {
    if (!formId || !fields) return [];
    return fields.filter(f => f.formId === formId);
  };

  const currentFormFields = getFormFields(localConfig.formId);

  return (
    <div className="space-y-4">
      {/* 选择目标表单 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">更新目标</label>
        <select
          value={localConfig.formId}
          onChange={(e) => {
            const form = forms?.find(f => f.id === e.target.value);
            updateConfig('formId', e.target.value);
            updateConfig('formName', form?.name || '');
          }}
          className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- 选择表单 --</option>
          {forms?.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {localConfig.formId && (
        <>
          {/* 定位方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">定位记录</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={localConfig.locateMode === 'primaryKey'}
                  onChange={() => updateConfig('locateMode', 'primaryKey')}
                  className="text-blue-500"
                />
                <span className="text-gray-200 text-sm">通过主键</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={localConfig.locateMode === 'condition'}
                  onChange={() => updateConfig('locateMode', 'condition')}
                  className="text-blue-500"
                />
                <span className="text-gray-200 text-sm">通过条件</span>
              </label>
            </div>
          </div>

          {/* 主键定位 - 传递变量管理参数 */}
          {localConfig.locateMode === 'primaryKey' && (
            <div className="bg-gray-700 rounded-lg p-4">
              <PrimaryKeySelector
                formId={localConfig.formId}
                forms={forms}
                pages={pages}
                blocks={blocks}
                label="主键取值"
                value={localConfig.primaryKey}
                onChange={(newValue) => updateConfig('primaryKey', newValue)}
                projectId={projectId}
                flowId={flowId}
                nodeId={nodeId}
              />
            </div>
          )}

          {/* 条件定位 - 传递变量管理参数 */}
          {localConfig.locateMode === 'condition' && (
            <div className="bg-gray-700 rounded-lg p-4">
              <ConditionEditor
                conditions={localConfig.conditions}
                onChange={(newConditions) => updateConfig('conditions', newConditions)}
                fields={currentFormFields}
                label="定位条件"
                projectId={projectId}
                flowId={flowId}
                nodeId={nodeId}
                forms={forms}
              />
              <p className="text-xs text-yellow-500 mt-2">
                ⚠ 注意：如果条件匹配多条记录，将全部更新
              </p>
            </div>
          )}

          {/* 更新内容 - 传递变量管理参数 */}
          <div className="bg-gray-700 rounded-lg p-4">
            <FieldMapper
              mappings={localConfig.fieldMappings}
              onChange={(newMappings) => updateConfig('fieldMappings', newMappings)}
              fields={currentFormFields}
              label="更新内容"
              projectId={projectId}
              flowId={flowId}
              nodeId={nodeId}
              forms={forms}
            />
          </div>
        </>
      )}

      {/* 配置预览 */}
      {localConfig.formId && localConfig.fieldMappings?.length > 0 && (
        <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
          ✓ 更新 [{localConfig.formName}] 的 {localConfig.fieldMappings.length} 个字段
        </div>
      )}
    </div>
  );
}

window.UpdateNodeConfigForm = UpdateNodeConfigForm;
