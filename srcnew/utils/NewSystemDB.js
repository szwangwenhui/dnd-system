/**
 * 新系统数据访问层
 * DND2 页面设计系统V2 - 独立数据访问
 *
 * 功能：
 * - 封装 pages_v2 表的所有数据库操作
 * - 提供初始化默认页面的方法
 * - 完全独立于旧系统（不调用 window.dndDB）
 */

(function() {
  'use strict';

  // ==================== 配置 ====================
  const TABLE_NAME = 'pages_v2';

  // 获取 Supabase 客户端
  const getClient = () => {
    if (!window.supabaseClient) {
      throw new Error('Supabase 客户端未初始化');
    }
    return window.supabaseClient;
  };

  // ==================== 缓存管理 ====================
  const cache = {
    pages: null,
    pagesCacheTime: 0,
    CACHE_TTL: 5 * 60 * 1000 // 5分钟缓存
  };

  // 清除缓存
  function clearCache() {
    cache.pages = null;
    cache.pagesCacheTime = 0;
  }

  // ==================== NewSystemDB 类 ====================
  class NewSystemDB {
    constructor() {
      console.log('[NewSystemDB] 数据访问层初始化');
    }

    // ==================== 页面管理 ====================

    /**
     * 获取角色的页面列表
     * @param {string} projectId - 项目ID
     * @param {string} roleId - 角色ID
     * @returns {Promise<Array>} 页面列表
     */
    async getPagesByRoleId(projectId, roleId) {
      console.log('[NewSystemDB] getPagesByRoleId - projectId:', projectId, 'roleId:', roleId);

      const { data, error } = await getClient()
        .from(TABLE_NAME)
        .select('*')
        .eq('project_id', projectId)
        .eq('role_id', roleId)
        .order('level', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[NewSystemDB] getPagesByRoleId - 错误:', error);
        throw error;
      }

      console.log('[NewSystemDB] getPagesByRoleId - 返回页面数:', data?.length || 0);

      // 转换数据格式
      return (data || []).map(dbPage => ({
        id: dbPage.id,
        projectId: dbPage.project_id,
        roleId: dbPage.role_id,
        name: dbPage.name,
        category: dbPage.category,
        level: dbPage.level,
        parentId: dbPage.parent_id,
        designProgress: dbPage.design_progress,
        layout: dbPage.layout || {},
        css: dbPage.css || {},
        components: dbPage.components || [],
        createdAt: dbPage.created_at,
        updatedAt: dbPage.updated_at
      }));
    }

    /**
     * 初始化新系统的默认页面
     * @param {string} projectId - 项目ID
     * @param {string} roleId - 角色ID
     * @param {string} roleName - 角色名称
     * @returns {Promise<Object>} 创建的默认页面
     */
    async initDefaultPages(projectId, roleId, roleName) {
      console.log('[NewSystemDB] initDefaultPages - projectId:', projectId, 'roleId:', roleId, 'roleName:', roleName);

      // 创建默认首页
      const defaultPage = {
        id: this.generateId(),
        projectId,
        roleId,
        name: `${roleName}首页`,
        category: '固定页',
        level: 0,
        parentId: null,
        designProgress: 0,
        layout: {
          width: 1200,
          height: 800,
          containerWidth: 1000,
          containerHeight: 750,
          gridSize: 10,
          scale: 1.0
        },
        css: {
          global: '',
          container: '.canvas-container',
          block: {}
        },
        components: []
      };

      const createdPage = await this.createPage(defaultPage);
      console.log('[NewSystemDB] initDefaultPages - 默认首页创建成功');

      return createdPage;
    }

    /**
     * 创建新页面
     * @param {Object} page - 页面数据
     * @returns {Promise<Object>} 创建的页面
     */
    async createPage(page) {
      console.log('[NewSystemDB] createPage - name:', page.name);

      const { data, error } = await getClient()
        .from(TABLE_NAME)
        .insert({
          id: page.id,
          project_id: page.projectId,
          role_id: page.roleId,
          name: page.name,
          category: page.category || '固定页',
          level: page.level || 0,
          parent_id: page.parentId || null,
          design_progress: page.designProgress || 0,
          layout: page.layout || {},
          css: page.css || {},
          components: page.components || []
        })
        .select()
        .single();

      if (error) {
        console.error('[NewSystemDB] createPage - 错误:', error);
        throw error;
      }

      console.log('[NewSystemDB] createPage - 页面创建成功');

      // 清除缓存
      clearCache();

      // 返回标准格式
      return {
        id: data.id,
        projectId: data.project_id,
        roleId: data.role_id,
        name: data.name,
        category: data.category,
        level: data.level,
        parentId: data.parent_id,
        designProgress: data.design_progress,
        layout: data.layout,
        css: data.css,
        components: data.components,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    /**
     * 更新页面
     * @param {string} pageId - 页面ID
     * @param {Object} updates - 更新数据
     * @returns {Promise<Object>} 更新后的页面
     */
    async updatePage(pageId, updates) {
      console.log('[NewSystemDB] updatePage - pageId:', pageId);

      // 转换字段名
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      if (updates.designProgress !== undefined) dbUpdates.design_progress = updates.designProgress;
      if (updates.layout !== undefined) dbUpdates.layout = updates.layout;
      if (updates.css !== undefined) dbUpdates.css = updates.css;
      if (updates.components !== undefined) dbUpdates.components = updates.components;

      const { data, error } = await getClient()
        .from(TABLE_NAME)
        .update(dbUpdates)
        .eq('id', pageId)
        .select()
        .single();

      if (error) {
        console.error('[NewSystemDB] updatePage - 错误:', error);
        throw error;
      }

      console.log('[NewSystemDB] updatePage - 页面更新成功');

      // 清除缓存
      clearCache();

      // 返回标准格式
      return {
        id: data.id,
        projectId: data.project_id,
        roleId: data.role_id,
        name: data.name,
        category: data.category,
        level: data.level,
        parentId: data.parent_id,
        designProgress: data.design_progress,
        layout: data.layout,
        css: data.css,
        components: data.components,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    /**
     * 删除页面
     * @param {string} pageId - 页面ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deletePage(pageId) {
      console.log('[NewSystemDB] deletePage - pageId:', pageId);

      const { error } = await getClient()
        .from(TABLE_NAME)
        .delete()
        .eq('id', pageId);

      if (error) {
        console.error('[NewSystemDB] deletePage - 错误:', error);
        throw error;
      }

      console.log('[NewSystemDB] deletePage - 页面删除成功');

      // 清除缓存
      clearCache();

      return true;
    }

    /**
     * 获取页面详情
     * @param {string} pageId - 页面ID
     * @returns {Promise<Object>} 页面详情
     */
    async getPageById(pageId) {
      console.log('[NewSystemDB] getPageById - pageId:', pageId);

      const { data, error } = await getClient()
        .from(TABLE_NAME)
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) {
        console.error('[NewSystemDB] getPageById - 错误:', error);
        throw error;
      }

      console.log('[NewSystemDB] getPageById - 页面加载成功');

      // 返回标准格式
      return {
        id: data.id,
        projectId: data.project_id,
        roleId: data.role_id,
        name: data.name,
        category: data.category,
        level: data.level,
        parentId: data.parent_id,
        designProgress: data.design_progress,
        layout: data.layout,
        css: data.css,
        components: data.components,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    /**
     * 批量删除页面的组件（清空页面）
     * @param {string} pageId - 页面ID
     * @returns {Promise<boolean>} 是否清空成功
     */
    async clearPage(pageId) {
      console.log('[NewSystemDB] clearPage - pageId:', pageId);

      return await this.updatePage(pageId, {
        components: []
      });
    }

    /**
     * 复制页面
     * @param {string} pageId - 源页面ID
     * @param {string} newName - 新页面名称
     * @returns {Promise<Object>} 新创建的页面
     */
    async duplicatePage(pageId, newName) {
      console.log('[NewSystemDB] duplicatePage - pageId:', pageId, 'newName:', newName);

      const originalPage = await this.getPageById(pageId);

      const newPage = {
        id: this.generateId(),
        projectId: originalPage.projectId,
        roleId: originalPage.roleId,
        name: newName,
        category: originalPage.category,
        level: originalPage.level,
        parentId: originalPage.parentId,
        designProgress: 0,
        layout: { ...originalPage.layout },
        css: { ...originalPage.css },
        components: JSON.parse(JSON.stringify(originalPage.components))
      };

      return await this.createPage(newPage);
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取页面统计信息
     * @param {string} projectId - 项目ID
     * @param {string} roleId - 角色ID
     * @returns {Promise<Object>} 统计信息
     */
    async getPageStats(projectId, roleId) {
      const pages = await this.getPagesByRoleId(projectId, roleId);

      return {
        total: pages.length,
        byCategory: pages.reduce((acc, page) => {
          acc[page.category] = (acc[page.category] || 0) + 1;
          return acc;
        }, {}),
        byLevel: pages.reduce((acc, page) => {
          acc[page.level] = (acc[page.level] || 0) + 1;
          return acc;
        }, {}),
        totalComponents: pages.reduce((sum, page) => sum + (page.components?.length || 0), 0)
      };
    }

    /**
     * 清除所有缓存
     */
    clearCache() {
      clearCache();
      console.log('[NewSystemDB] 缓存已清除');
    }
  }

  // ==================== 导出 ====================
  const instance = new NewSystemDB();

  // 挂载到全局对象（不使用 window.dndDB 避免与旧系统冲突）
  if (!window.newSystemDB) {
    window.newSystemDB = instance;
    console.log('[NewSystemDB] 已挂载到 window.newSystemDB');
  }

  console.log('[NewSystemDB] 模块加载完成');

})();
