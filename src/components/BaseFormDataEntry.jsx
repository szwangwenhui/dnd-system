// 基础表数据录入组件（支持独立基础表和关联基础表）
function BaseFormDataEntry({ projectId, form, fields, forms, onClose, onSuccess }) {
  const [formValues, setFormValues] = React.useState({});
  const [relatedFormData, setRelatedFormData] = React.useState({}); // 关联表的数据（用于下拉选择）
  const [attributeFormData, setAttributeFormData] = React.useState({}); // 属性表的数据
  const [loading, setLoading] = React.useState(false);
  const [existingData, setExistingData] = React.useState([]); // 已录入的数据
  const [importing, setImporting] = React.useState(false); // Excel导入中

  // 文件选择器引用
  const fileInputRef = React.useRef(null);

  // 初始化表单值和加载关联表数据
  React.useEffect(() => {
    initializeForm();
    loadExistingData();
  }, [form]);

  // Excel导入功能
  const handleExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !['xlsx', 'xls'].includes(fileExtension)) {
      alert('请选择Excel文件（.xlsx 或 .xls）');
      event.target.value = '';
      return;
    }

    setImporting(true);

    try {
      const data = await readExcelFile(file);
      await processExcelData(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setImporting(false);
      event.target.value = ''; // 重置文件选择器
    }
  };

  // 读取Excel文件
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 获取第一个工作表
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // 转换为JSON数组（包含表头）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel文件至少需要包含表头行和一行数据'));
            return;
          }
          
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Excel文件解析失败：' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // 处理Excel数据
  const processExcelData = async (excelData) => {
    const formFields = form.structure?.fields || [];
    
    if (formFields.length === 0) {
      throw new Error('表单结构未定义');
    }

    // 跳过第一行（表头），从第二行开始处理
    const dataRows = excelData.slice(1).filter(row => row && row.length > 0);
    
    if (dataRows.length === 0) {
      throw new Error('Excel文件中没有数据');
    }

    // 获取主键字段信息
    const primaryKeyFieldConfig = formFields.find(f => f.isPrimaryKey);
    const primaryKeyIndex = primaryKeyFieldConfig ? formFields.indexOf(primaryKeyFieldConfig) : 0;
    const primaryKeyFieldInfo = primaryKeyFieldConfig ? getFieldInfo(primaryKeyFieldConfig.fieldId) : null;

    // 收集所有主键值用于重复检测
    const importPrimaryKeys = new Set();
    const existingPrimaryKeys = new Set(existingData.map(d => d[primaryKeyFieldConfig?.fieldId]));

    // 准备导入的数据
    const recordsToImport = [];

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const rowNumber = rowIndex + 2; // Excel行号（跳过表头，从2开始）
      
      const record = {};
      
      // 按字段顺序读取Excel列
      for (let colIndex = 0; colIndex < formFields.length; colIndex++) {
        const fieldConfig = formFields[colIndex];
        const fieldInfo = getFieldInfo(fieldConfig.fieldId);
        const cellValue = row[colIndex];
        
        // 必填字段校验
        if (fieldConfig.required && (cellValue === undefined || cellValue === null || cellValue === '')) {
          throw new Error(`第${rowNumber}行：字段"${fieldInfo?.name || fieldConfig.fieldId}"为必填项，不能为空`);
        }
        
        // 类型校验
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          const validatedValue = validateAndConvertValue(cellValue, fieldInfo, rowNumber);
          record[fieldConfig.fieldId] = validatedValue;
        } else {
          record[fieldConfig.fieldId] = fieldConfig.hasDefault ? fieldConfig.defaultValue : '';
        }
      }
      
      // 主键重复检测（Excel内部）
      if (primaryKeyFieldConfig) {
        const pkValue = record[primaryKeyFieldConfig.fieldId];
        if (importPrimaryKeys.has(pkValue)) {
          throw new Error(`第${rowNumber}行：主键字段"${primaryKeyFieldInfo?.name}"的值"${pkValue}"在Excel中重复`);
        }
        // 主键重复检测（与已有数据）
        if (existingPrimaryKeys.has(pkValue)) {
          throw new Error(`第${rowNumber}行：主键字段"${primaryKeyFieldInfo?.name}"的值"${pkValue}"与已有数据重复`);
        }
        importPrimaryKeys.add(pkValue);
      }
      
      // 添加数据ID和时间戳
      record.id = `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${rowIndex}`;
      record.createdAt = new Date().toISOString();
      
      recordsToImport.push(record);
    }

    // 批量保存数据
    for (const record of recordsToImport) {
      await window.dndDB.addFormData(projectId, form.id, record);
    }

    alert(`成功导入 ${recordsToImport.length} 条数据`);

    // 刷新已录入数据
    const formList = await window.dndDB.getFormsByProjectId(projectId);
    const updatedForm = formList.find(f => f.id === form.id);
    if (updatedForm && updatedForm.data) {
      setExistingData(updatedForm.data);
    }

    onSuccess();
  };

  // 校验并转换值
  const validateAndConvertValue = (value, fieldInfo, rowNumber) => {
    if (!fieldInfo) return value;

    const fieldType = fieldInfo.type;
    const fieldName = fieldInfo.name;

    switch (fieldType) {
      case '整数':
        // 允许数字或可转换为整数的字符串
        const intVal = parseInt(value, 10);
        if (isNaN(intVal)) {
          throw new Error(`第${rowNumber}行：字段"${fieldName}"应为整数，但值为"${value}"`);
        }
        return intVal;
      
      case '小数':
        const floatVal = parseFloat(value);
        if (isNaN(floatVal)) {
          throw new Error(`第${rowNumber}行：字段"${fieldName}"应为小数，但值为"${value}"`);
        }
        return floatVal;
      
      case '布尔':
        // 支持多种布尔值表示
        const boolStr = String(value).toLowerCase().trim();
        if (['true', '是', '1', 'yes', 'y'].includes(boolStr)) return true;
        if (['false', '否', '0', 'no', 'n'].includes(boolStr)) return false;
        throw new Error(`第${rowNumber}行：字段"${fieldName}"应为布尔值（是/否），但值为"${value}"`);
      
      case '日期':
        // Excel日期可能是数字（序列号）或字符串
        if (typeof value === 'number') {
          // Excel日期序列号转换
          const date = XLSX.SSF.parse_date_code(value);
          if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          }
        }
        // 尝试解析日期字符串
        const dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
          throw new Error(`第${rowNumber}行：字段"${fieldName}"应为有效日期，但值为"${value}"`);
        }
        return value;
      
      case '时间':
        // 简单验证时间格式
        if (typeof value === 'number') {
          // Excel时间序列号转换
          const totalSeconds = Math.round(value * 24 * 60 * 60);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return String(value);
      
      case '文本':
      case '长文本':
      default:
        return String(value);
    }
  };

  // 初始化表单
  const initializeForm = async () => {
    if (!form || !form.structure || !form.structure.fields) return;

    // 初始化表单值
    const initialValues = {};
    form.structure.fields.forEach(f => {
      initialValues[f.fieldId] = '';
    });
    
    // 如果主键是自增模式，计算下一个主键值
    const pkConfig = form.structure.primaryKeyConfig;
    if (pkConfig && pkConfig.mode === 'auto') {
      const nextPkValue = calculateNextPrimaryKey(form);
      initialValues[form.structure.primaryKey] = nextPkValue;
    }
    
    setFormValues(initialValues);

    // 加载关联表数据（用于关联字段的下拉选择）
    await loadRelatedFormData();

    // 加载属性表数据（用于属性字段的级联选择）
    await loadAttributeFormData();
  };

  // 计算下一个主键值
  const calculateNextPrimaryKey = (currentForm) => {
    const pkConfig = currentForm.structure?.primaryKeyConfig;
    if (!pkConfig || pkConfig.mode !== 'auto') return '';
    
    const existingData = currentForm.data || [];
    const primaryKeyId = currentForm.structure.primaryKey;
    
    if (existingData.length === 0) {
      // 没有数据，返回开始值
      return pkConfig.startValue;
    }
    
    // 找出现有数据中最大的主键值
    const existingPkValues = existingData
      .map(d => Number(d[primaryKeyId]))
      .filter(v => !isNaN(v));
    
    if (existingPkValues.length === 0) {
      return pkConfig.startValue;
    }
    
    const maxPkValue = Math.max(...existingPkValues);
    const increment = pkConfig.incrementType === 'jump' ? (pkConfig.jumpStep || 1) : 1;
    
    return maxPkValue + increment;
  };

  // 加载已录入的数据
  const loadExistingData = () => {
    if (form && form.data) {
      setExistingData(form.data);
    }
  };

  // 加载关联表数据
  const loadRelatedFormData = async () => {
    if (!form || !form.structure || !form.structure.relatedFields) return;

    const relatedData = {};

    // 对于标题关联基础表，优先加载 managedFormId 对应的关联表单
    if (form.managedFormId) {
      let relatedForm = forms.find(f => f.id === form.managedFormId);

      // 如果关联表没有数据，尝试从数据库加载
      if (relatedForm && !relatedForm.data) {
        try {
          const formData = await window.dndDB.getFormDataList(projectId, form.managedFormId);
          relatedForm = { ...relatedForm, data: formData || [] };
        } catch (error) {
          console.error('加载关联表数据失败:', error);
        }
      }

      if (relatedForm && relatedForm.data) {
        // 找到主键关联字段对应的 reminderFieldId
        const primaryKeyRelatedField = form.structure.fields?.find(f =>
          f.isRelatedField && f.isPrimaryKey
        );
        const reminderFieldId = primaryKeyRelatedField?.reminderFieldId || '';

        relatedData[form.managedFormId] = {
          formName: relatedForm.name,
          primaryKeyId: relatedForm.structure?.primaryKey,
          reminderFieldId: reminderFieldId,
          data: relatedForm.data
        };
      }
    } else {
      // 对于普通关联基础表，加载所有关联表单的数据
      for (const rf of form.structure.relatedFields) {
        let relatedForm = forms.find(f => f.id === rf.formId);

        // 如果关联表没有数据，尝试从数据库加载
        if (relatedForm && !relatedForm.data) {
          try {
            const formData = await window.dndDB.getFormDataList(projectId, rf.formId);
            relatedForm = { ...relatedForm, data: formData || [] };
          } catch (error) {
            console.error('加载关联表数据失败:', error);
            continue;
          }
        }

        if (relatedForm && relatedForm.data) {
          // 获取关联表的主键字段和提醒字段信息
          const primaryKeyId = relatedForm.structure?.primaryKey;
          const reminderFieldId = rf.reminderFieldId;

          relatedData[rf.formId] = {
            formName: relatedForm.name,
            primaryKeyId: primaryKeyId,
            reminderFieldId: reminderFieldId,
            data: relatedForm.data,
            fieldId: rf.fieldId
          };
        }
      }
    }

    setRelatedFormData(relatedData);
  };

  // 加载属性表数据
  const loadAttributeFormData = async () => {
    if (!form || !form.structure || !form.structure.fields) return;

    const attrData = {};
    
    // 找出所有属性字段
    const attrFields = form.structure.fields.filter(f => f.isAttributeField);
    
    for (const af of attrFields) {
      const attributeForm = forms.find(f => f.id === af.attributeFormId);
      if (attributeForm) {
        attrData[af.attributeFormId] = {
          formName: attributeForm.name,
          structure: attributeForm.structure,
          data: attributeForm.data || []
        };
      }
    }

    setAttributeFormData(attrData);
  };

  // 获取字段信息
  const getFieldInfo = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  // 获取字段配置（从表单结构中）
  const getFieldConfig = (fieldId) => {
    if (!form || !form.structure || !form.structure.fields) return null;
    return form.structure.fields.find(f => f.fieldId === fieldId);
  };

  // 判断字段是否为关联字段
  const isRelatedField = (fieldId) => {
    const config = getFieldConfig(fieldId);
    return config?.isRelatedField === true;
  };

  // 判断字段是否为主键关联字段（可以下拉选择）
  const isPrimaryKeyRelatedField = (fieldId) => {
    const config = getFieldConfig(fieldId);
    return config?.isRelatedField === true && config?.isPrimaryKey === true;
  };

  // 获取同一关联表单的主键关联字段的值
  const getPrimaryKeyRelatedFieldValue = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isRelatedField) return null;

    // 对于标题关联基础表，使用 managedFormId
    const relatedFormId = form.managedFormId || config.relatedFormId;
    if (!relatedFormId) return null;

    // 找到同一个关联表单的主键关联字段
    const primaryKeyRelatedField = form.structure?.fields?.find(f =>
      f.isRelatedField === true &&
      f.isPrimaryKey === true
    );

    if (!primaryKeyRelatedField) return null;

    return formValues[primaryKeyRelatedField.fieldId];
  };

  // 根据主键值获取关联字段对应的值（级联）
  const getCascadedFieldValue = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isRelatedField) return null;

    // 如果是主键关联字段，返回当前值
    if (config.isPrimaryKey) {
      return formValues[fieldId];
    }

    // 如果是其他关联字段，根据主键查找对应的值
    const primaryKeyValue = getPrimaryKeyRelatedFieldValue(fieldId);
    if (!primaryKeyValue) return null;

    // 对于标题关联基础表，使用 managedFormId
    const relatedFormId = form.managedFormId || config.relatedFormId;
    const relatedInfo = relatedFormData[relatedFormId];
    if (!relatedInfo || !relatedInfo.data) return null;

    // 查找关联表中主键值对应的记录
    const relatedRecord = relatedInfo.data.find(item =>
      String(item[relatedInfo.primaryKeyId]) === String(primaryKeyValue)
    );

    if (!relatedRecord) return null;

    // 返回该记录中对应字段的值
    return relatedRecord[fieldId];
  };

  // 判断字段是否为属性字段
  const isAttributeField = (fieldId) => {
    const config = getFieldConfig(fieldId);
    return config?.isAttributeField === true;
  };

  // 获取属性字段配置
  const getAttributeFieldConfig = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config?.isAttributeField) return null;
    return config;
  };

  // 获取同一属性表中级别更高（数字更小）的属性字段
  const getHigherLevelAttributeFields = (fieldId) => {
    const config = getAttributeFieldConfig(fieldId);
    if (!config) return [];

    const attributeFormId = config.attributeFormId;
    const currentLevel = config.level;

    // 找出同一属性表中级别更高的字段
    return form.structure.fields
      .filter(f => f.isAttributeField && f.attributeFormId === attributeFormId && f.level < currentLevel)
      .sort((a, b) => a.level - b.level);
  };

  // 获取属性字段的可选值（基于上级选择）
  const getAttributeFieldOptions = (fieldId) => {
    const config = getAttributeFieldConfig(fieldId);
    if (!config) return [];

    const attrFormData = attributeFormData[config.attributeFormId];
    if (!attrFormData || !attrFormData.data || attrFormData.data.length === 0) {
      return [];
    }

    const currentLevel = config.level;
    const levelFields = attrFormData.structure?.levelFields || [];
    
    // 获取当前级别对应的字段ID
    const currentLevelField = levelFields.find(lf => lf.level === currentLevel);
    if (!currentLevelField) return [];

    let filteredData = attrFormData.data;

    // 根据上级选择过滤
    const higherFields = getHigherLevelAttributeFields(fieldId);
    for (const hf of higherFields) {
      const hfLevelField = levelFields.find(lf => lf.level === hf.level);
      if (hfLevelField) {
        const selectedValue = formValues[hf.fieldId];
        if (selectedValue) {
          filteredData = filteredData.filter(d => d[hfLevelField.fieldId] === selectedValue);
        } else {
          // 上级未选择，不能选择当前级别
          return [];
        }
      }
    }

    // 提取当前级别的唯一值
    const values = [...new Set(filteredData.map(d => d[currentLevelField.fieldId]).filter(v => v !== undefined && v !== ''))];
    return values.sort().map(v => ({ value: v, label: v }));
  };

  // 当属性字段值变化时，清除下级字段的值
  const handleAttributeFieldChange = (fieldId, value) => {
    const config = getAttributeFieldConfig(fieldId);
    if (!config) {
      handleInputChange(fieldId, value);
      return;
    }

    // 设置当前字段值
    const newValues = { ...formValues, [fieldId]: value };

    // 清除同一属性表中更低级别字段的值
    const attributeFormId = config.attributeFormId;
    const currentLevel = config.level;

    form.structure.fields
      .filter(f => f.isAttributeField && f.attributeFormId === attributeFormId && f.level > currentLevel)
      .forEach(f => {
        newValues[f.fieldId] = '';
      });

    setFormValues(newValues);
  };

  // 获取关联字段对应的关联表数据
  const getRelatedFieldOptions = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isRelatedField) return [];

    // 对于标题关联基础表，所有关联字段都来自同一个关联表单（managedFormId）
    const relatedFormId = form.managedFormId || config.relatedFormId;

    if (!relatedFormId) return [];

    const relatedInfo = relatedFormData[relatedFormId];
    if (!relatedInfo || !relatedInfo.data) return [];

    return relatedInfo.data.map(item => {
      const primaryKeyValue = item[relatedInfo.primaryKeyId];
      let displayText = String(primaryKeyValue);

      // 如果有提醒字段，添加提醒值
      if (relatedInfo.reminderFieldId && item[relatedInfo.reminderFieldId]) {
        displayText = `${primaryKeyValue} - ${item[relatedInfo.reminderFieldId]}`;
      }

      return {
        value: primaryKeyValue,
        label: displayText
      };
    });
  };

  // 处理输入变化
  const handleInputChange = (fieldId, value) => {
    // 更新字段值
    setFormValues(prev => {
      const newValues = {
        ...prev,
        [fieldId]: value
      };

      // 如果是主键关联字段，级联更新同一关联表单的其他关联字段
      const config = getFieldConfig(fieldId);
      if (config?.isRelatedField && config?.isPrimaryKey) {
        // 对于标题关联基础表，使用 managedFormId
        const relatedFormId = form.managedFormId || config.relatedFormId;

        if (relatedFormId) {
          // 查找同一关联表单的其他关联字段
          const otherRelatedFields = form.structure?.fields?.filter(f =>
            f.isRelatedField === true &&
            !f.isPrimaryKey
          );

          if (otherRelatedFields && otherRelatedFields.length > 0) {
            const relatedInfo = relatedFormData[relatedFormId];
            if (relatedInfo && relatedInfo.data) {
              // 查找关联表中主键值对应的记录
              const relatedRecord = relatedInfo.data.find(item =>
                String(item[relatedInfo.primaryKeyId]) === String(value)
              );

              if (relatedRecord) {
                // 更新其他关联字段的值
                otherRelatedFields.forEach(f => {
                  newValues[f.fieldId] = relatedRecord[f.fieldId];
                });
              }
            }
          }
        }
      }

      return newValues;
    });
  };

  // 验证表单
  const validateForm = () => {
    if (!form || !form.structure || !form.structure.fields) return false;

    for (const fieldConfig of form.structure.fields) {
      if (fieldConfig.required) {
        const value = formValues[fieldConfig.fieldId];
        if (value === '' || value === null || value === undefined) {
          const fieldInfo = getFieldInfo(fieldConfig.fieldId);
          alert(`请填写必填字段：${fieldInfo?.name || fieldConfig.fieldId}`);
          return false;
        }
      }
    }

    // 检查主键是否重复
    const primaryKeyId = form.structure.primaryKey;
    const primaryKeyValue = formValues[primaryKeyId];
    
    if (existingData.some(data => data[primaryKeyId] === primaryKeyValue)) {
      const fieldInfo = getFieldInfo(primaryKeyId);
      alert(`主键值"${primaryKeyValue}"已存在，${fieldInfo?.name || '主键'}不能重复`);
      return false;
    }

    return true;
  };

  // 提交数据
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 转换数据类型
      const processedData = {};
      form.structure.fields.forEach(fieldConfig => {
        const fieldInfo = getFieldInfo(fieldConfig.fieldId);
        let value = formValues[fieldConfig.fieldId];

        // 根据字段类型转换
        if (fieldInfo) {
          if (fieldInfo.type === '整数' && value !== '') {
            value = parseInt(value, 10);
            if (isNaN(value)) value = 0;
          } else if (fieldInfo.type === '小数' && value !== '') {
            value = parseFloat(value);
            if (isNaN(value)) value = 0;
          }
        }

        processedData[fieldConfig.fieldId] = value;
      });

      // 添加数据ID
      processedData.id = `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      processedData.createdAt = new Date().toISOString();

      // 保存到数据库
      await window.dndDB.addFormData(projectId, form.id, processedData);

      alert('数据添加成功！');

      // 刷新已录入数据
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      const updatedForm = formList.find(f => f.id === form.id);
      if (updatedForm && updatedForm.data) {
        setExistingData(updatedForm.data);
      }

      // 重置表单
      const initialValues = {};
      form.structure.fields.forEach(f => {
        initialValues[f.fieldId] = '';
      });
      
      // 如果主键是自增模式，计算下一个主键值
      const pkConfig = form.structure.primaryKeyConfig;
      if (pkConfig && pkConfig.mode === 'auto' && updatedForm) {
        const nextPkValue = calculateNextPrimaryKey(updatedForm);
        initialValues[form.structure.primaryKey] = nextPkValue;
      }
      
      setFormValues(initialValues);

      onSuccess();
    } catch (error) {
      alert('添加数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 渲染输入控件
  const renderInputField = (fieldConfig) => {
    const fieldInfo = getFieldInfo(fieldConfig.fieldId);
    if (!fieldInfo) return null;

    const isRequired = fieldConfig.required;
    const isPrimaryKey = fieldConfig.isPrimaryKey;
    const isRelated = isRelatedField(fieldConfig.fieldId);
    const isAttr = isAttributeField(fieldConfig.fieldId);

    // 属性字段 - 显示级联下拉选择
    if (isAttr) {
      const options = getAttributeFieldOptions(fieldConfig.fieldId);
      const higherFields = getHigherLevelAttributeFields(fieldConfig.fieldId);
      const hasUnselectedHigher = higherFields.some(hf => !formValues[hf.fieldId]);
      
      return (
        <div key={fieldConfig.fieldId} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldInfo.name}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
              属性字段 (第{fieldConfig.level}级)
            </span>
          </label>
          <select
            value={formValues[fieldConfig.fieldId] || ''}
            onChange={(e) => handleAttributeFieldChange(fieldConfig.fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required={isRequired}
            disabled={hasUnselectedHigher}
          >
            <option value="">请选择</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {hasUnselectedHigher && (
            <p className="text-xs text-purple-600 mt-1">
              请先选择上级属性字段
            </p>
          )}
          {!hasUnselectedHigher && options.length === 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              提示：属性表暂无数据，请先在属性表中添加数据
            </p>
          )}
        </div>
      );
    }

    // 关联字段 - 显示下拉选择或只读级联值
    if (isRelated) {
      const isPKRelated = isPrimaryKeyRelatedField(fieldConfig.fieldId);
      const cascadedValue = getCascadedFieldValue(fieldConfig.fieldId);
      const options = getRelatedFieldOptions(fieldConfig.fieldId);

      return (
        <div key={fieldConfig.fieldId} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldInfo.name}
            {isPrimaryKey && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                主键
              </span>
            )}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              关联字段
            </span>
            {!isPKRelated && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                级联字段
              </span>
            )}
          </label>

          {isPKRelated ? (
            /* 主键关联字段：可下拉选择 */
            <>
              <select
                value={formValues[fieldConfig.fieldId] || ''}
                onChange={(e) => handleInputChange(fieldConfig.fieldId, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={isRequired}
              >
                <option value="">请选择</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {options.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  提示：关联表暂无数据，请先在关联表中添加数据
                </p>
              )}
            </>
          ) : (
            /* 其他关联字段：只读级联值 */
            <div
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-700"
            >
              {cascadedValue !== undefined && cascadedValue !== null && cascadedValue !== ''
                ? String(cascadedValue)
                : '请先选择主键关联字段'
              }
            </div>
          )}
        </div>
      );
    }

    // 普通字段 - 根据类型显示不同输入控件
    let inputType = 'text';
    let inputProps = {};
    
    // 检查是否是自增主键
    const pkConfig = form.structure?.primaryKeyConfig;
    const isAutoIncrement = isPrimaryKey && pkConfig && pkConfig.mode === 'auto';

    switch (fieldInfo.type) {
      case '整数':
        inputType = 'number';
        inputProps = { step: 1 };
        break;
      case '小数':
        inputType = 'number';
        inputProps = { step: 0.01 };
        break;
      case '日期':
        inputType = 'date';
        break;
      case '时间':
        inputType = 'time';
        break;
      case '日期时间':
        inputType = 'datetime-local';
        break;
      case '布尔':
        return (
          <div key={fieldConfig.fieldId} className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formValues[fieldConfig.fieldId] === true || formValues[fieldConfig.fieldId] === 'true'}
                onChange={(e) => handleInputChange(fieldConfig.fieldId, e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                {fieldInfo.name}
                {isPrimaryKey && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    主键
                  </span>
                )}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          </div>
        );
      default:
        inputType = 'text';
    }

    // 自增主键 - 显示为只读
    if (isAutoIncrement) {
      return (
        <div key={fieldConfig.fieldId} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldInfo.name}
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              主键
            </span>
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
              系统自增
            </span>
          </label>
          <input
            type={inputType}
            value={formValues[fieldConfig.fieldId] || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            {...inputProps}
          />
          <p className="text-xs text-gray-500 mt-1">主键值由系统自动生成</p>
        </div>
      );
    }

    return (
      <div key={fieldConfig.fieldId} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {fieldInfo.name}
          {isPrimaryKey && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              主键
            </span>
          )}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={inputType}
          value={formValues[fieldConfig.fieldId] || ''}
          onChange={(e) => handleInputChange(fieldConfig.fieldId, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={isRequired}
          {...inputProps}
        />
      </div>
    );
  };

  // 获取字段显示名称
  const getFieldDisplayName = (fieldId) => {
    const fieldInfo = getFieldInfo(fieldId);
    return fieldInfo?.name || fieldId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            添加数据 - {form.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {form.subType} | 已有 {existingData.length} 条数据
          </p>
        </div>

        {/* 内容区 - 左右分栏 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧：数据录入表单 */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-4">录入新数据</h4>
            
            {form.structure && form.structure.fields ? (
              <div>
                {form.structure.fields.map(fieldConfig => renderInputField(fieldConfig))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                表单结构未定义
              </div>
            )}
          </div>

          {/* 右侧：已录入数据预览 */}
          <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              已录入数据 ({existingData.length} 条)
            </h4>
            
            {existingData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无数据
              </div>
            ) : (
              <div className="space-y-3">
                {existingData.slice(-10).reverse().map((data, index) => (
                  <div 
                    key={data.id || index} 
                    className="bg-white p-3 rounded-lg border border-gray-200 text-sm"
                  >
                    {form.structure.fields.slice(0, 4).map(fieldConfig => (
                      <div key={fieldConfig.fieldId} className="flex justify-between py-1">
                        <span className="text-gray-500">
                          {getFieldDisplayName(fieldConfig.fieldId)}:
                        </span>
                        <span className="text-gray-900 font-medium">
                          {data[fieldConfig.fieldId] ?? '-'}
                        </span>
                      </div>
                    ))}
                    {form.structure.fields.length > 4 && (
                      <div className="text-xs text-gray-400 mt-1">
                        ... 还有 {form.structure.fields.length - 4} 个字段
                      </div>
                    )}
                  </div>
                ))}
                {existingData.length > 10 && (
                  <div className="text-center text-gray-500 text-sm">
                    仅显示最近 10 条
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          {/* 左侧：Excel导入 */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={handleExcelImport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              disabled={loading || importing}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {importing ? 'Excel导入中...' : 'Excel表导入'}
            </button>
          </div>
          
          {/* 右侧：关闭和保存 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading || importing}
            >
              关闭
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || importing}
            >
              {loading ? '保存中...' : '保存数据'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.BaseFormDataEntry = BaseFormDataEntry;
