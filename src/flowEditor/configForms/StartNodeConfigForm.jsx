// 开始节点配置表单
function StartNodeConfigForm({ config, onChange, pages, forms, blocks, fields, projectId }) {
  // 确保所有子配置对象都存在
  const defaultConfig = {
    triggerTypes: ['button'],  // 改为数组，支持多选
    triggerType: 'button',     // 保留兼容
    buttonConfig: { pageId: '', pageName: '', blockId: '', blockName: '' },
    scheduleConfig: { hour: 0, minute: 0 },
    dataChangeConfig: {
      formId: '',
      formName: '',
      changeType: 'any'  // any, create, update, delete
    },
    conditionConfig: { 
      interval: 60, 
      unit: 'minutes', 
      formId: '', 
      formName: '', 
      conditionField: '',
      conditionOperator: '==',
      conditionValue: ''
    },
    flowTriggerConfig: {
      allowedFlows: []  // 允许哪些流程触发，空数组表示所有流程都可以触发
    },
    // 保留旧的intervalConfig以兼容已有配置
    intervalConfig: { 
      interval: 60, 
      unit: 'seconds', 
      formId: '', 
      formName: '', 
      primaryKey: {
        mode: 'static',
        staticValue: '',
        dynamicType: 'variable',
        dynamicValue: { variable: '', pageId: '', blockId: '', urlParam: '' }
      }, 
      scanField: '' 
    }
  };
  
  const [localConfig, setLocalConfig] = React.useState({
    ...defaultConfig,
    ...config,
    triggerTypes: config?.triggerTypes || (config?.triggerType ? [config.triggerType] : ['button']),
    buttonConfig: { ...defaultConfig.buttonConfig, ...(config?.buttonConfig || {}) },
    scheduleConfig: { ...defaultConfig.scheduleConfig, ...(config?.scheduleConfig || {}) },
    dataChangeConfig: { ...defaultConfig.dataChangeConfig, ...(config?.dataChangeConfig || {}) },
    conditionConfig: { ...defaultConfig.conditionConfig, ...(config?.conditionConfig || {}) },
    flowTriggerConfig: { ...defaultConfig.flowTriggerConfig, ...(config?.flowTriggerConfig || {}) },
    intervalConfig: { ...defaultConfig.intervalConfig, ...(config?.intervalConfig || {}) }
  });

  // 标记是否已初始化
  const initializedRef = React.useRef(false);

  // 首次渲染后，如果triggerTypes为空，自动设置默认值并通知父组件
  React.useEffect(() => {
    // 只在首次渲染后执行一次
    if (!initializedRef.current && (!config?.triggerTypes || config.triggerTypes.length === 0)) {
      initializedRef.current = true;
      // 使用setTimeout确保不在渲染期间调用setState
      setTimeout(() => {
        const initialConfig = {
          ...defaultConfig,
          ...config,
          triggerTypes: config?.triggerType ? [config.triggerType] : ['button'],
          buttonConfig: { ...defaultConfig.buttonConfig, ...(config?.buttonConfig || {}) },
          scheduleConfig: { ...defaultConfig.scheduleConfig, ...(config?.scheduleConfig || {}) },
          dataChangeConfig: { ...defaultConfig.dataChangeConfig, ...(config?.dataChangeConfig || {}) },
          conditionConfig: { ...defaultConfig.conditionConfig, ...(config?.conditionConfig || {}) },
          flowTriggerConfig: { ...defaultConfig.flowTriggerConfig, ...(config?.flowTriggerConfig || {}) },
          intervalConfig: { ...defaultConfig.intervalConfig, ...(config?.intervalConfig || {}) }
        };
        onChange(initialConfig);
      }, 0);
    } else {
      initializedRef.current = true;
    }
  }, []);

  // 单个路径更新
  const updateConfig = (path, value) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      onChange(newConfig);
      return newConfig;
    });
  };

  // 批量更新多个路径
  const updateConfigBatch = (updates) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      updates.forEach(({ path, value }) => {
        const keys = path.split('.');
        let obj = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      });
      onChange(newConfig);
      return newConfig;
    });
  };

  // 获取选中页面的按钮区块（放宽条件，包含所有可能的按钮类型）
  const getPageBlocks = (pageId) => {
    if (!blocks || !pageId) return [];
    // 过滤该页面的区块，查找按钮类型的区块
    const pageBlocks = blocks.filter(b => b.pageId === pageId);
    console.log('页面区块:', pageId, pageBlocks);
    
    // 返回所有可能是按钮的区块（根据实际类型名称）
    return pageBlocks.filter(b => 
      b.type === '按钮' || 
      b.type === '交互' || 
      b.type === 'button' ||
      b.type === 'interaction' ||
      b.blockType === '按钮' ||
      b.blockType === 'button' ||
      // 如果有 buttonText 或 buttonType 属性，也认为是按钮
      b.buttonText ||
      b.buttonType
    );
  };

  // 获取选中表单的字段（使用传入的 fields 获取字段名称）
  const getFormFields = (formId) => {
    if (!formId) return [];
    
    // 方法1：从传入的 fields 中筛选该表单的字段
    if (fields && fields.length > 0) {
      const formFields = fields.filter(f => f.formId === formId);
      console.log('使用传入的fields:', formFields);
      if (formFields.length > 0) {
        return formFields;
      }
    }
    
    // 方法2：如果没有传入 fields，从表单结构中获取
    if (forms) {
      const form = forms.find(f => f.id === formId);
      const formFields = form?.structure?.fields || form?.fields || [];
      console.log('从表单结构获取字段:', formFields);
      
      return formFields.map(f => ({
        id: f.fieldId || f.id,
        name: f.name || f.fieldId || f.id
      }));
    }
    
    return [];
  };

  return (
    <div className="space-y-4">
      {/* 触发方式 - 改为多选 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          触发方式 <span className="text-xs text-gray-400">（可多选）</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.triggerTypes?.includes('button')}
              onChange={(e) => {
                const types = [...(localConfig.triggerTypes || [])];
                if (e.target.checked) {
                  if (!types.includes('button')) types.push('button');
                } else {
                  const idx = types.indexOf('button');
                  if (idx > -1) types.splice(idx, 1);
                }
                updateConfig('triggerTypes', types.length > 0 ? types : ['button']);
              }}
              className="text-blue-500 rounded"
            />
            <span className="text-gray-200">🔘 按钮触发</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.triggerTypes?.includes('schedule')}
              onChange={(e) => {
                const types = [...(localConfig.triggerTypes || [])];
                if (e.target.checked) {
                  if (!types.includes('schedule')) types.push('schedule');
                } else {
                  const idx = types.indexOf('schedule');
                  if (idx > -1) types.splice(idx, 1);
                }
                updateConfig('triggerTypes', types.length > 0 ? types : ['button']);
              }}
              className="text-blue-500 rounded"
            />
            <span className="text-gray-200">⏰ 定时触发</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.triggerTypes?.includes('dataChange')}
              onChange={(e) => {
                const types = [...(localConfig.triggerTypes || [])];
                if (e.target.checked) {
                  if (!types.includes('dataChange')) types.push('dataChange');
                } else {
                  const idx = types.indexOf('dataChange');
                  if (idx > -1) types.splice(idx, 1);
                }
                updateConfig('triggerTypes', types.length > 0 ? types : ['button']);
              }}
              className="text-blue-500 rounded"
            />
            <span className="text-gray-200">📊 数据变化</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.triggerTypes?.includes('condition') || localConfig.triggerTypes?.includes('interval')}
              onChange={(e) => {
                const types = [...(localConfig.triggerTypes || [])];
                if (e.target.checked) {
                  if (!types.includes('condition')) types.push('condition');
                } else {
                  const idx = types.indexOf('condition');
                  if (idx > -1) types.splice(idx, 1);
                  const idx2 = types.indexOf('interval');
                  if (idx2 > -1) types.splice(idx2, 1);
                }
                updateConfig('triggerTypes', types.length > 0 ? types : ['button']);
              }}
              className="text-blue-500 rounded"
            />
            <span className="text-gray-200">✓ 条件满足</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.triggerTypes?.includes('flowTrigger')}
              onChange={(e) => {
                const types = [...(localConfig.triggerTypes || [])];
                if (e.target.checked) {
                  if (!types.includes('flowTrigger')) types.push('flowTrigger');
                } else {
                  const idx = types.indexOf('flowTrigger');
                  if (idx > -1) types.splice(idx, 1);
                }
                updateConfig('triggerTypes', types.length > 0 ? types : ['button']);
              }}
              className="text-blue-500 rounded"
            />
            <span className="text-gray-200">↗ 其它流程跳转触发</span>
          </label>
        </div>
        {localConfig.triggerTypes?.length > 1 && (
          <div className="mt-2 text-xs text-green-400">
            ✓ 已选择 {localConfig.triggerTypes.length} 种触发方式
          </div>
        )}
      </div>

      {/* 按钮触发配置 */}
      {localConfig.triggerTypes?.includes('button') && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">按钮触发配置</h4>
          
          <div className="text-xs text-blue-400 bg-blue-900/30 rounded p-2 mb-2">
            💡 页面和按钮选择为可选项。您也可以在页面设计时，通过"流程按钮"关联此流程。
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">选择页面（可选）</label>
            <select
              value={localConfig.buttonConfig.pageId}
              onChange={(e) => {
                const page = pages?.find(p => p.id === e.target.value);
                updateConfigBatch([
                  { path: 'buttonConfig.pageId', value: e.target.value },
                  { path: 'buttonConfig.pageName', value: page?.name || '' },
                  { path: 'buttonConfig.blockId', value: '' },
                  { path: 'buttonConfig.blockName', value: '' }
                ]);
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- 不指定页面 --</option>
              {pages?.map(p => (
                <option key={p.id} value={p.id}>[{p.roleName}] {p.name}</option>
              ))}
            </select>
          </div>
          
          {localConfig.buttonConfig.pageId && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">选择按钮（可选）</label>
              <select
                value={localConfig.buttonConfig.blockId}
                onChange={(e) => {
                  const block = getPageBlocks(localConfig.buttonConfig.pageId).find(b => b.id === e.target.value);
                  updateConfigBatch([
                    { path: 'buttonConfig.blockId', value: e.target.value },
                    { path: 'buttonConfig.blockName', value: block?.buttonText || block?.name || block?.label || '' }
                  ]);
                }}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- 不指定按钮 --</option>
                {getPageBlocks(localConfig.buttonConfig.pageId).map(b => {
                  const displayName = b.name || b.buttonText || b.label || '';
                  return (
                    <option key={b.id} value={b.id}>
                      {b.id} {displayName ? `(${displayName})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          
          {localConfig.buttonConfig.pageName && localConfig.buttonConfig.blockName && (
            <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
              ✓ 已绑定：{localConfig.buttonConfig.pageName} → {localConfig.buttonConfig.blockName}
            </div>
          )}
        </div>
      )}

      {/* 数据变化配置 */}
      {localConfig.triggerTypes?.includes('dataChange') && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">数据变化配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">监听表单</label>
            <select
              value={localConfig.dataChangeConfig.formId}
              onChange={(e) => {
                const form = forms?.find(f => f.id === e.target.value);
                updateConfigBatch([
                  { path: 'dataChangeConfig.formId', value: e.target.value },
                  { path: 'dataChangeConfig.formName', value: form?.name || '' }
                ]);
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- 选择表单 --</option>
              {forms?.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">变化类型</label>
            <select
              value={localConfig.dataChangeConfig.changeType}
              onChange={(e) => updateConfig('dataChangeConfig.changeType', e.target.value)}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="any">任何变化</option>
              <option value="create">新增数据</option>
              <option value="update">修改数据</option>
              <option value="delete">删除数据</option>
            </select>
          </div>
          
          {localConfig.dataChangeConfig.formId && (
            <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
              ✓ 当 {localConfig.dataChangeConfig.formName} 表单
              {localConfig.dataChangeConfig.changeType === 'any' && '有任何变化'}
              {localConfig.dataChangeConfig.changeType === 'create' && '新增数据'}
              {localConfig.dataChangeConfig.changeType === 'update' && '修改数据'}
              {localConfig.dataChangeConfig.changeType === 'delete' && '删除数据'}
              时触发
            </div>
          )}
        </div>
      )}

      {/* 条件满足配置 */}
      {(localConfig.triggerTypes?.includes('condition') || localConfig.triggerTypes?.includes('interval')) && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">条件满足配置</h4>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">检查间隔</label>
              <input
                type="number"
                value={localConfig.conditionConfig?.interval || localConfig.intervalConfig.interval}
                onChange={(e) => updateConfig('conditionConfig.interval', parseInt(e.target.value) || 60)}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                min="1"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-400 mb-1">单位</label>
              <select
                value={localConfig.conditionConfig?.unit || localConfig.intervalConfig.unit}
                onChange={(e) => updateConfig('conditionConfig.unit', e.target.value)}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="minutes">分钟</option>
                <option value="hours">小时</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">检查表单</label>
            <select
              value={localConfig.conditionConfig?.formId || localConfig.intervalConfig.formId}
              onChange={(e) => {
                const form = forms?.find(f => f.id === e.target.value);
                updateConfigBatch([
                  { path: 'conditionConfig.formId', value: e.target.value },
                  { path: 'conditionConfig.formName', value: form?.name || '' },
                  { path: 'conditionConfig.primaryKeyField', value: '' },
                  { path: 'conditionConfig.primaryKeyValue', value: '' },
                  { path: 'conditionConfig.conditionField', value: '' }
                ]);
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- 选择表单 --</option>
              {forms?.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          
          {(localConfig.conditionConfig?.formId || localConfig.intervalConfig.formId) && (
            <>
              {/* 主键选择 */}
              <div className="bg-gray-600/50 rounded p-3 space-y-2">
                <label className="block text-xs text-gray-300 font-medium">🔑 定位记录（主键）</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">主键字段</label>
                    <select
                      value={localConfig.conditionConfig?.primaryKeyField || ''}
                      onChange={(e) => updateConfig('conditionConfig.primaryKeyField', e.target.value)}
                      className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- 选择主键字段 --</option>
                      {getFormFields(localConfig.conditionConfig?.formId || localConfig.intervalConfig.formId)
                        .filter(f => f.isPrimaryKey)
                        .map(f => (
                          <option key={f.id} value={f.id}>{f.name || f.id} (主键)</option>
                        ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">主键值</label>
                    <input
                      type="text"
                      value={localConfig.conditionConfig?.primaryKeyValue || ''}
                      onChange={(e) => updateConfig('conditionConfig.primaryKeyValue', e.target.value)}
                      className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                      placeholder="输入要监视的记录主键值"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">指定要监视的具体记录，通过主键定位</p>
              </div>
              
              {/* 条件字段 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">监视字段</label>
                <select
                  value={localConfig.conditionConfig?.conditionField || localConfig.intervalConfig.scanField}
                  onChange={(e) => updateConfig('conditionConfig.conditionField', e.target.value)}
                  className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- 选择字段 --</option>
                  {getFormFields(localConfig.conditionConfig?.formId || localConfig.intervalConfig.formId).map(f => (
                    <option key={f.id} value={f.id}>{f.name || f.id}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <div className="w-24">
                  <label className="block text-xs text-gray-400 mb-1">运算符</label>
                  <select
                    value={localConfig.conditionConfig?.conditionOperator || '=='}
                    onChange={(e) => updateConfig('conditionConfig.conditionOperator', e.target.value)}
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="==">等于</option>
                    <option value="!=">不等于</option>
                    <option value=">">大于</option>
                    <option value=">=">大于等于</option>
                    <option value="<">小于</option>
                    <option value="<=">小于等于</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">条件值</label>
                  <input
                    type="text"
                    value={localConfig.conditionConfig?.conditionValue || ''}
                    onChange={(e) => updateConfig('conditionConfig.conditionValue', e.target.value)}
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                    placeholder="输入条件值"
                  />
                </div>
              </div>
              
              {/* 配置摘要 */}
              {localConfig.conditionConfig?.primaryKeyValue && localConfig.conditionConfig?.conditionField && (
                <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
                  ✓ 监视：{localConfig.conditionConfig.formName} 表中 
                  {localConfig.conditionConfig.primaryKeyField}={localConfig.conditionConfig.primaryKeyValue} 的记录，
                  当字段满足条件时触发
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 定时触发配置 */}
      {localConfig.triggerTypes?.includes('schedule') && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">定时触发配置</h4>
          
          <div className="flex space-x-2 items-center">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">时</label>
              <select
                value={localConfig.scheduleConfig.hour}
                onChange={(e) => updateConfig('scheduleConfig.hour', parseInt(e.target.value))}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <span className="text-gray-400 text-xl pt-5">:</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">分</label>
              <select
                value={localConfig.scheduleConfig.minute}
                onChange={(e) => updateConfig('scheduleConfig.minute', parseInt(e.target.value))}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-xs text-gray-400">
            每天 {String(localConfig.scheduleConfig.hour).padStart(2, '0')}:{String(localConfig.scheduleConfig.minute).padStart(2, '0')} 自动执行
          </div>
        </div>
      )}

      {/* 其它流程触发配置 */}
      {localConfig.triggerTypes?.includes('flowTrigger') && (
        <div className="bg-purple-900/30 rounded-lg p-4 space-y-3 border border-purple-700">
          <h4 className="text-sm font-medium text-purple-300">↗ 其它流程跳转触发</h4>
          <p className="text-xs text-gray-400">
            当其他流程使用"流程跳转"节点跳转到本流程时触发执行
          </p>
          <div className="text-xs text-purple-400 bg-purple-900/50 rounded p-2">
            💡 勾选此选项后，其他流程的"流程跳转"节点可以选择本流程作为目标
          </div>
        </div>
      )}
    </div>
  );
}

window.StartNodeConfigForm = StartNodeConfigForm;
