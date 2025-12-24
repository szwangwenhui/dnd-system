/**
 * DND用户认证服务模块
 * 
 * 支持两种模式：
 * 1. 模拟模式（mock）：本地开发测试，使用localStorage
 * 2. Supabase模式：生产环境，使用Supabase认证
 * 
 * 功能：
 * - 用户注册、登录、登出
 * - 预设系统管理员账号
 * - 用户状态管理（禁用/启用）
 * - 与DND用户表同步
 * 
 * 使用方式：
 * - window.authService.login(email, password)
 * - window.authService.register(email, password, nickname)
 * - window.authService.logout()
 * - window.authService.getCurrentUser()
 */

(function() {
  'use strict';

  // ==================== 配置 ====================
  const AUTH_CONFIG = {
    // 模式：'mock' 或 'supabase'
    mode: 'mock',
    
    // Supabase配置（部署时填写）
    supabaseUrl: '',
    supabaseKey: '',
    
    // 本地存储键名
    storageKeys: {
      currentUser: 'dnd_current_user',
      users: 'dnd_users',
      token: 'dnd_auth_token',
      initialized: 'dnd_auth_initialized'
    },
    
    // Token过期时间（毫秒）
    tokenExpiry: 7 * 24 * 60 * 60 * 1000,  // 7天
    
    // 预设管理员账号
    defaultAdmin: {
      email: '2029975007@qq.com',
      password: '84255550',
      nickname: '系统管理员',
      role: 'admin'
    },
    
    // 系统用户表ID
    systemUserFormId: 'system_user_form'
  };

  // ==================== 工具函数 ====================
  
  // 生成简单的UUID
  const generateId = () => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // 生成自增用户ID
  const generateUserId = (users) => {
    const maxId = users.reduce((max, u) => {
      const id = parseInt(u.userId) || 0;
      return id > max ? id : max;
    }, 0);
    return maxId + 1;
  };

  // 生成模拟Token
  const generateToken = (userId) => {
    const payload = {
      userId: userId,
      exp: Date.now() + AUTH_CONFIG.tokenExpiry
    };
    return btoa(JSON.stringify(payload));
  };

  // 解析Token
  const parseToken = (token) => {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) {
        return null; // Token过期
      }
      return payload;
    } catch (e) {
      return null;
    }
  };

  // 简单的密码哈希（模拟模式用，生产环境由Supabase处理）
  const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  };

  // ==================== DND表单同步 ====================
  
  // 同步用户到DND用户表
  const syncUserToDND = async (user, action = 'create') => {
    try {
      // 检查dndDB是否可用
      if (!window.dndDB) {
        console.log('[AuthService] dndDB不可用，跳过同步');
        return;
      }

      // 获取当前项目ID（从URL或全局变量）
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('projectId') || window.currentProjectId;
      
      if (!projectId) {
        console.log('[AuthService] 无项目ID，跳过同步');
        return;
      }

      // 通过SystemForms获取系统用户表和字段ID
      if (!window.SystemForms) {
        console.log('[AuthService] SystemForms不可用，跳过同步');
        return;
      }

      const systemForm = await window.SystemForms.getSystemUserForm(projectId);
      if (!systemForm) {
        console.log('[AuthService] 系统用户表不存在，跳过同步');
        return;
      }
      
      const formId = systemForm.id;
      const F = window.SystemForms.SYS_FIELD_IDS;  // 字段ID映射
      
      if (action === 'create') {
        // 创建用户记录（使用字段ID）
        const userData = {
          [F.userId]: user.userId,
          [F.email]: user.email,
          [F.nickname]: user.nickname || '',
          [F.avatar]: user.avatar || '',
          [F.role]: user.role || 'user',
          [F.status]: '正常',
          [F.createdAt]: user.createdAt,
          [F.lastLoginAt]: user.lastLoginAt || ''
        };
        await window.dndDB.addFormData(projectId, formId, userData);
        console.log('[AuthService] 用户已同步到DND表:', user.email);
      } else if (action === 'update') {
        // 更新用户记录 - 需要先找到对应的数据记录
        const existingData = systemForm.data || [];
        const userRecord = existingData.find(d => d[F.email] === user.email);
        
        if (userRecord && userRecord.id) {
          // 使用记录ID更新
          const userData = {
            [F.nickname]: user.nickname,
            [F.avatar]: user.avatar,
            [F.role]: user.role,
            [F.status]: user.status,
            [F.lastLoginAt]: user.lastLoginAt
          };
          await window.dndDB.updateFormData(projectId, formId, userRecord[F.userId], userData);
          console.log('[AuthService] 用户信息已更新:', user.email);
        } else {
          console.log('[AuthService] 未找到用户记录，跳过更新:', user.email);
        }
      } else if (action === 'delete') {
        // 删除用户记录
        const existingData = systemForm.data || [];
        const userRecord = existingData.find(d => d[F.email] === user.email);
        
        if (userRecord) {
          await window.dndDB.deleteFormData(projectId, formId, userRecord[F.userId]);
          console.log('[AuthService] 用户已从DND表删除:', user.email);
        }
      }
    } catch (error) {
      console.error('[AuthService] 同步到DND失败:', error);
      // 同步失败不影响认证流程
    }
  };

  // ==================== 模拟模式实现 ====================
  
  const mockAuth = {
    // 获取所有用户（模拟数据库）
    _getUsers() {
      const usersJson = localStorage.getItem(AUTH_CONFIG.storageKeys.users);
      return usersJson ? JSON.parse(usersJson) : [];
    },

    // 保存所有用户
    _saveUsers(users) {
      localStorage.setItem(AUTH_CONFIG.storageKeys.users, JSON.stringify(users));
    },

    // 初始化 - 创建预设管理员
    async init() {
      const initialized = localStorage.getItem(AUTH_CONFIG.storageKeys.initialized);
      if (initialized) {
        return; // 已初始化
      }

      const users = this._getUsers();
      if (users.length === 0) {
        // 创建预设管理员
        const admin = AUTH_CONFIG.defaultAdmin;
        const newUser = {
          id: generateId(),
          userId: 1,  // 管理员ID为1
          email: admin.email,
          passwordHash: hashPassword(admin.password),
          nickname: admin.nickname,
          avatar: '',
          role: admin.role,
          status: '正常',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: ''
        };

        users.push(newUser);
        this._saveUsers(users);

        console.log('[AuthService] 预设管理员账号已创建:', admin.email);
      }

      localStorage.setItem(AUTH_CONFIG.storageKeys.initialized, 'true');
    },

    // 注册
    async register(email, password, nickname = '') {
      // 验证参数
      if (!email || !password) {
        throw new Error('账号和密码不能为空');
      }
      if (password.length < 6) {
        throw new Error('密码长度至少6位');
      }

      const users = this._getUsers();
      
      // 检查账号是否已存在
      if (users.find(u => u.email === email)) {
        throw new Error('该账号已被注册');
      }

      // 生成自增用户ID
      const userId = generateUserId(users);

      // 创建新用户
      const newUser = {
        id: generateId(),
        userId: userId,
        email: email,
        passwordHash: hashPassword(password),
        nickname: nickname || email.split('@')[0],
        avatar: '',
        role: 'user',  // 新注册用户默认为普通用户
        status: '正常',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: ''
      };

      users.push(newUser);
      this._saveUsers(users);

      console.log('[AuthService] 用户注册成功:', newUser.email, '用户ID:', newUser.userId);

      // 同步到DND表单
      await syncUserToDND(newUser, 'create');

      // 返回用户信息（不含密码）
      const { passwordHash, ...userInfo } = newUser;
      return { user: userInfo };
    },

    // 登录
    async login(email, password) {
      if (!email || !password) {
        throw new Error('账号和密码不能为空');
      }

      const users = this._getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('用户不存在');
      }

      if (user.passwordHash !== hashPassword(password)) {
        throw new Error('密码错误');
      }

      // 检查用户状态
      if (user.status === '禁用') {
        throw new Error('该账号已被禁用，请联系管理员');
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      this._saveUsers(users);

      // 生成Token
      const token = generateToken(user.id);
      localStorage.setItem(AUTH_CONFIG.storageKeys.token, token);

      // 保存当前用户
      const { passwordHash, ...userInfo } = user;
      localStorage.setItem(AUTH_CONFIG.storageKeys.currentUser, JSON.stringify(userInfo));

      console.log('[AuthService] 用户登录成功:', user.email);

      // 同步最后登录时间到DND表
      await syncUserToDND(user, 'update');

      return { 
        user: userInfo, 
        token: token 
      };
    },

    // 登出
    async logout() {
      localStorage.removeItem(AUTH_CONFIG.storageKeys.token);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.currentUser);
      console.log('[AuthService] 用户已登出');
      return { success: true };
    },

    // 获取当前用户
    async getCurrentUser() {
      const token = localStorage.getItem(AUTH_CONFIG.storageKeys.token);
      if (!token) {
        return null;
      }

      const payload = parseToken(token);
      if (!payload) {
        // Token无效或过期
        this.logout();
        return null;
      }

      const userJson = localStorage.getItem(AUTH_CONFIG.storageKeys.currentUser);
      return userJson ? JSON.parse(userJson) : null;
    },

    // 更新用户资料
    async updateProfile(updates) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('请先登录');
      }

      const users = this._getUsers();
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) {
        throw new Error('用户不存在');
      }

      // 允许更新的字段
      const allowedFields = ['nickname', 'avatar'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          users[userIndex][field] = updates[field];
        }
      });
      users[userIndex].updatedAt = new Date().toISOString();

      this._saveUsers(users);

      // 更新当前用户缓存
      const { passwordHash, ...userInfo } = users[userIndex];
      localStorage.setItem(AUTH_CONFIG.storageKeys.currentUser, JSON.stringify(userInfo));

      // 同步到DND表
      await syncUserToDND(users[userIndex], 'update');

      console.log('[AuthService] 用户资料已更新');
      return { user: userInfo };
    },

    // 修改密码
    async changePassword(oldPassword, newPassword) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('请先登录');
      }

      if (!oldPassword || !newPassword) {
        throw new Error('请输入旧密码和新密码');
      }
      if (newPassword.length < 6) {
        throw new Error('新密码长度至少6位');
      }

      const users = this._getUsers();
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) {
        throw new Error('用户不存在');
      }

      // 验证旧密码
      if (users[userIndex].passwordHash !== hashPassword(oldPassword)) {
        throw new Error('旧密码错误');
      }

      // 更新密码
      users[userIndex].passwordHash = hashPassword(newPassword);
      users[userIndex].updatedAt = new Date().toISOString();
      this._saveUsers(users);

      console.log('[AuthService] 密码修改成功');
      return { success: true };
    },

    // 检查是否已登录
    async isLoggedIn() {
      const user = await this.getCurrentUser();
      return !!user;
    },

    // 检查是否为管理员
    async isAdmin() {
      const user = await this.getCurrentUser();
      return user?.role === 'admin';
    },

    // 监听认证状态变化
    onAuthStateChange(callback) {
      let lastUser = null;
      const checkInterval = setInterval(async () => {
        const currentUser = await this.getCurrentUser();
        const currentId = currentUser?.id || null;
        const lastId = lastUser?.id || null;
        
        if (currentId !== lastId) {
          lastUser = currentUser;
          callback(currentUser ? 'SIGNED_IN' : 'SIGNED_OUT', currentUser);
        }
      }, 1000);

      return () => clearInterval(checkInterval);
    },

    // ==================== 管理员功能 ====================

    // 获取所有用户（管理员功能）
    async getAllUsers() {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('无权限');
      }

      const users = this._getUsers();
      return users.map(({ passwordHash, ...user }) => user);
    },

    // 更新用户信息（管理员功能）
    async updateUser(userId, updates) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('无权限');
      }

      const users = this._getUsers();
      const userIndex = users.findIndex(u => u.userId === userId);
      
      if (userIndex === -1) {
        throw new Error('用户不存在');
      }

      // 管理员可更新的字段
      const allowedFields = ['nickname', 'avatar', 'role', 'status'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          users[userIndex][field] = updates[field];
        }
      });
      users[userIndex].updatedAt = new Date().toISOString();

      this._saveUsers(users);

      // 同步到DND表
      await syncUserToDND(users[userIndex], 'update');

      console.log('[AuthService] 管理员更新用户信息:', userId);
      
      const { passwordHash, ...userInfo } = users[userIndex];
      return { user: userInfo };
    },

    // 禁用用户（管理员功能）
    async disableUser(userId) {
      return this.updateUser(userId, { status: '禁用' });
    },

    // 启用用户（管理员功能）
    async enableUser(userId) {
      return this.updateUser(userId, { status: '正常' });
    },

    // 修改用户角色（管理员功能）
    async updateUserRole(userId, newRole) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('无权限');
      }

      if (!['user', 'admin'].includes(newRole)) {
        throw new Error('无效的角色');
      }

      // 不能修改自己的角色
      if (currentUser.userId === userId) {
        throw new Error('不能修改自己的角色');
      }

      return this.updateUser(userId, { role: newRole });
    },

    // 删除用户（管理员功能）
    async deleteUser(userId) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('无权限');
      }

      if (currentUser.userId === userId) {
        throw new Error('不能删除自己');
      }

      const users = this._getUsers();
      const userIndex = users.findIndex(u => u.userId === userId);
      
      if (userIndex === -1) {
        throw new Error('用户不存在');
      }

      const deletedUser = users[userIndex];
      
      // 不能删除预设管理员
      if (deletedUser.email === AUTH_CONFIG.defaultAdmin.email) {
        throw new Error('不能删除系统管理员');
      }

      users.splice(userIndex, 1);
      this._saveUsers(users);

      // 同步到DND表
      await syncUserToDND(deletedUser, 'delete');

      console.log('[AuthService] 用户已删除:', userId);
      return { success: true };
    },

    // 根据用户ID获取用户
    async getUserById(userId) {
      const users = this._getUsers();
      const user = users.find(u => u.userId === userId);
      if (!user) return null;
      
      const { passwordHash, ...userInfo } = user;
      return userInfo;
    },

    // 根据邮箱获取用户
    async getUserByEmail(email) {
      const users = this._getUsers();
      const user = users.find(u => u.email === email);
      if (!user) return null;
      
      const { passwordHash, ...userInfo } = user;
      return userInfo;
    }
  };

  // ==================== Supabase模式实现 ====================
  
  const supabaseAuth = {
    _getClient() {
      if (!window.supabaseClient) {
        throw new Error('Supabase客户端未初始化');
      }
      return window.supabaseClient;
    },

    async init() {
      // Supabase模式下，预设管理员需要手动在后台创建
      console.log('[AuthService] Supabase模式初始化');
    },

    async register(email, password, nickname = '') {
      const { data, error } = await this._getClient().auth.signUp({
        email,
        password,
        options: {
          data: { nickname: nickname || email.split('@')[0] }
        }
      });
      if (error) throw error;
      return data;
    },

    async login(email, password) {
      const { data, error } = await this._getClient().auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },

    async logout() {
      const { error } = await this._getClient().auth.signOut();
      if (error) throw error;
      return { success: true };
    },

    async getCurrentUser() {
      const { data: { user } } = await this._getClient().auth.getUser();
      return user;
    },

    async updateProfile(updates) {
      const { data, error } = await this._getClient().auth.updateUser({
        data: updates
      });
      if (error) throw error;
      return data;
    },

    async changePassword(oldPassword, newPassword) {
      const { data, error } = await this._getClient().auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { success: true };
    },

    async isLoggedIn() {
      const user = await this.getCurrentUser();
      return !!user;
    },

    async isAdmin() {
      const user = await this.getCurrentUser();
      return user?.user_metadata?.role === 'admin';
    },

    onAuthStateChange(callback) {
      const { data: { subscription } } = this._getClient().auth.onAuthStateChange(
        (event, session) => {
          callback(event, session?.user || null);
        }
      );
      return () => subscription.unsubscribe();
    },

    // Supabase模式下的管理功能需要通过数据库RPC实现
    async getAllUsers() {
      throw new Error('请通过Supabase后台管理用户');
    },

    async updateUser(userId, updates) {
      throw new Error('请通过Supabase后台管理用户');
    },

    async disableUser(userId) {
      throw new Error('请通过Supabase后台管理用户');
    },

    async enableUser(userId) {
      throw new Error('请通过Supabase后台管理用户');
    },

    async deleteUser(userId) {
      throw new Error('请通过Supabase后台删除用户');
    },

    async updateUserRole(userId, newRole) {
      throw new Error('请通过Supabase后台修改用户角色');
    },

    async getUserById(userId) {
      throw new Error('请通过Supabase后台查询用户');
    },

    async getUserByEmail(email) {
      throw new Error('请通过Supabase后台查询用户');
    }
  };

  // ==================== 统一接口 ====================
  
  const authService = {
    // 获取当前模式
    getMode() {
      return AUTH_CONFIG.mode;
    },

    // 切换模式
    setMode(mode) {
      if (!['mock', 'supabase'].includes(mode)) {
        throw new Error('无效的模式');
      }
      AUTH_CONFIG.mode = mode;
      console.log('[AuthService] 模式切换为:', mode);
    },

    // 配置Supabase
    configureSupabase(url, key) {
      AUTH_CONFIG.supabaseUrl = url;
      AUTH_CONFIG.supabaseKey = key;
    },

    // 获取当前实现
    _getImpl() {
      return AUTH_CONFIG.mode === 'supabase' ? supabaseAuth : mockAuth;
    },

    // 初始化
    async init() {
      await this._getImpl().init();
    },

    // 代理所有方法
    register(...args) { return this._getImpl().register(...args); },
    login(...args) { return this._getImpl().login(...args); },
    logout(...args) { return this._getImpl().logout(...args); },
    getCurrentUser(...args) { return this._getImpl().getCurrentUser(...args); },
    updateProfile(...args) { return this._getImpl().updateProfile(...args); },
    changePassword(...args) { return this._getImpl().changePassword(...args); },
    isLoggedIn(...args) { return this._getImpl().isLoggedIn(...args); },
    isAdmin(...args) { return this._getImpl().isAdmin(...args); },
    onAuthStateChange(...args) { return this._getImpl().onAuthStateChange(...args); },
    getAllUsers(...args) { return this._getImpl().getAllUsers(...args); },
    updateUser(...args) { return this._getImpl().updateUser(...args); },
    disableUser(...args) { return this._getImpl().disableUser(...args); },
    enableUser(...args) { return this._getImpl().enableUser(...args); },
    deleteUser(...args) { return this._getImpl().deleteUser(...args); },
    updateUserRole(...args) { return this._getImpl().updateUserRole(...args); },
    getUserById(...args) { return this._getImpl().getUserById(...args); },
    getUserByEmail(...args) { return this._getImpl().getUserByEmail(...args); }
  };

  // 初始化
  authService.init().then(() => {
    console.log('[DND2] auth/authService.js 初始化完成');
  });

  // 导出到全局
  window.authService = authService;
  window.AUTH_CONFIG = AUTH_CONFIG;

  console.log('[DND2] auth/authService.js 加载完成 - 当前模式:', AUTH_CONFIG.mode);

})();
