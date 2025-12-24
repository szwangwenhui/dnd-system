// DND2 数据库模块 - 表单管理操作
// 原文件位置: src/utils/db.js 第380-634行
// 
// API列表 (11个):
// 表单管理:
// - generateFormId(project)
// - addForm(projectId, form)
// - updateForm(projectId, formId, updatedForm)
// - deleteForm(projectId, formId)
// - getFormsByProjectId(projectId)
// - buildFormStructure(projectId, formId, structure)
// 
// 表单数据管理:
// - addFormData(projectId, formId, data)
// - getFormDataList(projectId, formId)
// - getFormDataById(projectId, formId, dataId)
// - updateFormData(projectId, formId, primaryKeyValue, data)
// - deleteFormData(projectId, formId, primaryKeyValue)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 表单管理（项目级别）====================

  /**
   * 生成表单ID（FORM-序号，项目级）
   * @param {Object} project - 项目对象
   * @returns {string} 新的表单ID
   */
  proto.generateFormId = function(project) {
    if (!project.forms || project.forms.length === 0) {
      return 'FORM-001';
    }

    const maxNum = project.forms.reduce((max, form) => {
      const num = parseInt(form.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);

    const nextNum = maxNum + 1;
    return `FORM-${nextNum.toString().padStart(3, '0')}`;
  };

  /**
   * 添加表单到项目
   * @param {string} projectId - 项目ID
   * @param {Object} form - 表单对象
   * @returns {Promise<Object>} 新创建的表单
   */
  proto.addForm = async function(projectId, form) {
    console.log('addForm 调用, projectId:', projectId);
    console.log('addForm 传入的form:', JSON.stringify(form, null, 2));
    
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const formId = this.generateFormId(project);

    const newForm = {
      ...form,
      id: formId,
      createdAt: new Date().toISOString(),
      structure: form.structure || null,  // 保留传入的表单结构
      formNature: form.formNature || '基础表单',  // 表单性质
      data: form.data || []  // 表单数据
    };

    console.log('addForm 创建的newForm:', JSON.stringify(newForm, null, 2));

    project.forms = project.forms || [];
    project.forms.push(newForm);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    console.log('addForm 保存成功, formId:', formId);
    return newForm;
  };

  /**
   * 更新表单
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @param {Object} updatedForm - 更新的表单数据
   * @returns {Promise<Object>} 更新后的表单
   */
  proto.updateForm = async function(projectId, formId, updatedForm) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const formIndex = project.forms.findIndex(f => f.id === formId);
    if (formIndex === -1) {
      throw new Error('表单不存在');
    }

    project.forms[formIndex] = {
      ...project.forms[formIndex],
      ...updatedForm
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.forms[formIndex];
  };

  /**
   * 删除表单
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @returns {Promise<string>} 删除的表单ID
   */
  proto.deleteForm = async function(projectId, formId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    project.forms = project.forms.filter(f => f.id !== formId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return formId;
  };

  /**
   * 获取项目的所有表单
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 表单列表
   */
  proto.getFormsByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.forms || [];
  };

  /**
   * 构建表单结构
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @param {Object} structure - 表单结构
   */
  proto.buildFormStructure = async function(projectId, formId, structure) {
    await this.updateForm(projectId, formId, { structure });
  };

  // ==================== 表单数据管理 ====================

  /**
   * 添加表单数据
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @param {Object} data - 数据对象
   * @returns {Promise<Object>} 新创建的数据
   */
  proto.addFormData = async function(projectId, formId, data) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const form = project.forms.find(f => f.id === formId);
    if (!form) {
      throw new Error('表单不存在');
    }

    if (!form.structure) {
      throw new Error('表单结构未构建');
    }

    // 初始化表单数据数组
    if (!form.data) {
      form.data = [];
    }

    // 生成数据ID
    const dataId = `DATA-${formId}-${String(form.data.length + 1).padStart(4, '0')}`;

    const newData = {
      id: dataId,
      ...data,
      // 如果传入的数据已有createdAt，则保留它（用于保持原表顺序）
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    form.data.push(newData);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newData;
  };

  /**
   * 获取表单数据列表
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @returns {Promise<Array>} 数据列表
   */
  proto.getFormDataList = async function(projectId, formId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const form = project.forms.find(f => f.id === formId);
    if (!form) {
      throw new Error('表单不存在');
    }

    return form.data || [];
  };

  /**
   * 获取单条表单数据
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @param {string} dataId - 数据ID
   * @returns {Promise<Object>} 数据对象
   */
  proto.getFormDataById = async function(projectId, formId, dataId) {
    const dataList = await this.getFormDataList(projectId, formId);
    return dataList.find(d => d.id === dataId);
  };

  /**
   * 更新表单数据
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @param {string} primaryKeyValue - 主键值（或记录ID）
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新后的数据
   */
  proto.updateFormData = async function(projectId, formId, primaryKeyValue, data) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const form = project.forms.find(f => f.id === formId);
    if (!form) {
      throw new Error('表单不存在');
    }

    if (!form.data) {
      throw new Error('数据不存在');
    }

    // 获取主键字段ID
    const primaryKeyId = form.structure?.primaryKey;
    
    // 查找数据：优先按主键查找，如果没有主键则按记录id查找
    let dataIndex = -1;
    if (primaryKeyId) {
      // 有主键字段，按主键查找
      dataIndex = form.data.findIndex(d => d[primaryKeyId] === primaryKeyValue);
    } else {
      // 没有主键字段（如属性表），按记录的id字段查找
      dataIndex = form.data.findIndex(d => d.id === primaryKeyValue);
    }
    
    if (dataIndex === -1) {
      throw new Error('数据不存在');
    }

    // 保留创建时间，更新其他字段
    form.data[dataIndex] = {
      ...form.data[dataIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };

    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return form.data[dataIndex];
  };

  /**
   * 删除表单数据
   * @param {string} projectId - 项目ID
   * @param {string} formId - 表单ID
   * @param {string} primaryKeyValue - 主键值（或记录ID）
   */
  proto.deleteFormData = async function(projectId, formId, primaryKeyValue) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const form = project.forms.find(f => f.id === formId);
    if (!form) {
      throw new Error('表单不存在');
    }

    if (!form.data) {
      throw new Error('数据不存在');
    }

    // 获取主键字段ID
    const primaryKeyId = form.structure?.primaryKey;
    
    // 查找数据：优先按主键查找，如果没有主键则按记录id查找
    let dataIndex = -1;
    if (primaryKeyId) {
      // 有主键字段，按主键查找
      dataIndex = form.data.findIndex(d => d[primaryKeyId] === primaryKeyValue);
    } else {
      // 没有主键字段（如属性表），按记录的id字段查找
      dataIndex = form.data.findIndex(d => d.id === primaryKeyValue);
    }

    if (dataIndex === -1) {
      throw new Error('数据不存在');
    }

    form.data.splice(dataIndex, 1);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
  };

  console.log('[DND2] db/formOperations.js 加载完成 - 11个表单API已注册');
})();
