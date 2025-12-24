// DND2 数据库模块 - 项目管理操作
// 原文件位置: src/utils/db.js 第39-153行
// 
// API列表 (5个):
// - addProject(project)
// - getAllProjects()
// - getProjectById(id)
// - updateProject(project)
// - deleteProject(id)

(function() {
  const proto = window.DNDDatabase.prototype;

  // 系统用户字段定义
  const SYSTEM_USER_FIELDS = [
    { name: '用户ID', type: '数字', nature: '系统字段', isSystemField: true },
    { name: '账号', type: '文本', nature: '系统字段', isSystemField: true },
    { name: '昵称', type: '文本', nature: '系统字段', isSystemField: true },
    { name: '头像', type: '文本', nature: '系统字段', isSystemField: true },
    { name: '角色', type: '文本', nature: '系统字段', isSystemField: true },
    { name: '状态', type: '文本', nature: '系统字段', isSystemField: true },
    { name: '注册时间', type: '文本', nature: '系统字段', isSystemField: true },
    { name: '最后登录', type: '文本', nature: '系统字段', isSystemField: true }
  ];

  // ==================== 项目管理 ====================

  /**
   * 添加项目
   * @param {Object} project - 项目对象
   * @returns {Promise<Object>} 新创建的项目
   */
  proto.addProject = async function(project) {
    return new Promise((resolve, reject) => {
      // 创建系统字段
      const systemFields = SYSTEM_USER_FIELDS.map((field, index) => ({
        ...field,
        id: `SYS-FLD-${(index + 1).toString().padStart(3, '0')}`,
        createdAt: new Date().toISOString()
      }));

      // 创建系统用户表结构
      const systemUserForm = {
        id: 'SYS-FORM-USER',
        name: '用户管理',
        type: '独立基础表',
        formNature: '系统表单',
        isSystemForm: true,
        isSystemUserForm: true,
        description: '系统用户信息表',
        structure: {
          primaryKey: 'SYS-FLD-001',  // 用户ID
          primaryKeyType: 'number',
          fields: systemFields.map((f, index) => ({
            fieldId: f.id,
            required: index < 2,  // 用户ID和账号必填
            order: index
          }))
        },
        data: [],
        createdAt: new Date().toISOString()
      };

      // 获取预设管理员数据（从authService配置或默认值）
      const defaultAdminEmail = '2029975007@qq.com';
      const defaultAdminData = {
        'SYS-FLD-001': 1,  // 用户ID
        'SYS-FLD-002': defaultAdminEmail,  // 账号
        'SYS-FLD-003': '系统管理员',  // 昵称
        'SYS-FLD-004': '',  // 头像
        'SYS-FLD-005': 'admin',  // 角色
        'SYS-FLD-006': '正常',  // 状态
        'SYS-FLD-007': new Date().toISOString(),  // 注册时间
        'SYS-FLD-008': '',  // 最后登录
        id: 'DATA-001',
        createdAt: new Date().toISOString()
      };

      // 将预设管理员添加到用户表
      systemUserForm.data = [defaultAdminData];

      // 创建默认的"系统管理员"角色
      const defaultAdminRole = {
        id: '00',  // 系统管理员固定ID为00
        name: '系统管理员',
        isSystemRole: true,  // 标记为系统角色，不可删除
        createdAt: new Date().toISOString(),
        fields: [],  // 角色的字段
        pages: [     // 角色的页面列表，默认包含首页
          {
            id: '00-0000',
            name: '首页',
            category: '固定页',
            level: 0,
            parentId: null,
            designProgress: 0,
            createdAt: new Date().toISOString()
          }
        ]
      };

      // 初始化项目的角色数组、字段数组、表单数组
      const newProject = {
        ...project,
        roles: [defaultAdminRole],  // 默认包含系统管理员角色
        fields: systemFields,       // 系统字段
        forms: [systemUserForm]     // 系统用户表
      };

      const transaction = this.db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(newProject);

      request.onsuccess = () => {
        console.log('[DND] 新项目已创建，包含系统用户表和预设管理员');
        resolve(newProject);
      };

      request.onerror = () => {
        reject('添加项目失败');
      };
    });
  };

  /**
   * 获取所有项目
   * @returns {Promise<Array>} 项目列表
   */
  proto.getAllProjects = async function() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject('获取项目列表失败');
      };
    });
  };

  /**
   * 根据ID获取项目
   * @param {string} id - 项目ID
   * @returns {Promise<Object>} 项目对象
   */
  proto.getProjectById = async function(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject('获取项目失败');
      };
    });
  };

  /**
   * 更新项目
   * @param {Object} project - 项目对象（包含id）
   * @returns {Promise<Object>} 更新后的项目
   */
  proto.updateProject = async function(project) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(project);

      request.onsuccess = () => {
        resolve(project);
      };

      request.onerror = () => {
        reject('更新项目失败');
      };
    });
  };

  /**
   * 删除项目
   * @param {string} id - 项目ID
   * @returns {Promise<string>} 删除的项目ID
   */
  proto.deleteProject = async function(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject('删除项目失败');
      };
    });
  };

  console.log('[DND2] db/projectOperations.js 加载完成 - 5个项目API已注册');
})();
