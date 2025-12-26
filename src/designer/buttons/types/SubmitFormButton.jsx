// 表单提交按钮 - 动作按钮类型
// 支持两种操作：validate（存在性校验/登录）和 create（直接存储/注册）

// ========== 配置面板 ==========

function SubmitFormButtonConfig({ config, onChange, projectId, roleId, blocks }) {
  return (
    <div className="space-y-4">
      {/* 提交动作 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          提交动作 <span className="text-red-500">*</span>
        </label>
        <select
          value={config.submitAction || 'create'}
          onChange={(e) => onChange({ submitAction: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="validate">存在性校验（登录）</option>
          <option value="create">直接存储（注册）</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {config.submitAction === 'validate' 
            ? '验证账号密码是否存在于用户表中'
            : '将数据直接存储到用户表中'}
        </div>
      </div>

      {/* 关联的表单区块 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          关联表单区块
        </label>
        <select
          value={config.formBlockId || ''}
          onChange={(e) => onChange({ formBlockId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">-- 自动检测父区块 --</option>
          {(blocks || [])
            .filter(b => b.type === '交互')
            .map(b => (
              <option key={b.id} value={b.id}>
                {b.name || b.id}
              </option>
            ))
          }
        </select>
      </div>

      {/* 成功提示 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          成功提示
        </label>
        <input
          type="text"
          value={config.successMessage || ''}
          onChange={(e) => onChange({ successMessage: e.target.value })}
          placeholder={config.submitAction === 'validate' ? '登录成功' : '注册成功'}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* 失败提示 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          失败提示
        </label>
        <input
          type="text"
          value={config.failMessage || ''}
          onChange={(e) => onChange({ failMessage: e.target.value })}
          placeholder={config.submitAction === 'validate' ? '账号或密码错误' : '注册失败'}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );
}

// ========== 执行逻辑 ==========

async function executeSubmitForm(config, context) {
  console.log('=== executeSubmitForm 执行 ===');
  console.log('config:', config);
  console.log('context:', context);
  
  const { projectId, blockId } = context;
  const submitAction = config.submitAction || 'create';
  
  // 获取表单区块ID（通过配置或查找父区块）
  let formBlockId = config.formBlockId;
  if (!formBlockId) {
    // 尝试从blocks中查找按钮的父区块
    const blocks = context.blocks || [];
    const button = blocks.find(b => b.id === blockId);
    if (button?.parentId) {
      formBlockId = button.parentId;
    }
  }
  
  console.log('表单区块ID:', formBlockId);
  
  if (!formBlockId) {
    const msg = config.failMessage || '未找到关联的表单区块';
    alert(msg);
    return { success: false, error: msg };
  }
  
  // 从全局状态获取表单输入数据
  const formData = window.__previewFormData?.[formBlockId] || {};
  console.log('表单数据:', formData);
  
  if (!formData || Object.keys(formData).length === 0) {
    alert('请填写表单内容');
    return { success: false, error: '表单数据为空' };
  }
  
  // 获取用户管理表ID
  const userFormId = 'SYS-FORM-USER';
  
  try {
    if (submitAction === 'validate') {
      // 存在性校验（登录）
      console.log('执行登录验证...');
      const result = await validateUser(projectId, userFormId, formData);
      
      if (result.success) {
        const msg = config.successMessage || '登录成功';
        alert(msg);
        // 关闭弹窗
        window.dispatchEvent(new CustomEvent('closePopup', {
          detail: { blockId: formBlockId }
        }));
        // 刷新页面以更新用户状态
        setTimeout(() => window.location.reload(), 500);
        return { success: true, user: result.user };
      } else {
        const msg = config.failMessage || '账号或密码错误';
        alert(msg);
        return { success: false, error: msg };
      }
    } else {
      // 直接存储（注册）
      console.log('执行注册...');
      const result = await createUser(projectId, userFormId, formData);
      
      if (result.success) {
        const msg = config.successMessage || '注册成功，请登录';
        alert(msg);
        // 清空表单
        window.dispatchEvent(new CustomEvent('clearFormInput', {
          detail: { blockId: formBlockId }
        }));
        return { success: true, userId: result.userId };
      } else {
        const msg = config.failMessage || result.error || '注册失败';
        alert(msg);
        return { success: false, error: msg };
      }
    }
  } catch (error) {
    console.error('表单提交失败:', error);
    const msg = config.failMessage || error.message || '操作失败';
    alert(msg);
    return { success: false, error: msg };
  }
}

// 验证用户（登录）
async function validateUser(projectId, formId, formData) {
  console.log('验证用户:', formData);
  
  // 获取用户表数据
  const userList = await window.dndDB.getFormDataList(projectId, formId);
  console.log('用户列表:', userList);
  
  // 查找匹配的用户
  const account = formData['SYS-FLD-002']; // 账号字段
  const password = formData['SYS-FLD-009']; // 密码字段
  
  if (!account || !password) {
    return { success: false, error: '请输入账号和密码' };
  }
  
  const user = userList.find(u => 
    u['SYS-FLD-002'] === account && u['SYS-FLD-009'] === password
  );
  
  if (user) {
    // 登录成功，保存用户信息到本地存储
    localStorage.setItem('dnd_end_user', JSON.stringify({
      userId: user['SYS-FLD-001'],
      account: user['SYS-FLD-002'],
      nickname: user['SYS-FLD-003'],
      role: user['SYS-FLD-005'],
      loginTime: new Date().toISOString()
    }));
    return { success: true, user };
  } else {
    return { success: false, error: '账号或密码错误' };
  }
}

// 创建用户（注册）
async function createUser(projectId, formId, formData) {
  console.log('创建用户:', formData);
  
  const account = formData['SYS-FLD-002'];
  const password = formData['SYS-FLD-009'];
  
  if (!account || !password) {
    return { success: false, error: '请输入账号和密码' };
  }
  
  // 检查账号是否已存在
  const userList = await window.dndDB.getFormDataList(projectId, formId);
  const existing = userList.find(u => u['SYS-FLD-002'] === account);
  
  if (existing) {
    return { success: false, error: '账号已存在' };
  }
  
  // 生成新用户ID
  const maxId = userList.reduce((max, u) => {
    const id = parseInt(u['SYS-FLD-001']) || 0;
    return id > max ? id : max;
  }, 0);
  const newUserId = maxId + 1;
  
  // 创建新用户数据
  const newUser = {
    'SYS-FLD-001': newUserId,
    'SYS-FLD-002': account,
    'SYS-FLD-009': password,
    'SYS-FLD-003': account.split('@')[0], // 默认昵称
    'SYS-FLD-004': '', // 头像
    'SYS-FLD-005': 'user', // 角色
    'SYS-FLD-006': 'active', // 状态
    'SYS-FLD-007': new Date().toISOString(), // 注册时间
    'SYS-FLD-008': '' // 最后登录
  };
  
  // 保存到数据库
  await window.dndDB.addFormData(projectId, formId, newUser);
  
  return { success: true, userId: newUserId };
}

// ========== 验证配置 ==========

function validateSubmitForm(config) {
  const errors = [];
  // 基本配置都有默认值，不需要强制验证
  return { valid: true, errors };
}

// ========== 注册按钮类型 ==========

if (window.ButtonRegistry) {
  window.ButtonRegistry.register('submitForm', {
    label: '表单提交',
    icon: '📝',
    description: '提交表单数据（登录/注册）',
    category: 'action',
    renderConfig: SubmitFormButtonConfig,
    execute: executeSubmitForm,
    validate: validateSubmitForm,
    defaultConfig: {
      submitAction: 'create',
      formBlockId: '',
      successMessage: '',
      failMessage: '',
      onSuccess: 'closePopup',
      onFail: 'showError'
    }
  });
  
  console.log('按钮类型 "submitForm" 注册成功');
}

window.SubmitFormButtonConfig = SubmitFormButtonConfig;
