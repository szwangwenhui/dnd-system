// DND2 数据库模块 - 类定义
// 原文件: src/utils/db.js (1,590行) -> 拆分为8个文件
// 
// 加载顺序：
// 1. index.js (本文件) - 类定义 + init方法
// 2. projectOperations.js - 项目管理
// 3. roleOperations.js - 角色管理
// 4. fieldOperations.js - 字段管理
// 5. formOperations.js - 表单+数据管理
// 6. flowOperations.js - 数据流程+变量管理
// 7. pageOperations.js - 页面管理
// 8. statisticsOperations.js - 统计管理 (末尾创建实例)

class DNDDatabase {
  constructor() {
    this.dbName = 'DND_Database';
    this.version = 1;
    this.db = null;
  }

  // ==================== 初始化 ====================
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject('数据库打开失败');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('数据库打开成功');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建项目对象仓库
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('name', 'name', { unique: false });
          projectStore.createIndex('status', 'status', { unique: false });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('项目对象仓库创建成功');
        }
      };
    });
  }
}

// 将类暴露到全局，供其他模块添加方法
window.DNDDatabase = DNDDatabase;

console.log('[DND2] db/index.js 加载完成 - DNDDatabase类已定义');
