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

    // 根据ID获取项目
    async getProjectById(id) {
      const { data, error } = await getClient()
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this._formatProject(data) : null;
    },

    // 添加项目
    async addProject(project) {
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

      // 系统用户字段
      const systemFields = [
        { id: 'SYS-FLD-001', name: '用户ID', type: '数字', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-002', name: '账号', type: '文本', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-003', name: '昵称', type: '文本', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-004', name: '头像', type: '文本', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-005', name: '角色', type: '文本', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-006', name: '状态', type: '文本', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-007', name: '注册时间', type: '文本', nature: '系统字段', isSystemField: true },
        { id: 'SYS-FLD-008', name: '最后登录', type: '文本', nature: '系统字段', isSystemField: true }
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
      const updates = {
        name: project.name,
        description: project.description,
        status: project.status,
        roles: project.roles || [],
        fields: project.fields || [],
        forms: project.forms || [],
        data_flows: project.dataFlows || [],
        statistics: project.statistics || [],
        page_templates: project.pageTemplates || [],
        block_templates: project.blockTemplates || []
      };

      const { data, error } = await getClient()
        .from('projects')
        .update(updates)
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;
      return this._formatProject(data);
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
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const forms = project.forms || [];
      const newForm = {
        ...form,
        id: form.id || this.generateFormId(project),
        createdAt: new Date().toISOString()
      };
      forms.push(newForm);

      await this.updateProject({ ...project, forms });
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

    async updateFormData(projectId, formId, primaryKeyValue, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const formIdx = project.forms.findIndex(f => f.id === formId);
      if (formIdx === -1) throw new Error('表单不存在');

      const form = project.forms[formIdx];
      const primaryKey = form.structure?.primaryKey;
      
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
      
      // 为新角色自动创建首页
      const defaultHomePage = {
        id: `${newRoleId}-0000`,
        name: '首页',
        category: '固定页',
        level: 0,
        parentId: null,
        designProgress: 0,
        blocks: [],
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

      const idx = project.dataFlows.findIndex(f => f.id === flowId);
      if (idx === -1) throw new Error('流程不存在');

      project.dataFlows[idx] = { ...project.dataFlows[idx], ...updates };
      await this.updateProject(project);
      return project.dataFlows[idx];
    },

    async deleteDataFlow(projectId, flowId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.dataFlows = project.dataFlows.filter(f => f.id !== flowId);
      await this.updateProject(project);
      return flowId;
    },

    // ==================== 统计管理 ====================

    async getStatisticsByProjectId(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.statistics || [];
    },

    async addStatistics(projectId, stats) {
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

    async updateStatistics(projectId, statsId, updates) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      const idx = project.statistics.findIndex(s => s.id === statsId);
      if (idx === -1) throw new Error('统计不存在');

      project.statistics[idx] = { ...project.statistics[idx], ...updates };
      await this.updateProject(project);
      return project.statistics[idx];
    },

    async deleteStatistics(projectId, statsId) {
      const project = await this.getProjectById(projectId);
      if (!project) throw new Error('项目不存在');

      project.statistics = project.statistics.filter(s => s.id !== statsId);
      await this.updateProject(project);
      return statsId;
    },

    // ==================== 模板管理 ====================

    async getPageTemplates(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.pageTemplates || [];
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

    async getBlockTemplates(projectId) {
      const project = await this.getProjectById(projectId);
      return project?.blockTemplates || [];
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
    }
  };

  // ==================== 反馈模块 ====================
  const feedback = {
    // 提交反馈
    async submit(content, screenshotUrl = null) {
      const user = await auth.getCurrentUser();
      
      const { data, error } = await getClient()
        .from('feedbacks')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || '未登录用户',
          type: 'feedback',
          content: content,
          screenshot_url: screenshotUrl,
          page_url: window.location.href,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // 获取我的反馈
    async getMyFeedbacks() {
      const { data, error } = await getClient()
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

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
