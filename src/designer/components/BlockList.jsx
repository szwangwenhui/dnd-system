// 左侧区块列表组件 - 包含区块定义配置
function BlockList({ 
  blocks, 
  selectedBlockId, 
  onSelectBlock, 
  onAddBlock, 
  onDeleteBlock,
  expandedBlocks,
  onToggleExpand,
  onUpdateBlock,
  onGenerateChildBlocks,  // 交互区块生成子区块
  onGenerateFlowButtonChildBlocks,  // 流程按钮生成子区块
  onSaveAsTemplate,  // 设为模板回调
  projectId,
  roleId,
  forms,      // 表单列表
  fields,     // 字段列表
  dataFlows   // 流程列表
}) {
  // 按钮配置弹窗状态
  const [buttonConfigOpen, setButtonConfigOpen] = React.useState(false);
  const [buttonConfigBlock, setButtonConfigBlock] = React.useState(null);
  
  // 交互区块配置弹窗状态
  const [interactionConfigOpen, setInteractionConfigOpen] = React.useState(false);
  const [interactionConfigBlock, setInteractionConfigBlock] = React.useState(null);

  // 获取区块类型的样式
  const getTypeStyle = (type) => {
    switch (type) {
      case '显示': return 'bg-green-500';
      case '交互': return 'bg-blue-500';
      case '按钮': return 'bg-orange-500';
      case '用户账号': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // 获取显示内容的图标
  const getContentIcon = (contentType) => {
    switch (contentType) {
      case '文字': return '📝';
      case '图片': return '🖼️';
      case '视频': return '🎬';
      case '表单': return '📋';
      case '图表': return '📊';
      default: return '📄';
    }
  };

  // 处理区块属性变更
  const handleBlockChange = (blockId, field, value) => {
    if (onUpdateBlock) {
      const updates = { [field]: value };
      
      // 特殊处理：当显示来源改变时，重置显示内容
      if (field === 'sourceType') {
        updates.contentType = '文字'; // 默认重置为文字
      }
      
      onUpdateBlock(blockId, updates);
    }
  };

  // 渲染区块定义配置
  const renderBlockConfig = (block) => {
    const isDisplayBlock = block.type === '显示';
    
    return (
      <div className="px-2 py-2 bg-gray-50 border-t border-gray-200 text-xs space-y-2">
        {/* 区块类型 - 移除"用户账号"选项，改为内置区块 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">类别：</span>
          <select
            value={block.type}
            onChange={(e) => handleBlockChange(block.id, 'type', e.target.value)}
            className="px-1.5 py-0.5 border border-gray-300 rounded text-xs bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="显示">显示</option>
            <option value="交互">交互</option>
            <option value="按钮">按钮</option>
          </select>
        </div>
        
        {/* 位置信息 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">位置：</span>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={block.x}
              onChange={(e) => handleBlockChange(block.id, 'x', parseInt(e.target.value) || 0)}
              className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-gray-400">,</span>
            <input
              type="number"
              value={block.y}
              onChange={(e) => handleBlockChange(block.id, 'y', parseInt(e.target.value) || 0)}
              className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        
        {/* 尺寸信息 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">尺寸：</span>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={block.width}
              onChange={(e) => handleBlockChange(block.id, 'width', parseInt(e.target.value) || 20)}
              className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-gray-400">×</span>
            <input
              type="number"
              value={block.height}
              onChange={(e) => handleBlockChange(block.id, 'height', parseInt(e.target.value) || 20)}
              className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* 设为弹窗勾选框 - 对显示、交互、按钮区块都显示 */}
        {(block.type === '显示' || block.type === '交互' || block.type === '按钮') && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.isPopup || false}
                onChange={(e) => {
                  e.stopPropagation();
                  const isPopup = e.target.checked;
                  const newZIndex = isPopup ? -1 : 0;
                  
                  // 只更新当前区块，层级联动由PageDesigner统一处理
                  if (onUpdateBlock) {
                    onUpdateBlock(block.id, {
                      isPopup: isPopup,
                      style: { ...block.style, zIndex: newZIndex }
                    });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-600 font-medium">设为弹窗</span>
            </label>
            {block.isPopup && (
              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                弹窗区块
              </span>
            )}
          </div>
        )}

        {/* 访问权限配置 */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-gray-600 font-medium mb-2">访问权限</div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.requireLogin || false}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onUpdateBlock) {
                    onUpdateBlock(block.id, { requireLogin: e.target.checked });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-500">需要登录</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.requireAdmin || false}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onUpdateBlock) {
                    onUpdateBlock(block.id, { 
                      requireAdmin: e.target.checked,
                      requireLogin: e.target.checked ? true : block.requireLogin  // 管理员必须先登录
                    });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-gray-500">仅管理员</span>
            </label>
          </div>
        </div>

        {/* 父子关系配置 - 独立功能 */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-gray-600 font-medium mb-2">父子关系</div>
          
          {/* 层级选择 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">层级：</span>
            <select
              value={block.level || 1}
              onChange={(e) => {
                e.stopPropagation();
                const newLevel = parseInt(e.target.value);
                if (onUpdateBlock) {
                  // 层级变为1时，清空父区块
                  const updates = { level: newLevel };
                  if (newLevel === 1) {
                    updates.parentId = null;
                  }
                  onUpdateBlock(block.id, updates);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white"
            >
              <option value={1}>1级（顶级）</option>
              <option value={2}>2级</option>
              <option value={3}>3级</option>
              <option value={4}>4级</option>
              <option value={5}>5级</option>
            </select>
          </div>
          
          {/* 父区块选择 - 仅当层级>1时显示 */}
          {(block.level || 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">父区块：</span>
              <select
                value={block.parentId || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  const parentId = e.target.value || null;
                  if (onUpdateBlock && parentId) {
                    const parentBlock = blocks.find(b => b.id === parentId);
                    if (parentBlock) {
                      // 计算相对位置（子区块顶点相对于父区块顶点的偏移）
                      const relativeX = block.x - parentBlock.x;
                      const relativeY = block.y - parentBlock.y;
                      // 继承父区块的zIndex
                      onUpdateBlock(block.id, {
                        parentId: parentId,
                        relativeX: relativeX,
                        relativeY: relativeY,
                        style: {
                          ...block.style,
                          zIndex: parentBlock.style?.zIndex ?? 0
                        }
                      });
                    }
                  } else if (onUpdateBlock) {
                    // 清空父区块时，也清空相对位置
                    onUpdateBlock(block.id, {
                      parentId: null,
                      relativeX: undefined,
                      relativeY: undefined
                    });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white"
              >
                <option value="">-- 请选择父区块 --</option>
                {blocks
                  .filter(b => {
                    // 排除自身
                    if (b.id === block.id) return false;
                    // 只显示比当前区块高一级的区块（即层级 = 当前层级 - 1）
                    const bLevel = b.level || 1;
                    const blockLevel = block.level || 1;
                    return bLevel === blockLevel - 1;
                  })
                  .map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.type} · {b.level || 1}级
                    </option>
                  ))
                }
              </select>
            </div>
          )}
          
          {/* 显示当前父子关系信息 */}
          {block.parentId && (
            <div className="text-xs text-blue-500 mt-1 bg-blue-50 p-1 rounded">
              父区块：{block.parentId}
              {block.relativeX !== undefined && (
                <span className="ml-2">相对位置: ({block.relativeX}, {block.relativeY})</span>
              )}
            </div>
          )}
        </div>

        {/* 以下配置仅对"显示"类型区块显示 */}
        {isDisplayBlock && (
          <>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="text-gray-600 font-medium mb-1">显示配置</div>
            </div>
            
            {/* 显示来源 */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">来源：</span>
              <div className="flex space-x-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`source-${block.id}`}
                    value="静态"
                    checked={block.sourceType === '静态' || !block.sourceType}
                    onChange={(e) => handleBlockChange(block.id, 'sourceType', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3 h-3"
                  />
                  <span>静态</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`source-${block.id}`}
                    value="动态"
                    checked={block.sourceType === '动态'}
                    onChange={(e) => handleBlockChange(block.id, 'sourceType', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3 h-3"
                  />
                  <span>动态</span>
                </label>
              </div>
            </div>
            
            {/* 显示内容 */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">内容：</span>
              <select
                value={block.contentType || '文字'}
                onChange={(e) => handleBlockChange(block.id, 'contentType', e.target.value)}
                className="px-1.5 py-0.5 border border-gray-300 rounded text-xs bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="文字">📝 文字</option>
                <option value="图片">🖼️ 图片</option>
                <option value="视频">🎬 视频</option>
                {block.sourceType === '动态' && (
                  <option value="表单">📋 表单</option>
                )}
              </select>
            </div>

            {/* 根据内容类型显示额外配置入口 */}
            {renderContentConfig(block)}
          </>
        )}

        {/* 交互区块配置 */}
        {block.type === '交互' && (
          <>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="text-gray-600 font-medium mb-1">交互配置</div>
            </div>
            
            {/* 1. 目标表单选择 */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">目标表单：</span>
            </div>
            <select
              value={block.targetFormId || ''}
              onChange={(e) => {
                const formId = e.target.value;
                // 选择表单后，清空已选字段
                handleBlockChange(block.id, 'targetFormId', formId);
                if (onUpdateBlock) {
                  onUpdateBlock(block.id, { 
                    targetFormId: formId,
                    selectedFields: [],
                    targetFormName: forms?.find(f => f.id === formId)?.name || ''
                  });
                }
              }}
              className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-xs bg-white mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">-- 选择表单 --</option>
              {(forms || [])
                .filter(f => f.category === '对象表' || f.type === '对象表单' || f.isSystemUserForm === true)
                .map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                ))
              }
            </select>
            
            {/* 2. 输入字段选择 - 仅当选择了目标表单后显示 */}
            {block.targetFormId && (
              <div className="mt-2">
                <div className="text-gray-500 text-xs mb-1">输入字段：</div>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-1 bg-gray-50">
                  {(() => {
                    const form = (forms || []).find(f => f.id === block.targetFormId);
                    if (!form || !form.structure?.fields) {
                      return <div className="text-xs text-gray-400 p-1">无字段</div>;
                    }
                    
                    const formFields = form.structure.fields;
                    const primaryKeyId = form.structure.primaryKey;
                    const selectedFields = block.selectedFields || [];
                    
                    return formFields.map(ff => {
                      const field = (fields || []).find(f => f.id === ff.fieldId);
                      const isPrimaryKey = ff.fieldId === primaryKeyId;
                      const isSelected = isPrimaryKey || selectedFields.includes(ff.fieldId);
                      
                      return (
                        <label 
                          key={ff.fieldId} 
                          className="flex items-center space-x-1 p-0.5 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isPrimaryKey}
                            onChange={(e) => {
                              if (isPrimaryKey) return;
                              const newSelected = e.target.checked
                                ? [...selectedFields, ff.fieldId]
                                : selectedFields.filter(id => id !== ff.fieldId);
                              onUpdateBlock(block.id, { selectedFields: newSelected });
                            }}
                            className="w-3 h-3"
                          />
                          <span className={`text-xs ${isPrimaryKey ? 'text-blue-600 font-medium' : ''}`}>
                            {field?.name || ff.fieldId}
                            {isPrimaryKey && ' (主键)'}
                          </span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            
            {/* 3. 样式模式选择 */}
            <div className="mt-2">
              <div className="text-gray-500 text-xs mb-1">样式模式：</div>
              <div className="flex space-x-3">
                <label className="flex items-center space-x-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name={`styleMode-${block.id}`}
                    value="default"
                    checked={(block.styleMode || 'default') === 'default'}
                    onChange={(e) => onUpdateBlock(block.id, { styleMode: 'default' })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">默认样式</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name={`styleMode-${block.id}`}
                    value="custom"
                    checked={block.styleMode === 'custom'}
                    onChange={(e) => onUpdateBlock(block.id, { styleMode: 'custom' })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">自行设计</span>
                </label>
              </div>
            </div>
            
            {/* 4. 交互目的选择 */}
            <div className="mt-2">
              <div className="text-gray-500 text-xs mb-1">交互目的：</div>
              <div className="space-y-1">
                <label className="flex items-center space-x-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={block.purposeSave !== false}
                    onChange={(e) => onUpdateBlock(block.id, { purposeSave: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">存入数据</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={block.purposeFlow === true}
                    onChange={(e) => onUpdateBlock(block.id, { purposeFlow: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">启动流程</span>
                </label>
              </div>
            </div>
            
            {/* 5. 关联流程选择 - 仅当选择了"启动流程"时显示 */}
            {block.purposeFlow && (
              <div className="mt-2">
                <div className="text-gray-500 text-xs mb-1">关联流程：</div>
                <select
                  value={block.linkedFlowId || ''}
                  onChange={(e) => {
                    const flowId = e.target.value || null;
                    const flow = (dataFlows || []).find(f => f.id === flowId);
                    onUpdateBlock(block.id, { 
                      linkedFlowId: flowId,
                      linkedFlowName: flow?.name || ''
                    });
                  }}
                  className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-xs bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">-- 选择流程 --</option>
                  {(dataFlows || []).map(flow => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name} ({flow.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* 6. 生成子区块按钮 - 仅当选择了"自行设计样式"且有选中字段时显示 */}
            {block.styleMode === 'custom' && block.targetFormId && (block.selectedFields?.length > 0 || block.targetFormId) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGenerateChildBlocks) {
                    onGenerateChildBlocks(block.id);
                  }
                }}
                className="w-full mt-2 px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                🔧 生成子区块
              </button>
            )}
            
            {/* 配置状态显示 */}
            {block.targetFormId && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="text-blue-700">
                  <div>表单：{block.targetFormName || block.targetFormId}</div>
                  <div>字段：{(block.selectedFields?.length || 0) + 1} 个（含主键）</div>
                  <div>样式：{block.styleMode === 'custom' ? '自行设计' : '默认样式'}</div>
                  <div>目的：
                    {block.purposeSave !== false && '存入数据'}
                    {block.purposeSave !== false && block.purposeFlow && ' + '}
                    {block.purposeFlow && '启动流程'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 按钮区块配置 */}
        {block.type === '按钮' && (
          <>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="text-gray-600 font-medium mb-1">按钮配置</div>
            </div>
            
            {/* 按钮编号 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">按钮编号：</span>
              <span className="text-blue-600 font-mono font-medium">{block.id}</span>
            </div>
            
            {/* 按钮类型显示 */}
            {block.buttonType && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">按钮类型：</span>
                <span className="text-orange-600 font-medium">
                  {window.ButtonRegistry?.get(block.buttonType)?.label || block.buttonType}
                </span>
              </div>
            )}
            
            {/* 按钮文字显示 */}
            {block.buttonText && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">按钮文字：</span>
                <span className="text-gray-700">{block.buttonText}</span>
              </div>
            )}
            
            {/* 配置按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setButtonConfigBlock(block);
                setButtonConfigOpen(true);
              }}
              className="w-full px-2 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs font-medium"
            >
              {block.buttonType ? '⚙️ 修改按钮配置' : '⚙️ 配置按钮'}
            </button>
            
            {/* 流程按钮配置了对话框或多项选择时显示生成子区块按钮 */}
            {block.buttonType === 'flow' && block.buttonConfig && (
              (block.buttonConfig.paramMode === 'dialog' && block.buttonConfig.dialogFormId) ||
              (block.buttonConfig.paramMode === 'selection' && block.buttonConfig.attrTableId && (block.buttonConfig.attrFieldId || block.buttonConfig.cascadeFromField))
            ) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGenerateFlowButtonChildBlocks) {
                    onGenerateFlowButtonChildBlocks(block.id);
                  }
                }}
                className="w-full mt-2 px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                🔧 生成子区块
              </button>
            )}
            
            {/* 未配置提示 */}
            {!block.buttonType && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                <div className="flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>按钮尚未配置，请点击上方按钮进行配置</span>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* 设为模板按钮 */}
        {onSaveAsTemplate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveAsTemplate(block);
            }}
            className="w-full mt-2 px-2 py-1 text-orange-600 border border-orange-300 rounded hover:bg-orange-50 text-xs"
          >
            设为模板
          </button>
        )}
        
        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className="w-full mt-2 px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 text-xs"
        >
          删除区块
        </button>
      </div>
    );
  };

  // 渲染内容类型的额外配置
  const renderContentConfig = (block) => {
    const contentType = block.contentType || '文字';
    const sourceType = block.sourceType || '静态';

    switch (contentType) {
      case '文字':
        return (
          <div className="mt-1 p-1.5 bg-white rounded border border-gray-200">
            <div className="text-gray-400 text-center text-xs">
              {sourceType === '静态' ? '双击区块编辑文字' : '在样式面板绑定字段'}
            </div>
          </div>
        );
      
      case '图片':
        return (
          <div className="mt-1 p-1.5 bg-white rounded border border-gray-200">
            {sourceType === '静态' ? (
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-1">
                  {block.imageUrl ? '已上传图片' : '尚未上传图片'}
                </div>
                <label className="inline-block px-2 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-xs">
                  选择图片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // 触发图片上传事件
                        const event = new CustomEvent('blockImageUpload', {
                          detail: { blockId: block.id, file }
                        });
                        window.dispatchEvent(event);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </div>
            ) : (
              <div className="text-gray-400 text-center text-xs">
                在样式面板绑定图片字段
              </div>
            )}
          </div>
        );
      
      case '视频':
        return (
          <div className="mt-1 p-1.5 bg-white rounded border border-gray-200">
            {sourceType === '静态' ? (
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-1">
                  {block.videoUrl ? '已上传视频' : '尚未上传视频'}
                </div>
                <label className="inline-block px-2 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-xs">
                  选择视频
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // 触发视频上传事件
                        const event = new CustomEvent('blockVideoUpload', {
                          detail: { blockId: block.id, file }
                        });
                        window.dispatchEvent(event);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </div>
            ) : (
              <div className="text-gray-400 text-center text-xs">
                在样式面板绑定视频字段
              </div>
            )}
          </div>
        );
      
      case '表单':
        return (
          <div className="mt-1 p-1.5 bg-white rounded border border-gray-200">
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">
                {block.formConfig?.formId ? 
                  `已配置: ${block.formConfig.displayFields?.length || 0}个字段` : 
                  '尚未配置表单'
                }
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // 触发表单配置事件
                  window.dispatchEvent(new CustomEvent('openFormConfig', {
                    detail: { blockId: block.id }
                  }));
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                配置表单
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* 标题栏 */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <span className="font-medium text-gray-700">区块列表</span>
        <button
          onClick={onAddBlock}
          className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center text-xl"
          title="添加区块"
        >
          +
        </button>
      </div>
      
      {/* 区块列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {blocks.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            暂无区块<br/>点击上方 + 添加
          </div>
        ) : (
          <div className="space-y-1">
            {blocks.map(block => (
              <div key={block.id} className="border border-gray-200 rounded">
                {/* 区块标题行 */}
                <div
                  className={`flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-50 ${
                    selectedBlockId === block.id ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => onSelectBlock(block.id)}
                >
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${getTypeStyle(block.type)}`}></span>
                    <span className={`font-mono text-sm ${
                      selectedBlockId === block.id ? 'text-blue-600 font-semibold' : 'text-gray-700'
                    }`}>
                      {block.id}
                    </span>
                    {block.type === '显示' && block.contentType && (
                      <span className="text-xs">{getContentIcon(block.contentType)}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(block.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    {expandedBlocks[block.id] ? '▲' : '▼'}
                  </button>
                </div>
                
                {/* 展开的配置面板 */}
                {expandedBlocks[block.id] && renderBlockConfig(block)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 底部统计 */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        共 {blocks.length} 个区块
      </div>
      
      {/* 按钮配置弹窗 */}
      {buttonConfigOpen && buttonConfigBlock && window.ButtonConfig && (
        (() => {
          console.log('=== BlockList 传递给 ButtonConfig 的 blocks ===');
          console.log('blocks:', blocks);
          console.log('blocks.length:', blocks?.length);
          return (
            <ButtonConfig
              isOpen={buttonConfigOpen}
              onClose={() => {
                setButtonConfigOpen(false);
                setButtonConfigBlock(null);
              }}
              block={buttonConfigBlock}
              onSave={(updatedBlock) => {
                if (onUpdateBlock) {
                  onUpdateBlock(buttonConfigBlock.id, {
                    buttonType: updatedBlock.buttonType,
                    buttonText: updatedBlock.buttonText,
                    buttonConfig: updatedBlock.buttonConfig
                  });
                }
                setButtonConfigOpen(false);
                setButtonConfigBlock(null);
              }}
              projectId={projectId}
              roleId={roleId}
              blocks={blocks}
            />
          );
        })()
      )}
    </div>
  );
}

window.BlockList = BlockList;
