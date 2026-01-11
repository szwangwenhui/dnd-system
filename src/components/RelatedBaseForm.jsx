// 关联基础表构建组件（按照设计文档重新实现）
function RelatedBaseForm({ projectId, onClose, onSuccess, onLoadingChange }) {
  const [fields, setFields] = React.useState([]);
  const [independentForms, setIndependentForms] = React.useState([]);
  const [allForms, setAllForms] = React.useState([]); // 所有表单（用于查找属性表）
  const [pages, setPages] = React.useState([]); // 所有页面（用于标题关联基础表选择详情页）
  const [formName, setFormName] = React.useState('');
  const [formSubType, setFormSubType] = React.useState('普通关联基础表'); // '普通关联基础表' | '标题关联基础表'
  const [detailPageId, setDetailPageId] = React.useState(''); // 标题关联基础表关联的详情页ID
  const [managedFormId, setManagedFormId] = React.useState(''); // 标题关联基础表关联的关联表单ID
  const [step, setStep] = React.useState(1);
  // 1: 输入表单名称
  // 2: 添加关联字段（可多个）
  // 3: 确定主键
  // 4: 添加其他字段

  // 已添加的关联字段列表
  const [relatedFields, setRelatedFields] = React.useState([]);
  // 当前选择的关联表（用于添加）
  const [selectedRelatedFormId, setSelectedRelatedFormId] = React.useState('');

  // 无用的测试函数
  const testFunction = () => {
    const testValue = Math.random() * 100;
    return testValue > 50 ? '大于50' : '小于等于50';
  };

  // 主键配置
  const [primaryKeySource, setPrimaryKeySource] = React.useState(''); // 'related' 或 'own'
  const [primaryKeyRelatedIndex, setPrimaryKeyRelatedIndex] = React.useState(-1); // 选择哪个关联字段作为主键
  const [ownPrimaryKeyId, setOwnPrimaryKeyId] = React.useState('');
  const [reminderFieldId, setReminderFieldId] = React.useState(''); // 提醒字段（非必填）

  // 主键自增配置（仅当使用自己的主键时有效）
  const [primaryKeyConfig, setPrimaryKeyConfig] = React.useState({
    mode: 'manual',       // 'manual' 手动填写, 'auto' 系统自增
    startValue: 1,        // 开始值
    incrementType: 'natural',  // 'natural' 自然增加, 'jump' 跳跃增加
    jumpStep: 1           // 跳跃数
  });

  // 其他字段
  const [selectedFields, setSelectedFields] = React.useState([]);

  // 属性字段
  const [selectedAttributeFields, setSelectedAttributeFields] = React.useState([]);

  // 加载数据
  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const startTime = Date.now();
      console.log('[RelatedBaseForm] ========== 开始加载数据 ==========');
      console.log('[RelatedBaseForm] 时间戳:', new Date().toLocaleTimeString());

      try {
        console.log('[RelatedBaseForm] 阶段1: 开始调用 getProjectById...');
        const getProjectStartTime = Date.now();
        // 只调用一次getProjectById，从返回的项目对象中获取所有数据
        const project = await window.dndDB.getProjectById(projectId);
        console.log('[RelatedBaseForm] 阶段1: getProjectById 完成, 耗时', Date.now() - getProjectStartTime, 'ms');
        console.log('[RelatedBaseForm] 阶段1: 总耗时', Date.now() - startTime, 'ms');

        if (!isMounted) return;

        if (project) {
          console.log('[RelatedBaseForm] 阶段2: 开始处理项目数据...');
          const processStartTime = Date.now();

          // 从项目对象中直接获取字段和表单，避免重复查询
          const fieldList = project.fields || [];
          console.log('[RelatedBaseForm] 阶段2a: 字段数量:', fieldList.length);
          setFields(fieldList);

          const formList = project.forms || [];
          console.log('[RelatedBaseForm] 阶段2b: 表单数量:', formList.length);
          setAllForms(formList); // 保存所有表单
          const independentList = formList.filter(f =>
            f.type === '对象表单' && (
              f.subType === '独立基础表' ||
              f.subType === '普通独立基础表' ||
              f.subType === '详情独立基础表'
            )
          );
          console.log('[RelatedBaseForm] 阶段2c: 独立基础表数量:', independentList.length);
          setIndependentForms(independentList);

          // 加载所有角色的页面（用于标题关联基础表选择详情页）
          if (project.roles) {
            let allPages = [];
            // 直接从项目对象中获取页面，避免重复查询数据库
            for (const role of project.roles) {
              if (role.pages) {
                allPages = allPages.concat(role.pages);
              }
            }
            console.log('[RelatedBaseForm] 阶段2d: 页面数量:', allPages.length);
            setPages(allPages);
          }

          console.log('[RelatedBaseForm] 阶段2: 处理项目数据完成, 耗时', Date.now() - processStartTime, 'ms');
          console.log('[RelatedBaseForm] 总耗时', Date.now() - startTime, 'ms');
          console.log('[RelatedBaseForm] ========== 数据加载完成 ==========');
        }
      } catch (error) {
        console.error('[RelatedBaseForm] 加载数据失败, 耗时', Date.now() - startTime, 'ms');
        console.error('[RelatedBaseForm] 错误详情:', error);
        if (isMounted) alert('加载数据失败：' + error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // 获取独立基础表的主键信息
  const getFormPrimaryKeyInfo = (formId) => {
    const form = independentForms.find(f => f.id === formId);
    if (!form || !form.structure || !form.structure.primaryKey) return null;

    const pkFieldId = form.structure.primaryKey;
    const pkField = fields.find(f => f.id === pkFieldId);
    return {
      formId: form.id,
      formName: form.name,
      fieldId: pkFieldId,
      fieldName: pkField?.name || pkFieldId,
      fieldType: pkField?.type || '未知'
    };
  };

  // 获取可选的独立基础表（排除已添加的）
  const getAvailableIndependentForms = () => {
    const addedFormIds = relatedFields.map(rf => rf.formId);
    return independentForms.filter(f => !addedFormIds.includes(f.id));
  };

  // 获取表单的可用字段（排除主键和已添加的字段）
  const getFormAvailableFields = (formId) => {
    const form = independentForms.find(f => f.id === formId);
    if (!form || !form.structure || !form.structure.fields) return [];

    // 已添加的字段ID
    const addedFieldIds = relatedFields
      .filter(rf => rf.formId === formId)
      .map(rf => rf.fieldId);

    return form.structure.fields
      .filter(f => !addedFieldIds.includes(f.fieldId))
      .map(f => {
        const fieldInfo = fields.find(field => field.id === f.fieldId);
        return fieldInfo || null;
      })
      .filter(Boolean);
  };

  // 从关联表单添加字段（支持标题关联基础表和普通关联基础表）
  const handleAddRelatedFieldFromManagedForm = (fieldId, formIdOverride = null) => {
    // 确定使用的表单ID（标题关联基础表用managedFormId，普通关联基础表用selectedRelatedFormId）
    const formId = formIdOverride || managedFormId || selectedRelatedFormId;

    if (!formId) {
      alert('请先选择关联表单');
      return;
    }

    const managedForm = independentForms.find(f => f.id === formId);
    if (!managedForm) {
      alert('关联表单不存在');
      return;
    }

    const fieldInfo = fields.find(f => f.id === fieldId);
    if (!fieldInfo) {
      alert('字段信息不存在');
      return;
    }

    setRelatedFields([
      ...relatedFields,
      {
        fieldId: fieldId,
        fieldName: fieldInfo.name,
        formId: formId,
        formName: managedForm.name,
        isPrimaryKey: false
      }
    ]);
  };

  // 自动添加关联表单的主键（标题关联基础表专用）
  const handleAutoAddPrimaryKey = () => {
    if (!managedFormId) return;

    const pkInfo = getFormPrimaryKeyInfo(managedFormId);
    if (!pkInfo) return;

    // 检查是否已添加
    const alreadyAdded = relatedFields.some(
      rf => rf.fieldId === pkInfo.fieldId && rf.formId === managedFormId
    );

    if (!alreadyAdded) {
      setRelatedFields([pkInfo]);
    }
  };

  // 监听关联表单选择变化，自动添加主键
  React.useEffect(() => {
    if (formSubType === '标题关联基础表' && managedFormId) {
      handleAutoAddPrimaryKey();
    }
    // 普通关联基础表：选择表单后自动添加主键
    if (formSubType === '普通关联基础表' && selectedRelatedFormId) {
      const pkInfo = getFormPrimaryKeyInfo(selectedRelatedFormId);
      if (!pkInfo) return;

      // 检查是否已添加
      const alreadyAdded = relatedFields.some(
        rf => rf.fieldId === pkInfo.fieldId && rf.formId === selectedRelatedFormId
      );

      if (!alreadyAdded) {
        setRelatedFields([pkInfo]);
      }
    }
  }, [managedFormId, selectedRelatedFormId]);

  // 添加关联字段
  const handleAddRelatedField = () => {
    if (!selectedRelatedFormId) {
      alert('请选择要关联的独立基础表');
      return;
    }

    const pkInfo = getFormPrimaryKeyInfo(selectedRelatedFormId);
    if (!pkInfo) {
      alert('获取主键信息失败');
      return;
    }

    setRelatedFields([...relatedFields, pkInfo]);
    setSelectedRelatedFormId('');
  };

  // 移除关联字段
  const handleRemoveRelatedField = (index) => {
    const newList = relatedFields.filter((_, i) => i !== index);
    setRelatedFields(newList);

    // 如果移除的是被选为主键的关联字段，重置主键选择
    if (primaryKeySource === 'related' && primaryKeyRelatedIndex === index) {
      setPrimaryKeySource('');
      setPrimaryKeyRelatedIndex(-1);
      setReminderFieldId('');
    } else if (primaryKeySource === 'related' && primaryKeyRelatedIndex > index) {
      // 调整索引
      setPrimaryKeyRelatedIndex(primaryKeyRelatedIndex - 1);
    }
  };

  // 获取选中的关联字段作为主键时，可选的提醒字段
  const getReminderFieldOptions = () => {
    if (primaryKeySource !== 'related' || primaryKeyRelatedIndex < 0) return [];

    const relatedField = relatedFields[primaryKeyRelatedIndex];
    if (!relatedField) return [];

    const form = independentForms.find(f => f.id === relatedField.formId);
    if (!form || !form.structure || !form.structure.fields) return [];

    return form.structure.fields
      .filter(f => !f.isPrimaryKey)
      .map(f => {
        const fieldInfo = fields.find(field => field.id === f.fieldId);
        return {
          fieldId: f.fieldId,
          name: fieldInfo?.name || f.fieldId,
          type: fieldInfo?.type || '未知'
        };
      });
  };

  // 获取主键字段列表（字段角色=主键）
  const getPrimaryKeyFields = () => {
    return fields.filter(f => f.role === '主键');
  };

  // 获取基础字段列表（字段性质=基础字段）
  const getBaseFields = () => {
    return fields.filter(f => f.nature === '基础字段');
  };

  // 获取属性字段列表
  const getAttributeFields = () => {
    return fields.filter(f => f.nature === '属性字段');
  };

  // 获取所有属性表
  const getAttributeForms = () => {
    return allForms.filter(f => f.type === '属性表单');
  };

  // 查找属性字段所属的属性表
  const findAttributeFormByFieldId = (fieldId) => {
    const attributeForms = getAttributeForms();
    for (const form of attributeForms) {
      const levelFields = form.structure?.levelFields || [];
      if (levelFields.some(lf => lf.fieldId === fieldId)) {
        return form;
      }
    }
    return null;
  };

  // 获取属性字段在属性表中的级别
  const getFieldLevelInAttributeForm = (fieldId, attributeForm) => {
    const levelFields = attributeForm.structure?.levelFields || [];
    const levelField = levelFields.find(lf => lf.fieldId === fieldId);
    return levelField?.level || 0;
  };

  // 检查是否可以添加该属性字段
  const canAddAttributeField = (fieldId) => {
    const attributeForm = findAttributeFormByFieldId(fieldId);
    if (!attributeForm) {
      return { canAdd: false, reason: '该属性字段尚未关联任何属性表，请先创建属性表' };
    }

    const fieldLevel = getFieldLevelInAttributeForm(fieldId, attributeForm);
    
    const sameFormSelectedFields = selectedAttributeFields.filter(sf => {
      const sfForm = findAttributeFormByFieldId(sf.fieldId);
      return sfForm && sfForm.id === attributeForm.id;
    });

    if (sameFormSelectedFields.length === 0) {
      if (fieldLevel !== 1) {
        return { canAdd: false, reason: `必须先选择该属性表的第1级字段` };
      }
      return { canAdd: true };
    }

    const maxSelectedLevel = Math.max(...sameFormSelectedFields.map(sf => 
      getFieldLevelInAttributeForm(sf.fieldId, attributeForm)
    ));

    if (fieldLevel !== maxSelectedLevel + 1) {
      return { canAdd: false, reason: `必须按顺序选择，下一个应该是第${maxSelectedLevel + 1}级` };
    }

    return { canAdd: true };
  };

  // 添加属性字段
  const handleAddAttributeField = (fieldId) => {
    const checkResult = canAddAttributeField(fieldId);
    if (!checkResult.canAdd) {
      alert(checkResult.reason);
      return;
    }

    const attributeForm = findAttributeFormByFieldId(fieldId);
    const fieldLevel = getFieldLevelInAttributeForm(fieldId, attributeForm);

    setSelectedAttributeFields([
      ...selectedAttributeFields,
      {
        fieldId: fieldId,
        required: true,
        attributeFormId: attributeForm.id,
        attributeFormName: attributeForm.name,
        level: fieldLevel
      }
    ]);
  };

  // 移除属性字段
  const handleRemoveAttributeField = (fieldId) => {
    const attributeForm = findAttributeFormByFieldId(fieldId);
    const fieldLevel = getFieldLevelInAttributeForm(fieldId, attributeForm);

    setSelectedAttributeFields(selectedAttributeFields.filter(sf => {
      const sfForm = findAttributeFormByFieldId(sf.fieldId);
      if (!sfForm || sfForm.id !== attributeForm.id) {
        return true;
      }
      const sfLevel = getFieldLevelInAttributeForm(sf.fieldId, attributeForm);
      return sfLevel < fieldLevel;
    }));
  };

  // 添加其他字段
  const handleAddField = (fieldId, required = true) => {
    if (selectedFields.some(f => f.fieldId === fieldId)) {
      alert('该字段已添加');
      return;
    }

    setSelectedFields([
      ...selectedFields,
      { fieldId, required, isPrimaryKey: false }
    ]);
  };

  // 移除其他字段
  const handleRemoveField = (fieldId) => {
    setSelectedFields(selectedFields.filter(f => f.fieldId !== fieldId));
  };

  // 切换必填状态
  const toggleRequired = (fieldId) => {
    setSelectedFields(selectedFields.map(f =>
      f.fieldId === fieldId ? { ...f, required: !f.required } : f
    ));
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formName.trim()) {
      alert('请输入表单名称');
      return;
    }

    if (relatedFields.length === 0) {
      alert('请至少添加一个关联字段');
      return;
    }

    if (!primaryKeySource) {
      alert('请选择主键配置方式');
      return;
    }

    if (primaryKeySource === 'own' && !ownPrimaryKeyId) {
      alert('请选择主键字段');
      return;
    }

    if (primaryKeySource === 'related' && primaryKeyRelatedIndex < 0) {
      alert('请选择哪个关联字段作为主键');
      return;
    }

    // 通知父组件开始加载
    if (onLoadingChange) onLoadingChange(true, '正在创建表单...');
    const startTime = Date.now();
    console.log('[RelatedBaseForm] ========== 开始创建表单 ==========');
    console.log('[RelatedBaseForm] 时间戳:', new Date().toLocaleTimeString());

    try {
      // 延迟确保UI渲染
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('[RelatedBaseForm] 阶段1: 延迟50ms完成, 耗时', Date.now() - startTime, 'ms');

      // 确定主键
      let primaryKeyFieldId;
      if (primaryKeySource === 'related') {
        primaryKeyFieldId = relatedFields[primaryKeyRelatedIndex].fieldId;
      } else {
        primaryKeyFieldId = ownPrimaryKeyId;
      }
      console.log('[RelatedBaseForm] 阶段2: 确定主键完成, 耗时', Date.now() - startTime, 'ms');

      // 构建关联字段结构
      const relatedFieldsStructure = relatedFields.map((rf, index) => ({
        formId: rf.formId,
        fieldId: rf.fieldId,
        isUsedAsPrimaryKey: primaryKeySource === 'related' && index === primaryKeyRelatedIndex,
        reminderFieldId: (primaryKeySource === 'related' && index === primaryKeyRelatedIndex) ? reminderFieldId : ''
      }));
      console.log('[RelatedBaseForm] 阶段3: 构建关联字段结构完成, 耗时', Date.now() - startTime, 'ms');

      // 构建字段列表
      const fieldsStructure = [];

      // 如果使用自己的主键，先添加主键
      if (primaryKeySource === 'own') {
        fieldsStructure.push({
          fieldId: ownPrimaryKeyId,
          required: true,
          isPrimaryKey: true,
          isRelatedField: false
        });
      }

      // 添加关联字段到表单结构中
      relatedFields.forEach((rf, index) => {
        const isThisPrimaryKey = primaryKeySource === 'related' && index === primaryKeyRelatedIndex;
        fieldsStructure.push({
          fieldId: rf.fieldId,
          required: true,
          isPrimaryKey: isThisPrimaryKey,
          isRelatedField: true,
          relatedFormId: rf.formId,
          relatedFormFieldId: rf.fieldId, // 存储关联表单中的字段ID，用于级联获取值
          reminderFieldId: isThisPrimaryKey ? reminderFieldId : ''
        });
      });

      // 添加其他字段
      fieldsStructure.push(...selectedFields);

      // 添加属性字段
      selectedAttributeFields.forEach(af => {
        fieldsStructure.push({
          fieldId: af.fieldId,
          required: af.required,
          isPrimaryKey: false,
          isAttributeField: true,
          attributeFormId: af.attributeFormId,
          level: af.level
        });
      });
      console.log('[RelatedBaseForm] 阶段4: 构建字段列表完成, 耗时', Date.now() - startTime, 'ms');

      // 构建表单结构
      const formStructure = {
        primaryKey: primaryKeyFieldId,
        // 仅当使用自己的主键时，保存主键自增配置
        primaryKeyConfig: primaryKeySource === 'own' ? primaryKeyConfig : null,
        relatedFields: relatedFieldsStructure,
        fields: fieldsStructure
      };
      console.log('[RelatedBaseForm] 阶段5: 构建表单结构完成, 耗时', Date.now() - startTime, 'ms');

      console.log('[RelatedBaseForm] 阶段6: 开始调用 addForm...');
      const addFormStartTime = Date.now();
      // 创建表单
      const newForm = await window.dndDB.addForm(projectId, {
        name: formName,
        type: '对象表单',
        formNature: '基础表单',
        subType: formSubType, // '普通关联基础表' | '标题关联基础表'
        detailPageId: formSubType === '标题关联基础表' ? detailPageId : null, // 仅标题关联基础表需要关联详情页
        managedFormId: formSubType === '标题关联基础表' ? managedFormId : null, // 仅标题关联基础表需要关联表单
        structure: formStructure
      });
      console.log('[RelatedBaseForm] 阶段6: addForm 完成, 耗时', Date.now() - addFormStartTime, 'ms');
      console.log('[RelatedBaseForm] 阶段6: addForm 总耗时', Date.now() - startTime, 'ms');

      // 更新字段的 relatedForms (批量更新优化)
      const fieldIdToRelatedFormMap = {};
      if (primaryKeySource === 'own') {
        fieldIdToRelatedFormMap[ownPrimaryKeyId] = newForm.id;
      }
      relatedFields.forEach(rf => {
        fieldIdToRelatedFormMap[rf.fieldId] = newForm.id;
      });
      selectedFields.forEach(f => {
        fieldIdToRelatedFormMap[f.fieldId] = newForm.id;
      });
      selectedAttributeFields.forEach(af => {
        fieldIdToRelatedFormMap[af.fieldId] = newForm.id;
      });

      console.log('[RelatedBaseForm] 阶段7: 开始批量更新字段关联, 共', Object.keys(fieldIdToRelatedFormMap).length, '个字段');
      const updateFieldsStartTime = Date.now();
      await window.dndDB.batchUpdateFieldRelatedForms(projectId, fieldIdToRelatedFormMap);
      console.log('[RelatedBaseForm] 阶段7: 字段关联更新完成, 耗时', Date.now() - updateFieldsStartTime, 'ms');
      console.log('[RelatedBaseForm] 阶段7: 总耗时', Date.now() - startTime, 'ms');

      const totalTime = Date.now() - startTime;
      console.log('[RelatedBaseForm] ========== 创建表单完成 ==========');
      console.log('[RelatedBaseForm] 总耗时:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), '秒)');

      alert('关联基础表创建成功！');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('[RelatedBaseForm] 创建失败, 耗时', Date.now() - startTime, 'ms');
      console.error('[RelatedBaseForm] 错误详情:', error);
      alert('创建失败：' + error.message);
    } finally {
      // 通知父组件结束加载
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">创建关联基础表</h3>
          <p className="text-sm text-gray-500 mt-1">
            包含关联字段（外键），可关联多个独立基础表
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            {[
              { num: 1, label: '名称' },
              { num: 2, label: '关联字段' },
              { num: 3, label: '主键' },
              { num: 4, label: '其他字段' }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                {i > 0 && <div className="w-8 h-0.5 bg-gray-300"></div>}
                <div className={`flex items-center ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {s.num}
                  </div>
                  <span className="ml-1 text-xs font-medium hidden sm:inline">{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 步骤1: 输入表单名称 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表单名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：学生成绩表、订单明细表"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表单分类 <span className="text-red-500">*</span>
                </label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="formSubType"
                      value="普通关联基础表"
                      checked={formSubType === '普通关联基础表'}
                      onChange={(e) => setFormSubType(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">普通关联基础表</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="formSubType"
                      value="标题关联基础表"
                      checked={formSubType === '标题关联基础表'}
                      onChange={(e) => setFormSubType(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">标题关联基础表</span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  普通关联基础表：现有功能；标题关联基础表：用于TCM功能，点击标题跳转到详情页
                </p>
              </div>

              {/* 标题关联基础表需要选择关联的详情页和关联表单 */}
              {formSubType === '标题关联基础表' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择关联表单 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={managedFormId}
                      onChange={(e) => {
                        setManagedFormId(e.target.value);
                        // 清空已添加的关联字段
                        setRelatedFields([]);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">请选择关联表单（独立基础表）</option>
                      {independentForms.filter(f =>
                        f.subType === '普通独立基础表' ||
                        f.subType === '详情独立基础表' ||
                        f.subType === '独立基础表'
                      ).map(form => {
                        const pkInfo = getFormPrimaryKeyInfo(form.id);
                        return (
                          <option key={form.id} value={form.id}>
                            {form.name}（主键：{pkInfo?.fieldName || '未知'}）
                          </option>
                        );
                      })}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      选择要关联的表单，该表单的主键会自动成为关联字段
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      关联详情页 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={detailPageId}
                      onChange={(e) => setDetailPageId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">请选择详情页</option>
                      {pages.filter(p => p.category === '详情页').map(page => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      选择标题点击后要跳转到的详情页
                    </p>
                  </div>
                </>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  <strong>关联基础表说明：</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  <li>包含关联字段（外键），指向独立基础表的主键</li>
                  <li>可以关联多个独立基础表</li>
                  <li>关联字段可以作为本表主键，也可以使用自己的主键</li>
                </ul>
              </div>
            </div>
          )}

          {/* 步骤2: 添加关联字段 */}
          {step === 2 && (
            <div className="space-y-4">
              {/* 标题关联基础表的说明 */}
              {formSubType === '标题关联基础表' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>标题关联基础表：</strong>关联表单的主键已自动添加为关联字段，您可以从下方选择关联表单的其他字段一起加入。
                  </p>
                </div>
              )}

              {/* 已添加的关联字段 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  已添加的关联字段
                </label>
                <div className="border border-gray-300 rounded-lg divide-y divide-gray-200">
                  {relatedFields.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      尚未添加关联字段，请从下方选择
                    </div>
                  ) : (
                    relatedFields.map((rf, index) => (
                      <div key={index} className="px-4 py-3 bg-yellow-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-600 text-white rounded-full">
                              关联{index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{rf.fieldName}</span>
                            <span className="text-xs text-gray-500">→ {rf.formName}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveRelatedField(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 添加新关联字段 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加关联字段
                </label>
                {formSubType === '标题关联基础表' ? (
                  /* 标题关联基础表：显示关联表单的字段 */
                  (() => {
                    const managedForm = independentForms.find(f => f.id === managedFormId);
                    if (!managedForm) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-700">
                            请先选择关联表单
                          </p>
                        </div>
                      );
                    }

                    // 获取关联表单的字段列表（排除主键和已添加的字段）
                    const availableFields = getFormAvailableFields(managedForm.id);

                    return availableFields.length === 0 ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                          所有可用字段都已添加。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableFields.map(field => (
                          <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <span className="text-sm font-medium text-gray-900">{field.name}</span>
                            <button
                              onClick={() => handleAddRelatedFieldFromManagedForm(field.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                              添加
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  /* 普通关联基础表：先选择关联表单，再显示该表单的字段 */
                  (() => {
                    // 尚未选择关联表单时，显示表单选择列表
                    if (!selectedRelatedFormId) {
                      return (
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <label className="text-sm font-medium text-gray-700">选择关联表单：</label>
                            <select
                              value={selectedRelatedFormId}
                              onChange={(e) => setSelectedRelatedFormId(e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">选择独立基础表</option>
                              {getAvailableIndependentForms().map(form => {
                                const pkInfo = getFormPrimaryKeyInfo(form.id);
                                return (
                                  <option key={form.id} value={form.id}>
                                    {form.name}（主键：{pkInfo?.fieldName || '未知'}）
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      );
                    }

                    // 已选择关联表单，显示该表单的字段列表
                    const selectedForm = independentForms.find(f => f.id === selectedRelatedFormId);
                    if (!selectedForm) {
                      setSelectedRelatedFormId('');
                      return null;
                    }

                    const availableFields = getFormAvailableFields(selectedRelatedFormId);

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">
                              关联表单：<span className="text-blue-600 font-semibold">{selectedForm.name}</span>
                            </label>
                            <button
                              onClick={() => setSelectedRelatedFormId('')}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              更换
                            </button>
                          </div>
                        </div>

                        {availableFields.length === 0 ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-700">
                              该表单的所有可用字段都已添加。
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-2">请选择要添加的字段：</p>
                            {availableFields.map(field => (
                              <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <span className="text-sm font-medium text-gray-900">{field.name}</span>
                                <button
                                  onClick={() => handleAddRelatedFieldFromManagedForm(field.id, selectedRelatedFormId)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                  添加
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {independentForms.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>注意：</strong>当前没有独立基础表。请先创建独立基础表。
                  </p>
                </div>
              )}

              {getAvailableIndependentForms().length === 0 && independentForms.length > 0 && relatedFields.length > 0 && formSubType !== '标题关联基础表' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    所有独立基础表都已添加为关联字段。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 步骤3: 确定主键 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择主键来源 <span className="text-red-500">*</span>
                </label>

                <div className="space-y-3">
                  {/* 选项A：从关联字段中选择 */}
                  <label
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: primaryKeySource === 'related' ? '#3B82F6' : '#E5E7EB' }}
                  >
                    <input
                      type="radio"
                      name="primaryKeySource"
                      value="related"
                      checked={primaryKeySource === 'related'}
                      onChange={(e) => {
                        setPrimaryKeySource(e.target.value);
                        setOwnPrimaryKeyId('');
                      }}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">使用关联字段作为主键</div>
                      <div className="text-sm text-gray-500 mt-1">
                        从已添加的关联字段中选择一个作为本表主键
                      </div>
                    </div>
                  </label>

                  {/* 选项B：使用自己的主键 */}
                  <label
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: primaryKeySource === 'own' ? '#3B82F6' : '#E5E7EB' }}
                  >
                    <input
                      type="radio"
                      name="primaryKeySource"
                      value="own"
                      checked={primaryKeySource === 'own'}
                      onChange={(e) => {
                        setPrimaryKeySource(e.target.value);
                        setPrimaryKeyRelatedIndex(-1);
                        setReminderFieldId('');
                      }}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">使用自己的主键</div>
                      <div className="text-sm text-gray-500 mt-1">
                        本表有独立的主键字段，关联字段只作为外键
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 如果选择关联字段作为主键 */}
              {primaryKeySource === 'related' && (
                <div className="space-y-4 pl-4 border-l-4 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择哪个关联字段作为主键 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={primaryKeyRelatedIndex}
                      onChange={(e) => {
                        setPrimaryKeyRelatedIndex(parseInt(e.target.value));
                        setReminderFieldId('');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={-1}>请选择</option>
                      {relatedFields.map((rf, index) => (
                        <option key={index} value={index}>
                          {rf.fieldName}（来自 {rf.formName}）
                        </option>
                      ))}
                    </select>
                  </div>

                  {primaryKeyRelatedIndex >= 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        提醒字段（可选）
                      </label>
                      <select
                        value={reminderFieldId}
                        onChange={(e) => setReminderFieldId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">不设置提醒字段</option>
                        {getReminderFieldOptions().map(field => (
                          <option key={field.fieldId} value={field.fieldId}>
                            {field.name}（{field.type}）
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        设置后，数据录入时显示为"主键值 - 提醒值"，便于识别
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 如果选择自己的主键 */}
              {primaryKeySource === 'own' && (
                <div className="pl-4 border-l-4 border-blue-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择主键字段 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={ownPrimaryKeyId}
                      onChange={(e) => setOwnPrimaryKeyId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择</option>
                      {getPrimaryKeyFields().map(field => (
                        <option key={field.id} value={field.id}>
                          {field.name}（{field.type}）
                        </option>
                      ))}
                    </select>

                    {getPrimaryKeyFields().length === 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
                        <p className="text-sm text-yellow-700">
                          <strong>注意：</strong>没有可用的主键字段，请先在"定义字段"中创建。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 主键数据添加方式 */}
                  {ownPrimaryKeyId && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        主键数据添加方式
                      </label>
                      <div className="flex space-x-6 mb-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="pkModeRelated"
                            checked={primaryKeyConfig.mode === 'manual'}
                            onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, mode: 'manual' })}
                            className="form-radio h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">手动填写</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="pkModeRelated"
                            checked={primaryKeyConfig.mode === 'auto'}
                            onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, mode: 'auto' })}
                            className="form-radio h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">系统自增</span>
                        </label>
                      </div>

                      {/* 系统自增配置 */}
                      {primaryKeyConfig.mode === 'auto' && (
                        <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                          <div className="flex items-center space-x-4">
                            <label className="text-sm text-gray-700 w-20">开始值：</label>
                            <input
                              type="number"
                              value={primaryKeyConfig.startValue}
                              onChange={(e) => setPrimaryKeyConfig({ 
                                ...primaryKeyConfig, 
                                startValue: parseInt(e.target.value) || 1 
                              })}
                              min="0"
                              className="w-32 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="text-sm text-gray-700 w-20">增加方式：</label>
                            <div className="flex space-x-4">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="incrementTypeRelated"
                                  checked={primaryKeyConfig.incrementType === 'natural'}
                                  onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, incrementType: 'natural' })}
                                  className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">自然增加</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="incrementTypeRelated"
                                  checked={primaryKeyConfig.incrementType === 'jump'}
                                  onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, incrementType: 'jump' })}
                                  className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">跳跃增加</span>
                              </label>
                            </div>
                          </div>

                          {primaryKeyConfig.incrementType === 'jump' && (
                            <div className="flex items-center space-x-4">
                              <label className="text-sm text-gray-700 w-20">跳跃数：</label>
                              <input
                                type="number"
                                value={primaryKeyConfig.jumpStep}
                                onChange={(e) => setPrimaryKeyConfig({ 
                                  ...primaryKeyConfig, 
                                  jumpStep: parseInt(e.target.value) || 1 
                                })}
                                min="1"
                                className="w-32 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          )}

                          <div className="text-xs text-blue-600 mt-2">
                            预览：{primaryKeyConfig.startValue}, {primaryKeyConfig.startValue + (primaryKeyConfig.incrementType === 'jump' ? primaryKeyConfig.jumpStep : 1)}, {primaryKeyConfig.startValue + (primaryKeyConfig.incrementType === 'jump' ? primaryKeyConfig.jumpStep * 2 : 2)}, ...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 步骤4: 添加其他字段 */}
          {step === 4 && (
            <div className="space-y-4">
              {/* 已添加的字段列表 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表单字段结构
                </label>
                <div className="border border-gray-300 rounded-lg divide-y divide-gray-200">
                  {/* 主键字段 */}
                  <div className="px-4 py-3 bg-blue-50">
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        主键
                      </span>
                      <span className="font-medium text-gray-900">
                        {primaryKeySource === 'related'
                          ? relatedFields[primaryKeyRelatedIndex]?.fieldName
                          : getFieldName(ownPrimaryKeyId)}
                      </span>
                      {primaryKeySource === 'related' && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          关联字段
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        必填
                      </span>
                    </div>
                  </div>

                  {/* 其他关联字段（非主键） */}
                  {relatedFields.map((rf, index) => {
                    if (primaryKeySource === 'related' && index === primaryKeyRelatedIndex) {
                      return null; // 已作为主键显示
                    }
                    return (
                      <div key={`related-${index}`} className="px-4 py-3 bg-yellow-50">
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-1 text-xs font-semibold bg-yellow-600 text-white rounded-full">
                            外键
                          </span>
                          <span className="font-medium text-gray-900">{rf.fieldName}</span>
                          <span className="text-xs text-gray-500">→ {rf.formName}</span>
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            必填
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* 其他字段 */}
                  {selectedFields.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      尚未添加其他字段，请从下方选择（可选）
                    </div>
                  ) : (
                    selectedFields.map(field => {
                      const fieldInfo = fields.find(f => f.id === field.fieldId);
                      return (
                        <div key={field.fieldId} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">{fieldInfo?.name}</span>
                              <span className="text-xs text-gray-500">{fieldInfo?.type}</span>
                              <button
                                onClick={() => toggleRequired(field.fieldId)}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  field.required
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {field.required ? '必填' : '非必填'}
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveField(field.fieldId)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* 已选择的属性字段 */}
                  {selectedAttributeFields.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium">
                        属性字段
                      </div>
                      {selectedAttributeFields.map(af => {
                        const fieldInfo = fields.find(f => f.id === af.fieldId);
                        return (
                          <div key={af.fieldId} className="px-4 py-3 bg-purple-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                                  第{af.level}级
                                </span>
                                <span className="font-medium text-gray-900">
                                  {fieldInfo?.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {af.attributeFormName}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveAttributeField(af.fieldId)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                移除
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* 可选择的字段列表 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加其他字段（可选）
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {getBaseFields().length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      没有可用的基础字段
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {getBaseFields()
                        .filter(f => {
                          // 排除主键字段
                          if (primaryKeySource === 'own' && f.id === ownPrimaryKeyId) return false;
                          // 排除关联字段
                          if (relatedFields.some(rf => rf.fieldId === f.id)) return false;
                          // 排除已添加的字段
                          if (selectedFields.some(sf => sf.fieldId === f.id)) return false;
                          return true;
                        })
                        .map(field => (
                          <div key={field.id} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{field.name}</div>
                                <div className="text-xs text-gray-500">{field.type}</div>
                              </div>
                              <button
                                onClick={() => handleAddField(field.id, true)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                添加
                              </button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* 可选择的属性字段列表 */}
              {getAttributeFields().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    添加属性字段 <span className="text-xs text-gray-500">（可选，需按级别顺序添加）</span>
                  </label>
                  <div className="border border-purple-300 rounded-lg max-h-48 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {getAttributeFields()
                        .filter(f => !selectedAttributeFields.some(sf => sf.fieldId === f.id))
                        .map(field => {
                          const attributeForm = findAttributeFormByFieldId(field.id);
                          const checkResult = canAddAttributeField(field.id);
                          const fieldLevel = attributeForm ? getFieldLevelInAttributeForm(field.id, attributeForm) : 0;
                          
                          return (
                            <div key={field.id} className={`px-4 py-3 ${checkResult.canAdd ? 'hover:bg-purple-50' : 'bg-gray-100'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{field.name}</span>
                                    {attributeForm && (
                                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                        {attributeForm.name} - 第{fieldLevel}级
                                      </span>
                                    )}
                                  </div>
                                  {!attributeForm && (
                                    <div className="text-xs text-yellow-600">未关联属性表</div>
                                  )}
                                  {attributeForm && !checkResult.canAdd && (
                                    <div className="text-xs text-red-500">{checkResult.reason}</div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAddAttributeField(field.id)}
                                  disabled={!checkResult.canAdd}
                                  className={`px-3 py-1 text-sm rounded ${
                                    checkResult.canAdd 
                                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  添加
                                </button>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                ← 上一步
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            {step < 4 ? (
              <button
                onClick={() => {
                  if (step === 1 && !formName.trim()) {
                    alert('请输入表单名称');
                    return;
                  }
                  if (step === 2 && relatedFields.length === 0) {
                    alert('请至少添加一个关联字段');
                    return;
                  }
                  if (step === 3) {
                    if (!primaryKeySource) {
                      alert('请选择主键来源');
                      return;
                    }
                    if (primaryKeySource === 'related' && primaryKeyRelatedIndex < 0) {
                      alert('请选择哪个关联字段作为主键');
                      return;
                    }
                    if (primaryKeySource === 'own' && !ownPrimaryKeyId) {
                      alert('请选择主键字段');
                      return;
                    }
                  }
                  setStep(step + 1);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                下一步 →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                创建表单
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DNDComponents.RelatedBaseForm = RelatedBaseForm;