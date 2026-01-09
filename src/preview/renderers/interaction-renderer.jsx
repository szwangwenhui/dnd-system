// 交互区块渲染器
// 负责渲染交互区块和子区块，以及处理相关的提交逻辑

window.createInteractionRenderer = (props) => {
  const {
    forms,
    fields,
    blocks,
    projectId,
    pageId,
    roleId,
    interactionInputData,
    setInteractionInputData,
    childBlockInputData,
    setChildBlockInputData,
    flowDialogData,
    setFlowDialogData,
    flowSelectionData,
    setFlowSelectionData,
    loadAllFormData
  } = props;

  // 富文本编辑器状态
  const [richTextEditor, setRichTextEditor] = React.useState({
    isOpen: false,
    blockId: null,
    fieldId: null,
    fieldName: '',
    content: ''
  });

  // 提交状态（从外部传入）
  const { setSubmitting } = props;
  const [submitting, setSubmittingState] = React.useState(false);

  // 处理交互区块提交
  const handleInteractionSubmit = async (block) => {
    console.log('[InteractionRenderer] handleInteractionSubmit 调用, block:', block);
    const formId = block.targetFormId;
    if (!formId) {
      alert('未配置目标表单');
      return;
    }

    const inputData = interactionInputData[block.id] || {};
    const purposeSave = block.purposeSave !== false;
    const purposeFlow = block.purposeFlow === true;

    console.log('[InteractionRenderer] inputData:', inputData);
    console.log('[InteractionRenderer] forms:', forms?.length);

    setSubmitting(true);

    try {
      // 获取表单结构
      const form = forms.find(f => f.id === formId);
      console.log('[InteractionRenderer] 找到的表单:', form);
      if (!form || !form.structure) {
        throw new Error('表单结构不存在');
      }

      const primaryKeyId = form.structure.primaryKey;
      const primaryKeyValue = inputData[primaryKeyId];
      console.log('[InteractionRenderer] primaryKeyId:', primaryKeyId, 'primaryKeyValue:', primaryKeyValue);

      // 存入数据
      if (purposeSave) {
        // 检查数据库中是否已存在该主键的记录
        const formData = await window.dndDB.getFormData(projectId, formId);
        const existingRecord = primaryKeyId
          ? formData.find(d => d[primaryKeyId] === primaryKeyValue)
          : formData.find(d => d.id === primaryKeyValue);

        if (existingRecord) {
          // 如果记录存在，更新数据
          console.log('[InteractionRenderer] 尝试更新数据, formId:', formId, 'primaryKeyValue:', primaryKeyValue);
          await window.dndDB.updateFormData(projectId, formId, primaryKeyValue, inputData);
          console.log('数据已更新到表单:', formId, '主键:', primaryKeyValue);
        } else {
          // 如果记录不存在，添加新数据
          console.log('[InteractionRenderer] 尝试添加新数据');
          await window.dndDB.addFormData(projectId, formId, inputData);
          console.log('数据已写入表单:', formId);
        }
      }

      // 启动流程
      if (purposeFlow && block.linkedFlowId) {
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: block.id,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId,
            inputData: inputData,
            inputFormId: formId
          }
        }));
        console.log('已触发流程:', block.linkedFlowId);
      }

      // 清空输入
      setInteractionInputData(prev => ({
        ...prev,
        [block.id]: {}
      }));

      // 刷新数据
      if (purposeSave) {
        await loadAllFormData(blocks, forms);
        alert('提交成功！');
      } else if (purposeFlow) {
        alert('已启动流程！');
      }

    } catch (error) {
      console.error('[InteractionRenderer] 提交失败:', error);
      alert('提交失败：' + error.message);
    } finally {
      setSubmitting(false);
      setSubmittingState && setSubmittingState(false);
    }
  };

  // 打开富文本编辑器
  const handleOpenRichTextEditor = (blockId, fieldId, fieldName) => {
    if (!window.RichTextEditor) {
      console.error('[InteractionRenderer] window.RichTextEditor 未定义');
      alert('富文本编辑器组件未加载，请刷新页面重试');
      return;
    }

    const currentContent = interactionInputData[blockId]?.[fieldId] || '';
    setRichTextEditor({
      isOpen: true,
      blockId: blockId,
      fieldId: fieldId,
      fieldName: fieldName,
      content: currentContent
    });
  };

  // 保存富文本内容
  const handleSaveRichText = (result) => {
    console.log('[InteractionRenderer] handleSaveRichText 调用, result:', result);

    // Quill版本返回 {html, text, isEmpty}
    let html = '';

    if (typeof result === 'string') {
      html = result;
    } else if (result && result.html) {
      html = result.html;
    } else if (result && typeof result === 'object') {
      html = String(result);
    }

    console.log('[InteractionRenderer] 保存的HTML:', html);

    setInteractionInputData(prev => ({
      ...prev,
      [richTextEditor.blockId]: {
        ...(prev[richTextEditor.blockId] || {}),
        [richTextEditor.fieldId]: html
      }
    }));
    setRichTextEditor(prev => ({ ...prev, isOpen: false }));
  };

  // 取消富文本编辑
  const handleCloseRichTextEditor = () => {
    setRichTextEditor(prev => ({ ...prev, isOpen: false }));
  };

  // 截取HTML文本（提取纯文本并截取前n个汉字）
  const truncateHtmlText = (html, maxChars = 20) => {
    if (!html) return '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    let text = tempDiv.textContent || tempDiv.innerText || '';

    if (text.length > maxChars) {
      text = text.substring(0, maxChars) + '...';
    }

    return text;
  };

  // 渲染交互区块
  const renderInteractionBlock = (block, blockStyle, contentStyle, PopupCloseButton, isPopupBlock = false) => {
    const style = block.style || {};
    const styleMode = block.styleMode || 'default';

    // 自行设计样式 - 只渲染容器，子区块单独渲染
    if (styleMode === 'custom') {
      const containerStyle = {
        ...blockStyle,
        backgroundColor: style.backgroundColor || '#f9fafb',
        position: 'relative',
      };

      return (
        <div key={block.id} style={containerStyle}>
          {PopupCloseButton && <PopupCloseButton />}
          {/* 子区块在外部单独渲染 */}
        </div>
      );
    }

    // 默认样式 - 显示完整的表单输入界面
    const hasCustomBg = style.backgroundColor && style.backgroundColor !== 'transparent';

    const containerStyle = {
      ...blockStyle,
      backgroundColor: hasCustomBg ? blockStyle.backgroundColor : '#ffffff',
      padding: contentStyle.paddingTop || 12,
      overflow: 'auto',
    };

    // 获取表单和字段信息
    const form = forms.find(f => f.id === block.targetFormId);
    // 获取表单的所有字段ID（包括主键）
    const primaryKeyId = form?.structure?.primaryKey;
    // 显示主键字段（如果主键不是自动生成的话）和用户选择的字段
    const selectedFieldIds = (block.selectedFields || []).filter(Boolean);
    // 始终添加主键字段（因为设计器中主键字段被禁用但不包含在selectedFields中）
    const allFieldIds = primaryKeyId
      ? [primaryKeyId, ...selectedFieldIds.filter(id => id !== primaryKeyId)]
      : selectedFieldIds;

    // 从内容样式中获取字体设置
    const labelFontSize = contentStyle.fontSize ? contentStyle.fontSize * 0.85 : 12;
    const inputFontSize = contentStyle.fontSize || 14;
    const titleFontSize = contentStyle.fontSize || 14;
    const textColor = contentStyle.color || '#374151';
    const labelColor = style.labelColor || '#6b7280';

    return (
      <div key={block.id} className={isPopupBlock ? 'popup-container' : ''} style={containerStyle}>
        {PopupCloseButton && <PopupCloseButton />}

        {/* 表单标题 */}
        <div style={{
          fontSize: titleFontSize,
          fontWeight: contentStyle.fontWeight || 'bold',
          marginBottom: '12px',
          color: textColor,
          fontFamily: contentStyle.fontFamily || 'inherit',
        }}>
          {block.targetFormName || form?.name || '数据录入'}
        </div>

        {/* 字段输入 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {allFieldIds.map(fieldId => {
            const field = fields.find(f => f.id === fieldId);
            const fieldType = field?.type || '文本';

            // 富文本字段特殊处理
            if (fieldType === '富文本') {
              const currentValue = interactionInputData[block.id]?.[fieldId] || '';
              // 处理富文本值，兼容对象和字符串格式
              const displayValue = typeof currentValue === 'object' && currentValue?.html
                ? currentValue.html
                : (typeof currentValue === 'string' ? currentValue : '');
              return (
                <div key={fieldId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <label style={{
                    width: '80px',
                    fontSize: labelFontSize,
                    color: labelColor,
                    textAlign: 'right',
                    flexShrink: 0,
                    fontFamily: contentStyle.fontFamily || 'inherit',
                    paddingTop: '6px',
                  }}>
                    {field?.name || fieldId}
                  </label>
                  <div
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: inputFontSize,
                      fontFamily: contentStyle.fontFamily || 'inherit',
                      minHeight: '80px',
                      cursor: 'pointer',
                      backgroundColor: displayValue ? '#f9fafb' : '#ffffff',
                    }}
                    onClick={() => handleOpenRichTextEditor(block.id, fieldId, field?.name || fieldId)}
                    title="点击打开富文本编辑器"
                  >
                    {displayValue ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: truncateHtmlText(displayValue, 20)
                        }}
                        style={{ color: '#374151' }}
                      />
                    ) : (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        点击编辑富文本内容...
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 普通字段
            return (
              <div key={fieldId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{
                  width: '80px',
                  fontSize: labelFontSize,
                  color: labelColor,
                  textAlign: 'right',
                  flexShrink: 0,
                  fontFamily: contentStyle.fontFamily || 'inherit',
                }}>
                  {field?.name || fieldId}
                </label>
                <input
                  type={fieldType === '密码' ? 'password' : 'text'}
                  value={interactionInputData[block.id]?.[fieldId] || ''}
                  onChange={(e) => {
                    setInteractionInputData(prev => ({
                      ...prev,
                      [block.id]: {
                        ...(prev[block.id] || {}),
                        [fieldId]: e.target.value
                      }
                    }));
                  }}
                  placeholder={`请输入${field?.name || ''}`}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: inputFontSize,
                    fontFamily: contentStyle.fontFamily || 'inherit',
                    outline: 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 提交按钮 - 如果hideSubmitButton为true则隐藏 */}
        {!block.hideSubmitButton && (
          <button
            onClick={() => handleInteractionSubmit(block)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              backgroundColor: style.buttonColor || '#3b82f6',
              color: style.buttonTextColor || '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: inputFontSize,
              fontWeight: 'bold',
              fontFamily: contentStyle.fontFamily || 'inherit',
              cursor: 'pointer',
            }}
          >
            确认提交
          </button>
        )}

        {/* 富文本编辑器 */}
        {richTextEditor.isOpen && window.RichTextEditor ? (
          <window.RichTextEditor
            isOpen={richTextEditor.isOpen}
            initialContent={richTextEditor.content}
            onSave={handleSaveRichText}
            onCancel={handleCloseRichTextEditor}
          />
        ) : richTextEditor.isOpen && !window.RichTextEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <div className="text-red-500 mb-4">富文本编辑器组件未加载</div>
              <div className="text-sm text-gray-500 mb-4">
                请检查网络连接并刷新页面
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                刷新页面
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 处理子区块提交
  const handleChildBlockSubmit = async (parentBlock) => {
    const formId = parentBlock.targetFormId;
    if (!formId) {
      alert('未配置目标表单');
      return;
    }

    // 收集所有子区块的输入数据
    const inputData = {};
    const childBlocks = blocks.filter(b => b.parentId === parentBlock.id);

    childBlocks.forEach(child => {
      if (child.subType === 'input' && child.fieldId) {
        const inputKey = `${parentBlock.id}-${child.fieldId}`;
        inputData[child.fieldId] = childBlockInputData[inputKey] || '';
      }
    });

    const purposeSave = parentBlock.purposeSave !== false;
    const purposeFlow = parentBlock.purposeFlow === true;

    try {
      // 获取表单结构
      const form = forms.find(f => f.id === formId);
      if (!form || !form.structure) {
        throw new Error('表单结构不存在');
      }

      const primaryKeyId = form.structure.primaryKey;
      const primaryKeyValue = inputData[primaryKeyId];
      console.log('[InteractionRenderer] primaryKeyId:', primaryKeyId, 'primaryKeyValue:', primaryKeyValue);

      // 存入数据
      if (purposeSave) {
        // 检查数据库中是否已存在该主键的记录
        const formData = await window.dndDB.getFormData(projectId, formId);
        const existingRecord = primaryKeyId
          ? formData.find(d => d[primaryKeyId] === primaryKeyValue)
          : formData.find(d => d.id === primaryKeyValue);

        if (existingRecord) {
          // 如果记录存在，更新数据
          console.log('[InteractionRenderer] 尝试更新数据, formId:', formId, 'primaryKeyValue:', primaryKeyValue);
          await window.dndDB.updateFormData(projectId, formId, primaryKeyValue, inputData);
          console.log('数据已更新到表单:', formId, '主键:', primaryKeyValue);
        } else {
          // 如果记录不存在，添加新数据
          console.log('[InteractionRenderer] 尝试添加新数据');
          await window.dndDB.addFormData(projectId, formId, inputData);
          console.log('数据已写入表单:', formId);
        }
      }

      // 启动流程
      if (purposeFlow && parentBlock.linkedFlowId) {
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: parentBlock.id,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId,
            inputData: inputData,
            inputFormId: formId
          }
        }));
        console.log('已触发流程:', parentBlock.linkedFlowId);
      }

      // 清空输入
      const keysToRemove = Object.keys(childBlockInputData).filter(k => k.startsWith(parentBlock.id));
      const newData = { ...childBlockInputData };
      keysToRemove.forEach(k => delete newData[k]);
      setChildBlockInputData(newData);

      // 刷新数据
      if (purposeSave) {
        await loadAllFormData(blocks, forms);
        alert('提交成功！');
      } else if (purposeFlow) {
        alert('已启动流程！');
      }

    } catch (error) {
      alert('提交失败：' + error.message);
    }
  };

  // 处理流程按钮子区块提交（对话框方式）
  const handleFlowButtonSubmit = async (parentBlock, submitBlock) => {
    if (!parentBlock || parentBlock.type !== '按钮') return;

    const config = parentBlock.buttonConfig || {};
    const flowId = config.flowId || submitBlock.flowId;
    const flowName = config.flowName || submitBlock.flowName;

    if (!flowId) {
      alert('未关联流程');
      return;
    }

    // 收集对话框输入数据
    const inputData = {};
    const childBlocks = blocks.filter(b => b.parentId === parentBlock.id);

    childBlocks.forEach(child => {
      if (child.subType === 'flowInput' && child.fieldId) {
        const inputKey = `flow-${parentBlock.id}-${child.fieldId}`;
        inputData[child.fieldId] = flowDialogData[inputKey] || '';
      }
    });

    console.log('流程按钮提交 - 对话框数据:', inputData);

    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: flowId,
          flowName: flowName,
          params: { formData: inputData },
          context: { projectId, pageId, roleId, blockId: parentBlock.id },
          showLoading: config.showLoading !== false,
          showResult: config.showResult !== false
        }
      }));

      // 清空输入
      const keysToRemove = Object.keys(flowDialogData).filter(k => k.startsWith(`flow-${parentBlock.id}`));
      const newData = { ...flowDialogData };
      keysToRemove.forEach(k => delete newData[k]);
      setFlowDialogData(newData);

      alert('已启动流程：' + (flowName || flowId));
    } catch (error) {
      alert('启动流程失败：' + error.message);
    }
  };

  // 处理流程按钮选项按钮点击（按钮组方式，点击即触发）
  const handleFlowOptionButtonClick = async (block) => {
    const parentBlock = blocks.find(b => b.id === block.parentId);
    if (!parentBlock) return;

    const config = parentBlock.buttonConfig || {};
    const flowId = config.flowId || block.flowId;
    const flowName = config.flowName || block.flowName;

    if (!flowId) {
      alert('未关联流程');
      return;
    }

    const selectedValue = block.optionValue;
    console.log('流程按钮点击 - 选项:', selectedValue);

    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: flowId,
          flowName: flowName,
          params: { selection: selectedValue },
          context: { projectId, pageId, roleId, blockId: parentBlock.id },
          showLoading: config.showLoading !== false,
          showResult: config.showResult !== false
        }
      }));

      alert('已选择 "' + selectedValue + '" 并启动流程');
    } catch (error) {
      alert('启动流程失败：' + error.message);
    }
  };

  // 处理流程按钮多选提交（勾选框/级联方式）
  const handleFlowSelectionSubmit = async (parentBlock, submitBlock) => {
    if (!parentBlock || parentBlock.type !== '按钮') return;

    const config = parentBlock.buttonConfig || {};
    const flowId = config.flowId || submitBlock.flowId;
    const flowName = config.flowName || submitBlock.flowName;

    if (!flowId) {
      alert('未关联流程');
      return;
    }

    const selectedValue = flowSelectionData;

    if (!selectedValue || (Array.isArray(selectedValue) && selectedValue.length === 0)) {
      alert('请至少选择一个选项');
      return;
    }

    console.log('流程按钮提交 - 选择数据:', selectedValue);

    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: flowId,
          flowName: flowName,
          params: { selection: selectedValue },
          context: { projectId, pageId, roleId, blockId: parentBlock.id },
          showLoading: config.showLoading !== false,
          showResult: config.showResult !== false
        }
      }));

      // 清空选择
      setFlowSelectionData(config.selectMode === 'multiple' ? [] : '');

      alert('已启动流程：' + (flowName || flowId));
    } catch (error) {
      alert('启动流程失败：' + error.message);
    }
  };

  // 渲染子区块（提示/输入/级联/提交）
  const renderChildBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    const subType = block.subType;
    const style = block.style || {};

    // 从内容样式获取字体设置
    const fontSize = contentStyle.fontSize || style.fontSize || 14;
    const fontFamily = contentStyle.fontFamily || style.fontFamily || 'inherit';
    const color = contentStyle.color || style.color || '#333333';
    const textAlign = contentStyle.textAlign || style.textAlign || 'left';

    if (subType === 'prompt') {
      // 提示区块 - 显示字段名
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'right' ? 'flex-end' : (textAlign === 'center' ? 'center' : 'flex-start'),
          fontSize: fontSize,
          fontFamily: fontFamily,
          color: color,
          padding: `${contentStyle.paddingTop || 8}px ${contentStyle.paddingRight || 8}px ${contentStyle.paddingBottom || 8}px ${contentStyle.paddingLeft || 8}px`,
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          {block.content}
        </div>
      );
    }

    if (subType === 'input') {
      // 填写区块 - 显示输入框
      const inputKey = `${block.parentId}-${block.fieldId}`;

      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <input
            type="text"
            value={childBlockInputData[inputKey] || ''}
            onChange={(e) => {
              setChildBlockInputData(prev => ({
                ...prev,
                [inputKey]: e.target.value
              }));
            }}
            placeholder={block.placeholder || '请输入'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          />
        </div>
      );
    }

    if (subType === 'cascader') {
      // 级联下拉区块 - 简化版，后续可扩展
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <select
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          >
            <option value="">请选择属性</option>
            {/* 属性选项需要从属性表加载 */}
          </select>
        </div>
      );
    }

    if (subType === 'submit') {
      // 提交按钮区块
      const parentBlock = blocks.find(b => b.id === block.parentId);

      return (
        <div
          key={block.id}
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            if (parentBlock) {
              handleChildBlockSubmit(parentBlock);
            }
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          {block.content || '确认提交'}
        </div>
      );
    }

    // ===== 流程按钮子区块类型 =====
    if (subType === 'flowPrompt') {
      // 流程对话框 - 提示区块
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'right' ? 'flex-end' : (textAlign === 'center' ? 'center' : 'flex-start'),
          fontSize: fontSize,
          fontFamily: fontFamily,
          color: color,
          padding: `${contentStyle.paddingTop || 8}px ${contentStyle.paddingRight || 8}px ${contentStyle.paddingBottom || 8}px ${contentStyle.paddingLeft || 8}px`,
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          {block.content}
        </div>
      );
    }

    if (subType === 'flowInput') {
      // 流程对话框 - 输入区块
      const inputKey = `flow-${block.parentId}-${block.fieldId}`;

      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <input
            type="text"
            value={flowDialogData[inputKey] || ''}
            onChange={(e) => {
              setFlowDialogData(prev => ({
                ...prev,
                [inputKey]: e.target.value
              }));
            }}
            placeholder={block.placeholder || '请输入'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          />
        </div>
      );
    }

    if (subType === 'flowSubmit') {
      // 流程提交按钮
      const parentBlock = blocks.find(b => b.id === block.parentId);
      const config = parentBlock?.buttonConfig || {};

      return (
        <div
          key={block.id}
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            if (parentBlock) {
              // 根据参数模式调用不同的处理函数
              if (config.paramMode === 'dialog') {
                handleFlowButtonSubmit(parentBlock, block);
              } else if (config.paramMode === 'selection') {
                handleFlowSelectionSubmit(parentBlock, block);
              }
            }
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          {block.content || '确认提交'}
        </div>
      );
    }

    if (subType === 'flowCheckbox') {
      // 流程多选 - 勾选框
      const checkKey = `flow-check-${block.parentId}-${block.optionValue}`;
      const isChecked = flowSelectionData.includes ? flowSelectionData.includes(block.optionValue) : flowSelectionData === block.optionValue;

      return (
        <div
          key={block.id}
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            const selectMode = block.selectMode || 'single';
            if (selectMode === 'multiple') {
              // 多选模式
              setFlowSelectionData(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                if (arr.includes(block.optionValue)) {
                  return arr.filter(v => v !== block.optionValue);
                } else {
                  return [...arr, block.optionValue];
                }
              });
            } else {
              // 单选模式
              setFlowSelectionData(block.optionValue);
            }
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          <input
            type={block.selectMode === 'multiple' ? 'checkbox' : 'radio'}
            checked={isChecked}
            readOnly
            style={{ marginRight: 8 }}
          />
          <span>{block.content}</span>
        </div>
      );
    }

    if (subType === 'flowOptionButton') {
      // 流程多选 - 按钮选项（点击即触发）
      return (
        <div
          key={block.id}
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            // 按钮组模式：点击即触发流程
            handleFlowOptionButtonClick(block);
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          {block.content}
        </div>
      );
    }

    if (subType === 'flowCascade') {
      // 流程多选 - 级联下拉（简化版）
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <select
            value={flowSelectionData || ''}
            onChange={(e) => setFlowSelectionData(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          >
            <option value="">请选择</option>
            {/* 级联选项需要从属性表加载 */}
          </select>
        </div>
      );
    }

    // 默认渲染
    return (
      <div key={block.id} style={{
        ...blockStyle,
        fontSize: fontSize,
        fontFamily: fontFamily,
        color: color,
        padding: `${contentStyle.paddingTop || 8}px ${contentStyle.paddingRight || 8}px ${contentStyle.paddingBottom || 8}px ${contentStyle.paddingLeft || 8}px`,
      }}>
        {PopupCloseButton && <PopupCloseButton />}
        {block.content}
      </div>
    );
  };

  return {
    renderInteractionBlock,
    renderChildBlock,
    handleInteractionSubmit,
    handleChildBlockSubmit,
    handleFlowButtonSubmit,
    handleFlowOptionButtonClick,
    handleFlowSelectionSubmit,
    submitting  // 导出提交状态
  };
};
