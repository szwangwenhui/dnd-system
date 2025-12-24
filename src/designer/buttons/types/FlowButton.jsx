// 流程按钮 - 触发数据流程
// 支持三种参数方式：不带参数、对话框输入、多项选择

function FlowButtonConfig({ config, onChange, projectId, roleId }) {
  const [flows, setFlows] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [attrTables, setAttrTables] = React.useState([]);
  const [attrFields, setAttrFields] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 加载数据
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (window.dndDB) {
          // 获取所有流程（使用正确的API方法名）
          const allFlows = await window.dndDB.getDataFlowsByProjectId(projectId);
          console.log('加载流程数据:', allFlows?.length, '个');
          
          // 筛选可用的流程（放宽条件：有开始节点即可，或者没有设计也可以选择）
          const availableFlows = (allFlows || []).filter(flow => {
            // 如果没有设计信息，也允许选择（可能是新建的流程）
            if (!flow.design || !flow.design.nodes) {
              return true;
            }
            // 有设计信息的，检查开始节点
            const startNode = flow.design.nodes.find(n => n.type === 'start');
            if (!startNode) {
              return true; // 没有开始节点也允许
            }
            // 有开始节点但没有配置，也允许
            if (!startNode.config) {
              return true;
            }
            // 有配置的，检查触发类型（支持多种触发类型）
            const triggerType = startNode.config.triggerType;
            return !triggerType || // 未设置触发类型
                   triggerType === 'button' ||
                   triggerType === 'pageClick' || 
                   triggerType === 'manual';
          });
          console.log('可用流程:', availableFlows?.length, '个');
          setFlows(availableFlows);

          // 获取所有表单（用于对话框方式）
          const allForms = await window.dndDB.getFormsByProjectId(projectId);
          setForms(allForms || []);

          // 获取属性表（用于多项选择）
          const attrForms = (allForms || []).filter(f => 
            f.type === '属性表单' || f.formType === 'attribute' || f.isAttributeTable
          );
          setAttrTables(attrForms);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  // 当选择属性表后，加载其字段
  React.useEffect(() => {
    const loadAttrFields = async () => {
      if (config.attrTableId) {
        try {
          // 从已加载的属性表中获取字段
          const attrTable = attrTables.find(t => t.id === config.attrTableId);
          console.log('选中的属性表:', attrTable);
          
          if (attrTable && attrTable.structure) {
            // 属性表的字段在 structure.levelFields 中（不是 fields）
            const levelFields = attrTable.structure.levelFields || [];
            console.log('属性表levelFields:', levelFields);
            
            if (levelFields.length > 0 && window.dndDB) {
              const allFields = await window.dndDB.getFieldsByProjectId(projectId);
              const matchedFields = levelFields.map(lf => {
                const fullField = allFields.find(f => f.id === lf.fieldId);
                return {
                  ...(fullField || { id: lf.fieldId, name: lf.fieldId }),
                  level: lf.level  // 保留层级信息
                };
              });
              console.log('匹配后的字段:', matchedFields);
              setAttrFields(matchedFields);
            } else {
              // 回退：直接使用levelFields
              setAttrFields(levelFields.map(lf => ({ id: lf.fieldId, name: lf.fieldId, level: lf.level })));
            }
          } else {
            setAttrFields([]);
          }
        } catch (error) {
          console.error('加载属性表字段失败:', error);
          setAttrFields([]);
        }
      } else {
        setAttrFields([]);
      }
    };
    loadAttrFields();
  }, [projectId, config.attrTableId, attrTables]);

  // 获取层级字段（用于级联下拉）
  const getLevelFields = () => {
    // 筛选出层级相关的字段（通常是有层级关系的字段）
    return attrFields.filter(f => f.isLevelField || f.fieldType === 'level' || true);
  };

  // 更新配置的辅助函数
  const updateConfig = (updates) => {
    onChange({ ...config, ...updates });
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 关联流程 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          关联流程 <span className="text-red-500">*</span>
        </label>
        {flows.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
            <div className="text-gray-400 text-sm">暂无可用流程</div>
            <div className="text-gray-400 text-xs mt-1">
              请先创建触发方式为"页面点触发"的数据流程
            </div>
          </div>
        ) : (
          <select
            value={config.flowId || ''}
            onChange={(e) => {
              const flow = flows.find(f => f.id === e.target.value);
              updateConfig({ 
                flowId: e.target.value,
                flowName: flow?.name || ''
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">-- 请选择流程 --</option>
            {flows.map(flow => (
              <option key={flow.id} value={flow.id}>
                {flow.name || flow.id}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 参数方式 */}
      {config.flowId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参数方式</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-gray-50">
              <input
                type="radio"
                checked={config.paramMode === 'none' || !config.paramMode}
                onChange={() => updateConfig({ paramMode: 'none' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">不带参数</span>
                <p className="text-xs text-gray-500">直接启动流程</p>
              </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-gray-50">
              <input
                type="radio"
                checked={config.paramMode === 'dialog'}
                onChange={() => updateConfig({ paramMode: 'dialog' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">对话框输入</span>
                <p className="text-xs text-gray-500">弹出对话框，填写表单后启动流程</p>
              </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-gray-50">
              <input
                type="radio"
                checked={config.paramMode === 'selection'}
                onChange={() => updateConfig({ paramMode: 'selection' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">多项选择</span>
                <p className="text-xs text-gray-500">从属性表选择选项后启动流程</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ===== 对话框输入配置 ===== */}
      {config.flowId && config.paramMode === 'dialog' && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h4 className="text-sm font-medium text-blue-800 mb-3">📝 对话框配置</h4>
          
          {/* 关联表单 */}
          <div className="mb-3">
            <label className="block text-xs text-blue-700 mb-1">
              关联表单 <span className="text-red-500">*</span>
            </label>
            <select
              value={config.dialogFormId || ''}
              onChange={(e) => {
                const form = forms.find(f => f.id === e.target.value);
                updateConfig({ 
                  dialogFormId: e.target.value,
                  dialogFormName: form?.name || ''
                });
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded text-sm bg-white"
            >
              <option value="">-- 请选择表单 --</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.name || form.id}
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-600 mt-1">
              对话框将显示该表单的字段供用户填写
            </p>
          </div>

          {/* 对话框标题 */}
          <div className="mb-3">
            <label className="block text-xs text-blue-700 mb-1">对话框标题</label>
            <input
              type="text"
              value={config.dialogTitle || ''}
              onChange={(e) => updateConfig({ dialogTitle: e.target.value })}
              placeholder="请输入..."
              className="w-full px-3 py-2 border border-blue-300 rounded text-sm"
            />
          </div>
          
          {/* 提示：需要生成子区块 */}
          {config.dialogFormId && (
            <div className="mt-3 p-2 bg-blue-100 rounded">
              <p className="text-xs text-blue-700">
                💡 保存配置后，在左侧区块列表点击"生成子区块"按钮，生成输入框等子区块
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== 多项选择配置 ===== */}
      {config.flowId && config.paramMode === 'selection' && (
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
          <h4 className="text-sm font-medium text-purple-800 mb-3">☑️ 多项选择配置</h4>
          
          {/* 选择模式：单选/多选 */}
          <div className="mb-3">
            <label className="block text-xs text-purple-700 mb-1">选择模式</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  checked={config.selectMode === 'single' || !config.selectMode}
                  onChange={() => updateConfig({ selectMode: 'single' })}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm text-purple-700">单选</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  checked={config.selectMode === 'multiple'}
                  onChange={() => updateConfig({ selectMode: 'multiple' })}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm text-purple-700">多选</span>
              </label>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {config.selectMode === 'multiple' 
                ? '多选：可选择多个选项，传递数组给流程' 
                : '单选：只能选择一个选项'}
            </p>
          </div>

          {/* 选择形式 */}
          <div className="mb-3">
            <label className="block text-xs text-purple-700 mb-1">选择形式</label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex flex-col items-center p-3 rounded border cursor-pointer transition-colors ${
                config.selectStyle === 'checkbox' || !config.selectStyle
                  ? 'border-purple-500 bg-purple-100'
                  : 'border-purple-200 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  checked={config.selectStyle === 'checkbox' || !config.selectStyle}
                  onChange={() => updateConfig({ selectStyle: 'checkbox' })}
                  className="sr-only"
                />
                <span className="text-2xl mb-1">☑️</span>
                <span className="text-xs text-purple-700">勾选框</span>
              </label>
              <label className={`flex flex-col items-center p-3 rounded border cursor-pointer transition-colors ${
                config.selectStyle === 'buttons'
                  ? 'border-purple-500 bg-purple-100'
                  : 'border-purple-200 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  checked={config.selectStyle === 'buttons'}
                  onChange={() => updateConfig({ selectStyle: 'buttons' })}
                  className="sr-only"
                />
                <span className="text-2xl mb-1">🔘</span>
                <span className="text-xs text-purple-700">按钮组</span>
              </label>
              <label className={`flex flex-col items-center p-3 rounded border cursor-pointer transition-colors ${
                config.selectStyle === 'cascade'
                  ? 'border-purple-500 bg-purple-100'
                  : 'border-purple-200 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  checked={config.selectStyle === 'cascade'}
                  onChange={() => updateConfig({ selectStyle: 'cascade' })}
                  className="sr-only"
                />
                <span className="text-2xl mb-1">📂</span>
                <span className="text-xs text-purple-700">级联下拉</span>
              </label>
            </div>
          </div>

          {/* 选项来源：属性表 */}
          <div className="mb-3">
            <label className="block text-xs text-purple-700 mb-1">
              选项来源（属性表） <span className="text-red-500">*</span>
            </label>
            {attrTables.length === 0 ? (
              <div className="text-center py-3 bg-white rounded border border-dashed border-purple-300">
                <div className="text-purple-400 text-xs">暂无属性表</div>
                <div className="text-purple-400 text-xs mt-1">
                  请先创建属性表类型的表单
                </div>
              </div>
            ) : (
              <select
                value={config.attrTableId || ''}
                onChange={(e) => {
                  const table = attrTables.find(t => t.id === e.target.value);
                  updateConfig({ 
                    attrTableId: e.target.value,
                    attrTableName: table?.name || '',
                    attrFieldId: '',
                    cascadeFromField: '',
                    cascadeToField: ''
                  });
                }}
                className="w-full px-3 py-2 border border-purple-300 rounded text-sm bg-white"
              >
                <option value="">-- 请选择属性表 --</option>
                {attrTables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.name || table.id}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 单级选择：选择字段 */}
          {config.attrTableId && (config.selectStyle === 'checkbox' || config.selectStyle === 'buttons' || !config.selectStyle) && (
            <div className="mb-3">
              <label className="block text-xs text-purple-700 mb-1">
                选项字段 <span className="text-red-500">*</span>
              </label>
              <select
                value={config.attrFieldId || ''}
                onChange={(e) => {
                  const field = attrFields.find(f => f.id === e.target.value);
                  updateConfig({ 
                    attrFieldId: e.target.value,
                    attrFieldName: field?.name || ''
                  });
                }}
                className="w-full px-3 py-2 border border-purple-300 rounded text-sm bg-white"
              >
                <option value="">-- 请选择字段 --</option>
                {attrFields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name || field.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-1">
                选项将从该字段的所有取值中获取
              </p>
            </div>
          )}

          {/* 级联下拉：选择层级范围 */}
          {config.attrTableId && config.selectStyle === 'cascade' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-purple-700 mb-1">
                  起始层级 <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.cascadeFromField || ''}
                  onChange={(e) => {
                    const field = attrFields.find(f => f.id === e.target.value);
                    updateConfig({ 
                      cascadeFromField: e.target.value,
                      cascadeFromFieldName: field?.name || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-purple-300 rounded text-sm bg-white"
                >
                  <option value="">-- 请选择起始字段 --</option>
                  {getLevelFields().map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name || field.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-purple-700 mb-1">
                  结束层级 <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.cascadeToField || ''}
                  onChange={(e) => {
                    const field = attrFields.find(f => f.id === e.target.value);
                    updateConfig({ 
                      cascadeToField: e.target.value,
                      cascadeToFieldName: field?.name || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-purple-300 rounded text-sm bg-white"
                >
                  <option value="">-- 请选择结束字段 --</option>
                  {getLevelFields().map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name || field.id}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-purple-600">
                用户将从起始层级逐级选择到结束层级
              </p>
            </div>
          )}

          {/* 预览提示 */}
          {config.attrTableId && (
            <div className="mt-3 p-2 bg-white rounded border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1">配置预览</div>
              <div className="text-xs text-purple-600">
                {config.selectStyle === 'cascade' ? (
                  <>级联选择：{config.cascadeFromFieldName || '?'} → {config.cascadeToFieldName || '?'}</>
                ) : (
                  <>从 [{config.attrTableName}] 的 [{config.attrFieldName || '?'}] 字段获取选项</>
                )}
                <span className="ml-2">
                  ({config.selectMode === 'multiple' ? '多选' : '单选'})
                </span>
              </div>
            </div>
          )}
          
          {/* 提示：需要生成子区块 */}
          {config.attrTableId && (config.attrFieldId || config.cascadeFromField) && (
            <div className="mt-3 p-2 bg-purple-100 rounded">
              <p className="text-xs text-purple-700">
                💡 保存配置后，在左侧区块列表点击"生成子区块"按钮，生成选择器等子区块
              </p>
            </div>
          )}
        </div>
      )}

      {/* 执行选项 */}
      {config.flowId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">执行选项</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showLoading !== false}
                onChange={(e) => updateConfig({ showLoading: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">执行时显示加载状态</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showResult !== false}
                onChange={(e) => updateConfig({ showResult: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">执行完成后显示结果提示</span>
            </label>
            {config.paramMode === 'none' && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.confirmBeforeRun || false}
                  onChange={(e) => updateConfig({ confirmBeforeRun: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">执行前需要确认</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* 确认提示语 */}
      {config.flowId && config.paramMode === 'none' && config.confirmBeforeRun && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">确认提示语</label>
          <input
            type="text"
            value={config.confirmMessage || ''}
            onChange={(e) => updateConfig({ confirmMessage: e.target.value })}
            placeholder="确定要执行此操作吗？"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )}

      {/* 配置摘要 */}
      {config.flowId && (
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <div className="flex items-center text-green-700">
            <span className="text-lg mr-2">✅</span>
            <span className="font-medium">配置摘要</span>
          </div>
          <div className="text-sm text-green-600 mt-1">
            <div>流程：{config.flowName || config.flowId}</div>
            <div>
              参数：
              {config.paramMode === 'dialog' && `对话框输入 (${config.dialogFormName || '未选择表单'})`}
              {config.paramMode === 'selection' && `多项选择 - ${
                config.selectStyle === 'checkbox' ? '勾选框' :
                config.selectStyle === 'buttons' ? '按钮组' :
                config.selectStyle === 'cascade' ? '级联下拉' : '勾选框'
              } (${config.selectMode === 'multiple' ? '多选' : '单选'})`}
              {(config.paramMode === 'none' || !config.paramMode) && '不带参数'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 执行流程
async function executeFlowButton(config, context) {
  if (!config.flowId) {
    return { success: false, error: '未关联流程' };
  }

  // 不带参数模式：直接执行或确认后执行
  if (config.paramMode === 'none' || !config.paramMode) {
    if (config.confirmBeforeRun) {
      const message = config.confirmMessage || '确定要执行此操作吗？';
      if (!confirm(message)) {
        return { success: false, error: '用户取消' };
      }
    }
    
    // 直接触发流程
    window.dispatchEvent(new CustomEvent('executeFlow', {
      detail: {
        flowId: config.flowId,
        flowName: config.flowName,
        params: {},
        context: context,
        showLoading: config.showLoading !== false,
        showResult: config.showResult !== false
      }
    }));
    
    return { success: true };
  }

  // 对话框模式：触发显示对话框事件
  if (config.paramMode === 'dialog') {
    window.dispatchEvent(new CustomEvent('showFlowDialog', {
      detail: {
        flowId: config.flowId,
        flowName: config.flowName,
        formId: config.dialogFormId,
        formName: config.dialogFormName,
        dialogTitle: config.dialogTitle || '请输入',
        context: context,
        showLoading: config.showLoading !== false,
        showResult: config.showResult !== false
      }
    }));
    
    return { success: true, pending: true };
  }

  // 多项选择模式：触发显示选择器事件
  if (config.paramMode === 'selection') {
    window.dispatchEvent(new CustomEvent('showFlowSelection', {
      detail: {
        flowId: config.flowId,
        flowName: config.flowName,
        selectMode: config.selectMode || 'single',
        selectStyle: config.selectStyle || 'checkbox',
        attrTableId: config.attrTableId,
        attrTableName: config.attrTableName,
        attrFieldId: config.attrFieldId,
        attrFieldName: config.attrFieldName,
        cascadeFromField: config.cascadeFromField,
        cascadeToField: config.cascadeToField,
        context: context,
        showLoading: config.showLoading !== false,
        showResult: config.showResult !== false
      }
    }));
    
    return { success: true, pending: true };
  }

  return { success: false, error: '未知的参数模式' };
}

// 验证配置
function validateFlowButton(config) {
  const errors = [];
  
  if (!config.flowId) {
    errors.push('请选择要关联的流程');
  }
  
  if (config.paramMode === 'dialog') {
    if (!config.dialogFormId) {
      errors.push('对话框模式需要选择关联表单');
    }
  }
  
  if (config.paramMode === 'selection') {
    if (!config.attrTableId) {
      errors.push('多项选择模式需要选择属性表');
    }
    if (config.selectStyle === 'cascade') {
      if (!config.cascadeFromField || !config.cascadeToField) {
        errors.push('级联下拉需要设置起始和结束层级');
      }
    } else {
      if (!config.attrFieldId) {
        errors.push('请选择选项字段');
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('flow', {
    label: '流程按钮',
    icon: '⚙️',
    description: '触发数据流程',
    category: 'process',
    renderConfig: FlowButtonConfig,
    execute: executeFlowButton,
    validate: validateFlowButton,
    defaultConfig: {
      flowId: '',
      flowName: '',
      paramMode: 'none',  // none/dialog/selection
      // 对话框配置
      dialogFormId: '',
      dialogFormName: '',
      dialogTitle: '',
      // 多项选择配置
      selectMode: 'single',  // single/multiple
      selectStyle: 'checkbox',  // checkbox/buttons/cascade
      attrTableId: '',
      attrTableName: '',
      attrFieldId: '',
      attrFieldName: '',
      cascadeFromField: '',
      cascadeFromFieldName: '',
      cascadeToField: '',
      cascadeToFieldName: '',
      // 执行选项
      showLoading: true,
      showResult: true,
      confirmBeforeRun: false,
      confirmMessage: ''
    }
  });
}

window.FlowButtonConfig = FlowButtonConfig;
