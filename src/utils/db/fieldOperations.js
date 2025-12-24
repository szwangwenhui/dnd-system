// DND2 数据库模块 - 字段管理操作
// 原文件位置: src/utils/db.js 第273-378行, 859-923行
// 
// API列表 (8个):
// - generateFieldId(project)
// - checkFieldNameExists(project, fieldName, excludeFieldId)
// - addField(projectId, field)
// - updateField(projectId, fieldId, updatedField)
// - deleteField(projectId, fieldId)
// - getFieldsByProjectId(projectId)
// - updateFieldRelatedForms(projectId, fieldId, formId, action)
// - batchUpdateFieldRelatedForms(projectId, fieldIds, formId, action)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 字段管理（全局）====================

  /**
   * 生成字段ID
   * @param {Object} project - 项目对象
   * @returns {string} 新的字段ID (F001格式)
   */
  proto.generateFieldId = function(project) {
    if (!project.fields || project.fields.length === 0) {
      return 'F001';
    }

    const maxId = project.fields.reduce((max, field) => {
      const num = parseInt(field.id.substring(1));
      return num > max ? num : max;
    }, 0);

    const nextId = maxId + 1;
    return 'F' + nextId.toString().padStart(3, '0');
  };

  /**
   * 检查字段名称是否重复
   * @param {Object} project - 项目对象
   * @param {string} fieldName - 字段名称
   * @param {string} excludeFieldId - 排除的字段ID（用于更新时）
   * @returns {boolean} 是否存在重复
   */
  proto.checkFieldNameExists = function(project, fieldName, excludeFieldId = null) {
    if (!project.fields) return false;
    
    return project.fields.some(field => 
      field.name === fieldName && field.id !== excludeFieldId
    );
  };

  /**
   * 添加字段
   * @param {string} projectId - 项目ID
   * @param {Object} field - 字段对象
   * @returns {Promise<Object>} 新创建的字段
   */
  proto.addField = async function(projectId, field) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 检查字段名称是否重复
    if (this.checkFieldNameExists(project, field.name)) {
      throw new Error('字段名称已存在，请使用其他名称');
    }

    const fieldId = this.generateFieldId(project);
    
    const newField = {
      ...field,
      id: fieldId,
      createdAt: new Date().toISOString(),
      nature: field.nature || '基础字段'  // 字段性质
    };

    project.fields = project.fields || [];
    project.fields.push(newField);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newField;
  };

  /**
   * 更新字段
   * @param {string} projectId - 项目ID
   * @param {string} fieldId - 字段ID
   * @param {Object} updatedField - 更新的字段数据
   * @returns {Promise<Object>} 更新后的字段
   */
  proto.updateField = async function(projectId, fieldId, updatedField) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const fieldIndex = project.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) {
      throw new Error('字段不存在');
    }

    // 如果修改了字段名称，检查是否重复
    if (updatedField.name && updatedField.name !== project.fields[fieldIndex].name) {
      if (this.checkFieldNameExists(project, updatedField.name, fieldId)) {
        throw new Error('字段名称已存在，请使用其他名称');
      }
    }

    project.fields[fieldIndex] = {
      ...project.fields[fieldIndex],
      ...updatedField
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.fields[fieldIndex];
  };

  /**
   * 删除字段
   * @param {string} projectId - 项目ID
   * @param {string} fieldId - 字段ID
   * @returns {Promise<string>} 删除的字段ID
   */
  proto.deleteField = async function(projectId, fieldId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    project.fields = project.fields.filter(f => f.id !== fieldId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return fieldId;
  };

  /**
   * 获取项目的所有字段
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 字段列表
   */
  proto.getFieldsByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.fields || [];
  };

  // ==================== 字段关联表单更新 ====================

  /**
   * 更新字段的关联表单列表
   * @param {string} projectId - 项目ID
   * @param {string} fieldId - 字段ID
   * @param {string} formId - 表单ID
   * @param {string} action - 操作：'add' 或 'remove'
   * @returns {Promise<Object>} 更新后的字段
   */
  proto.updateFieldRelatedForms = async function(projectId, fieldId, formId, action = 'add') {
    return new Promise(async (resolve, reject) => {
      try {
        const project = await this.getProjectById(projectId);
        if (!project) {
          reject(new Error('项目不存在'));
          return;
        }
        
        // 字段存储在项目级别的 project.fields 中
        if (!project.fields) {
          console.warn('项目没有字段列表');
          resolve(null);
          return;
        }
        
        const fieldIndex = project.fields.findIndex(f => f.id === fieldId);
        if (fieldIndex === -1) {
          console.warn('字段未找到:', fieldId);
          resolve(null);
          return;
        }
        
        // 初始化relatedForms数组
        if (!project.fields[fieldIndex].relatedForms) {
          project.fields[fieldIndex].relatedForms = [];
        }
        
        if (action === 'add') {
          // 添加关联（避免重复）
          if (!project.fields[fieldIndex].relatedForms.includes(formId)) {
            project.fields[fieldIndex].relatedForms.push(formId);
          }
        } else if (action === 'remove') {
          // 移除关联
          project.fields[fieldIndex].relatedForms = project.fields[fieldIndex].relatedForms.filter(id => id !== formId);
        }
        
        // 更新项目
        project.updatedAt = new Date().toISOString();
        await this.updateProject(project);
        
        resolve(project.fields[fieldIndex]);
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * 批量更新多个字段的关联表单
   * @param {string} projectId - 项目ID
   * @param {Array<string>} fieldIds - 字段ID数组
   * @param {string} formId - 表单ID
   * @param {string} action - 操作：'add' 或 'remove'
   * @returns {Promise<Array>} 更新结果数组
   */
  proto.batchUpdateFieldRelatedForms = async function(projectId, fieldIds, formId, action = 'add') {
    const results = [];
    for (const fieldId of fieldIds) {
      try {
        const result = await this.updateFieldRelatedForms(projectId, fieldId, formId, action);
        results.push({ fieldId, success: true, field: result });
      } catch (error) {
        results.push({ fieldId, success: false, error: error.message });
      }
    }
    return results;
  };

  console.log('[DND2] db/fieldOperations.js 加载完成 - 8个字段API已注册');
})();
