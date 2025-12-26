// DND2 预览模块 - 主组件
// 原文件: src/preview/Preview.jsx (2,389行)
// 
// Phase 3 拆分结构:
// 1. Preview.jsx (本文件) - 主组件，状态管理，核心逻辑
// 2. previewUtils.js - 工具函数：evaluateExpression, getFieldName, getAllDescendants等
// 3. PreviewToolbar.jsx - 预览工具栏组件
// 4. PreviewLoadingError.jsx - 加载和错误状态组件
// 5. previewStyles.js - 样式常量
//
// 依赖加载顺序: previewUtils.js -> previewStyles.js -> PreviewToolbar.jsx -> PreviewLoadingError.jsx -> Preview.jsx

function Preview() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(null);
  const [pages, setPages] = React.useState([]);
  const [blocks, setBlocks] = React.useState([]);
  const [formDataCache, setFormDataCache] = React.useState({});
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  
  // 当前登录用户状态
  const [currentUser, setCurrentUser] = React.useState(null);
  
  // 数据录入弹窗状态
  const [dataEntryModal, setDataEntryModal] = React.useState({ show: false, formId: null, formName: null });
  const [entryFormData, setEntryFormData] = React.useState({});
  
  // 交互区块输入数据状态（默认样式）
  const [interactionInputData, setInteractionInputData] = React.useState({});
  // 子区块输入数据状态（自行设计样式）
  const [childBlockInputData, setChildBlockInputData] = React.useState({});
  
  // 流程对话框状态
  const [flowDialogModal, setFlowDialogModal] = React.useState({ show: false });
  const [flowDialogData, setFlowDialogData] = React.useState({});
  
  // 流程多项选择状态
  const [flowSelectionModal, setFlowSelectionModal] = React.useState({ show: false });
  const [flowSelectionData, setFlowSelectionData] = React.useState([]);
  
  // 页面参数状态
  const [pageParams, setPageParams] = React.useState({});  // 读取到的参数
  const [paramError, setParamError] = React.useState(null);  // 参数错误信息
  
  // 从URL参数获取预览信息
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const roleId = urlParams.get('roleId');
  const pageId = urlParams.get('pageId');

  // 初始化加载
  React.useEffect(() => {
    // 加载当前用户
    const loadCurrentUser = async () => {
      if (window.authService) {
        const user = await window.authService.getCurrentUser();
        setCurrentUser(user);
      }
    };
    loadCurrentUser();
    
    // 监听用户状态变化
    let unsubscribe;
    if (window.authService) {
      unsubscribe = window.authService.onAuthStateChange((event, user) => {
        setCurrentUser(user);
      });
    }
    
    if (projectId && roleId && pageId) {
      loadPreviewData();
    } else {
      setError('缺少必要参数：projectId, roleId, pageId');
      setLoading(false);
    }
    
    // 组件卸载时销毁流程引擎
    return () => {
      if (window.destroyFlowEngine) {
        window.destroyFlowEngine();
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId, roleId, pageId]);

  // 弹窗事件监听
  React.useEffect(() => {
    // 从URL获取参数（确保在闭包中使用最新值）
    const getUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      return {
        projectId: params.get('projectId'),
        roleId: params.get('roleId'),
        pageId: params.get('pageId')
      };
    };

    // 打开弹窗：将目标区块及其所有子区块的style.zIndex改为正常值，并保存到数据库
    const handleOpenPopup = async (event) => {
      const { blockId } = event.detail;
      const { projectId, roleId, pageId } = getUrlParams();
      
      console.log('=== 打开弹窗事件触发 ===');
      console.log('目标区块ID:', blockId);
      
      if (!projectId || !roleId || !pageId) {
        console.error('缺少URL参数，无法保存');
        return;
      }
      
      // 获取所有子区块（递归）
      const getAllDescendants = (targetId, allBlocks) => {
        const descendants = [];
        const directChildren = allBlocks.filter(b => b.parentId === targetId);
        directChildren.forEach(child => {
          descendants.push(child);
          descendants.push(...getAllDescendants(child.id, allBlocks));
        });
        return descendants;
      };
      
      // 更新本地状态（包括所有子区块）
      setBlocks(prevBlocks => {
        const descendants = getAllDescendants(blockId, prevBlocks);
        const descendantIds = descendants.map(d => d.id);
        
        return prevBlocks.map(block => {
          if (block.id === blockId || descendantIds.includes(block.id)) {
            console.log('修改区块层级:', block.id, block.style?.zIndex, '-> 0');
            return { 
              ...block, 
              style: { ...block.style, zIndex: 0 }
            };
          }
          return block;
        });
      });
      
      // 保存到数据库
      try {
        const pages = await window.dndDB.getPagesByRoleId(projectId, roleId);
        const page = pages.find(p => p.id === pageId);
        
        if (page) {
          const allBlocks = page.design?.blocks || [];
          const descendants = getAllDescendants(blockId, allBlocks);
          const descendantIds = descendants.map(d => d.id);
          
          const updatedBlocks = allBlocks.map(block => {
            if (block.id === blockId || descendantIds.includes(block.id)) {
              return { ...block, style: { ...block.style, zIndex: 0 } };
            }
            return block;
          });
          
          const updatedPage = {
            ...page,
            design: { ...page.design, blocks: updatedBlocks },
            updatedAt: new Date().toISOString()
          };
          
          await window.dndDB.updatePage(projectId, roleId, pageId, updatedPage);
          console.log('✓ 弹窗及子区块已打开并保存');
        }
      } catch (error) {
        console.error('保存弹窗状态失败:', error);
      }
    };

    // 关闭弹窗：将按钮所在的最高级父区块及其子区块的style.zIndex改为-1，并保存到数据库
    const handleClosePopup = async (event) => {
      const { blockId } = event.detail;
      const { projectId, roleId, pageId } = getUrlParams();
      
      console.log('=== 关闭弹窗事件触发 ===');
      console.log('按钮所在区块:', blockId);
      
      if (!projectId || !roleId || !pageId) {
        console.error('缺少URL参数，无法保存');
        return;
      }
      
      // 先获取页面数据来计算需要关闭的区块
      let blocksToClose = new Set();
      
      try {
        const pages = await window.dndDB.getPagesByRoleId(projectId, roleId);
        const page = pages.find(p => p.id === pageId);
        
        if (page && page.design?.blocks) {
          const pageBlocks = page.design.blocks;
          
          // 查找最高级父区块
          const findTopParent = (currentId) => {
            const current = pageBlocks.find(b => b.id === currentId);
            if (!current) return currentId;
            if (!current.parentId) return currentId;
            return findTopParent(current.parentId);
          };
          
          const topParentId = findTopParent(blockId);
          console.log('最高级父区块:', topParentId);
          
          // 收集所有需要关闭的区块ID
          const collectChildren = (parentId, ids = new Set()) => {
            ids.add(parentId);
            pageBlocks.forEach(b => {
              if (b.parentId === parentId && !ids.has(b.id)) {
                collectChildren(b.id, ids);
              }
            });
            return ids;
          };
          
          blocksToClose = collectChildren(topParentId);
          console.log('需要关闭的区块:', Array.from(blocksToClose));
          
          // 更新本地状态
          setBlocks(prevBlocks => {
            return prevBlocks.map(block => {
              if (blocksToClose.has(block.id)) {
                return { 
                  ...block, 
                  style: { ...block.style, zIndex: -1 }
                };
              }
              return block;
            });
          });
          
          // 保存到数据库
          const updatedBlocks = pageBlocks.map(block => {
            if (blocksToClose.has(block.id)) {
              return { ...block, style: { ...block.style, zIndex: -1 } };
            }
            return block;
          });
          
          const updatedPage = {
            ...page,
            design: { ...page.design, blocks: updatedBlocks },
            updatedAt: new Date().toISOString()
          };
          
          await window.dndDB.updatePage(projectId, roleId, pageId, updatedPage);
          console.log('✓ 弹窗状态已保存到数据库（关闭）');
        }
      } catch (error) {
        console.error('保存弹窗状态失败:', error);
      }
    };

    window.addEventListener('openPopup', handleOpenPopup);
    window.addEventListener('closePopup', handleClosePopup);

    return () => {
      window.removeEventListener('openPopup', handleOpenPopup);
      window.removeEventListener('closePopup', handleClosePopup);
    };
  }, []);

  // 流程按钮事件监听（对话框和多项选择）
  React.useEffect(() => {
    // 显示流程对话框
    const handleShowFlowDialog = (event) => {
      const { flowId, flowName, formId, formName, dialogTitle, context, showLoading, showResult } = event.detail;
      console.log('显示流程对话框:', { flowId, formId, dialogTitle });
      
      setFlowDialogModal({
        show: true,
        flowId,
        flowName,
        formId,
        formName,
        dialogTitle: dialogTitle || '请输入',
        context,
        showLoading,
        showResult
      });
      setFlowDialogData({});
    };

    // 显示流程多项选择
    const handleShowFlowSelection = async (event) => {
      const { 
        flowId, flowName, selectMode, selectStyle, 
        attrTableId, attrTableName, attrFieldId, attrFieldName,
        cascadeFromField, cascadeToField,
        context, showLoading, showResult 
      } = event.detail;
      
      console.log('显示流程多项选择:', { flowId, selectStyle, attrTableId, attrFieldId });
      
      // 加载选项数据
      let options = [];
      try {
        if (attrTableId && window.dndDB) {
          // 获取属性表数据
          const attrData = await window.dndDB.getFormDataList(projectId, attrTableId);
          console.log('属性表数据:', attrData?.length, '条');
          
          if (attrData && attrData.length > 0) {
            if (selectStyle === 'cascade') {
              // 级联下拉：需要构建层级数据
              options = attrData;
            } else {
              // 勾选框/按钮组：提取指定字段的唯一值
              const uniqueValues = [...new Set(attrData.map(d => d[attrFieldId]).filter(Boolean))];
              options = uniqueValues.map(v => ({ value: v, label: v }));
            }
          }
        }
      } catch (error) {
        console.error('加载选项数据失败:', error);
      }
      
      setFlowSelectionModal({
        show: true,
        flowId,
        flowName,
        selectMode: selectMode || 'single',
        selectStyle: selectStyle || 'checkbox',
        attrTableId,
        attrTableName,
        attrFieldId,
        attrFieldName,
        cascadeFromField,
        cascadeToField,
        options,
        context,
        showLoading,
        showResult
      });
      setFlowSelectionData(selectMode === 'multiple' ? [] : '');
    };

    window.addEventListener('showFlowDialog', handleShowFlowDialog);
    window.addEventListener('showFlowSelection', handleShowFlowSelection);

    return () => {
      window.removeEventListener('showFlowDialog', handleShowFlowDialog);
      window.removeEventListener('showFlowSelection', handleShowFlowSelection);
    };
  }, [projectId]);

  // 加载预览数据
  const loadPreviewData = async () => {
    try {
      setLoading(true);
      
      console.log('=== 预览页面加载数据 ===');
      console.log('预览参数:', { projectId, roleId, pageId });
      
      // 初始化系统表单（如用户管理表）
      if (window.SystemForms) {
        const result = await window.SystemForms.initSystemForms(projectId);
        console.log('系统表单初始化:', result);
      }
      
      // 加载项目数据
      const project = await window.dndDB.getProjectById(projectId);
      console.log('项目数据:', project);
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 加载角色的所有页面
      const rolePages = await window.dndDB.getPagesByRoleId(projectId, roleId);
      console.log('角色页面列表:', rolePages?.length, '个');
      setPages(rolePages);
      
      // 查找当前页面
      const page = rolePages.find(p => p.id === pageId);
      console.log('当前页面:', page?.name);
      console.log('页面区块数量:', page?.design?.blocks?.length);
      
      // 打印每个区块的层级信息
      if (page?.design?.blocks) {
        console.log('=== 从数据库读取的区块层级信息 ===');
        page.design.blocks.forEach(b => {
          console.log(`区块 ${b.id}: type=${b.type}, style.zIndex=${b.style?.zIndex}`);
        });
      }
      
      if (!page) {
        throw new Error('页面不存在');
      }
      
      // ====== 页面参数验证 ======
      if (page.paramConfig && window.ParamReader) {
        console.log('=== 验证页面参数 ===');
        console.log('参数配置:', page.paramConfig);
        
        // 读取页面参数
        const paramResult = window.ParamReader.readPageParams(page.paramConfig);
        console.log('参数读取结果:', paramResult);
        
        // 保存读取到的参数
        setPageParams(paramResult.params);
        
        // 检查是否有缺失的必需参数
        if (paramResult.missing && paramResult.missing.length > 0) {
          const handleResult = window.ParamReader.handleMissingParams(
            page.paramConfig, 
            paramResult.missing
          );
          
          console.log('缺失参数处理:', handleResult);
          
          if (handleResult.action === 'error') {
            setParamError(handleResult.message);
            setLoading(false);
            return; // 停止加载
          } else if (handleResult.action === 'redirect' && handleResult.redirectUrl) {
            window.location.href = handleResult.redirectUrl;
            return; // 跳转
          }
          // action === 'continue' 或 'default'，继续加载
        }
      }
      
      setCurrentPage(page);
      setBlocks(page.design?.blocks || []);
      
      // 加载表单和字段数据
      setForms(project.forms || []);
      
      // 获取角色的字段，并合并项目级系统字段
      const role = project.roles?.find(r => r.id === roleId);
      const roleFields = role?.fields || [];
      const projectFields = project.fields || [];
      // 合并字段：项目级字段 + 角色字段（去重，优先使用角色字段）
      const mergedFields = [...projectFields];
      roleFields.forEach(rf => {
        if (!mergedFields.find(f => f.id === rf.id)) {
          mergedFields.push(rf);
        }
      });
      setFields(mergedFields);
      
      // 预加载所有表单数据
      await loadAllFormData(page.design?.blocks || [], project.forms || []);
      
      // 初始化流程引擎
      if (window.initFlowEngine) {
        await window.initFlowEngine(projectId);
        console.log('流程引擎初始化完成');
      }
      
      // 设置页面标题
      document.title = `预览 - ${page.name}`;
      
      setLoading(false);
    } catch (err) {
      console.error('加载预览数据失败:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // 加载所有表单数据
  const loadAllFormData = async (blockList, formList) => {
    const newCache = {};
    
    // 找出所有配置了表单的区块
    const formBlocks = blockList.filter(b => 
      b.contentType === '表单' && b.formConfig && b.formConfig.formId
    );
    
    for (const block of formBlocks) {
      const formId = block.formConfig.formId;
      try {
        // 查找表单获取数据
        const form = formList.find(f => f.id === formId);
        if (form) {
          // 如果是衍生表，需要从源表计算
          if (form.subType === '衍生表') {
            const sourceFormId = form.structure?.sourceFormId;
            const sourceForm = formList.find(f => f.id === sourceFormId);
            if (sourceForm && sourceForm.data) {
              // 计算衍生字段
              const derivedFields = form.structure?.derivedFields || [];
              const computedData = sourceForm.data.map(record => {
                const newRecord = { ...record };
                derivedFields.forEach(df => {
                  newRecord[df.fieldId] = evaluateExpression(df.expression, record, derivedFields, df, form);
                });
                return newRecord;
              });
              newCache[formId] = computedData;
            } else {
              newCache[formId] = [];
            }
          } else {
            newCache[formId] = form.data || [];
          }
        }
      } catch (error) {
        console.error('加载表单数据失败:', formId, error);
        newCache[formId] = [];
      }
    }
    
    setFormDataCache(newCache);
  };

  // 计算表达式（简化版）
  const evaluateExpression = (expr, record, allDerivedFields, derivedFieldConfig, form) => {
    try {
      if (!expr) return '';
      
      // 检查是否是分段函数
      if (expr.startsWith('PIECEWISE(') || expr.startsWith('PIECEWISE_DISCRETE(')) {
        return evaluatePiecewise(record, derivedFieldConfig);
      }

      let evalExpr = expr;
      
      // 替换字段引用为实际值
      const fieldRefs = expr.match(/\[([^\]]+)\]/g) || [];
      for (const ref of fieldRefs) {
        const fieldName = ref.slice(1, -1);
        
        // 查找源表字段
        const sourceFields = form.structure?.fields?.filter(f => f.isSourceField) || [];
        for (const sf of sourceFields) {
          const fieldInfo = fields.find(f => f.id === sf.fieldId);
          if (fieldInfo && fieldInfo.name === fieldName) {
            const value = record[sf.fieldId];
            evalExpr = evalExpr.replace(ref, value !== undefined && value !== '' ? value : 0);
            break;
          }
        }
        
        // 查找衍生字段
        const derivedField = allDerivedFields.find(df => df.name === fieldName);
        if (derivedField) {
          const derivedValue = evaluateExpression(derivedField.expression, record, allDerivedFields, derivedField, form);
          evalExpr = evalExpr.replace(ref, derivedValue);
        }
      }

      // 将 ^ 转换为 **
      evalExpr = evalExpr.replace(/\^/g, '**');

      // 安全性检查
      if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(evalExpr)) {
        return 'ERROR';
      }

      const result = eval(evalExpr);
      return typeof result === 'number' ? (Number.isInteger(result) ? result : parseFloat(result.toFixed(2))) : 'ERROR';
    } catch (e) {
      return 'ERROR';
    }
  };

  // 计算分段函数
  const evaluatePiecewise = (record, config) => {
    // 简化实现，完整逻辑可从FormViewer复用
    return '-';
  };

  // 跳转到其他页面
  const navigateToPage = (targetPageId) => {
    const targetPage = pages.find(p => p.id === targetPageId);
    if (targetPage) {
      // 更新URL并重新加载
      const newUrl = `${window.location.pathname}?projectId=${projectId}&roleId=${roleId}&pageId=${targetPageId}`;
      window.history.pushState({}, '', newUrl);
      
      // 更新当前页面
      setCurrentPage(targetPage);
      setBlocks(targetPage.design?.blocks || []);
      document.title = `预览 - ${targetPage.name}`;
      
      // 重新加载表单数据
      loadAllFormData(targetPage.design?.blocks || [], forms);
    }
  };

  // 跳转到首页
  const navigateToHome = () => {
    const homePage = pages.find(p => p.level === 0);
    if (homePage) {
      navigateToPage(homePage.id);
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 渲染区块
  const renderBlock = (block) => {
    // 层级为-1的区块不渲染（弹窗隐藏状态）
    // 层级存储在 block.style.zIndex 中
    const style = block.style || {};
    const layer = style.zIndex ?? 0;
    const isPopupBlock = block.isPopup || false;
    
    if (layer === -1) {
      return null;
    }
    
    // 权限检查：requireAdmin为true的区块需要管理员登录
    if (block.requireAdmin === true) {
      if (!currentUser || currentUser.role !== 'admin') {
        return null;  // 非管理员不渲染此区块
      }
    }
    
    // 权限检查：requireLogin为true的区块需要登录
    if (block.requireLogin === true) {
      if (!currentUser) {
        return null;  // 未登录不渲染此区块
      }
    }
    
    // 关闭弹窗的处理函数
    const handleClosePopup = async (e) => {
      e.stopPropagation();
      
      // 获取所有子区块（递归）
      const getAllDescendants = (blockId, allBlocks) => {
        const descendants = [];
        const directChildren = allBlocks.filter(b => b.parentId === blockId);
        directChildren.forEach(child => {
          descendants.push(child);
          descendants.push(...getAllDescendants(child.id, allBlocks));
        });
        return descendants;
      };
      
      // 更新本地状态（包括所有子区块）
      setBlocks(prevBlocks => {
        const descendants = getAllDescendants(block.id, prevBlocks);
        const descendantIds = descendants.map(d => d.id);
        
        return prevBlocks.map(b => {
          if (b.id === block.id || descendantIds.includes(b.id)) {
            return { ...b, style: { ...b.style, zIndex: -1 } };
          }
          return b;
        });
      });
      
      // 保存到数据库
      try {
        const params = new URLSearchParams(window.location.search);
        const pId = params.get('projectId');
        const rId = params.get('roleId');
        const pgId = params.get('pageId');
        
        if (pId && rId && pgId) {
          const pages = await window.dndDB.getPagesByRoleId(pId, rId);
          const page = pages.find(p => p.id === pgId);
          if (page) {
            const allBlocks = page.design?.blocks || [];
            
            // 获取所有子区块（递归）
            const getAllDescendants = (blockId) => {
              const descendants = [];
              const directChildren = allBlocks.filter(b => b.parentId === blockId);
              directChildren.forEach(child => {
                descendants.push(child);
                descendants.push(...getAllDescendants(child.id));
              });
              return descendants;
            };
            
            const descendants = getAllDescendants(block.id);
            const descendantIds = descendants.map(d => d.id);
            
            // 更新父区块和所有子区块的层级
            const updatedBlocks = allBlocks.map(b => {
              if (b.id === block.id || descendantIds.includes(b.id)) {
                return { ...b, style: { ...b.style, zIndex: -1 } };
              }
              return b;
            });
            const updatedPage = {
              ...page,
              design: { ...page.design, blocks: updatedBlocks },
              updatedAt: new Date().toISOString()
            };
            await window.dndDB.updatePage(pId, rId, pgId, updatedPage);
            console.log('弹窗及子区块已关闭并保存');
          }
        }
      } catch (error) {
        console.error('保存弹窗状态失败:', error);
      }
    };
    
    // 使用共享的样式工具构建区块容器样式
    const blockStyle = window.StyleUtils?.buildBlockContainerStyle 
      ? window.StyleUtils.buildBlockContainerStyle(block, {
          scale: 100,  // 预览页面不缩放
          isButtonBlock: block.type === '按钮',
          forDesigner: false
        })
      : {
          // 回退：如果共享工具未加载，使用基础样式
          position: 'absolute',
          left: block.x,
          top: block.y,
          width: block.width,
          height: block.autoHeight ? 'auto' : block.height,
          minHeight: block.autoHeight ? block.height : undefined,
          zIndex: style.zIndex || 0,
          backgroundColor: style.backgroundColor || 'transparent',
          borderStyle: style.borderStyle || 'solid',
          borderWidth: style.borderWidth !== undefined ? style.borderWidth : 1,
          borderColor: style.borderColor || '#cccccc',
          borderRadius: style.borderRadius || 0,
          boxShadow: style.boxShadow || 'none',
          overflow: 'hidden',
          opacity: style.opacity !== undefined ? style.opacity : 1,
        };
    
    // 使用共享的样式工具构建区块内容样式（字体、颜色、内边距等）
    const contentStyle = window.StyleUtils?.buildBlockContentStyle 
      ? window.StyleUtils.buildBlockContentStyle(block, { scale: 100 })
      : {
          // 回退：如果共享工具未加载，使用基础样式
          width: '100%',
          height: '100%',
          paddingTop: style.paddingTop !== undefined ? style.paddingTop : 8,
          paddingRight: style.paddingRight !== undefined ? style.paddingRight : 8,
          paddingBottom: style.paddingBottom !== undefined ? style.paddingBottom : 8,
          paddingLeft: style.paddingLeft !== undefined ? style.paddingLeft : 8,
          fontFamily: style.fontFamily || 'inherit',
          fontSize: style.fontSize || 14,
          fontWeight: style.fontWeight || 'normal',
          fontStyle: style.fontStyle || 'normal',
          lineHeight: style.lineHeight || 1.5,
          letterSpacing: style.letterSpacing || 0,
          textAlign: style.textAlign || 'left',
          textDecoration: style.textDecoration || 'none',
          textTransform: style.textTransform || 'none',
          color: style.color || '#333333',
          textShadow: style.textShadow || 'none',
          overflow: 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        };

    // 获取内容文本（处理对象格式）
    const getContentHtml = (content) => {
      if (!content) return '';
      if (typeof content === 'string') return content;
      if (typeof content === 'object') {
        // 处理 {type, html, text} 格式
        if (content.html) return content.html;
        if (content.text) return content.text;
        return '';
      }
      return String(content);
    };

    // 根据区块类型和内容类型渲染
    // 先检查区块类型（交互、按钮），再检查内容类型
    
    // 弹窗关闭按钮组件 - 鼠标悬停时才显示
    const [showCloseButton, setShowCloseButton] = React.useState(false);
    
    const PopupCloseButton = () => (
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          display: showCloseButton ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          zIndex: 999,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onClick={handleClosePopup}
        title="关闭弹窗"
      >
        ✕
      </div>
    );
    
    // 弹窗容器的鼠标事件处理器
    const popupHoverHandlers = isPopupBlock ? {
      onMouseEnter: () => setShowCloseButton(true),
      onMouseLeave: () => setShowCloseButton(false)
    } : {};
    
    // 如果是子区块（有subType），使用子区块渲染
    if (block.subType) {
      return renderChildBlock(block, blockStyle, contentStyle, isPopupBlock ? PopupCloseButton : null);
    }
    
    if (block.type === '交互') {
      return renderInteractionBlock(block, blockStyle, contentStyle, isPopupBlock ? PopupCloseButton : null);
    }
    
    if (block.type === '按钮') {
      return renderButtonBlock(block, blockStyle, contentStyle, isPopupBlock ? PopupCloseButton : null);
    }
    
    // 用户账号区块
    if (block.type === '用户账号') {
      return renderAuthBlock(block, blockStyle, isPopupBlock ? PopupCloseButton : null);
    }
    
    // 显示类型区块，根据contentType渲染
    switch (block.contentType) {
      case '文本':
      case '文字':
        return (
          <div key={block.id} style={blockStyle}>
            {isPopupBlock && <PopupCloseButton />}
            <div style={contentStyle} dangerouslySetInnerHTML={{ __html: getContentHtml(block.content) }} />
          </div>
        );
      
      case '图片':
        const imgSrc = typeof block.content === 'object' ? (block.content.url || block.content.src || '') : (block.content || '');
        return (
          <div key={block.id} style={blockStyle}>
            {isPopupBlock && <PopupCloseButton />}
            {imgSrc ? (
              <img 
                src={imgSrc} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: style.objectFit || 'cover' }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                color: '#9ca3af'
              }}>
                暂无图片
              </div>
            )}
          </div>
        );
      
      case '表单':
        return renderFormBlock(block, blockStyle, contentStyle, isPopupBlock ? PopupCloseButton : null);
      
      case '按钮':
        return renderButtonBlock(block, blockStyle, contentStyle, isPopupBlock ? PopupCloseButton : null);
      
      default:
        return (
          <div key={block.id} style={blockStyle}>
            {isPopupBlock && <PopupCloseButton />}
            <div style={contentStyle} dangerouslySetInnerHTML={{ __html: getContentHtml(block.content) }} />
          </div>
        );
    }
  };

  // 渲染交互区块（根据样式模式渲染）
  const renderInteractionBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    const style = block.style || {};
    const styleMode = block.styleMode || 'default';
    
    // 自行设计样式 - 只渲染容器，子区块单独渲染
    if (styleMode === 'custom') {
      const containerStyle = {
        ...blockStyle,
        backgroundColor: style.backgroundColor || '#f9fafb',
        position: 'relative',
      };
      
      return (
        <div key={block.id} style={containerStyle}>
          {PopupCloseButton && <PopupCloseButton />}
          {/* 子区块在外部单独渲染 */}
        </div>
      );
    }
    
    // 默认样式 - 显示完整的表单输入界面
    const hasCustomBg = style.backgroundColor && style.backgroundColor !== 'transparent';
    
    const containerStyle = {
      ...blockStyle,
      backgroundColor: hasCustomBg ? blockStyle.backgroundColor : '#ffffff',
      padding: contentStyle.paddingTop || 12,
      overflow: 'auto',
    };
    
    // 获取表单和字段信息
    const form = forms.find(f => f.id === block.targetFormId);
    const primaryKeyId = form?.structure?.primaryKey;
    // 不显示主键字段（自动生成），只显示用户选择的字段
    const selectedFieldIds = (block.selectedFields || []).filter(Boolean);
    
    // 从内容样式中获取字体设置
    const labelFontSize = contentStyle.fontSize ? contentStyle.fontSize * 0.85 : 12;
    const inputFontSize = contentStyle.fontSize || 14;
    const titleFontSize = contentStyle.fontSize || 14;
    const textColor = contentStyle.color || '#374151';
    const labelColor = style.labelColor || '#6b7280';
    
    return (
      <div key={block.id} style={containerStyle} {...popupHoverHandlers}>
        {PopupCloseButton && <PopupCloseButton />}
        
        {/* 表单标题 */}
        <div style={{ 
          fontSize: titleFontSize, 
          fontWeight: contentStyle.fontWeight || 'bold', 
          marginBottom: '12px', 
          color: textColor,
          fontFamily: contentStyle.fontFamily || 'inherit',
        }}>
          {block.targetFormName || form?.name || '数据录入'}
        </div>
        
        {/* 字段输入 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedFieldIds.map(fieldId => {
            const field = fields.find(f => f.id === fieldId);
            const fieldType = field?.type || '文本';
            
            return (
              <div key={fieldId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ 
                  width: '80px', 
                  fontSize: labelFontSize, 
                  color: labelColor,
                  textAlign: 'right',
                  flexShrink: 0,
                  fontFamily: contentStyle.fontFamily || 'inherit',
                }}>
                  {field?.name || fieldId}
                </label>
                <input
                  type={fieldType === '密码' ? 'password' : 'text'}
                  value={interactionInputData[block.id]?.[fieldId] || ''}
                  onChange={(e) => {
                    setInteractionInputData(prev => ({
                      ...prev,
                      [block.id]: {
                        ...(prev[block.id] || {}),
                        [fieldId]: e.target.value
                      }
                    }));
                  }}
                  placeholder={`请输入${field?.name || ''}`}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: inputFontSize,
                    fontFamily: contentStyle.fontFamily || 'inherit',
                    outline: 'none',
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* 提交按钮 - 如果hideSubmitButton为true则隐藏 */}
        {!block.hideSubmitButton && (
          <button
            onClick={() => handleInteractionSubmit(block)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              backgroundColor: style.buttonColor || '#3b82f6',
              color: style.buttonTextColor || '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: inputFontSize,
              fontWeight: 'bold',
              fontFamily: contentStyle.fontFamily || 'inherit',
              cursor: 'pointer',
            }}
          >
            确认提交
          </button>
        )}
      </div>
    );
  };

  // 处理交互区块提交
  const handleInteractionSubmit = async (block) => {
    const formId = block.targetFormId;
    if (!formId) {
      alert('未配置目标表单');
      return;
    }
    
    const inputData = interactionInputData[block.id] || {};
    const purposeSave = block.purposeSave !== false;
    const purposeFlow = block.purposeFlow === true;
    
    try {
      // 存入数据
      if (purposeSave) {
        await window.dndDB.addFormData(projectId, formId, inputData);
        console.log('数据已写入表单:', formId);
      }
      
      // 启动流程
      if (purposeFlow && block.linkedFlowId) {
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: block.id,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId,
            inputData: inputData,
            inputFormId: formId
          }
        }));
        console.log('已触发流程:', block.linkedFlowId);
      }
      
      // 清空输入
      setInteractionInputData(prev => ({
        ...prev,
        [block.id]: {}
      }));
      
      // 刷新数据
      if (purposeSave) {
        await loadAllFormData(blocks, forms);
        alert('提交成功！');
      } else if (purposeFlow) {
        alert('已启动流程！');
      }
      
    } catch (error) {
      alert('提交失败：' + error.message);
    }
  };

  // 渲染子区块（提示/输入/级联/提交）
  const renderChildBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    const subType = block.subType;
    const style = block.style || {};
    
    // 从内容样式获取字体设置
    const fontSize = contentStyle.fontSize || style.fontSize || 14;
    const fontFamily = contentStyle.fontFamily || style.fontFamily || 'inherit';
    const color = contentStyle.color || style.color || '#333333';
    const textAlign = contentStyle.textAlign || style.textAlign || 'left';
    
    if (subType === 'prompt') {
      // 提示区块 - 显示字段名
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'right' ? 'flex-end' : (textAlign === 'center' ? 'center' : 'flex-start'),
          fontSize: fontSize,
          fontFamily: fontFamily,
          color: color,
          padding: `${contentStyle.paddingTop || 8}px ${contentStyle.paddingRight || 8}px ${contentStyle.paddingBottom || 8}px ${contentStyle.paddingLeft || 8}px`,
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          {block.content}
        </div>
      );
    }
    
    if (subType === 'input') {
      // 填写区块 - 显示输入框
      const parentBlock = blocks.find(b => b.id === block.parentId);
      const inputKey = `${block.parentId}-${block.fieldId}`;
      
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <input
            type="text"
            value={childBlockInputData[inputKey] || ''}
            onChange={(e) => {
              setChildBlockInputData(prev => ({
                ...prev,
                [inputKey]: e.target.value
              }));
            }}
            placeholder={block.placeholder || '请输入'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          />
        </div>
      );
    }
    
    if (subType === 'cascader') {
      // 级联下拉区块 - 简化版，后续可扩展
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <select
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          >
            <option value="">请选择属性</option>
            {/* 属性选项需要从属性表加载 */}
          </select>
        </div>
      );
    }
    
    if (subType === 'submit') {
      // 提交按钮区块
      const parentBlock = blocks.find(b => b.id === block.parentId);
      
      return (
        <div 
          key={block.id} 
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            if (parentBlock) {
              handleChildBlockSubmit(parentBlock);
            }
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          {block.content || '确认提交'}
        </div>
      );
    }
    
    // ===== 流程按钮子区块类型 =====
    if (subType === 'flowPrompt') {
      // 流程对话框 - 提示区块
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'right' ? 'flex-end' : (textAlign === 'center' ? 'center' : 'flex-start'),
          fontSize: fontSize,
          fontFamily: fontFamily,
          color: color,
          padding: `${contentStyle.paddingTop || 8}px ${contentStyle.paddingRight || 8}px ${contentStyle.paddingBottom || 8}px ${contentStyle.paddingLeft || 8}px`,
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          {block.content}
        </div>
      );
    }
    
    if (subType === 'flowInput') {
      // 流程对话框 - 输入区块
      const inputKey = `flow-${block.parentId}-${block.fieldId}`;
      
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <input
            type="text"
            value={flowDialogData[inputKey] || ''}
            onChange={(e) => {
              setFlowDialogData(prev => ({
                ...prev,
                [inputKey]: e.target.value
              }));
            }}
            placeholder={block.placeholder || '请输入'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          />
        </div>
      );
    }
    
    if (subType === 'flowSubmit') {
      // 流程提交按钮
      const parentBlock = blocks.find(b => b.id === block.parentId);
      const config = parentBlock?.buttonConfig || {};
      
      return (
        <div 
          key={block.id} 
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            if (parentBlock) {
              // 根据参数模式调用不同的处理函数
              if (config.paramMode === 'dialog') {
                handleFlowButtonSubmit(parentBlock, block);
              } else if (config.paramMode === 'selection') {
                handleFlowSelectionSubmit(parentBlock, block);
              }
            }
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          {block.content || '确认提交'}
        </div>
      );
    }
    
    if (subType === 'flowCheckbox') {
      // 流程多选 - 勾选框
      const checkKey = `flow-check-${block.parentId}-${block.optionValue}`;
      const isChecked = flowSelectionData.includes ? flowSelectionData.includes(block.optionValue) : flowSelectionData === block.optionValue;
      
      return (
        <div 
          key={block.id} 
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            const selectMode = block.selectMode || 'single';
            if (selectMode === 'multiple') {
              // 多选模式
              setFlowSelectionData(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                if (arr.includes(block.optionValue)) {
                  return arr.filter(v => v !== block.optionValue);
                } else {
                  return [...arr, block.optionValue];
                }
              });
            } else {
              // 单选模式
              setFlowSelectionData(block.optionValue);
            }
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          <input 
            type={block.selectMode === 'multiple' ? 'checkbox' : 'radio'} 
            checked={isChecked}
            readOnly
            style={{ marginRight: 8 }} 
          />
          <span>{block.content}</span>
        </div>
      );
    }
    
    if (subType === 'flowOptionButton') {
      // 流程多选 - 按钮选项（点击即触发）
      return (
        <div 
          key={block.id} 
          style={{
            ...blockStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
          }}
          onClick={() => {
            // 按钮组模式：点击即触发流程
            handleFlowOptionButtonClick(block);
          }}
        >
          {PopupCloseButton && <PopupCloseButton />}
          {block.content}
        </div>
      );
    }
    
    if (subType === 'flowCascade') {
      // 流程多选 - 级联下拉（简化版）
      return (
        <div key={block.id} style={{
          ...blockStyle,
          display: 'flex',
          alignItems: 'center',
        }}>
          {PopupCloseButton && <PopupCloseButton />}
          <select
            value={flowSelectionData || ''}
            onChange={(e) => setFlowSelectionData(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: contentStyle.paddingTop || style.padding || 4,
              fontSize: fontSize,
              fontFamily: fontFamily,
              color: color,
              outline: 'none',
            }}
          >
            <option value="">请选择</option>
            {/* 级联选项需要从属性表加载 */}
          </select>
        </div>
      );
    }
    
    // 默认渲染
    return (
      <div key={block.id} style={{
        ...blockStyle,
        fontSize: fontSize,
        fontFamily: fontFamily,
        color: color,
        padding: `${contentStyle.paddingTop || 8}px ${contentStyle.paddingRight || 8}px ${contentStyle.paddingBottom || 8}px ${contentStyle.paddingLeft || 8}px`,
      }}>
        {PopupCloseButton && <PopupCloseButton />}
        {block.content}
      </div>
    );
  };

  // 处理子区块提交
  const handleChildBlockSubmit = async (parentBlock) => {
    const formId = parentBlock.targetFormId;
    if (!formId) {
      alert('未配置目标表单');
      return;
    }
    
    // 收集所有子区块的输入数据
    const inputData = {};
    const childBlocks = blocks.filter(b => b.parentId === parentBlock.id);
    
    childBlocks.forEach(child => {
      if (child.subType === 'input' && child.fieldId) {
        const inputKey = `${parentBlock.id}-${child.fieldId}`;
        inputData[child.fieldId] = childBlockInputData[inputKey] || '';
      }
    });
    
    const purposeSave = parentBlock.purposeSave !== false;
    const purposeFlow = parentBlock.purposeFlow === true;
    
    try {
      // 存入数据
      if (purposeSave) {
        await window.dndDB.addFormData(projectId, formId, inputData);
        console.log('数据已写入表单:', formId);
      }
      
      // 启动流程
      if (purposeFlow && parentBlock.linkedFlowId) {
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: parentBlock.id,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId,
            inputData: inputData,
            inputFormId: formId
          }
        }));
        console.log('已触发流程:', parentBlock.linkedFlowId);
      }
      
      // 清空输入
      const keysToRemove = Object.keys(childBlockInputData).filter(k => k.startsWith(parentBlock.id));
      const newData = { ...childBlockInputData };
      keysToRemove.forEach(k => delete newData[k]);
      setChildBlockInputData(newData);
      
      // 刷新数据
      if (purposeSave) {
        await loadAllFormData(blocks, forms);
        alert('提交成功！');
      } else if (purposeFlow) {
        alert('已启动流程！');
      }
      
    } catch (error) {
      alert('提交失败：' + error.message);
    }
  };

  // 处理流程按钮子区块提交（对话框方式）
  const handleFlowButtonSubmit = async (parentBlock, submitBlock) => {
    if (!parentBlock || parentBlock.type !== '按钮') return;
    
    const config = parentBlock.buttonConfig || {};
    const flowId = config.flowId || submitBlock.flowId;
    const flowName = config.flowName || submitBlock.flowName;
    
    if (!flowId) {
      alert('未关联流程');
      return;
    }
    
    // 收集对话框输入数据
    const inputData = {};
    const childBlocks = blocks.filter(b => b.parentId === parentBlock.id);
    
    childBlocks.forEach(child => {
      if (child.subType === 'flowInput' && child.fieldId) {
        const inputKey = `flow-${parentBlock.id}-${child.fieldId}`;
        inputData[child.fieldId] = flowDialogData[inputKey] || '';
      }
    });
    
    console.log('流程按钮提交 - 对话框数据:', inputData);
    
    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: flowId,
          flowName: flowName,
          params: { formData: inputData },
          context: { projectId, pageId, roleId, blockId: parentBlock.id },
          showLoading: config.showLoading !== false,
          showResult: config.showResult !== false
        }
      }));
      
      // 清空输入
      const keysToRemove = Object.keys(flowDialogData).filter(k => k.startsWith(`flow-${parentBlock.id}`));
      const newData = { ...flowDialogData };
      keysToRemove.forEach(k => delete newData[k]);
      setFlowDialogData(newData);
      
      alert('已启动流程：' + (flowName || flowId));
    } catch (error) {
      alert('启动流程失败：' + error.message);
    }
  };

  // 处理流程按钮选项按钮点击（按钮组方式，点击即触发）
  const handleFlowOptionButtonClick = async (block) => {
    const parentBlock = blocks.find(b => b.id === block.parentId);
    if (!parentBlock) return;
    
    const config = parentBlock.buttonConfig || {};
    const flowId = config.flowId || block.flowId;
    const flowName = config.flowName || block.flowName;
    
    if (!flowId) {
      alert('未关联流程');
      return;
    }
    
    const selectedValue = block.optionValue;
    console.log('流程按钮点击 - 选项:', selectedValue);
    
    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: flowId,
          flowName: flowName,
          params: { selection: selectedValue },
          context: { projectId, pageId, roleId, blockId: parentBlock.id },
          showLoading: config.showLoading !== false,
          showResult: config.showResult !== false
        }
      }));
      
      alert('已选择 "' + selectedValue + '" 并启动流程');
    } catch (error) {
      alert('启动流程失败：' + error.message);
    }
  };

  // 处理流程按钮多选提交（勾选框/级联方式）
  const handleFlowSelectionSubmit = async (parentBlock, submitBlock) => {
    if (!parentBlock || parentBlock.type !== '按钮') return;
    
    const config = parentBlock.buttonConfig || {};
    const flowId = config.flowId || submitBlock.flowId;
    const flowName = config.flowName || submitBlock.flowName;
    
    if (!flowId) {
      alert('未关联流程');
      return;
    }
    
    const selectedValue = flowSelectionData;
    
    if (!selectedValue || (Array.isArray(selectedValue) && selectedValue.length === 0)) {
      alert('请至少选择一个选项');
      return;
    }
    
    console.log('流程按钮提交 - 选择数据:', selectedValue);
    
    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: flowId,
          flowName: flowName,
          params: { selection: selectedValue },
          context: { projectId, pageId, roleId, blockId: parentBlock.id },
          showLoading: config.showLoading !== false,
          showResult: config.showResult !== false
        }
      }));
      
      // 清空选择
      setFlowSelectionData(config.selectMode === 'multiple' ? [] : '');
      
      alert('已启动流程：' + (flowName || flowId));
    } catch (error) {
      alert('启动流程失败：' + error.message);
    }
  };

  // 处理数据录入提交（基础表）
  const handleDataEntrySubmit = async () => {
    const formId = dataEntryModal.formId;
    const blockId = dataEntryModal.blockId;  // 获取触发的区块ID
    const writeOnSubmit = dataEntryModal.writeOnSubmit !== false; // 默认为true
    if (!formId) return;
    
    try {
      // 根据配置决定是否写入数据
      if (writeOnSubmit) {
        const savedRecord = await window.dndDB.addFormData(projectId, formId, entryFormData);
        console.log('数据已写入表单:', formId);
      } else {
        console.log('跳过数据写入（writeOnSubmit=false）');
      }
      
      // 关闭弹窗
      setDataEntryModal({ show: false, formId: null, formName: null, blockId: null, writeOnSubmit: true });
      const submittedData = { ...entryFormData }; // 保存一份数据副本
      setEntryFormData({});
      
      // 触发数据流程事件
      if (blockId) {
        console.log('');
        console.log('========== 基础表交互区块触发流程 ==========');
        console.log('区块ID:', blockId);
        console.log('页面ID:', pageId);
        console.log('录入的数据:', submittedData);
        console.log('表单ID:', formId);
        console.log('写入数据:', writeOnSubmit ? '是' : '否（仅校验）');
        console.log('=============================================');
        console.log('');
        
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: blockId,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId,
            inputData: submittedData,
            inputFormId: formId
          }
        }));
      } else {
        // 没有关联流程时，显示成功提示并刷新
        if (writeOnSubmit) {
          alert('数据添加成功！');
          await loadAllFormData(blocks, forms);
          window.location.reload();
        } else {
          alert('提交成功！（未配置数据流程）');
        }
      }
      
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 渲染数据录入弹窗（支持基础表和属性表）
  const renderDataEntryModal = () => {
    if (!dataEntryModal.show) return null;
    
    const form = forms.find(f => f.id === dataEntryModal.formId);
    if (!form) return null;
    
    // 判断是否为属性表
    const isAttributeForm = form.type === '属性表单';
    
    // 从角色字段中获取字段详情（名称等）
    const getFieldDetail = (fieldId) => {
      return fields.find(f => f.id === fieldId);
    };
    
    // ==================== 属性表弹窗 ====================
    if (isAttributeForm) {
      const levelFields = form.structure?.levelFields || [];
      const levelCount = form.structure?.levels || 0;
      const existingData = form.data || [];
      
      // 获取某级别的字段ID
      const getLevelFieldId = (level) => {
        const lf = levelFields.find(f => f.level === level);
        return lf?.fieldId;
      };
      
      // 获取某级别在选定上级路径下的可选值
      const getLevelOptions = (level) => {
        const fieldId = getLevelFieldId(level);
        if (!fieldId) return [];
        
        let filteredData = existingData;
        
        // 按上级路径过滤
        for (let i = 1; i < level; i++) {
          const parentFieldId = getLevelFieldId(i);
          const parentValue = entryFormData[`_level_${i}`];
          if (parentValue) {
            filteredData = filteredData.filter(d => d[parentFieldId] === parentValue);
          }
        }
        
        const values = [...new Set(filteredData.map(d => d[fieldId]).filter(v => v !== undefined && v !== ''))];
        return values;
      };
      
      // 处理级别选择变化
      const handleLevelChange = (level, value) => {
        const newData = { ...entryFormData };
        newData[`_level_${level}`] = value;
        // 清除下级选择
        for (let i = level + 1; i <= levelCount; i++) {
          delete newData[`_level_${i}`];
          delete newData[`_new_${i}`];
        }
        setEntryFormData(newData);
      };
      
      // 处理新值输入
      const handleNewValueChange = (level, value) => {
        setEntryFormData(prev => ({
          ...prev,
          [`_new_${level}`]: value
        }));
      };
      
      // 提交属性表数据
      const handleAttributeSubmit = async () => {
        // 找到最深的有值的级别
        let maxLevel = 0;
        let newValueLevel = 0;
        
        for (let i = 1; i <= levelCount; i++) {
          if (entryFormData[`_new_${i}`]) {
            newValueLevel = i;
            break;
          }
          if (entryFormData[`_level_${i}`]) {
            maxLevel = i;
          }
        }
        
        if (newValueLevel === 0) {
          alert('请输入新值');
          return;
        }
        
        // 检查上级是否都已选择
        for (let i = 1; i < newValueLevel; i++) {
          if (!entryFormData[`_level_${i}`]) {
            alert(`请先选择第${i}级`);
            return;
          }
        }
        
        // 构建数据记录
        const record = {};
        for (let i = 1; i < newValueLevel; i++) {
          const fieldId = getLevelFieldId(i);
          record[fieldId] = entryFormData[`_level_${i}`];
        }
        record[getLevelFieldId(newValueLevel)] = entryFormData[`_new_${newValueLevel}`];
        
        try {
          // 保存数据
          const savedRecord = await window.dndDB.addFormData(projectId, form.id, record);
          
          // 关闭弹窗
          const blockId = dataEntryModal.blockId;  // 获取触发的区块ID
          setDataEntryModal({ show: false, formId: null, formName: null, blockId: null });
          setEntryFormData({});
          
          // 触发数据流程事件，传递刚录入的数据
          if (blockId) {
            console.log('');
            console.log('========== 交互区块触发流程 ==========');
            console.log('区块ID:', blockId);
            console.log('页面ID:', pageId);
            console.log('录入的数据:', record);
            console.log('表单ID:', form.id);
            console.log('========================================');
            console.log('');
            
            window.dispatchEvent(new CustomEvent('buttonClick', {
              detail: {
                blockId: blockId,
                pageId: pageId,
                projectId: projectId,
                roleId: roleId,
                // 传递刚录入的数据，供流程读取
                inputData: record,
                inputFormId: form.id
              }
            }));
          }
          
          // 注意：不再立即刷新页面，让流程完整执行
          // 流程的结束节点会负责页面跳转
          // 如果没有关联流程，给用户提示
          if (!blockId) {
            alert('数据添加成功！');
          }
          // 如果有关联流程，流程会接管后续操作
          
        } catch (error) {
          alert('数据添加失败：' + error.message);
        }
      };
      
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '450px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            {/* 紫色标题栏 */}
            <div style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '8px 8px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                🏷️ {dataEntryModal.formName}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                {levelCount}级属性表
              </p>
            </div>
            
            {/* 级别选择器 */}
            <div style={{ padding: '24px' }}>
              {Array.from({ length: levelCount }, (_, i) => i + 1).map(level => {
                const fieldId = getLevelFieldId(level);
                const fieldInfo = getFieldDetail(fieldId);
                const options = getLevelOptions(level);
                const selectedValue = entryFormData[`_level_${level}`];
                const newValue = entryFormData[`_new_${level}`];
                
                // 判断是否可以操作（上级都已选择或是第一级）
                let canOperate = true;
                for (let i = 1; i < level; i++) {
                  if (!entryFormData[`_level_${i}`]) {
                    canOperate = false;
                    break;
                  }
                }
                
                return (
                  <div key={level} style={{
                    marginBottom: '16px',
                    padding: '12px',
                    border: `1px solid ${canOperate ? '#a78bfa' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    backgroundColor: canOperate ? '#f5f3ff' : '#f9fafb',
                    opacity: canOperate ? 1 : 0.5
                  }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#4c1d95'
                    }}>
                      第{level}级：{fieldInfo?.name || `级别${level}`}
                    </label>
                    
                    {canOperate ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* 选择已有值 */}
                        {options.length > 0 && (
                          <select
                            value={selectedValue || ''}
                            onChange={(e) => handleLevelChange(level, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="">-- 选择已有值 --</option>
                            {options.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        
                        {/* 输入新值 */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={newValue || ''}
                            onChange={(e) => handleNewValueChange(level, e.target.value)}
                            placeholder="输入新值..."
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '1px solid #a78bfa',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                        请先选择上级
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 已有数据统计 */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                已有 {existingData.length} 条数据
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setDataEntryModal({ show: false, formId: null, formName: null });
                  setEntryFormData({});
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleAttributeSubmit}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // ==================== 基础表弹窗（原有逻辑） ====================
    // 获取表单字段结构（包含fieldId）
    const formFields = form.structure?.fields || [];
    
    // 获取字段显示名称
    const getFieldName = (formField) => {
      const detail = getFieldDetail(formField.fieldId);
      return detail?.name || formField.fieldId;
    };
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '400px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
            {dataEntryModal.formName}
          </h3>
          
          {/* 主键字段 */}
          {form.structure?.primaryKey && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151', fontWeight: 'bold' }}>
                {getFieldDetail(form.structure.primaryKey)?.name || form.structure.primaryKey}
                <span style={{ color: '#ef4444' }}> *</span>
              </label>
              <input
                type="text"
                value={entryFormData[form.structure.primaryKey] || ''}
                onChange={(e) => setEntryFormData(prev => ({
                  ...prev,
                  [form.structure.primaryKey]: e.target.value
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
          
          {/* 其他字段 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {formFields.filter(f => f.fieldId !== form.structure?.primaryKey).map(formField => {
              const fieldDetail = getFieldDetail(formField.fieldId);
              const isReadOnly = fieldDetail?.nature === '衍生字段';
              
              return (
                <div key={formField.fieldId}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
                    {getFieldName(formField)}
                    {formField.required && <span style={{ color: '#ef4444' }}> *</span>}
                    {isReadOnly && <span style={{ color: '#9ca3af', fontSize: '12px' }}> (自动计算)</span>}
                  </label>
                  <input
                    type="text"
                    value={entryFormData[formField.fieldId] || ''}
                    onChange={(e) => setEntryFormData(prev => ({
                      ...prev,
                      [formField.fieldId]: e.target.value
                    }))}
                    readOnly={isReadOnly}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: isReadOnly ? '#f3f4f6' : 'white'
                    }}
                  />
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setDataEntryModal({ show: false, formId: null, formName: null })}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              onClick={handleDataEntrySubmit}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              确定
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染表单区块
  const renderFormBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    const cfg = block.formConfig;
    const style = block.style || {};
    
    // 从内容样式获取字体设置
    const fontSize = contentStyle.fontSize || 14;
    const fontFamily = contentStyle.fontFamily || 'inherit';
    const tableFontSize = fontSize * 0.85; // 表格字体稍小
    
    if (!cfg || !cfg.formId) {
      return (
        <div key={block.id} style={blockStyle}>
          {PopupCloseButton && <PopupCloseButton />}
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#9ca3af',
            fontSize: fontSize,
            fontFamily: fontFamily,
          }}>
            未配置表单
          </div>
        </div>
      );
    }

    const headers = cfg.fieldInfos?.map(f => f.fieldName) || [];
    const realData = formDataCache[cfg.formId] || [];
    
    // 排序（置顶优先，然后按显示顺序）
    let sortedData = [...realData];
    
    // 先分离置顶和普通数据
    const topData = sortedData.filter(d => d._isTop);
    const normalData = sortedData.filter(d => !d._isTop);
    
    // 置顶数据按置顶时间排序（最新置顶在前）
    topData.sort((a, b) => new Date(b._topTime || 0) - new Date(a._topTime || 0));
    
    // 普通数据根据sortOrder配置排序
    if (cfg.sortOrder === 'asc') {
      // 顺序：最早在前（按createdAt升序）
      normalData.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      // 倒序：最新在前（按createdAt降序，默认）
      normalData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    
    // 合并：置顶在前，普通数据在后
    sortedData = [...topData, ...normalData];
    
    // 限制数据量
    let displayData = sortedData;
    if (cfg.totalRecords && parseInt(cfg.totalRecords) > 0) {
      displayData = displayData.slice(0, parseInt(cfg.totalRecords));
    }

    // 构建表格行
    const tableRows = displayData.map(record => {
      return cfg.fieldInfos?.map(f => {
        const value = record[f.fieldId];
        return value !== undefined && value !== null ? String(value) : '-';
      }) || [];
    });

    // 操作栏配置
    const actionColumn = cfg.actionColumn;

    return (
      <div key={block.id} style={{ ...blockStyle, overflow: 'auto' }}>
        {PopupCloseButton && <PopupCloseButton />}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: tableFontSize,
          fontFamily: fontFamily,
        }}>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} style={{
                  backgroundColor: cfg.headerBgColor || '#f3f4f6',
                  color: cfg.headerTextColor || '#374151',
                  padding: '8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  {header}
                </th>
              ))}
              {actionColumn?.enabled && (
                <th style={{
                  backgroundColor: cfg.headerBgColor || '#f3f4f6',
                  color: cfg.headerTextColor || '#374151',
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #e5e7eb',
                  width: `${actionColumn.width || 150}px`,
                }}>
                  {actionColumn.title || '操作'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + (actionColumn?.enabled ? 1 : 0)} style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              tableRows.map((row, rowIndex) => {
                const record = displayData[rowIndex];
                return (
                  <tr key={rowIndex} style={{
                    backgroundColor: record._isTop ? '#fef3c7' : (rowIndex % 2 === 0 ? '#fff' : '#f9fafb'),
                  }}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} style={{
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        {record._isTop && colIndex === 0 && <span style={{ marginRight: '4px' }}>📌</span>}
                        {cell}
                      </td>
                    ))}
                    {actionColumn?.enabled && (
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          {actionColumn.buttons?.edit?.enabled && (
                            <button
                              onClick={() => handleEditRecord(cfg, record)}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: '#fff',
                                backgroundColor: actionColumn.buttons.edit.color || '#3b82f6',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {actionColumn.buttons.edit.text || '修改'}
                            </button>
                          )}
                          {actionColumn.buttons?.delete?.enabled && (
                            <button
                              onClick={() => handleDeleteRecord(cfg, record)}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: '#fff',
                                backgroundColor: actionColumn.buttons.delete.color || '#ef4444',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {actionColumn.buttons.delete.text || '删除'}
                            </button>
                          )}
                          {actionColumn.buttons?.top?.enabled && (
                            <button
                              onClick={() => handleTopRecord(cfg, record)}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: '#fff',
                                backgroundColor: actionColumn.buttons.top.color || '#f59e0b',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {record._isTop 
                                ? (actionColumn.buttons.top.textOn || '取消置顶')
                                : (actionColumn.buttons.top.textOff || '置顶')
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染按钮区块 - 支持多种按钮类型
  const renderButtonBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    // 完全继承blockStyle，只添加按钮特有的交互样式
    // blockStyle 已经包含了完整的边框、圆角等样式
    const style = block.style || {};
    
    // 判断用户是否设置了背景色（不是默认的transparent）
    const hasCustomBg = style.backgroundColor && style.backgroundColor !== 'transparent';
    const hasCustomColor = style.color && style.color !== '#333' && style.color !== '#333333';
    
    // 从内容样式获取字体设置
    const fontSize = contentStyle.fontSize || 14;
    const fontFamily = contentStyle.fontFamily || 'inherit';
    const fontWeight = contentStyle.fontWeight || 'normal';
    
    const finalStyle = {
      ...blockStyle,  // 继承所有样式（包括边框）
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      // 字体样式
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      // 直接使用原始样式中的背景色，如果没有设置则使用默认蓝色
      backgroundColor: hasCustomBg ? style.backgroundColor : '#3b82f6',
      // 如果用户没有设置文字颜色，使用白色；否则保留用户设置
      color: hasCustomColor ? style.color : '#ffffff',
    };

    const handleClick = async () => {
      console.log('按钮点击:', block.id, '类型:', block.buttonType);
      
      // 根据按钮类型执行不同的操作
      if (block.buttonType && window.ButtonRegistry) {
        const context = {
          projectId: projectId,
          pageId: pageId,
          roleId: roleId,
          blockId: block.id,
          pages: pages,
          forms: forms,
          fields: fields
        };
        
        try {
          const result = await window.ButtonRegistry.execute(
            block.buttonType, 
            block.buttonConfig || {}, 
            context
          );
          console.log('按钮执行结果:', result);
        } catch (error) {
          console.error('按钮执行失败:', error);
        }
      } else {
        // 没有配置buttonType，使用旧的事件触发方式（兼容中性按钮）
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: block.id,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId
          }
        }));
        console.log('按钮点击（中性按钮模式），触发数据流程事件:', block.id);
      }
    };

    return (
      <div 
        key={block.id} 
        style={finalStyle}
        onClick={handleClick}
      >
        {PopupCloseButton && <PopupCloseButton />}
        {block.buttonText ?? ''}
      </div>
    );
  };

  // 渲染用户账号区块
  const renderAuthBlock = (block, blockStyle, PopupCloseButton) => {
    const config = block.authConfig || {};
    const style = block.style || {};
    
    // 构建样式配置传递给AuthBlock
    const authStyle = {
      fontSize: style.fontSize || 14,
      fontFamily: style.fontFamily || 'inherit',
      loginBgColor: style.backgroundColor || '#3b82f6',
      loginTextColor: style.color || '#ffffff',
      registerBgColor: 'transparent',
      registerTextColor: style.backgroundColor || '#3b82f6',
      registerBorderColor: style.backgroundColor || '#3b82f6',
      nicknameColor: style.color || '#374151',
      avatarBgColor: '#e5e7eb',
      avatarTextColor: '#6b7280',
    };
    
    // 处理页面跳转
    const handleNavigate = (targetPageId) => {
      if (targetPageId) {
        const targetPage = pages.find(p => p.id === targetPageId);
        if (targetPage) {
          const url = `preview.html?projectId=${projectId}&roleId=${roleId}&pageId=${targetPageId}`;
          window.location.href = url;
        }
      }
    };
    
    return (
      <div key={block.id} style={{
        ...blockStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: style.textAlign === 'center' ? 'center' : (style.textAlign === 'right' ? 'flex-end' : 'flex-start'),
      }}>
        {PopupCloseButton && <PopupCloseButton />}
        {window.AuthBlock ? (
          <AuthBlock 
            block={block}
            style={authStyle}
            config={config}
            onNavigate={handleNavigate}
          />
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 12 }}>
            用户账号组件未加载
          </div>
        )}
      </div>
    );
  };

  // 操作栏功能
  const handleEditRecord = async (cfg, record) => {
    alert('编辑功能 - 预览模式下暂不支持');
  };

  const handleDeleteRecord = async (cfg, record) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
      const targetFormId = cfg.sourceFormId || cfg.formId;
      const form = forms.find(f => f.id === cfg.formId);
      const primaryKey = form?.structure?.primaryKey;
      const pkValue = record[primaryKey];
      
      await window.dndDB.deleteFormData(projectId, targetFormId, pkValue);
      alert('删除成功！');
      
      // 重新加载数据
      await loadAllFormData(blocks, forms);
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  };

  const handleTopRecord = async (cfg, record) => {
    try {
      const targetFormId = cfg.sourceFormId || cfg.formId;
      const form = forms.find(f => f.id === cfg.formId);
      const primaryKey = form?.structure?.primaryKey;
      const pkValue = record[primaryKey];
      
      const isCurrentlyTop = record._isTop === true;
      const updates = {
        _isTop: !isCurrentlyTop,
        _topTime: isCurrentlyTop ? null : new Date().toISOString()
      };
      
      await window.dndDB.updateFormData(projectId, targetFormId, pkValue, { ...record, ...updates });
      
      // 重新加载数据
      await loadAllFormData(blocks, forms);
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 加载中
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}>
        加载中...
      </div>
    );
  }

  // 错误
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#ef4444',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '18px' }}>{error}</div>
        <button
          onClick={() => window.close()}
          style={{
            marginTop: '24px',
            padding: '8px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          关闭
        </button>
      </div>
    );
  }

  // 参数缺失错误
  if (paramError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#f59e0b',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>页面访问受限</div>
        <div style={{ fontSize: '14px', color: '#666' }}>{paramError}</div>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '24px',
            padding: '8px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          返回上一页
        </button>
      </div>
    );
  }

  // 获取画布配置（使用共享工具）
  const canvasType = currentPage?.design?.canvasType || 'PC';
  const config = window.StyleUtils?.getCanvasConfig(canvasType) || {
    width: canvasType === 'Mobile' ? 360 : 1200,
    minHeight: canvasType === 'Mobile' ? 640 : 800
  };

  // 使用共享的画布高度计算函数
  const canvasHeight = window.StyleUtils?.calculateCanvasHeight 
    ? window.StyleUtils.calculateCanvasHeight(blocks, config.minHeight)
    : (() => {
        // 回退：本地计算
        if (blocks.length === 0) return config.minHeight;
        const maxBottom = blocks.reduce((max, block) => {
          const bottom = block.y + block.height + 50;
          return bottom > max ? bottom : max;
        }, config.minHeight);
        return maxBottom;
      })();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 预览工具栏 - 使用拆分的组件 */}
      {window.PreviewToolbar ? (
        <PreviewToolbar 
          pageName={currentPage?.name}
          canvasType={canvasType}
          onNavigateHome={navigateToHome}
          onClose={() => window.close()}
        />
      ) : (
        // 回退：内联工具栏
        <div style={{
          backgroundColor: '#1f2937',
          color: '#fff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 'bold' }}>🔍 预览模式</span>
            <span style={{ color: '#9ca3af' }}>|</span>
            <span>{currentPage?.name}</span>
            <span style={{ 
              padding: '2px 8px', 
              backgroundColor: canvasType === 'PC' ? '#3b82f6' : '#10b981',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              {canvasType === 'PC' ? '💻 PC端' : '📱 手机端'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={navigateToHome}
              style={{
                padding: '4px 12px',
                backgroundColor: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🏠 首页
            </button>
            <button
              onClick={() => window.close()}
              style={{
                padding: '4px 12px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕ 关闭预览
            </button>
          </div>
        </div>
      )}

      {/* 预览内容区 - 真实页面样式 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'auto',
        backgroundColor: '#ffffff',
      }}>
        <div style={{
          width: `${config.width}px`,
          minHeight: `${canvasHeight}px`,
          backgroundColor: '#ffffff',
          position: 'relative',
        }}>
          {blocks.map(block => renderBlock(block))}
          
          {blocks.length === 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '16px',
            }}>
              此页面尚未设计内容
            </div>
          )}
        </div>
      </div>
      
      {/* 数据录入弹窗 */}
      {renderDataEntryModal()}
      
      {/* 流程参数收集组件 */}
      {window.FlowDialogRenderer && <FlowDialogRenderer projectId={projectId} />}
      {window.FlowSelectionRenderer && <FlowSelectionRenderer projectId={projectId} />}
    </div>
  );
}

window.Preview = Preview;
