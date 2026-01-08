// 数据处理和模态框
// 负责加载数据、处理数据录入、渲染数据录入弹窗等

export const createDataHandlers = (props) => {
  const {
    projectId,
    pageId,
    roleId,
    blocks,
    forms,
    fields,
    formDataCache,
    setFormDataCache,
    dataEntryModal,
    setDataEntryModal,
    entryFormData,
    setEntryFormData,
    evaluateExpression,
    loadAllFormData
  } = props;

  // 加载所有表单数据
  const loadAllFormDataInternal = async (blockList, formList) => {
    const newCache = {};

    // 找出所有配置了表单的区块
    const formBlocks = blockList.filter(b =>
      b.contentType === '表单' && b.formConfig && b.formConfig.formId
    );

    for (const block of formBlocks) {
      const formId = block.formConfig.formId;
      try {
        // 查找表单获取数据
        const form = formList.find(f => f.id === formId);
        if (form) {
          // 如果是衍生表，需要从源表计算
          if (form.subType === '衍生表') {
            const sourceFormId = form.structure?.sourceFormId;
            const sourceForm = formList.find(f => f.id === sourceFormId);
            if (sourceForm && sourceForm.data) {
              // 计算衍生字段
              const derivedFields = form.structure?.derivedFields || [];
              const computedData = sourceForm.data.map(record => {
                const newRecord = { ...record };
                derivedFields.forEach(df => {
                  newRecord[df.fieldId] = evaluateExpression(df.expression, record, derivedFields, df, form);
                });
                return newRecord;
              });
              newCache[formId] = computedData;
            } else {
              newCache[formId] = [];
            }
          } else {
            newCache[formId] = form.data || [];
          }
        }
      } catch (error) {
        console.error('加载表单数据失败:', formId, error);
        newCache[formId] = [];
      }
    }

    setFormDataCache(newCache);
  };

  // 处理数据录入提交（基础表）
  const handleDataEntrySubmit = async () => {
    const formId = dataEntryModal.formId;
    const blockId = dataEntryModal.blockId;  // 获取触发的区块ID
    const writeOnSubmit = dataEntryModal.writeOnSubmit !== false; // 默认为true
    if (!formId) return;

    try {
      // 根据配置决定是否写入数据
      if (writeOnSubmit) {
        const savedRecord = await window.dndDB.addFormData(projectId, formId, entryFormData);
        console.log('数据已写入表单:', formId);
      } else {
        console.log('跳过数据写入（writeOnSubmit=false）');
      }

      // 关闭弹窗
      setDataEntryModal({ show: false, formId: null, formName: null, blockId: null, writeOnSubmit: true });
      const submittedData = { ...entryFormData }; // 保存一份数据副本
      setEntryFormData({});

      // 触发数据流程事件
      if (blockId) {
        console.log('');
        console.log('========== 基础表交互区块触发流程 ==========');
        console.log('区块ID:', blockId);
        console.log('页面ID:', pageId);
        console.log('录入的数据:', submittedData);
        console.log('表单ID:', formId);
        console.log('写入数据:', writeOnSubmit ? '是' : '否（仅校验）');
        console.log('=============================================');
        console.log('');

        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: blockId,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId,
            inputData: submittedData,
            inputFormId: formId
          }
        }));
      } else {
        // 没有关联流程时，显示成功提示并刷新
        if (writeOnSubmit) {
          alert('数据添加成功！');
          await loadAllFormData(blocks, forms);
          window.location.reload();
        } else {
          alert('提交成功！（未配置数据流程）');
        }
      }

    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 渲染数据录入弹窗（支持基础表和属性表）
  const renderDataEntryModal = () => {
    if (!dataEntryModal.show) return null;

    const form = forms.find(f => f.id === dataEntryModal.formId);
    if (!form) return null;

    // 判断是否为属性表
    const isAttributeForm = form.type === '属性表单';

    // 从角色字段中获取字段详情（名称等）
    const getFieldDetail = (fieldId) => {
      return fields.find(f => f.id === fieldId);
    };

    // ==================== 属性表弹窗 ====================
    if (isAttributeForm) {
      const levelFields = form.structure?.levelFields || [];
      const levelCount = form.structure?.levels || 0;
      const existingData = form.data || [];

      // 获取某级别的字段ID
      const getLevelFieldId = (level) => {
        const lf = levelFields.find(f => f.level === level);
        return lf?.fieldId;
      };

      // 获取某级别在选定上级路径下的可选值
      const getLevelOptions = (level) => {
        const fieldId = getLevelFieldId(level);
        if (!fieldId) return [];

        let filteredData = existingData;

        // 按上级路径过滤
        for (let i = 1; i < level; i++) {
          const parentFieldId = getLevelFieldId(i);
          const parentValue = entryFormData[`_level_${i}`];
          if (parentValue) {
            filteredData = filteredData.filter(d => d[parentFieldId] === parentValue);
          }
        }

        // 提取当前级别的唯一值
        const options = [...new Set(filteredData.map(d => d[fieldId]))].filter(v => v);
        return options;
      };

      // 处理级别选择
      const handleLevelChange = (level, value) => {
        // 清空下级选择
        const newFormData = { ...entryFormData };
        for (let i = level + 1; i <= levelCount; i++) {
          delete newFormData[`_level_${i}`];
        }
        newFormData[`_level_${level}`] = value;
        setEntryFormData(newFormData);
      };

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              录入属性数据 - {form.name}
            </h3>

            {/* 级联选择器 */}
            <div style={{ marginBottom: '16px' }}>
              {Array.from({ length: levelCount }, (_, i) => {
                const level = i + 1;
                const fieldId = getLevelFieldId(level);
                const fieldDetail = getFieldDetail(fieldId);
                const options = getLevelOptions(level);
                const currentValue = entryFormData[`_level_${level}`];
                const parentValue = level > 1 ? entryFormData[`_level_${level - 1}`] : true;

                // 如果上级未选择，禁用当前级别
                const isDisabled = !parentValue;

                return (
                  <div key={level} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      {fieldDetail?.name || `级别${level}`}：
                    </label>
                    <select
                      value={currentValue || ''}
                      onChange={(e) => handleLevelChange(level, e.target.value)}
                      disabled={isDisabled}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: isDisabled ? '#f3f4f6' : '#fff',
                        color: isDisabled ? '#9ca3af' : '#374151',
                      }}
                    >
                      <option value="">请选择{fieldDetail?.name || `级别${level}`}</option>
                      {options.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setDataEntryModal({ show: false, formId: null, formName: null, blockId: null, writeOnSubmit: true })}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleDataEntrySubmit}
                disabled={!entryFormData[`_level_${levelCount}`]}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !entryFormData[`_level_${levelCount}`] ? '#d1d5db' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !entryFormData[`_level_${levelCount}`] ? 'not-allowed' : 'pointer',
                }}
              >
                确认录入
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ==================== 基础表弹窗 ====================
    const formFields = form.structure?.fields || [];
    const displayFields = formFields.filter(f => f.isSourceField);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '400px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
            录入数据 - {form.name}
          </h3>

          {/* 字段输入 */}
          {displayFields.map(field => {
            const fieldDetail = getFieldDetail(field.fieldId);
            const fieldType = fieldDetail?.type || '文本';

            return (
              <div key={field.fieldId} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  {fieldDetail?.name || field.fieldId}：
                </label>
                <input
                  type={fieldType === '密码' ? 'password' : 'text'}
                  value={entryFormData[field.fieldId] || ''}
                  onChange={(e) => setEntryFormData(prev => ({
                    ...prev,
                    [field.fieldId]: e.target.value
                  }))}
                  placeholder={`请输入${fieldDetail?.name || ''}`}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                  }}
                />
              </div>
            );
          })}

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => setDataEntryModal({ show: false, formId: null, formName: null, blockId: null, writeOnSubmit: true })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={handleDataEntrySubmit}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              确认录入
            </button>
          </div>
        </div>
      </div>
    );
  };

  return {
    loadAllFormData: loadAllFormDataInternal,
    handleDataEntrySubmit,
    renderDataEntryModal
  };
};
