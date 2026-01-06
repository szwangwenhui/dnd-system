// 再造表管理器组件
function RebuildTableManager({ projectId, form, fields, forms, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 1: 选择配置, 2: 确认
  const [sourceFormId, setSourceFormId] = React.useState('');
  const [targetFieldId, setTargetFieldId] = React.useState(''); // 标的字段
  const [aggregationType, setAggregationType] = React.useState('count'); // 聚合方式
  const [tableName, setTableName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // 过滤出对象表单
  const objectForms = forms.filter(f => f.type === '对象表单' && !f.subType);
  const sourceForm = sourceFormId ? forms.find(f => f.id === sourceFormId) : null;

  // 获取源表单的所有字段
  const sourceFormFields = React.useMemo(() => {
    if (!sourceForm) return [];
    const formFieldIds = (sourceForm.structure?.fields || []).map(f => f.fieldId);
    return fields.filter(f => formFieldIds.includes(f.id));
  }, [sourceForm, fields]);

  // 标的字段候选列表（通常选择属性字段）
  const targetFieldCandidates = React.useMemo(() => {
    // 可以是所有字段，但通常选择属性字段或文本类型字段
    return sourceFormFields.filter(f => f.type === '属性表单' || ['文本', '选项'].includes(f.type));
  }, [sourceFormFields]);

  // 数值类字段（用于聚合运算）
  const numericFields = React.useMemo(() => {
    return sourceFormFields.filter(f => ['数字', '金额', '数量'].includes(f.type));
  }, [sourceFormFields]);

  // 聚合方式选项
  const aggregationOptions = [
    { value: 'count', label: '计数' },
    { value: 'sum', label: '求和' },
    { value: 'avg', label: '平均值' },
    { value: 'max', label: '最大值' },
    { value: 'min', label: '最小值' },
    { value: 'median', label: '中位数' }
  ];

  // 生成默认表单名称
  React.useEffect(() => {
    if (sourceForm && targetFieldId && aggregationType) {
      const targetField = sourceFormFields.find(f => f.id === targetFieldId);
      const aggLabel = aggregationOptions.find(opt => opt.value === aggregationType)?.label || '';
      const defaultName = `${sourceForm.name}-${targetField?.name || ''}-${aggLabel}`;
      setTableName(defaultName);
    } else if (sourceForm) {
      setTableName(`${sourceForm.name}-再造表`);
    }
  }, [sourceForm, targetFieldId, aggregationType, sourceFormFields]);

  // 提交创建再造表
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    try {
      const config = {
        sourceFormId,
        targetFieldId,
        aggregationType,
        tableName
      };

      const newForm = await window.dndDB.createRebuildTable(projectId, config);
      
      if (onSuccess) {
        onSuccess(newForm);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || '创建再造表失败');
    } finally {
      setLoading(false);
    }
  };

  // 下一步
  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!sourceFormId) {
        setError('请选择操作目标表');
        return;
      }
      if (!targetFieldId) {
        setError('请选择标的字段');
        return;
      }
      if (!aggregationType) {
        setError('请选择再造方式');
        return;
      }
      setStep(2);
    }
  };

  // 上一步
  const handlePrev = () => {
    setError('');
    if (step === 2) {
      setStep(1);
    }
  };

  return React.createElement('div', { className: 'rebuild-table-manager modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h3', null, '再造表管理器'),
        React.createElement('button', {
          className: 'close-btn',
          onClick: onClose
        }, '×')
      ),
      
      error && React.createElement('div', { className: 'error-message' }, error),
      
      React.createElement('div', { className: 'modal-body' },
        // 第1步：选择配置
        step === 1 && React.createElement('div', { className: 'step step-1' },
          React.createElement('h4', null, '第1步：选择操作目标表和配置'),
          
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
          ),
          
          sourceForm && React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '标的字段（用于分组的字段）：'),
            React.createElement('select', {
              value: targetFieldId,
              onChange: (e) => setTargetFieldId(e.target.value)
            },
              React.createElement('option', { value: '' }, '请选择字段'),
              sourceFormFields.map(f =>
                React.createElement('option', { key: f.id, value: f.id },
                  `${f.name} (${f.type})`
                )
              )
            )
          ),
          
          sourceForm && targetFieldId && React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, '再造方式（聚合运算）：'),
            React.createElement('select', {
              value: aggregationType,
              onChange: (e) => setAggregationType(e.target.value)
            },
              aggregationOptions.map(opt =>
                React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
              )
            )
          ),
          
          sourceForm && targetFieldId && aggregationType && numericFields.length > 0 && 
            React.createElement('div', { className: 'info-box' },
              React.createElement('p', null, React.createElement('strong', null, '将参与聚合运算的数值字段：')),
              React.createElement('ul', null,
                numericFields.map(f =>
                  React.createElement('li', { key: f.id }, f.name)
                )
              )
            ),
          
          sourceForm && targetFieldId && aggregationType && numericFields.length === 0 &&
            React.createElement('div', { className: 'warning-box' },
              React.createElement('p', null, '⚠️ 警告：该表单没有数值类型字段，无法进行聚合运算！')
            )
        ),
        
        // 第2步：确认
        step === 2 && React.createElement('div', { className: 'step step-2' },
          React.createElement('h4', null, '第2步：确认信息'),
          React.createElement('div', { className: 'summary' },
            React.createElement('p', null, React.createElement('strong', null, '源表单：'), sourceForm?.name),
            React.createElement('p', null,
              React.createElement('strong', null, '标的字段：'),
              sourceFormFields.find(f => f.id === targetFieldId)?.name
            ),
            React.createElement('p', null,
              React.createElement('strong', null, '再造方式：'),
              aggregationOptions.find(opt => opt.value === aggregationType)?.label
            ),
            React.createElement('p', null,
              React.createElement('strong', null, '聚合字段数：'), numericFields.length
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', null, '再造表名称（10汉字以内）：'),
              React.createElement('input', {
                type: 'text',
                value: tableName,
                onChange: (e) => setTableName(e.target.value.slice(0, 10)),
                maxLength: 10
              })
            )
          ),
          
          numericFields.length > 0 && React.createElement('div', { className: 'preview-info' },
            React.createElement('h5', null, '预览：'),
            React.createElement('p', null, '系统将按标的字段的不同取值分组，对每组的数值字段进行'),
            React.createElement('strong', null, aggregationOptions.find(opt => opt.value === aggregationType)?.label),
            React.createElement('p', null, '运算，生成新的再造表。')
          )
        )
      ),
      
      React.createElement('div', { className: 'modal-footer' },
        step > 1 && React.createElement('button', {
          className: 'btn-secondary',
          onClick: handlePrev
        }, '上一步'),
        step < 2 ? React.createElement('button', {
          className: 'btn-primary',
          onClick: handleNext,
          disabled: numericFields.length === 0
        }, '下一步') : React.createElement('button', {
          className: 'btn-primary',
          onClick: handleSubmit,
          disabled: loading || numericFields.length === 0
        }, loading ? '创建中...' : '创建再造表')
      )
    )
  );
}
