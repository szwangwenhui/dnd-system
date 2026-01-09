/**
 * DND系统内置表单定义
 * 
 * 系统用户表和字段在项目创建时由 projectOperations.js 自动创建
 * 本模块提供：
 * - 查找系统用户表
 * - 同步authService用户到系统用户表
 */

(function() {
  'use strict';

  // 系统字段ID映射
  const SYS_FIELD_IDS = {
    userId: 'SYS-FLD-001',
    email: 'SYS-FLD-002',
    nickname: 'SYS-FLD-003',
    avatar: 'SYS-FLD-004',
    role: 'SYS-FLD-005',
    status: 'SYS-FLD-006',
    createdAt: 'SYS-FLD-007',
    lastLoginAt: 'SYS-FLD-008'
  };

  // 系统用户表ID
  const SYSTEM_USER_FORM_ID = 'SYS-FORM-USER';

  // 获取系统用户表
  const getSystemUserForm = async (projectId) => {
    if (!window.dndDB || !projectId) return null;
    
    try {
      const project = await window.dndDB.getProjectById(projectId);
      if (!project) return null;
      
      const forms = project.forms || [];
      return forms.find(f => f.id === SYSTEM_USER_FORM_ID || f.isSystemUserForm === true);
    } catch (e) {
      console.error('[SystemForms] 获取系统用户表失败:', e);
      return null;
    }
  };

  // 同步authService用户到DND用户表
  const syncAuthUsersToDND = async (projectId) => {
    if (!window.dndDB) {
      console.log('[SystemForms] dndDB不可用，跳过用户同步');
      return;
    }

    try {
      // 获取系统用户表
      const systemForm = await getSystemUserForm(projectId);
      if (!systemForm) {
        console.log('[SystemForms] 系统用户表不存在，跳过同步');
        return;
      }

      // 从localStorage直接读取用户（mock模式）
      let authUsers = [];
      const usersJson = localStorage.getItem('dnd_users');
      if (usersJson) {
        const users = JSON.parse(usersJson);
        authUsers = users.map(({ passwordHash, ...user }) => user);
      }

      if (!authUsers || authUsers.length === 0) {
        console.log('[SystemForms] 没有用户需要同步');
        return;
      }

      // 获取DND表中已有的用户数据
      const existingData = systemForm.data || [];
      const existingEmails = new Set(existingData.map(d => d[SYS_FIELD_IDS.email]));

      // 获取当前最大用户ID
      let maxDataId = existingData.reduce((max, d) => {
        const num = parseInt((d.id || '').replace('DATA-', '')) || 0;
        return num > max ? num : max;
      }, 0);

      // 同步每个用户
      let syncedCount = 0;
      for (const user of authUsers) {
        if (!existingEmails.has(user.email)) {
          // 用户不存在，创建
          maxDataId++;
          const userData = {
            [SYS_FIELD_IDS.userId]: user.userId,
            [SYS_FIELD_IDS.email]: user.email,
            [SYS_FIELD_IDS.nickname]: user.nickname || '',
            [SYS_FIELD_IDS.avatar]: user.avatar || '',
            [SYS_FIELD_IDS.role]: user.role || 'user',
            [SYS_FIELD_IDS.status]: user.status || '正常',
            [SYS_FIELD_IDS.createdAt]: user.createdAt || new Date().toISOString(),
            [SYS_FIELD_IDS.lastLoginAt]: user.lastLoginAt || '',
            id: `DATA-${maxDataId.toString().padStart(3, '0')}`,
            createdAt: new Date().toISOString()
          };
          
          try {
            await window.dndDB.addFormData(projectId, systemForm.id, userData);
            console.log('[SystemForms] 用户已同步:', user.email);
            syncedCount++;
          } catch (e) {
            console.error('[SystemForms] 同步用户失败:', user.email, e);
          }
        }
      }

      if (syncedCount > 0) {
        console.log('[SystemForms] 用户同步完成，新增', syncedCount, '个用户');
      } else {
        console.log('[SystemForms] 所有用户已存在，无需同步');
      }
    } catch (error) {
      console.error('[SystemForms] 同步用户数据失败:', error);
    }
  };

  // 初始化系统表单（确保存在并同步用户）
  const initSystemForms = async (projectId) => {
    if (!window.dndDB) {
      console.error('[SystemForms] dndDB不可用');
      return { success: false, error: 'dndDB不可用' };
    }

    if (!projectId) {
      console.error('[SystemForms] 缺少projectId');
      return { success: false, error: '缺少projectId' };
    }

    try {
      // 检查系统用户表是否存在
      const systemForm = await getSystemUserForm(projectId);
      
      if (!systemForm) {
        // 系统用户表不存在，说明是旧项目，需要手动创建
        console.log('[SystemForms] 系统用户表不存在（旧项目），尝试创建...');
        
        // 为旧项目创建系统字段和表单
        const result = await createSystemFormsForOldProject(projectId);
        if (!result.success) {
          return result;
        }
      }

      // 同步authService用户
      await syncAuthUsersToDND(projectId);

      return { success: true, formId: SYSTEM_USER_FORM_ID };
    } catch (error) {
      console.error('[SystemForms] 初始化系统表单失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 为旧项目创建系统表单（兼容已存在的项目）
  const createSystemFormsForOldProject = async (projectId) => {
    try {
      // 注意：这里会触发缓存更新，但不会清除缓存
      const project = await window.dndDB.getProjectById(projectId);
      if (!project) {
        return { success: false, error: '项目不存在' };
      }

      // 检查是否已有系统字段
      const existingFields = project.fields || [];
      const hasSysFields = existingFields.some(f => f.id && f.id.startsWith('SYS-FLD-'));
      
      if (!hasSysFields) {
        // 创建系统字段
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

        project.fields = [...existingFields, ...systemFields];
        console.log('[SystemForms] 系统字段已添加');
      }

      // 检查是否已有系统用户表
      const existingForms = project.forms || [];
      const hasSysForm = existingForms.some(f => f.id === SYSTEM_USER_FORM_ID || f.isSystemUserForm);
      
      if (!hasSysForm) {
        // 创建系统用户表
        const systemUserForm = {
          id: SYSTEM_USER_FORM_ID,
          name: '用户管理',
          type: '独立基础表',
          formNature: '系统表单',
          isSystemForm: true,
          isSystemUserForm: true,
          description: '系统用户信息表',
          structure: {
            primaryKey: SYS_FIELD_IDS.userId,
            primaryKeyType: 'number',
            fields: Object.values(SYS_FIELD_IDS).map((fieldId, index) => ({
              fieldId: fieldId,
              required: index < 2,
              order: index
            }))
          },
          data: [],
          createdAt: new Date().toISOString()
        };

        project.forms = [...existingForms, systemUserForm];
        console.log('[SystemForms] 系统用户表已添加');
      }

      // 保存项目
      await window.dndDB.updateProject(project);
      console.log('[SystemForms] 旧项目已更新，添加了系统表单');

      return { success: true };
    } catch (error) {
      console.error('[SystemForms] 为旧项目创建系统表单失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 检查是否为系统表单
  const isSystemForm = (form) => {
    return form && (form.id === SYSTEM_USER_FORM_ID || form.isSystemUserForm === true || form.isSystemForm === true);
  };

  // 检查是否为系统字段
  const isSystemField = (field) => {
    return field && (field.isSystemField === true || (field.id && field.id.startsWith('SYS-FLD-')));
  };

  // 导出到全局
  window.SystemForms = {
    SYS_FIELD_IDS,
    SYSTEM_USER_FORM_ID,
    initSystemForms,
    syncAuthUsersToDND,
    getSystemUserForm,
    isSystemForm,
    isSystemField,
    createSystemFormsForOldProject
  };

  console.log('[DND2] auth/systemForms.js 加载完成');

})();
