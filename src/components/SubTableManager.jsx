// 子表管理器组件
function SubTableManager({ projectId, form, fields, forms, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 0: 选择操作目标表(入口1), 1: 选择截取方式, 2: 配置横向, 3: 配置纵向, 4: 确认
  const [sourceFormId, setSourceFormId] = React.useState('');
  const [subType, setSubType] = React.useState(''); // 'horizontal', 'vertical', 'mixed'
  
  // 横向截取配置
  const [selectedFields, setSelectedFields] = React.useState([]);
  
  // 纵向截取配置
  const [criteriaFieldId, setCriteriaFieldId] = React.useState('');
  const [operator, setOperator] = React.useState('equals'); // 'equals' (单选/多选), 'range' (范围)
  const [selectedValues, setSelectedValues] = React.useState([]);
  const [rangeMin, setRangeMin] = React.useState('');
  const [rangeMax, setRangeMax] = React.useState('');
  
  // 表单名称
  const [tableName, setTableName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // 初始化：如果是入口2（从表单详情页进入），直接使用该表单
  React.useEffect(() => {
    if (form && form.id) {
      setSourceFormId(form.id);
      setStep(1); // 跳过选择操作目标表步骤
    }
  }, [form]);

  // 过滤出对象表单
  const objectForms = forms.filter(f => f.type === '对象表单' && !f.subType);
  const sourceForm = sourceFormId ? forms.find(f => f.id === sourceFormId) : null;
  
  // 获取源表单的字段（排除主键）
  const sourceFormFields = React.useMemo(() => {
    if (!sourceForm) return [];
    const formFieldIds = (sourceForm.structure?.fields || []).map(f => f.fieldId);
    return fields.filter(f => formFieldIds.includes(f.id) && f.id !== sourceForm.structure?.primaryKey);
  }, [sourceForm, fields]);

  // 属性字段列表
  const attributeFields = React.useMemo(() => {
    return sourceFormFields.filter(f => f.type === '属性表单');
  }, [sourceFormFields]);

  // 非主键非属性字段列表
  const nonAttributeFields = React.useMemo(() => {
    return sourceFormFields.filter(f => f.type !== '属性表单');
  }, [sourceFormFields]);

  // 处理横向字段选择
  const handleFieldToggle = (fieldId) => {
    const field = sourceFormFields.find(f => f.id === fieldId);
    
    if (field.type === '属性表单') {
      // 属性字段需要遵循一体化原则
      const attributeLevels = window.dndDB.getAttributeFieldLevels(fieldId, fields);
      const allLevelFieldIds = attributeLevels.map(l => l.fieldId);
      
      if (selectedFields.includes(fieldId)) {
        // 取消选择，取消所有层级
        setSelectedFields(prev => prev.filter(id => !allLevelFieldIds.includes(id)));
      } else {
        // 选中，选中所有层级
        setSelectedFields(prev => {
          const newSelected = [...prev];
          allLevelFieldIds.forEach(fid => {
            if (!newSelected.includes(fid)) {
              newSelected.push(fid);
            }
          });
          return newSelected;
        });
      }
    } else {
      // 非属性字段单独处理
      setSelectedFields(prev =>
        prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
      );
    }
  };

  // 处理纵向字段选择
  const handleCriteriaFieldChange = (fieldId) => {
    setCriteriaFieldId(fieldId);
    setOperator('equals');
    setSelectedValues([]);
    setRangeMin('');
    setRangeMax('');
  };

  // 获取纵向字段的所有可能值
  const criteriaFieldValues = React.useMemo(() => {
    if (!sourceForm || !criteriaFieldId) return [];
    const uniqueValues = [...new Set(
      (sourceForm.data || []).map(record => record[criteriaFieldId]).filter(v => v !== undefined && v !== null)
    )].sort();
    return uniqueValues;
  }, [sourceForm, criteriaFieldId]);

  // 处理值的选择
  const handleValueToggle = (value) => {
    setSelectedValues(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  // 生成默认表单名称
  React.useEffect(() => {
    if (sourceForm && subType === 'vertical' && criteriaFieldId) {
      const criteriaField = sourceFormFields.find(f => f.id === criteriaFieldId);
      if (criteriaField) {
        const defaultName = window.dndDB.generateSubTableName(
          sourceForm.name,
          { field: criteriaField, values: selectedValues.length > 0 ? selectedValues : criteriaFieldValues }
        );
        setTableName(defaultName);
      }
    } else if (sourceForm) {
      setTableName(`${sourceForm.name}-子表`);
    }
  }, [sourceForm, subType, criteriaFieldId, selectedValues, criteriaFieldValues, sourceFormFields]);

  // 提交创建子表
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    try {
      const config = {
        sourceFormId,
        subType,
        selectedFields: subType === 'vertical' ? (sourceForm.structure?.fields || []).map(f => f.fieldId).filter(id => id !== sourceForm.structure?.primaryKey) : selectedFields,
        criteria: subType === 'horizontal' ? null : {
          fieldId: criteriaFieldId,
          operator,
          values: operator === 'equals' ? selectedValues : [Number(rangeMin), Number(rangeMax)]
        },
        tableName
      };

      const newForm = await window.dndDB.createSubTable(projectId, config);
      
      if (onSuccess) {
        onSuccess(newForm);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || '创建子表失败');
    } finally {
      setLoading(false);
    }
  };

  // 下一步
  const handleNext = () => {
    setError('');
    if (step === 0) {
      // 入口1：选择操作目标表
      if (!sourceFormId) {
        setError('请选择操作目标表');
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!sourceFormId) {
        setError('请选择操作目标表');
        return;
      }
      if (!subType) {
        setError('请选择截取方式');
        return;
      }
      
      if (subType === 'horizontal') {
        setStep(2);
      } else if (subType === 'vertical') {
        setStep(3);
      } else {
        setStep(2); // 混合截取，先横向
      }
    } else if (step === 2) {
      if ((subType === 'horizontal' || subType === 'mixed') && selectedFields.length === 0) {
        setError('请至少选择一个字段');
        return;
      }
      if (subType === 'mixed') {
        setStep(3);
      } else {
        setStep(4);
      }
    } else if (step === 3) {
      if (subType === 'vertical' || subType === 'mixed') {
        if (!criteriaFieldId) {
          setError('请选择标准字段');
          return;
        }
        if (operator === 'equals' && selectedValues.length === 0) {
          setError('请至少选择一个值');
          return;
        }
        if (operator === 'range' && (rangeMin === '' || rangeMax === '')) {
          setError('请输入范围');
          return;
        }
      }
      setStep(4);
    }
  };

  // 上一步
  const handlePrev = () => {
    setError('');
    if (step === 1) {
      // 如果是从入口1进入的，可以回到step 0重新选择表单
      if (!form) {
        setStep(0);
      }
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      if (subType === 'mixed') {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 4) {
      if (subType === 'mixed') {
        setStep(3);
      } else if (subType === 'vertical') {
        setStep(3);
      } else {
        setStep(2);
      }
    }
  };

  return React.createElement('div', { className: 'sub-table-manager modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h3', null, '子表管理器'),
        React.createElement('button', {
          className: 'close-btn',
          onClick: onClose
        }, '×')
      ),
      
      error && React.createElement('div', { className: 'error-message' }, error),
      
      React.createElement('div', { className: 'modal-body' },
        // 第0步：选择操作目标表（入口1）
        step === 0 && React.createElement('div', { className: 'step step-0' },
          React.createElement('h4', null, '第1步：选择操作目标表'),
          React.createElement('p', { className: 'hint' }, '选择要从中截取数据的源表单'),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '操作目标表：'),
            React.createElement('select', {
              value: sourceFormId,
              onChange: (e) => setSourceFormId(e.target.value)
            },
              React.createElement('option', { value: '' }, '请选择表单'),
              objectForms.map(f =>
                React.createElement('option', { key: f.id, value: f.id }, f.name)
              )
            )
          )
        ),

        // 第1步：选择截取方式
        step === 1 && React.createElement('div', { className: 'step step-1' },
          React.createElement('h4', null, !form ? '第2步：选择截取方式' : '第1步：选择截取方式'),
          React.createElement('p', { className: 'hint' }, '请选择要截取的方式'),
          sourceForm && React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '截取方式：'),
            React.createElement('div', { className: 'checkbox-group' },
              React.createElement('label', null,
                React.createElement('input', {
                  type: 'checkbox',
                  checked: subType === 'horizontal' || subType === 'mixed',
                  onChange: (e) => setSubType(e.target.checked ? (subType === 'vertical' ? 'mixed' : 'horizontal') : '')
                }),
                ' 横向截取'
              ),
              React.createElement('label', null,
                React.createElement('input', {
                  type: 'checkbox',
                  checked: subType === 'vertical' || subType === 'mixed',
                  onChange: (e) => setSubType(e.target.checked ? (subType === 'horizontal' ? 'mixed' : 'vertical') : '')
                }),
                ' 纵向截取'
              )
            )
          )
        ),
        
        // 第2步：配置横向截取
        step === 2 && React.createElement('div', { className: 'step step-2' },
          React.createElement('h4', null, !form ? '第3步：选择横向截取字段' : '第2步：选择横向截取字段'),
          React.createElement('p', { className: 'hint' }, '请选择要包含在子表中的字段（非主键字段）'),
          
          nonAttributeFields.length > 0 && React.createElement('div', { className: 'field-group' },
            React.createElement('h5', null, '普通字段'),
            nonAttributeFields.map(f =>
              React.createElement('label', { key: f.id, className: 'checkbox-item' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: selectedFields.includes(f.id),
                  onChange: () => handleFieldToggle(f.id)
                }),
                ` ${f.name} (${f.type})`
              )
            )
          ),
          
          attributeFields.length > 0 && React.createElement('div', { className: 'field-group' },
            React.createElement('h5', null, '属性字段（需全选整个属性表）'),
            attributeFields.map(f =>
              React.createElement('label', { key: f.id, className: 'checkbox-item' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: selectedFields.includes(f.id),
                  onChange: () => handleFieldToggle(f.id)
                }),
                ` ${f.name} (属性表单)`
              )
            )
          )
        ),
        
        // 第3步：配置纵向截取
        step === 3 && React.createElement('div', { className: 'step step-3' },
          React.createElement('h4', null, !form ? '第4步：选择纵向截取标准' : '第3步：选择纵向截取标准'),
          
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '标准字段：'),
            React.createElement('select', {
              value: criteriaFieldId,
              onChange: (e) => handleCriteriaFieldChange(e.target.value)
            },
              React.createElement('option', { value: '' }, '请选择字段'),
              [...(sourceForm.structure?.fields || []).map(f => {
                const fieldDef = fields.find(fld => fld.id === f.fieldId);
                return {
                  id: f.fieldId,
                  name: fieldDef?.name || f.fieldId,
                  type: fieldDef?.type || ''
                };
              })].map(f =>
                React.createElement('option', { key: f.id, value: f.id },
                  `${f.name} (${f.type})`
                )
              )
            )
          ),
          
          criteriaFieldId && React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '选择方式：'),
            React.createElement('div', { className: 'radio-group' },
              React.createElement('label', null,
                React.createElement('input', {
                  type: 'radio',
                  name: 'operator',
                  value: 'equals',
                  checked: operator === 'equals',
                  onChange: (e) => setOperator(e.target.value)
                }),
                ' 等于（单选或多选）'
              ),
              React.createElement('label', null,
                React.createElement('input', {
                  type: 'radio',
                  name: 'operator',
                  value: 'range',
                  checked: operator === 'range',
                  onChange: (e) => setOperator(e.target.value),
                  disabled: true // 主键才支持范围
                }),
                ' 范围（仅数字类型主键）'
              )
            )
          ),
          
          operator === 'equals' && criteriaFieldId && React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '选择值：'),
            React.createElement('div', { className: 'value-list' },
              criteriaFieldValues.length > 0 ? criteriaFieldValues.map((v, i) =>
                React.createElement('label', { key: i, className: 'checkbox-item' },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: selectedValues.includes(v),
                    onChange: () => handleValueToggle(v)
                  }),
                  ` ${v}`
                )
              ) : React.createElement('p', null, '该字段暂无数据')
            ),
            React.createElement('div', { className: 'value-actions' },
              React.createElement('button', {
                type: 'button',
                onClick: () => setSelectedValues(criteriaFieldValues)
              }, '全选'),
              React.createElement('button', {
                type: 'button',
                onClick: () => setSelectedValues([])
              }, '清空')
            )
          ),
          
          operator === 'range' && React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '范围：'),
            React.createElement('div', { className: 'range-inputs' },
              React.createElement('input', {
                type: 'number',
                placeholder: '最小值',
                value: rangeMin,
                onChange: (e) => setRangeMin(e.target.value)
              }),
              React.createElement('span', null, '-'),
              React.createElement('input', {
                type: 'number',
                placeholder: '最大值',
                value: rangeMax,
                onChange: (e) => setRangeMax(e.target.value)
              })
            )
          )
        ),
        
        // 第4步：确认
        step === 4 && React.createElement('div', { className: 'step step-4' },
          React.createElement('h4', null, !form ? '第5步：确认信息' : '第4步：确认信息'),
          React.createElement('div', { className: 'summary' },
            React.createElement('p', null, React.createElement('strong', null, '源表单：'), sourceForm?.name),
            React.createElement('p', null,
              React.createElement('strong', null, '截取方式：'),
              subType === 'horizontal' ? '横向截取' :
              subType === 'vertical' ? '纵向截取' : '混合截取'
            ),
            (subType === 'horizontal' || subType === 'mixed') && React.createElement('p', null,
              React.createElement('strong', null, '选中字段数：'), selectedFields.length
            ),
            (subType === 'vertical' || subType === 'mixed') && React.createElement('p', null,
              React.createElement('strong', null, '标准字段：'),
              sourceFormFields.find(f => f.id === criteriaFieldId)?.name
            ),
            (subType === 'vertical' || subType === 'mixed') && operator === 'equals' && React.createElement('p', null,
              React.createElement('strong', null, '选中值数：'), selectedValues.length
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', null, '子表名称（10汉字以内）：'),
              React.createElement('input', {
                type: 'text',
                value: tableName,
                onChange: (e) => setTableName(e.target.value.slice(0, 10)),
                maxLength: 10
              })
            )
          )
        )
      ),
      
      React.createElement('div', { className: 'modal-footer' },
        step >= 1 && React.createElement('button', {
          className: 'btn-secondary',
          onClick: handlePrev
        }, '上一步'),
        step < 4 ? React.createElement('button', {
          className: 'btn-primary',
          onClick: handleNext
        }, '下一步') : React.createElement('button', {
          className: 'btn-primary',
          onClick: handleSubmit,
          disabled: loading
        }, loading ? '创建中...' : '创建子表')
      )
    )
  );
}
