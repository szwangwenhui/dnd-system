// DND2 参数读取工具
// 功能：从URL、LocalStorage、SessionStorage读取参数

(function() {
  const ParamReader = {
    /**
     * 从URL读取参数
     * @param {string} paramName - 参数名
     * @returns {string|null} 参数值
     */
    readFromURL: function(paramName) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(paramName);
    },

    /**
     * 从LocalStorage读取参数
     * @param {string} paramName - 参数名
     * @returns {string|null} 参数值
     */
    readFromLocalStorage: function(paramName) {
      try {
        return localStorage.getItem(paramName);
      } catch (e) {
        console.warn('LocalStorage读取失败:', e);
        return null;
      }
    },

    /**
     * 从SessionStorage读取参数
     * @param {string} paramName - 参数名
     * @returns {string|null} 参数值
     */
    readFromSessionStorage: function(paramName) {
      try {
        return sessionStorage.getItem(paramName);
      } catch (e) {
        console.warn('SessionStorage读取失败:', e);
        return null;
      }
    },

    /**
     * 根据来源读取参数
     * @param {string} paramName - 参数名
     * @param {string} source - 来源 ('URL' | 'LocalStorage' | 'SessionStorage')
     * @returns {string|null} 参数值
     */
    readParam: function(paramName, source) {
      switch (source) {
        case 'URL':
          return this.readFromURL(paramName);
        case 'LocalStorage':
          return this.readFromLocalStorage(paramName);
        case 'SessionStorage':
          return this.readFromSessionStorage(paramName);
        default:
          console.warn('未知的参数来源:', source);
          return null;
      }
    },

    /**
     * 根据页面参数配置读取所有参数
     * @param {Object} paramConfig - 页面参数配置
     * @returns {Object} { params: {}, missing: [], errors: [] }
     */
    readPageParams: function(paramConfig) {
      const result = {
        params: {},      // 成功读取的参数
        missing: [],     // 缺失的必需参数
        errors: []       // 错误信息
      };

      if (!paramConfig) {
        return result;
      }

      // 读取必需参数
      if (paramConfig.requiredParams) {
        paramConfig.requiredParams.forEach(param => {
          const value = this.readParam(param.name, param.source);
          if (value !== null && value !== undefined && value !== '') {
            result.params[param.name] = this.convertType(value, param.dataType);
          } else {
            result.missing.push({
              name: param.name,
              label: param.label || param.name,
              source: param.source
            });
          }
        });
      }

      // 读取可选参数
      if (paramConfig.optionalParams) {
        paramConfig.optionalParams.forEach(param => {
          const value = this.readParam(param.name, param.source);
          if (value !== null && value !== undefined && value !== '') {
            result.params[param.name] = this.convertType(value, param.dataType);
          } else if (paramConfig.defaultValues && paramConfig.defaultValues[param.name]) {
            // 使用默认值
            result.params[param.name] = this.convertType(
              paramConfig.defaultValues[param.name], 
              param.dataType
            );
          }
        });
      }

      // 读取自定义参数
      if (paramConfig.customParams) {
        paramConfig.customParams.forEach(param => {
          const value = this.readParam(param.name, param.source);
          if (value !== null && value !== undefined && value !== '') {
            result.params[param.name] = this.convertType(value, param.dataType);
          } else if (param.defaultValue) {
            // 使用默认值
            result.params[param.name] = this.convertType(param.defaultValue, param.dataType);
          }
        });
      }

      return result;
    },

    /**
     * 类型转换
     * @param {string} value - 原始值
     * @param {string} dataType - 目标类型
     * @returns {any} 转换后的值
     */
    convertType: function(value, dataType) {
      if (value === null || value === undefined) return null;
      
      switch (dataType) {
        case 'number':
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        case 'boolean':
          return value === 'true' || value === '1' || value === true;
        case 'string':
        default:
          return String(value);
      }
    },

    /**
     * 处理参数缺失
     * @param {Object} paramConfig - 页面参数配置
     * @param {Array} missingParams - 缺失的参数列表
     * @returns {Object} { action: string, redirectUrl?: string, message?: string }
     */
    handleMissingParams: function(paramConfig, missingParams) {
      if (!missingParams || missingParams.length === 0) {
        return { action: 'continue' };
      }

      const action = paramConfig.missingAction || 'error';
      
      switch (action) {
        case 'error':
          const missingNames = missingParams.map(p => p.label || p.name).join(', ');
          return {
            action: 'error',
            message: `页面缺少必需参数: ${missingNames}`
          };
        
        case 'redirect':
          if (paramConfig.redirectPageId) {
            // 构建跳转URL
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('pageId', paramConfig.redirectPageId);
            return {
              action: 'redirect',
              redirectUrl: currentUrl.toString()
            };
          }
          return {
            action: 'error',
            message: '参数缺失，但未配置跳转页面'
          };
        
        case 'default':
          // 使用默认值，继续加载
          return { action: 'continue' };
        
        case 'ignore':
          // 忽略，继续加载
          return { action: 'continue' };
        
        default:
          return { action: 'continue' };
      }
    }
  };

  // 参数写入工具
  const ParamWriter = {
    /**
     * 写入URL参数
     * @param {string} paramName - 参数名
     * @param {any} value - 参数值
     */
    writeToURL: function(paramName, value) {
      const url = new URL(window.location.href);
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(paramName, String(value));
      } else {
        url.searchParams.delete(paramName);
      }
      window.history.replaceState({}, '', url.toString());
    },

    /**
     * 写入LocalStorage
     * @param {string} paramName - 参数名
     * @param {any} value - 参数值
     */
    writeToLocalStorage: function(paramName, value) {
      try {
        if (value !== null && value !== undefined && value !== '') {
          localStorage.setItem(paramName, String(value));
        } else {
          localStorage.removeItem(paramName);
        }
      } catch (e) {
        console.warn('LocalStorage写入失败:', e);
      }
    },

    /**
     * 写入SessionStorage
     * @param {string} paramName - 参数名
     * @param {any} value - 参数值
     */
    writeToSessionStorage: function(paramName, value) {
      try {
        if (value !== null && value !== undefined && value !== '') {
          sessionStorage.setItem(paramName, String(value));
        } else {
          sessionStorage.removeItem(paramName);
        }
      } catch (e) {
        console.warn('SessionStorage写入失败:', e);
      }
    },

    /**
     * 根据来源写入参数
     * @param {string} paramName - 参数名
     * @param {any} value - 参数值
     * @param {string} source - 来源
     */
    writeParam: function(paramName, value, source) {
      switch (source) {
        case 'URL':
          this.writeToURL(paramName, value);
          break;
        case 'LocalStorage':
          this.writeToLocalStorage(paramName, value);
          break;
        case 'SessionStorage':
          this.writeToSessionStorage(paramName, value);
          break;
        default:
          console.warn('未知的参数来源:', source);
      }
    },

    /**
     * 构建跳转URL
     * @param {string} baseUrl - 基础URL
     * @param {Object} params - 要传递的参数 { paramName: { value, source } }
     * @returns {string} 完整URL
     */
    buildJumpUrl: function(baseUrl, params) {
      const url = new URL(baseUrl, window.location.origin);
      
      if (params) {
        Object.entries(params).forEach(([name, config]) => {
          if (config.source === 'URL' && config.value !== null && config.value !== undefined) {
            url.searchParams.set(name, String(config.value));
          }
        });
      }
      
      return url.toString();
    },

    /**
     * 执行页面跳转并传参
     * @param {string} targetPageId - 目标页面ID
     * @param {Object} params - 要传递的参数
     * @param {Object} options - 选项
     */
    jumpWithParams: function(targetPageId, params, options = {}) {
      const { projectId, roleId, newTab = false } = options;
      
      // 构建基础URL
      let baseUrl = 'preview.html';
      const urlParams = new URLSearchParams();
      
      if (projectId) urlParams.set('projectId', projectId);
      if (roleId) urlParams.set('roleId', roleId);
      urlParams.set('pageId', targetPageId);
      
      // 添加传递的参数
      if (params) {
        Object.entries(params).forEach(([name, config]) => {
          if (config.source === 'URL' && config.value !== null && config.value !== undefined) {
            urlParams.set(name, String(config.value));
          } else if (config.source === 'LocalStorage') {
            this.writeToLocalStorage(name, config.value);
          } else if (config.source === 'SessionStorage') {
            this.writeToSessionStorage(name, config.value);
          }
        });
      }
      
      const fullUrl = `${baseUrl}?${urlParams.toString()}`;
      
      if (newTab) {
        window.open(fullUrl, '_blank');
      } else {
        window.location.href = fullUrl;
      }
    }
  };

  // 导出到全局
  window.ParamReader = ParamReader;
  window.ParamWriter = ParamWriter;

  console.log('[DND2] paramUtils.js 加载完成');
})();
