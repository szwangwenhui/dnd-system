/**
 * DND2 Supabase 数据库模块
 * 公测版 - 精简版本
 *
 * 提供与原 IndexedDB 版本兼容的 API
 */

(function() {
  'use strict';

  // 获取 Supabase 客户端
  const getClient = () => {
    if (!window.supabaseClient) {
      throw new Error('Supabase 客户端未初始化');
    }
    return window.supabaseClient;
  };

  // ==================== 缓存管理 ====================
  const cache = {
    project: null,
    projectCacheTime: 0,
    CACHE_TTL: 5 * 60 * 1000 // 5分钟缓存
  };

  // 清除项目缓存
  function clearProjectCache() {
    cache.project = null;
    cache.projectCacheTime = 0;
  }

  // ==================== 认证模块 ====================
  const auth = {
    // 获取当前用户
    async getCurrentUser() {
      const { data: { user } } = await getClient().auth.getUser();
      return user;
    },

    // 登录
    async signIn(email, password) {
      const { data, error } = await getClient().auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },

    // 登出
    async signOut() {
      const { error } = await getClient().auth.signOut();
      if (error) throw error;
    },

    // 监听认证状态变化
    onAuthStateChange(callback) {
      return getClient().auth.onAuthStateChange(callback);
    },

    // 获取当前会话
    async getSession() {
      const { data: { session } } = await getClient().auth.getSession();
      return session;
    }
  };

  // ==================== 数据库模块 ====================
  const db = {
    // 初始化（兼容原接口）
    async init() {
      console.log('[SupabaseDB] 初始化完成');
      return true;
    },

    // ==================== 项目管理 ====================

    // 获取所有项目（当前用户的）
    async getAllProjects() {
      const { data, error } = await getClient()
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this._formatProject);
    },

    // 根据ID获取项目（带缓存）
    async getProjectById(id) {
      const startTime = Date.now();

      // 检查缓存
      const now = Date.now();
      if (cache.project && cache.project.id === id && (now - cache.projectCacheTime) < cache.CACHE_TTL) {
        console.log('[SupabaseDB] getProjectById - 从缓存获取项目:', id, ', 耗时:', Date.now() - startTime, 'ms');
        return cache.project;
      }

      // 从数据库获取
      console.log('[SupabaseDB] getProjectById - 从数据库获取项目:', id);
      const dbStartTime = Date.now();
      const { data, error } = await getClient()
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      console.log('[SupabaseDB] getProjectById - 数据库查询完成, 耗时:', Date.now() - dbStartTime, 'ms');

      if (error && error.code !== 'PGRST116') throw error;

      const project = data ? this._formatProject(data) : null;

      // 更新缓存
      if (project) {
        cache.project = project;
        cache.projectCacheTime = now;
      }

      console.log('[SupabaseDB] getProjectById 完成, 总耗时:', Date.now() - startTime, 'ms');
      return project;
    },

    // 添加项目
    async addProject(project) {
      // 不清除缓存，因为添加的是新项目
      const user = await auth.getCurrentUser();
      if (!user) throw new Error('请先登录');

      // 创建默认的系统管理员角色
      const defaultAdminRole = {
        id: '00',
        name: '系统管理员',
        isSystemRole: true,
        createdAt: new Date().toISOString(),
        fields: [],
        pages: [{
          id: '00-0000',
          name: '首页',
          category: '固定页',
          level: 0,
          parentId: null,
          designProgress: 0,
          blocks: [],
          createdAt: new Date().toISOString()
        }]
      };

      // 创建默认的"系统字段"业务分类
      const defaultBusinessCategory = {
        id: 'BCAT-001',
        name: '系统字段',
        description: '系统内置字段，不可删除',
        createdAt: new Date().toISOString()
      };

      // 系统用户字段
      const systemFields = [
        { id: 'SYS-FLD-001', name: '用户ID', type: '数字', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-002', name: '账号', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-009', name: '密码', type: '密码', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-003', name: '昵称', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-004', name: '头像', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-005', name: '角色', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-006', name: '状态', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-007', name: '注册时间', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' },
        { id: 'SYS-FLD-008', name: '最后登录', type: '文本', nature: '系统字段', isSystemField: true, businessCategoryId: 'BCAT-001' }
      ].map(f => ({ ...f, createdAt: new Date().toISOString() }));

      // 预置管理员账号数据
      const presetAdminData = {
        id: 'DATA-001',
        'SYS-FLD-001': 1,
        'SYS-FLD-002': user.email || 'admin@system.com',
        'SYS-FLD-003': '系统管理员',
        'SYS-FLD-004': '',
        'SYS-FLD-005': 'admin',
        'SYS-FLD-006': '正常',
        'SYS-FLD-007': new Date().toISOString(),
        'SYS-FLD-008': '',
        createdAt: new Date().toISOString()
      };

      // 系统用户表
      const systemUserForm = {
        id: 'SYS-FORM-USER',
        name: '用户管理',
        type: '独立基础表',
        formNature: '系统表单',
        isSystemForm: true,
        isSystemUserForm: true,
        structure: {
          primaryKey: 'SYS-FLD-001',
          primaryKeyType: 'number',
          fields: systemFields.map((f, i) => ({ fieldId: f.id, required: i < 2, order: i }))
        },
        data: [presetAdminData],
        createdAt: new Date().toISOString()
      };

      const newProject = {
        user_id: user.id,
        name: project.name,
        description: project.description || '',
        status: project.status || '进行中',
        roles: project.roles || [defaultAdminRole],
        fields: project.fields || systemFields,
        forms: project.forms || [systemUserForm],
        data_flows: project.dataFlows || [],
        statistics: project.statistics || [],
        business_categories: project.businessCategories || [defaultBusinessCategory],
        page_templates: project.pageTemplates || [],
        block_templates: project.blockTemplates || []
      };

      const { data, error } = await getClient()
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;
      console.log('[SupabaseDB] 项目创建成功:', data.id);
      return this._formatProject(data);
    },

    // 更新项目
    async updateProject(project) {
      console.log('[SupabaseDB] updateProject 开始, projectId:', project.id);
      const startTime = Date.now();

      const updates = {
        name: project.name,
        description: project.description,
        status: project.status,
        roles: project.roles || [],
        fields: project.fields || [],
        forms: project.forms || [],
        data_flows: project.dataFlows || [],
        statistics: project.statistics || [],
        business_categories: project.businessCategories || [],
        page_templates: project.pageTemplates || [],
        block_templates: project.blockTemplates || []
      };

      console.log('[SupabaseDB] updateProject - 准备数据库更新...');
      const dbStartTime = Date.now();
      const { data, error } = await getClient()
        .from('projects')
        .update(updates)
        .eq('id', project.id)
        .select()
        .single();
      console.log('[SupabaseDB] updateProject - 数据库更新完成, 耗时:', Date.now() - dbStartTime, 'ms');

      if (error) throw error;

      // 更新缓存而不是清除
      const updatedProject = this._formatProject(data);
      if (cache.project && cache.project.id === project.id) {
        cache.project = updatedProject;
        cache.projectCacheTime = Date.now();
      }

      console.log('[SupabaseDB] updateProject 完成, 总耗时:', Date.now() - startTime, 'ms');
      return updatedProject;
    },

    // 删除项目
    async deleteProject(id) {
      const { error } = await getClient()
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },

    // 格式化项目数据
    _formatProject(dbProject) {
      if (!dbProject) return null;
      return {
        id: dbProject.id,
        name: dbProject.name,
        description: dbProject.description,
        status: dbProject.status,
        roles: dbProject.roles || [],
        fields: dbProject.fields || [],
        forms: dbProject.forms || [],
        dataFlows: dbProject.data_flows || [],
        statistics: dbProject.statistics || [],
        businessCategories: dbProject.business_categories || [],
        pageTemplates: dbProject.page_templates || [],
        blockTemplates: dbProject.block_templates || [],
        createdAt: dbProject.created_at,
        updatedAt: dbProject.updated_at
      };
    },

    // ==================== 字段管理 ====================

    async getFieldsByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.fields || [];
    },

    generateFieldId(project) {
      const fields = project.fields || [];
      if (fields.length === 0) return 'FLD-001';
      
      const maxNum = fields.reduce((max, f) => {
        const match = f.id?.match(/FLD-(\d+)/);
        const num = match ? parseInt(match[1]) : 0;
        return num > max ? num : max;
      }, 0);
      
      return `FLD-${(maxNum + 1).toString().padStart(3, '0')}`;
    },

    async addField(projectId, field) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const fields = project.fields || [];
      const newField = {
        ...field,
        id: field.id || this.generateFieldId(project),
        createdAt: new Date().toISOString()
      };
      fields.push(newField);

      await this.updateProject({ ...project, fields });
      return newField;
    },

    async updateField(projectId, fieldId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = project.fields.findIndex(f => f.id === fieldId);
      if (idx === -1) throw new Error('字段不存在');

      project.fields[idx] = { ...project.fields[idx], ...updates };
      await this.updateProject(project);
      return project.fields[idx];
    },

    async deleteField(projectId, fieldId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.fields = project.fields.filter(f => f.id !== fieldId);
      await this.updateProject(project);
      return fieldId;
    },

    async updateFieldRelatedForms(projectId, fieldId, relatedForms) {
      console.log('[SupabaseDB] updateFieldRelatedForms 开始, fieldId:', fieldId);
      const startTime = Date.now();

      const project = await this.getProjectById(projectId);
      console.log('[SupabaseDB] updateFieldRelatedForms - getProjectById 耗时:', Date.now() - startTime, 'ms');

      if (!project) throw new Error('项目不存在');

      const idx = (project.fields || []).findIndex(f => f.id === fieldId);
      if (idx === -1) throw new Error('字段不存在');

      project.fields[idx].relatedForms = relatedForms;

      console.log('[SupabaseDB] updateFieldRelatedForms - 准备调用 updateProject, 耗时:', Date.now() - startTime, 'ms');
      await this.updateProject(project);
      console.log('[SupabaseDB] updateFieldRelatedForms 完成, 总耗时:', Date.now() - startTime, 'ms');
      return project.fields[idx];
    },

    // ==================== 业务分类管理 ====================

    // 获取项目的所有业务分类
    async getBusinessCategoriesByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.businessCategories || [];
    },

    // 生成业务分类ID
    generateBusinessCategoryId(project) {
      const categories = project.businessCategories || [];
      if (categories.length === 0) return 'BCAT-001';

      const maxNum = categories.reduce((max, c) => {
        const match = c.id?.match(/BCAT-(\d+)/);
        const num = match ? parseInt(match[1]) : 0;
        return num > max ? num : max;
      }, 0);

      return `BCAT-${(maxNum + 1).toString().padStart(3, '0')}`;
    },

    // 添加业务分类
    async addBusinessCategory(projectId, category) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const categories = project.businessCategories || [];
      const newCategory = {
        ...category,
        id: category.id || this.generateBusinessCategoryId(project),
        createdAt: new Date().toISOString()
      };
      categories.push(newCategory);

      await this.updateProject({ ...project, businessCategories: categories });
      return newCategory;
    },

    // 更新业务分类
    async updateBusinessCategory(projectId, categoryId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = (project.businessCategories || []).findIndex(c => c.id === categoryId);
      if (idx === -1) throw new Error('业务分类不存在');

      project.businessCategories[idx] = { ...project.businessCategories[idx], ...updates };
      await this.updateProject(project);
      return project.businessCategories[idx];
    },

    // 删除业务分类
    async deleteBusinessCategory(projectId, categoryId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      // 检查是否有字段使用该分类
      const usedFields = (project.fields || []).filter(f => f.businessCategoryId === categoryId);
      if (usedFields.length > 0) {
        throw new Error(`该分类下有 ${usedFields.length} 个字段正在使用，无法删除`);
      }

      project.businessCategories = (project.businessCategories || []).filter(c => c.id !== categoryId);
      await this.updateProject(project);
      return categoryId;
    },

    // ==================== 表单管理 ====================

    async getFormsByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.forms || [];
    },

    generateFormId(project) {
      const forms = project.forms || [];
      if (forms.length === 0) return 'FORM-001';
      
      const maxNum = forms.reduce((max, f) => {
        const match = f.id?.match(/FORM-(\d+)/);
        const num = match ? parseInt(match[1]) : 0;
        return num > max ? num : max;
      }, 0);
      
      return `FORM-${(maxNum + 1).toString().padStart(3, '0')}`;
    },

    async addForm(projectId, form) {
      console.log('[SupabaseDB] addForm 开始, projectId:', projectId);
      const startTime = Date.now();

      const project = await this.getProjectById(projectId);
      console.log('[SupabaseDB] addForm - getProjectById 耗时:', Date.now() - startTime, 'ms');

      if (!project) throw new Error('项目不存在');

      const forms = project.forms || [];
      const newForm = {
        ...form,
        id: form.id || this.generateFormId(project),
        createdAt: new Date().toISOString()
      };
      forms.push(newForm);

      console.log('[SupabaseDB] addForm - 准备调用 updateProject, 耗时:', Date.now() - startTime, 'ms');
      await this.updateProject({ ...project, forms });
      console.log('[SupabaseDB] addForm 完成, 总耗时:', Date.now() - startTime, 'ms');
      return newForm;
    },

    async updateForm(projectId, formId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = project.forms.findIndex(f => f.id === formId);
      if (idx === -1) throw new Error('表单不存在');

      project.forms[idx] = { ...project.forms[idx], ...updates };
      await this.updateProject(project);
      return project.forms[idx];
    },

    async deleteForm(projectId, formId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.forms = project.forms.filter(f => f.id !== formId);
      await this.updateProject(project);
      return formId;
    },

    // ==================== 表单数据管理 ====================

    async getFormData(projectId, formId) {
      // 先从项目的表单中获取
      const project = await this.getProjectById(projectId);
      if (!project) return [];

      const form = project.forms.find(f => f.id === formId);
      return form?.data || [];
    },

    // 别名，兼容原有代码
    async getFormDataList(projectId, formId) {
      return this.getFormData(projectId, formId);
    },

    async addFormData(projectId, formId, record) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const formIdx = project.forms.findIndex(f => f.id === formId);
      if (formIdx === -1) throw new Error('表单不存在');

      if (!project.forms[formIdx].data) {
        project.forms[formIdx].data = [];
      }

      const newRecord = {
        ...record,
        id: record.id || `DATA-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      project.forms[formIdx].data.push(newRecord);

      await this.updateProject(project);
      return newRecord;
    },

    // 批量添加表单数据（性能优化）
    async addFormDataBatch(projectId, formId, records) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const formIdx = project.forms.findIndex(f => f.id === formId);
      if (formIdx === -1) throw new Error('表单不存在');

      if (!project.forms[formIdx].data) {
        project.forms[formIdx].data = [];
      }

      const newRecords = records.map(record => ({
        ...record,
        id: record.id || `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: record.createdAt || new Date().toISOString()
      }));
      project.forms[formIdx].data.push(...newRecords);

      await this.updateProject(project);
      return newRecords;
    },

    async updateFormData(projectId, formId, primaryKeyValue, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const formIdx = project.forms.findIndex(f => f.id === formId);
      if (formIdx === -1) throw new Error('表单不存在');

      const form = project.forms[formIdx];
      const primaryKey = form.structure?.primaryKey;

      // 确保 data 存在
      if (!form.data) {
        form.data = [];
      }
      
      let dataIdx = -1;
      if (primaryKey) {
        dataIdx = form.data.findIndex(d => d[primaryKey] === primaryKeyValue);
      } else {
        dataIdx = form.data.findIndex(d => d.id === primaryKeyValue);
      }

      if (dataIdx === -1) throw new Error('数据不存在');

      form.data[dataIdx] = { ...form.data[dataIdx], ...updates, updatedAt: new Date().toISOString() };
      await this.updateProject(project);
      return form.data[dataIdx];
    },

    async deleteFormData(projectId, formId, primaryKeyValue) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const formIdx = project.forms.findIndex(f => f.id === formId);
      if (formIdx === -1) throw new Error('表单不存在');

      const form = project.forms[formIdx];
      const primaryKey = form.structure?.primaryKey;
      
      if (primaryKey) {
        form.data = form.data.filter(d => d[primaryKey] !== primaryKeyValue);
      } else {
        form.data = form.data.filter(d => d.id !== primaryKeyValue);
      }

      await this.updateProject(project);
      return primaryKeyValue;
    },

    // ==================== 角色管理 ====================

    async getRolesByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.roles || [];
    },

    generateRoleId(project) {
      const roles = project.roles || [];
      const maxNum = roles.reduce((max, r) => {
        const num = parseInt(r.id) || 0;
        return num > max ? num : max;
      }, 0);
      return (maxNum + 1).toString().padStart(2, '0');
    },

    async addRole(projectId, role) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const roles = project.roles || [];
      const newRoleId = role.id || this.generateRoleId(project);
      
      // 获取用户管理表ID
      const userFormId = 'SYS-FORM-USER';
      
      // 父区块位置和尺寸
      const parentX = 400;
      const parentY = 150;
      const parentWidth = 400;
      const parentHeight = 300;
      
      // 创建4个内置区块
      const builtInBlocks = [
        // 1. "登录/注册"按钮 - 显示在右上角，点击打开登录注册弹窗
        {
          id: `${newRoleId}-0000-BLK-001`,
          name: '登录/注册',
          type: '按钮',
          x: 1080,
          y: 20,
          width: 100,
          height: 36,
          level: 100,
          isBuiltIn: true,
          // 按钮类型和文字放在顶层
          buttonType: 'openPopup',
          buttonText: '登录/注册',
          buttonConfig: {
            targetBlockId: `${newRoleId}-0000-BLK-002`,
            targetBlockName: '登录注册表单'
          },
          style: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        // 2. 登录注册父区块 - 交互区块，包含账号密码字段，默认隐藏
        {
          id: `${newRoleId}-0000-BLK-002`,
          name: '登录注册表单',
          type: '交互',
          contentType: '表单',
          x: parentX,
          y: parentY,
          width: parentWidth,
          height: parentHeight,
          level: 99,
          isBuiltIn: true,
          isPopup: true,
          // 绑定用户管理表
          targetFormId: userFormId,
          targetFormName: '用户管理',
          selectedFields: ['SYS-FLD-002', 'SYS-FLD-009'],  // 只显示账号 + 密码（不含用户ID主键）
          hideSubmitButton: true,  // 隐藏默认提交按钮
          popupConfig: {
            showCloseButton: true,
            closeOnOverlayClick: true
          },
          style: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            padding: '32px',
            zIndex: -1  // 默认隐藏
          }
        },
        // 3. "登录"按钮 - 子区块，跟随父区块显示/隐藏
        {
          id: `${newRoleId}-0000-BLK-003`,
          name: '登录',
          type: '按钮',
          x: parentX + 50,
          y: parentY + parentHeight - 70,
          width: 140,
          height: 44,
          level: 99,
          isBuiltIn: true,
          parentId: `${newRoleId}-0000-BLK-002`,
          isPopup: false,  // 不是弹窗，只是子区块
          buttonType: 'submitForm',
          buttonText: '登录',
          buttonConfig: {
            submitAction: 'validate',
            formBlockId: `${newRoleId}-0000-BLK-002`,
            onSuccess: 'closePopupAndRefresh',
            onFail: 'showError',
            successMessage: '登录成功',
            failMessage: '账号或密码错误'
          },
          style: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: -1  // 跟随父区块隐藏
          }
        },
        // 4. "注册"按钮 - 子区块，跟随父区块显示/隐藏
        {
          id: `${newRoleId}-0000-BLK-004`,
          name: '注册',
          type: '按钮',
          x: parentX + 210,
          y: parentY + parentHeight - 70,
          width: 140,
          height: 44,
          level: 99,
          isBuiltIn: true,
          parentId: `${newRoleId}-0000-BLK-002`,
          isPopup: false,  // 不是弹窗，只是子区块
          buttonType: 'submitForm',
          buttonText: '注册',
          buttonConfig: {
            submitAction: 'create',
            formBlockId: `${newRoleId}-0000-BLK-002`,
            onSuccess: 'showSuccessAndClear',
            onFail: 'showError',
            successMessage: '注册成功，请登录',
            failMessage: '注册失败，账号可能已存在'
          },
          style: {
            backgroundColor: 'transparent',
            color: '#3b82f6',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#3b82f6',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: -1  // 跟随父区块隐藏
          }
        }
      ];
      
      // 为新角色自动创建首页（包含内置区块）
      const defaultHomePage = {
        id: `${newRoleId}-0000`,
        name: '首页',
        category: '固定页',
        level: 0,
        parentId: null,
        designProgress: 0,
        blocks: builtInBlocks,
        createdAt: new Date().toISOString()
      };
      
      const newRole = {
        ...role,
        id: newRoleId,
        pages: role.pages || [defaultHomePage],  // 如果没有pages，默认创建首页
        fields: role.fields || [],
        createdAt: new Date().toISOString()
      };
      roles.push(newRole);

      await this.updateProject({ ...project, roles });
      return newRole;
    },

    async updateRole(projectId, roleId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = project.roles.findIndex(r => r.id === roleId);
      if (idx === -1) throw new Error('角色不存在');

      project.roles[idx] = { ...project.roles[idx], ...updates };
      await this.updateProject(project);
      return project.roles[idx];
    },

    async deleteRole(projectId, roleId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.roles = project.roles.filter(r => r.id !== roleId);
      await this.updateProject(project);
      return roleId;
    },

    // ==================== 页面管理 ====================

    async getPagesByRoleId(projectId, roleId) {
      const project = await this.getProjectById(projectId);
      if (!project) return [];
      const role = project.roles.find(r => r.id === roleId);
      return role?.pages || [];
    },

    generatePageId(role) {
      const pages = role.pages || [];
      const maxNum = pages.reduce((max, p) => {
        const match = p.id?.match(/\d+-(\d+)/);
        const num = match ? parseInt(match[1]) : 0;
        return num > max ? num : max;
      }, 0);
      return `${role.id}-${(maxNum + 1).toString().padStart(4, '0')}`;
    },

    async addPage(projectId, roleId, page) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const roleIdx = project.roles.findIndex(r => r.id === roleId);
      if (roleIdx === -1) throw new Error('角色不存在');

      const role = project.roles[roleIdx];
      if (!role.pages) role.pages = [];

      const newPage = {
        ...page,
        id: page.id || this.generatePageId(role),
        blocks: page.blocks || [],
        createdAt: new Date().toISOString()
      };
      role.pages.push(newPage);

      await this.updateProject(project);
      return newPage;
    },

    async updatePage(projectId, roleId, pageId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const roleIdx = project.roles.findIndex(r => r.id === roleId);
      if (roleIdx === -1) throw new Error('角色不存在');

      const pageIdx = project.roles[roleIdx].pages.findIndex(p => p.id === pageId);
      if (pageIdx === -1) throw new Error('页面不存在');

      project.roles[roleIdx].pages[pageIdx] = {
        ...project.roles[roleIdx].pages[pageIdx],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.updateProject(project);
      return project.roles[roleIdx].pages[pageIdx];
    },

    async deletePage(projectId, roleId, pageId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const roleIdx = project.roles.findIndex(r => r.id === roleId);
      if (roleIdx === -1) throw new Error('角色不存在');

      project.roles[roleIdx].pages = project.roles[roleIdx].pages.filter(p => p.id !== pageId);
      await this.updateProject(project);
      return pageId;
    },

    // ==================== 数据流程管理 ====================

    async getDataFlowsByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.dataFlows || [];
    },

    async getDataFlowById(projectId, flowId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');
      const flow = (project.dataFlows || []).find(f => f.id === flowId);
      return flow || null;
    },

    async addDataFlow(projectId, dataFlow) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const dataFlows = project.dataFlows || [];
      const newFlow = {
        ...dataFlow,
        id: dataFlow.id || `FLOW-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      dataFlows.push(newFlow);

      await this.updateProject({ ...project, dataFlows });
      return newFlow;
    },

    async updateDataFlow(projectId, flowId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = (project.dataFlows || []).findIndex(f => f.id === flowId);
      if (idx === -1) throw new Error('流程不存在');

      project.dataFlows[idx] = { ...project.dataFlows[idx], ...updates };
      await this.updateProject(project);
      return project.dataFlows[idx];
    },

    async saveDataFlowDesign(projectId, flowId, design) {
      return this.updateDataFlow(projectId, flowId, { design });
    },

    async deleteDataFlow(projectId, flowId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.dataFlows = (project.dataFlows || []).filter(f => f.id !== flowId);
      await this.updateProject(project);
      return flowId;
    },

    // ==================== 统计管理 ====================

    async getStatisticsByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.statistics || [];
    },

    async getStatisticById(projectId, statsId) {
      const project = await this.getProjectById(projectId);
      if (!project) return null;
      return (project.statistics || []).find(s => s.id === statsId) || null;
    },

    async addStatistic(projectId, stats) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const statistics = project.statistics || [];
      const newStats = {
        ...stats,
        id: stats.id || `STATS-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      statistics.push(newStats);

      await this.updateProject({ ...project, statistics });
      return newStats;
    },

    // 兼容旧方法名
    async addStatistics(projectId, stats) {
      return this.addStatistic(projectId, stats);
    },

    async updateStatistic(projectId, statsId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = (project.statistics || []).findIndex(s => s.id === statsId);
      if (idx === -1) throw new Error('统计不存在');

      project.statistics[idx] = { ...project.statistics[idx], ...updates };
      await this.updateProject(project);
      return project.statistics[idx];
    },

    // 兼容旧方法名
    async updateStatistics(projectId, statsId, updates) {
      return this.updateStatistic(projectId, statsId, updates);
    },

    async updateStatisticData(projectId, statsId, data) {
      return this.updateStatistic(projectId, statsId, { data });
    },

    async deleteStatistic(projectId, statsId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.statistics = (project.statistics || []).filter(s => s.id !== statsId);
      await this.updateProject(project);
      return statsId;
    },

    // 兼容旧方法名
    async deleteStatistics(projectId, statsId) {
      return this.deleteStatistic(projectId, statsId);
    },

    // ==================== 变量管理 ====================

    async getVariables(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.variables || [];
    },

    async getVariableById(projectId, varId) {
      const project = await this.getProjectById(projectId);
      if (!project) return null;
      return (project.variables || []).find(v => v.id === varId) || null;
    },

    async getVariablesBySourceType(projectId, sourceType) {
      const project = await this.getProjectById(projectId);
      if (!project) return [];
      return (project.variables || []).filter(v => v.sourceType === sourceType);
    },

    async addVariable(projectId, variable) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const variables = project.variables || [];
      const newVar = {
        ...variable,
        id: variable.id || `VAR-${Date.now()}`,
        usages: [],
        createdAt: new Date().toISOString()
      };
      variables.push(newVar);

      await this.updateProject({ ...project, variables });
      return newVar;
    },

    async updateVariable(projectId, varId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = (project.variables || []).findIndex(v => v.id === varId);
      if (idx === -1) throw new Error('变量不存在');

      project.variables[idx] = { ...project.variables[idx], ...updates };
      await this.updateProject(project);
      return project.variables[idx];
    },

    async deleteVariable(projectId, varId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.variables = (project.variables || []).filter(v => v.id !== varId);
      await this.updateProject(project);
      return varId;
    },

    async addVariableUsage(projectId, varId, nodeId, flowId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = (project.variables || []).findIndex(v => v.id === varId);
      if (idx === -1) throw new Error('变量不存在');

      const usages = project.variables[idx].usages || [];
      // 避免重复添加
      if (!usages.some(u => u.nodeId === nodeId && u.flowId === flowId)) {
        usages.push({ nodeId, flowId, addedAt: new Date().toISOString() });
        project.variables[idx].usages = usages;
        await this.updateProject(project);
      }
      return project.variables[idx];
    },

    // ==================== 模板管理 ====================

    async getPageTemplates(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.pageTemplates || [];
    },

    // 兼容旧方法名
    async getPageTemplatesByProjectId(projectId) {
      return this.getPageTemplates(projectId);
    },

    async addPageTemplate(projectId, template) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const templates = project.pageTemplates || [];
      const newTemplate = {
        ...template,
        id: `PT-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      templates.push(newTemplate);

      await this.updateProject({ ...project, pageTemplates: templates });
      return newTemplate;
    },

    async createPageFromTemplate(projectId, roleId, templateId, pageName) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');
      
      const template = (project.pageTemplates || []).find(t => t.id === templateId);
      if (!template) throw new Error('模板不存在');
      
      const newPage = {
        ...template.design,
        name: pageName || template.name,
        id: `PAGE-${Date.now()}`
      };
      
      return this.addPage(projectId, roleId, newPage);
    },

    async getBlockTemplates(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.blockTemplates || [];
    },

    // 兼容旧方法名
    async getBlockTemplatesByProjectId(projectId) {
      return this.getBlockTemplates(projectId);
    },

    async addBlockTemplate(projectId, template) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const templates = project.blockTemplates || [];
      const newTemplate = {
        ...template,
        id: `BT-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      templates.push(newTemplate);

      await this.updateProject({ ...project, blockTemplates: templates });
      return newTemplate;
    },

    async createBlockFromTemplate(projectId, templateId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');
      
      const template = (project.blockTemplates || []).find(t => t.id === templateId);
      if (!template) throw new Error('模板不存在');
      
      // 返回模板设计的副本，生成新ID
      return {
        ...template.design,
        id: `BLOCK-${Date.now()}`
      };
    },

    async deleteBlockTemplate(projectId, templateId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.blockTemplates = (project.blockTemplates || []).filter(t => t.id !== templateId);
      await this.updateProject(project);
      return templateId;
    },

    // ==================== 页面参数 ====================

    getAvailableParams() {
      return [
        { name: 'userId', label: '用户ID', sources: ['URL', 'LocalStorage', 'SessionStorage'], defaultSource: 'LocalStorage', dataType: 'string' },
        { name: 'recordId', label: '记录ID', sources: ['URL'], defaultSource: 'URL', dataType: 'string' },
        { name: 'formId', label: '表单ID', sources: ['URL'], defaultSource: 'URL', dataType: 'string' },
        { name: 'pageId', label: '页面ID', sources: ['URL'], defaultSource: 'URL', dataType: 'string' },
        { name: 'roleId', label: '角色ID', sources: ['URL', 'LocalStorage', 'SessionStorage'], defaultSource: 'LocalStorage', dataType: 'string' }
      ];
    },

    async getPageParams(projectId, roleId, pageId) {
      const pages = await this.getPagesByRoleId(projectId, roleId);
      const page = pages.find(p => p.id === pageId);
      return page?.paramConfig || { requiredParams: [], optionalParams: [], customParams: [], missingAction: 'error' };
    },

    async updatePageParams(projectId, roleId, pageId, paramConfig) {
      return this.updatePage(projectId, roleId, pageId, { paramConfig });
    },

    validatePageParams(paramConfig) {
      const errors = [];
      const warnings = [];
      
      if (!paramConfig) {
        return { valid: true, errors: [], warnings: [] };
      }
      
      const allParams = [
        ...(paramConfig.requiredParams || []),
        ...(paramConfig.optionalParams || []),
        ...(paramConfig.customParams || [])
      ];
      
      // 检查参数名称是否重复
      const paramNames = allParams.map(p => p.name);
      const duplicates = paramNames.filter((name, idx) => paramNames.indexOf(name) !== idx);
      if (duplicates.length > 0) {
        errors.push(`参数名称重复: ${[...new Set(duplicates)].join(', ')}`);
      }
      
      // 检查必需参数是否有默认值或有效来源
      (paramConfig.requiredParams || []).forEach(param => {
        if (!param.source && !param.defaultValue) {
          warnings.push(`必需参数 "${param.name}" 没有指定来源或默认值`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    },

    // ==================== 聚合运算 ====================

    // 判断是否为数值型字段
    isNumericField(field) {
      if (!field) return false;
      return ['整数', '浮点数', '日期/时间'].includes(field.type);
    },

    // 判断是否支持排序
    isSortableField(field) {
      if (!field) return false;
      return this.isNumericField(field) || field.type === '字符串';
    },

    // 求记录数
    async countFormRecords(projectId, formId) {
      const data = await this.getFormData(projectId, formId);
      return data.length;
    },

    // 求和
    async sumFormField(projectId, formId, fieldId) {
      const data = await this.getFormData(projectId, formId);
      const numericValues = data
        .map(record => parseFloat(record[fieldId]))
        .filter(value => !isNaN(value));
      return numericValues.reduce((sum, val) => sum + val, 0);
    },

    // 求平均值
    async avgFormField(projectId, formId, fieldId) {
      const data = await this.getFormData(projectId, formId);
      const numericValues = data
        .map(record => parseFloat(record[fieldId]))
        .filter(value => !isNaN(value));
      if (numericValues.length === 0) return 0;
      const sum = numericValues.reduce((sum, val) => sum + val, 0);
      return sum / numericValues.length;
    },

    // 求最大值（返回数值和对应的主键）
    async maxFormField(projectId, formId, fieldId) {
      const data = await this.getFormData(projectId, formId);
      const primaryKey = await this.getFormPrimaryKey(projectId, formId);

      let maxRecord = null;
      let maxValue = -Infinity;

      for (const record of data) {
        const value = parseFloat(record[fieldId]);
        if (!isNaN(value) && value > maxValue) {
          maxValue = value;
          maxRecord = record;
        }
      }

      if (!maxRecord) return null;
      return {
        value: maxValue,
        primaryKey: primaryKey ? maxRecord[primaryKey] : maxRecord.id
      };
    },

    // 求最小值（返回数值和对应的主键）
    async minFormField(projectId, formId, fieldId) {
      const data = await this.getFormData(projectId, formId);
      const primaryKey = await this.getFormPrimaryKey(projectId, formId);
      
      let minRecord = null;
      let minValue = Infinity;

      for (const record of data) {
        const value = parseFloat(record[fieldId]);
        if (!isNaN(value) && value < minValue) {
          minValue = value;
          minRecord = record;
        }
      }

      if (!minRecord) return null;
      return {
        value: minValue,
        primaryKey: primaryKey ? minRecord[primaryKey] : minRecord.id
      };
    },

    // 求中位数
    async medianFormField(projectId, formId, fieldId) {
      const data = await this.getFormData(projectId, formId);
      const numericValues = data
        .map(record => parseFloat(record[fieldId]))
        .filter(value => !isNaN(value))
        .sort((a, b) => a - b);

      if (numericValues.length === 0) return 0;

      const mid = Math.floor(numericValues.length / 2);
      if (numericValues.length % 2 === 0) {
        return (numericValues[mid - 1] + numericValues[mid]) / 2;
      } else {
        return numericValues[mid];
      }
    },

    // 排序表单数据
    async sortFormRecords(projectId, formId, fieldId, order = 'asc') {
      const data = await this.getFormData(projectId, formId);
      const sortedData = [...data].sort((a, b) => {
        const valueA = a[fieldId];
        const valueB = b[fieldId];

        // 数字排序
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return order === 'asc' ? valueA - valueB : valueB - valueA;
        }

        // 字符串排序（拼音序或字母序）
        const strA = String(valueA || '');
        const strB = String(valueB || '');
        return order === 'asc' 
          ? strA.localeCompare(strB, 'zh-CN') 
          : strB.localeCompare(strA, 'zh-CN');
      });

      return sortedData;
    },

    // 获取表单主键
    async getFormPrimaryKey(projectId, formId) {
      const project = await this.getProjectById(projectId);
      if (!project) return null;
      const form = project.forms?.find(f => f.id === formId);
      return form?.structure?.primaryKey || null;
    },

    // 复制表单（用于另存为功能）
    async copyForm(projectId, sourceFormId, newName) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const forms = project.forms || [];
      const sourceForm = forms.find(f => f.id === sourceFormId);
      if (!sourceForm) throw new Error('源表单不存在');

      const newForm = {
        ...sourceForm,
        id: this.generateFormId({ forms }),
        name: newName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.addForm(projectId, newForm);
      return newForm;
    },

    // ==================== 子表功能 ====================
    
    // 检查是否为属性字段
    isAttributeField(fieldId, fields) {
      const field = fields.find(f => f.id === fieldId);
      return field?.type === '属性表单';
    },

    // 获取属性字段的所有层级
    getAttributeFieldLevels(fieldId, fields) {
      const levels = [];
      const field = fields.find(f => f.id === fieldId);
      if (!field || field.type !== '属性表单') return levels;

      // 获取属性字段的relatedForms，这是包含所有层级ID的数组
      const relatedForms = field.relatedForms || [];
      if (Array.isArray(relatedForms)) {
        relatedForms.forEach(formId => {
          const formField = fields.find(f => f.id === formId);
          if (formField) {
            levels.push({
              fieldId: formField.id,
              name: formField.name,
              level: relatedForms.indexOf(formId)
            });
          }
        });
      }
      return levels;
    },

    // 生成子表名称
    generateSubTableName(sourceFormName, criteria) {
      const field = criteria.field;
      const values = criteria.values || [];
      if (values.length === 1) {
        return `${sourceFormName}-${field.name}-${values[0]}`;
      } else {
        return `${sourceFormName}-${field.name}(${values.length}个值)`;
      }
    },

    // 创建子表
    async createSubTable(projectId, config) {
      const {
        sourceFormId,
        subType, // 'horizontal' (横向), 'vertical' (纵向), 'mixed' (混合)
        selectedFields, // 横向选择的字段（不包含主键）
        criteria, // 纵向截取条件 { fieldId, operator, values }
        tableName
      } = config;

      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const sourceForm = project.forms.find(f => f.id === sourceFormId);
      if (!sourceForm) throw new Error('源表单不存在');

      const sourceFields = project.fields || [];
      const allFormFields = sourceForm.structure?.fields || [];
      
      // 获取完整的字段对象
      const selectedFieldObjects = allFormFields
        .filter(f => selectedFields.includes(f.fieldId))
        .map(f => {
          const fieldDef = sourceFields.find(sf => sf.id === f.fieldId);
          return { ...f, ...fieldDef };
        });

      // 过滤数据
      let filteredData = [...(sourceForm.data || [])];

      // 如果有纵向截取条件
      if (criteria && subType !== 'horizontal') {
        const criteriaField = sourceFields.find(f => f.id === criteria.fieldId);
        if (!criteriaField) throw new Error('标准字段不存在');

        if (criteria.operator === 'equals') {
          // 单选或多选等于
          filteredData = filteredData.filter(record => {
            const fieldValue = record[criteria.fieldId];
            return criteria.values.includes(fieldValue);
          });
        } else if (criteria.operator === 'range') {
          // 范围选择（针对数字类型）
          const [min, max] = criteria.values;
          filteredData = filteredData.filter(record => {
            const fieldValue = record[criteria.fieldId];
            return fieldValue >= min && fieldValue <= max;
          });
        }
      }

      // 如果有横向截取，只保留选中的字段
      let dataForNewTable = filteredData;
      if (subType === 'horizontal' || subType === 'mixed') {
        const fieldIdsToKeep = new Set(selectedFields);
        if (sourceForm.structure?.primaryKey) {
          fieldIdsToKeep.add(sourceForm.structure.primaryKey);
        }

        dataForNewTable = filteredData.map(record => {
          const newRecord = {};
          fieldIdsToKeep.forEach(fieldId => {
            if (record[fieldId] !== undefined) {
              newRecord[fieldId] = record[fieldId];
            }
          });
          return newRecord;
        });
      }

      // 构建新表单的结构
      const newFormFields = subType === 'horizontal' || subType === 'mixed'
        ? allFormFields.filter(f => selectedFields.includes(f.fieldId))
        : allFormFields;

      // 构建表单名称
      const formName = tableName || this.generateSubTableName(
        sourceForm.name,
        criteria ? { field: sourceFields.find(f => f.id === criteria.fieldId), values: criteria.values } : {}
      );

      const newForm = {
        id: this.generateFormId({ forms: project.forms }),
        name: formName,
        type: '对象表单',
        subType: '子表',
        formNature: '用户表单',
        structure: {
          primaryKey: sourceForm.structure?.primaryKey,
          primaryKeyType: sourceForm.structure?.primaryKeyType,
          fields: newFormFields
        },
        data: dataForNewTable,
        sourceFormId: sourceFormId, // 记录源表单
        subTableConfig: config, // 记录子表配置
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.addForm(projectId, newForm);
      return newForm;
    },

    // ==================== 再造表功能 ====================

    // 创建再造表
    async createRebuildTable(projectId, config) {
      const {
        sourceFormId,
        targetFieldId, // 标的字段（通常是属性字段）
        aggregationType, // 聚合方式：'count', 'sum', 'avg', 'max', 'min', 'median'
        tableName
      } = config;

      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const sourceForm = project.forms.find(f => f.id === sourceFormId);
      if (!sourceForm) throw new Error('源表单不存在');

      const sourceFields = project.fields || [];
      const allFormFields = sourceForm.structure?.fields || [];
      
      // 获取标的字段
      const targetField = sourceFields.find(f => f.id === targetFieldId);
      if (!targetField) throw new Error('标的字段不存在');

      // 获取数值类字段（用于聚合运算）- 支持多种数值类型
      const numericFields = allFormFields.filter(f => {
        const fieldDef = sourceFields.find(sf => sf.id === f.fieldId);
        return fieldDef && ['数字', '金额', '数量', '整数', '小数', '浮点数'].includes(fieldDef.type);
      });

      // 获取标的字段的所有唯一值
      const uniqueValues = [...new Set(
        (sourceForm.data || []).map(record => record[targetFieldId]).filter(v => v !== undefined && v !== null)
      )];

      // 为每个唯一值生成子表并进行聚合运算
      const rebuildData = [];

      for (const value of uniqueValues) {
        // 生成子表（值为value的记录）
        const subTableData = (sourceForm.data || []).filter(
          record => record[targetFieldId] === value
        );

        // 对每个数值字段进行聚合运算
        const aggregatedRecord = {
          id: `REBUILD-${Date.now()}-${rebuildData.length}`,
          [targetFieldId]: value // 标的字段的值作为主键
        };

        numericFields.forEach(field => {
          const fieldId = field.fieldId;
          const values = subTableData
            .map(record => record[fieldId])
            .filter(v => v !== undefined && v !== null && !isNaN(Number(v)));

          let aggregatedValue = null;
          if (values.length > 0) {
            const numericValues = values.map(v => Number(v));
            switch (aggregationType) {
              case 'count':
                aggregatedValue = values.length;
                break;
              case 'sum':
                aggregatedValue = numericValues.reduce((sum, v) => sum + v, 0);
                break;
              case 'avg':
                aggregatedValue = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
                break;
              case 'max':
                aggregatedValue = Math.max(...numericValues);
                break;
              case 'min':
                aggregatedValue = Math.min(...numericValues);
                break;
              case 'median':
                sortedValues = [...numericValues].sort((a, b) => a - b);
                const mid = Math.floor(sortedValues.length / 2);
                aggregatedValue = sortedValues.length % 2
                  ? sortedValues[mid]
                  : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
                break;
              default:
                aggregatedValue = null;
            }
          }

          aggregatedRecord[fieldId] = aggregatedValue;
        });

        rebuildData.push(aggregatedRecord);
      }

      // 构建新表单的结构
      // 主键是标的字段
      // 字段包括：标的字段 + 数值类字段
      const newFormFields = [
        {
          fieldId: targetFieldId,
          required: true,
          order: 0
        },
        ...numericFields.map((f, index) => ({
          fieldId: f.fieldId,
          required: false,
          order: index + 1
        }))
      ];

      const newForm = {
        id: this.generateFormId({ forms: project.forms }),
        name: tableName || `${sourceForm.name}-再造表`,
        type: '对象表单',
        subType: '再造表',
        formNature: '用户表单',
        structure: {
          primaryKey: targetFieldId,
          primaryKeyType: targetField.type === '数字' ? 'number' : 'string',
          fields: newFormFields
        },
        data: rebuildData,
        sourceFormId: sourceFormId,
        rebuildTableConfig: config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.addForm(projectId, newForm);
      return newForm;
    }
  };

  // ==================== 反馈模块 ====================
  const feedback = {
    // 生成反馈显示编号（年月日+3位数，如20241225001）- 仅用于显示
    generateDisplayId() {
      const now = new Date();
      const dateStr = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
      return dateStr + '-' + timeStr;
    },

    // 提交反馈
    async submit(content, screenshotUrl = null) {
      const user = await auth.getCurrentUser();
      
      const { data, error } = await getClient()
        .from('feedbacks')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || '未登录用户',
          content: content,
          screenshot: screenshotUrl,
          page_url: window.location.href,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // 获取所有反馈
    async getAllFeedbacks() {
      const { data, error } = await getClient()
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // 获取我的反馈
    async getMyFeedbacks() {
      const user = await auth.getCurrentUser();
      if (!user) return [];
      
      const { data, error } = await getClient()
        .from('feedbacks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // 添加回复
    async addReply(feedbackId, content) {
      const user = await auth.getCurrentUser();
      if (!user) throw new Error('请先登录');
      
      const { data, error } = await getClient()
        .from('feedback_replies')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
          user_email: user.email,
          content: content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // 获取反馈的回复
    async getReplies(feedbackId) {
      const { data, error } = await getClient()
        .from('feedback_replies')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  };

  // ==================== 存储模块 ====================
  const storage = {
    // 上传文件
    async uploadFile(file, folder = 'uploads') {
      const user = await auth.getCurrentUser();
      const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${file.name}`;
      
      const { data, error } = await getClient().storage
        .from(folder)
        .upload(fileName, file);

      if (error) throw error;

      // 获取公开URL
      const { data: { publicUrl } } = getClient().storage
        .from(folder)
        .getPublicUrl(data.path);

      return publicUrl;
    },

    // 上传截图（Base64）
    async uploadScreenshot(base64Data) {
      // 将base64转为blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
      
      return this.uploadFile(file, 'uploads');
    }
  };

  // 导出到全局
  window.supabaseAuth = auth;
  window.supabaseDB = db;
  window.supabaseFeedback = feedback;
  window.supabaseStorage = storage;
  
  // 兼容原有代码 - 将 dndDB 指向 supabaseDB
  window.dndDB = db;

  console.log('[DND2] utils/supabaseDB.js 加载完成');
})();
