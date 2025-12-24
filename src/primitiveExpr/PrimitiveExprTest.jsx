/**
 * DND原语表达式测试页面
 * 
 * 架构：
 * - 函数分类选择 → 测试通道选择 → 对应编辑器
 * - 每个函数类别使用独立的编辑器组件
 */

function PrimitiveExprTest({ onBack }) {
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [activeChannel, setActiveChannel] = React.useState(null);

  const categories = [
    {
      id: 'arithmetic',
      name: '四则运算',
      icon: '📐',
      description: '括号和四则运算符 ( ) + - × ÷',
      channels: [
        { id: 'derived', name: '表单衍生', desc: '基于源表字段计算衍生字段' },
        { id: 'calculate', name: '计算节点', desc: '模拟中间变量计算' }
      ]
    },
    {
      id: 'math',
      name: '数学公式',
      icon: '📊',
      description: '数学函数 round, abs, sqrt, floor, ceil',
      channels: [
        { id: 'derived', name: '表单衍生', desc: '基于源表字段计算衍生字段' },
        { id: 'calculate', name: '计算节点', desc: '模拟中间变量计算' }
      ]
    },
    {
      id: 'aggregation',
      name: '聚合计算',
      icon: '📈',
      description: '统计函数 sum, avg, count, max, min',
      channels: [
        { id: 'formColumn', name: '表单列统计', desc: '对表单的某一列进行聚合统计' },
        { id: 'arrayCalc', name: '数组统计', desc: '对数组变量进行聚合统计' }
      ]
    },
    {
      id: 'string',
      name: '字符串函数',
      icon: '📝',
      description: '拼接、截取、替换、查找等20个函数',
      channels: [
        { id: 'stringTest', name: '函数测试', desc: '测试字符串函数的各项功能' }
      ]
    },
    {
      id: 'time',
      name: '时间函数',
      icon: '⏰',
      description: '格式化、加减、比较、字段提取等15个函数',
      channels: [
        { id: 'timeTest', name: '函数测试', desc: '测试时间函数的各项功能' }
      ]
    }
  ];

  const handleReset = () => {
    setSelectedCategory(null);
    setActiveChannel(null);
  };

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900">← 返回首页</button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DND原语表达式测试</h1>
              <p className="text-sm text-gray-500">
                {selectedCategory ? `${currentCategory?.icon} ${currentCategory?.name}` : '选择函数类别开始测试'}
                {activeChannel && ` → ${currentCategory?.channels.find(c => c.id === activeChannel)?.name}`}
              </p>
            </div>
          </div>
          {selectedCategory && (
            <button onClick={handleReset} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg">重新选择</button>
          )}
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 步骤1：选择函数类别 */}
        {!selectedCategory && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">步骤1：选择函数类别</h3>
              <p className="text-sm text-blue-700">不同类别使用不同的编辑器</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl border-2 border-transparent hover:border-blue-500">
                  <div className="text-4xl mb-4">{cat.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                  <p className="text-gray-600 text-sm">{cat.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">测试通道：</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cat.channels.map(ch => (<span key={ch.id} className="px-2 py-1 bg-gray-100 rounded text-xs">{ch.name}</span>))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 步骤2：选择测试通道 */}
        {selectedCategory && !activeChannel && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">步骤2：选择测试通道 - {currentCategory?.icon} {currentCategory?.name}</h3>
              <p className="text-sm text-green-700">{currentCategory?.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentCategory?.channels.map(channel => (
                <div key={channel.id} onClick={() => setActiveChannel(channel.id)} className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl border-2 border-transparent hover:border-green-500">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{channel.name}</h3>
                  <p className="text-gray-600">{channel.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 步骤3：测试 */}
        {selectedCategory && activeChannel && (
          <div>
            {selectedCategory === 'arithmetic' && activeChannel === 'derived' && <ArithmeticDerivedTest />}
            {selectedCategory === 'arithmetic' && activeChannel === 'calculate' && <ArithmeticCalculateTest />}
            {selectedCategory === 'math' && activeChannel === 'derived' && <MathDerivedTest />}
            {selectedCategory === 'math' && activeChannel === 'calculate' && <MathCalculateTest />}
            {selectedCategory === 'aggregation' && activeChannel === 'formColumn' && <FormColumnAggregationTest />}
            {selectedCategory === 'aggregation' && activeChannel === 'arrayCalc' && <ArrayAggregationTest />}
            {selectedCategory === 'string' && activeChannel === 'stringTest' && <StringFunctionTest />}
            {selectedCategory === 'time' && activeChannel === 'timeTest' && <TimeFunctionTest />}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 四则运算 - 表单衍生测试
// ============================================================
function ArithmeticDerivedTest() {
  const [projectId, setProjectId] = React.useState('');
  const [projects, setProjects] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [selectedForm, setSelectedForm] = React.useState(null);
  const [formData, setFormData] = React.useState([]);
  const [derivedFieldName, setDerivedFieldName] = React.useState('');
  const [derivedTokens, setDerivedTokens] = React.useState([]);
  const [derivedFields, setDerivedFields] = React.useState([]);

  React.useEffect(() => { loadProjects(); }, []);
  React.useEffect(() => { if (projectId) loadFormsAndFields(); }, [projectId]);
  React.useEffect(() => { if (selectedForm && projectId) loadFormData(); }, [selectedForm]);

  const loadProjects = async () => {
    const allProjects = await window.dndDB.getAllProjects();
    setProjects(allProjects);
  };

  const loadFormsAndFields = async () => {
    const formList = await window.dndDB.getFormsByProjectId(projectId);
    setForms(formList.filter(f => f.type === '对象表单' && (f.subType === '独立基础表' || f.subType === '关联基础表')));
    setFields(await window.dndDB.getFieldsByProjectId(projectId));
  };

  const loadFormData = async () => {
    const data = await window.dndDB.getFormDataList(projectId, selectedForm.id);
    setFormData(data || []);
  };

  const getSourceFields = () => {
    if (!selectedForm?.structure) return [];
    return (selectedForm.structure.fields || []).map(sf => {
      const fieldInfo = fields.find(f => f.id === sf.fieldId);
      return { id: sf.fieldId, name: fieldInfo?.name || sf.fieldId, type: fieldInfo?.type || 'unknown' };
    });
  };

  const getNumericFields = () => getSourceFields().filter(f => f.type === '整数' || f.type === '小数');

  const handleAddDerivedField = () => {
    if (!derivedFieldName.trim()) { alert('请输入字段名称'); return; }
    if (derivedTokens.length === 0) { alert('请配置计算表达式'); return; }
    const validation = window.primitiveEngine.validate(derivedTokens);
    if (!validation.valid) { alert('表达式有误: ' + validation.errors.join('; ')); return; }
    setDerivedFields([...derivedFields, {
      id: `DERIVED-${Date.now()}`,
      name: derivedFieldName.trim(),
      tokens: [...derivedTokens],
      displayExpr: window.primitiveEngine.tokensToDisplayText(derivedTokens)
    }]);
    setDerivedFieldName('');
    setDerivedTokens([]);
  };

  const calculateDerivedValue = (derivedField, record) => {
    return window.primitiveEngine.executeForDerived(derivedField.tokens, record, getSourceFields());
  };

  // 使用 ArithmeticEditor
  const Editor = window.ArithmeticEditor;

  return (
    <div className="space-y-6">
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <h3 className="font-medium text-pink-800 mb-2">📐 四则运算 - 表单衍生测试</h3>
        <p className="text-sm text-pink-700">使用括号和四则运算符计算衍生字段</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">选择数据源</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择项目</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelectedForm(null); setDerivedFields([]); }}>
              <option value="">请选择项目...</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择源表</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={selectedForm?.id || ''} onChange={(e) => { setSelectedForm(forms.find(f => f.id === e.target.value) || null); setDerivedFields([]); }} disabled={!projectId}>
              <option value="">请选择源表...</option>
              {forms.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>
        </div>
        {selectedForm && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">源表字段：</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {getSourceFields().map(f => (<span key={f.id} className="px-2 py-1 bg-white border rounded text-sm">{f.name} <span className="text-gray-400">({f.type})</span></span>))}
            </div>
          </div>
        )}
      </div>

      {selectedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">添加衍生字段</h4>
          {derivedFields.length > 0 && (
            <div className="mb-4 space-y-2">
              {derivedFields.map(df => (
                <div key={df.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div><span className="font-medium">{df.name}</span><code className="ml-2 px-2 py-1 bg-white rounded text-sm">{df.displayExpr}</code></div>
                  <button onClick={() => setDerivedFields(derivedFields.filter(f => f.id !== df.id))} className="text-red-600 text-sm">移除</button>
                </div>
              ))}
            </div>
          )}
          <div className="border border-pink-300 rounded-lg p-4 bg-pink-50">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">字段名称 <span className="text-red-500">*</span></label>
              <input type="text" value={derivedFieldName} onChange={(e) => setDerivedFieldName(e.target.value)} placeholder="例如：总分" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">计算表达式 <span className="text-red-500">*</span></label>
              {Editor && <Editor availableVariables={getNumericFields()} tokens={derivedTokens} onTokensChange={setDerivedTokens} />}
            </div>
            <button onClick={handleAddDerivedField} className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">添加此衍生字段</button>
          </div>
        </div>
      )}

      {selectedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">预览结果 <span className="text-sm font-normal text-gray-500">（{formData.length}条数据）</span></h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {getSourceFields().map(f => (<th key={f.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{f.name}</th>))}
                  {derivedFields.map(df => (<th key={df.id} className="px-4 py-2 text-left text-xs font-medium text-pink-600 bg-pink-50">{df.name} ★</th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.length === 0 ? (
                  <tr><td colSpan={getSourceFields().length + derivedFields.length} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>
                ) : formData.slice(0, 5).map((record, idx) => (
                  <tr key={idx}>
                    {getSourceFields().map(f => (<td key={f.id} className="px-4 py-2 text-gray-900">{record[f.id] ?? '-'}</td>))}
                    {derivedFields.map(df => (<td key={df.id} className="px-4 py-2 text-pink-600 bg-pink-50 font-medium">{calculateDerivedValue(df, record)}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 四则运算 - 计算节点测试
// ============================================================
function ArithmeticCalculateTest() {
  const [variables, setVariables] = React.useState([
    { id: '$price', name: '单价', type: 'number', value: 100 },
    { id: '$quantity', name: '数量', type: 'number', value: 5 }
  ]);
  const [outputVarName, setOutputVarName] = React.useState('$result');
  const [tokens, setTokens] = React.useState([]);
  const [result, setResult] = React.useState(null);

  const handleExecute = () => {
    if (tokens.length === 0) { alert('请先配置计算表达式'); return; }
    const validation = window.primitiveEngine.validate(tokens);
    if (!validation.valid) { setResult({ success: false, error: validation.errors.join('; ') }); return; }
    const varContext = {};
    variables.forEach(v => { varContext[v.id] = Number(v.value) || 0; });
    setResult(window.primitiveEngine.execute(tokens, varContext));
  };

  const Editor = window.ArithmeticEditor;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">📐 四则运算 - 计算节点测试</h3>
        <p className="text-sm text-blue-700">使用括号和四则运算符进行变量计算</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">设置模拟变量</h4>
          <button onClick={() => setVariables([...variables, { id: `$var${Date.now()}`, name: `变量${variables.length + 1}`, type: 'number', value: 0 }])} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+ 添加变量</button>
        </div>
        <div className="space-y-2">
          {variables.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="text" value={v.id} onChange={(e) => { const nv = [...variables]; nv[i] = { ...nv[i], id: e.target.value }; setVariables(nv); }} className="w-32 border rounded px-2 py-1 text-sm font-mono" />
              <input type="text" value={v.name} onChange={(e) => { const nv = [...variables]; nv[i] = { ...nv[i], name: e.target.value }; setVariables(nv); }} className="w-32 border rounded px-2 py-1 text-sm" />
              <span>=</span>
              <input type="number" value={v.value} onChange={(e) => { const nv = [...variables]; nv[i] = { ...nv[i], value: e.target.value }; setVariables(nv); }} className="w-24 border rounded px-2 py-1 text-sm" />
              <button onClick={() => setVariables(variables.filter((_, j) => j !== i))} className="text-red-600">🗑️</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">编写计算表达式</h4>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">输出变量名</label>
          <input type="text" value={outputVarName} onChange={(e) => setOutputVarName(e.target.value)} className="w-48 border rounded-lg px-3 py-2 font-mono" />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">计算表达式</label>
          {Editor && <Editor availableVariables={variables.map(v => ({ id: v.id, name: v.name, type: v.type }))} tokens={tokens} onTokensChange={setTokens} />}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">执行结果</h4>
        <button onClick={handleExecute} className="px-6 py-2 bg-green-600 text-white rounded-lg mb-4">▶ 执行计算</button>
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success ? (
              <div className="text-2xl font-bold text-green-600">{outputVarName} = {result.result}</div>
            ) : (
              <div className="text-red-600">❌ {result.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 数学公式 - 表单衍生测试
// ============================================================
function MathDerivedTest() {
  const [projectId, setProjectId] = React.useState('');
  const [projects, setProjects] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [selectedForm, setSelectedForm] = React.useState(null);
  const [formData, setFormData] = React.useState([]);
  const [derivedFieldName, setDerivedFieldName] = React.useState('');
  const [derivedTokens, setDerivedTokens] = React.useState([]);
  const [derivedFields, setDerivedFields] = React.useState([]);

  React.useEffect(() => { loadProjects(); }, []);
  React.useEffect(() => { if (projectId) loadFormsAndFields(); }, [projectId]);
  React.useEffect(() => { if (selectedForm && projectId) loadFormData(); }, [selectedForm]);

  const loadProjects = async () => setProjects(await window.dndDB.getAllProjects());
  const loadFormsAndFields = async () => {
    const formList = await window.dndDB.getFormsByProjectId(projectId);
    setForms(formList.filter(f => f.type === '对象表单' && (f.subType === '独立基础表' || f.subType === '关联基础表')));
    setFields(await window.dndDB.getFieldsByProjectId(projectId));
  };
  const loadFormData = async () => setFormData(await window.dndDB.getFormDataList(projectId, selectedForm.id) || []);

  const getSourceFields = () => {
    if (!selectedForm?.structure) return [];
    return (selectedForm.structure.fields || []).map(sf => {
      const fieldInfo = fields.find(f => f.id === sf.fieldId);
      return { id: sf.fieldId, name: fieldInfo?.name || sf.fieldId, type: fieldInfo?.type || 'unknown' };
    });
  };
  const getNumericFields = () => getSourceFields().filter(f => f.type === '整数' || f.type === '小数');

  const handleAddDerivedField = () => {
    if (!derivedFieldName.trim()) { alert('请输入字段名称'); return; }
    if (derivedTokens.length === 0) { alert('请配置计算表达式'); return; }
    const validation = window.primitiveEngine.validate(derivedTokens);
    if (!validation.valid) { alert('表达式有误: ' + validation.errors.join('; ')); return; }
    setDerivedFields([...derivedFields, { id: `DERIVED-${Date.now()}`, name: derivedFieldName.trim(), tokens: [...derivedTokens], displayExpr: window.primitiveEngine.tokensToDisplayText(derivedTokens) }]);
    setDerivedFieldName('');
    setDerivedTokens([]);
  };

  const calculateDerivedValue = (df, record) => window.primitiveEngine.executeForDerived(df.tokens, record, getSourceFields());

  // 使用 MathFormulaEditor
  const Editor = window.MathFormulaEditor;

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-purple-800 mb-2">📊 数学公式 - 表单衍生测试</h3>
        <p className="text-sm text-purple-700">使用数学函数(round, abs, sqrt等)计算衍生字段</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">选择数据源</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择项目</label>
            <select className="w-full border rounded-lg px-3 py-2" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelectedForm(null); setDerivedFields([]); }}>
              <option value="">请选择...</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择源表</label>
            <select className="w-full border rounded-lg px-3 py-2" value={selectedForm?.id || ''} onChange={(e) => { setSelectedForm(forms.find(f => f.id === e.target.value) || null); setDerivedFields([]); }} disabled={!projectId}>
              <option value="">请选择...</option>
              {forms.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {selectedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">添加衍生字段</h4>
          {derivedFields.length > 0 && (
            <div className="mb-4 space-y-2">
              {derivedFields.map(df => (
                <div key={df.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div><span className="font-medium">{df.name}</span><code className="ml-2 px-2 py-1 bg-white rounded text-sm">{df.displayExpr}</code></div>
                  <button onClick={() => setDerivedFields(derivedFields.filter(f => f.id !== df.id))} className="text-red-600 text-sm">移除</button>
                </div>
              ))}
            </div>
          )}
          <div className="border border-purple-300 rounded-lg p-4 bg-purple-50">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">字段名称</label>
              <input type="text" value={derivedFieldName} onChange={(e) => setDerivedFieldName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">计算表达式</label>
              {Editor && <Editor availableVariables={getNumericFields()} tokens={derivedTokens} onTokensChange={setDerivedTokens} />}
            </div>
            <button onClick={handleAddDerivedField} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg">添加</button>
          </div>
        </div>
      )}

      {selectedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">预览结果</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getSourceFields().map(f => (<th key={f.id} className="px-4 py-2 text-left text-xs text-gray-500">{f.name}</th>))}
                {derivedFields.map(df => (<th key={df.id} className="px-4 py-2 text-left text-xs text-purple-600 bg-purple-50">{df.name} ★</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {formData.slice(0, 5).map((record, idx) => (
                <tr key={idx}>
                  {getSourceFields().map(f => (<td key={f.id} className="px-4 py-2">{record[f.id] ?? '-'}</td>))}
                  {derivedFields.map(df => (<td key={df.id} className="px-4 py-2 text-purple-600 bg-purple-50 font-medium">{calculateDerivedValue(df, record)}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 数学公式 - 计算节点测试
// ============================================================
function MathCalculateTest() {
  const [variables, setVariables] = React.useState([
    { id: '$x', name: 'x', type: 'number', value: 16 },
    { id: '$y', name: 'y', type: 'number', value: -5.7 }
  ]);
  const [outputVarName, setOutputVarName] = React.useState('$result');
  const [tokens, setTokens] = React.useState([]);
  const [result, setResult] = React.useState(null);

  const handleExecute = () => {
    if (tokens.length === 0) { alert('请先配置计算表达式'); return; }
    const validation = window.primitiveEngine.validate(tokens);
    if (!validation.valid) { setResult({ success: false, error: validation.errors.join('; ') }); return; }
    const varContext = {};
    variables.forEach(v => { varContext[v.id] = Number(v.value) || 0; });
    setResult(window.primitiveEngine.execute(tokens, varContext));
  };

  const Editor = window.MathFormulaEditor;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-medium text-indigo-800 mb-2">📊 数学公式 - 计算节点测试</h3>
        <p className="text-sm text-indigo-700">使用数学函数(round, abs, sqrt等)进行计算</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">设置变量</h4>
          <button onClick={() => setVariables([...variables, { id: `$var${Date.now()}`, name: `v${variables.length + 1}`, type: 'number', value: 0 }])} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">+ 添加</button>
        </div>
        <div className="space-y-2">
          {variables.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="text" value={v.id} onChange={(e) => { const nv = [...variables]; nv[i].id = e.target.value; setVariables(nv); }} className="w-24 border rounded px-2 py-1 text-sm font-mono" />
              <input type="text" value={v.name} onChange={(e) => { const nv = [...variables]; nv[i].name = e.target.value; setVariables(nv); }} className="w-24 border rounded px-2 py-1 text-sm" />
              <span>=</span>
              <input type="number" value={v.value} onChange={(e) => { const nv = [...variables]; nv[i].value = e.target.value; setVariables(nv); }} className="w-24 border rounded px-2 py-1 text-sm" />
              <button onClick={() => setVariables(variables.filter((_, j) => j !== i))} className="text-red-600">🗑️</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">计算表达式</h4>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">输出变量</label>
          <input type="text" value={outputVarName} onChange={(e) => setOutputVarName(e.target.value)} className="w-48 border rounded-lg px-3 py-2 font-mono" />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">表达式</label>
          {Editor && <Editor availableVariables={variables.map(v => ({ id: v.id, name: v.name, type: v.type }))} tokens={tokens} onTokensChange={setTokens} />}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <button onClick={handleExecute} className="px-6 py-2 bg-green-600 text-white rounded-lg mb-4">▶ 执行</button>
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success ? <div className="text-2xl font-bold text-green-600">{outputVarName} = {result.result}</div> : <div className="text-red-600">❌ {result.error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 聚合计算 - 表单列统计
// ============================================================
function FormColumnAggregationTest() {
  const [projectId, setProjectId] = React.useState('');
  const [projects, setProjects] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [selectedForm, setSelectedForm] = React.useState(null);
  const [formData, setFormData] = React.useState([]);
  const [selectedColumn, setSelectedColumn] = React.useState('');
  const [selectedFunction, setSelectedFunction] = React.useState('');
  const [result, setResult] = React.useState(null);

  React.useEffect(() => { loadProjects(); }, []);
  React.useEffect(() => { if (projectId) loadFormsAndFields(); }, [projectId]);
  React.useEffect(() => { if (selectedForm && projectId) loadFormData(); }, [selectedForm]);

  const loadProjects = async () => setProjects(await window.dndDB.getAllProjects());
  const loadFormsAndFields = async () => {
    const formList = await window.dndDB.getFormsByProjectId(projectId);
    setForms(formList.filter(f => f.type === '对象表单'));
    setFields(await window.dndDB.getFieldsByProjectId(projectId));
  };
  const loadFormData = async () => { setFormData(await window.dndDB.getFormDataList(projectId, selectedForm.id) || []); setResult(null); };

  const getSourceFields = () => {
    if (!selectedForm?.structure) return [];
    return (selectedForm.structure.fields || []).map(sf => {
      const fi = fields.find(f => f.id === sf.fieldId);
      return { id: sf.fieldId, name: fi?.name || sf.fieldId, type: fi?.type || 'unknown' };
    });
  };
  const getNumericFields = () => getSourceFields().filter(f => f.type === '整数' || f.type === '小数');
  const getPrimaryKeyField = () => getSourceFields().find(f => f.type === '主键');

  const handleExecute = () => {
    if (!selectedColumn || !selectedFunction) { alert('请选择列和函数'); return; }
    const pkField = getPrimaryKeyField();
    const res = window.primitiveEngine.executeAggregationOnForm(selectedFunction, formData, selectedColumn, pkField?.id);
    setResult({ function: selectedFunction, column: selectedColumn, columnName: getSourceFields().find(f => f.id === selectedColumn)?.name, result: res });
  };

  const aggregations = window.DND_PRIMITIVES?.aggregations || [];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-purple-800 mb-2">📈 聚合计算 - 表单列统计</h3>
        <p className="text-sm text-purple-700">对表单某列进行聚合统计</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">选择数据源</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">项目</label>
            <select className="w-full border rounded-lg px-3 py-2" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelectedForm(null); setResult(null); }}>
              <option value="">请选择...</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">源表</label>
            <select className="w-full border rounded-lg px-3 py-2" value={selectedForm?.id || ''} onChange={(e) => { setSelectedForm(forms.find(f => f.id === e.target.value) || null); setSelectedColumn(''); setResult(null); }} disabled={!projectId}>
              <option value="">请选择...</option>
              {forms.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>
        </div>
        {selectedForm && <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">已加载 {formData.length} 条数据</div>}
      </div>

      {selectedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">配置聚合</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">选择列（数值）</label>
              <select className="w-full border rounded-lg px-3 py-2" value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)}>
                <option value="">请选择...</option>
                {getNumericFields().map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">聚合函数</label>
              <select className="w-full border rounded-lg px-3 py-2" value={selectedFunction} onChange={(e) => setSelectedFunction(e.target.value)}>
                <option value="">请选择...</option>
                {aggregations.map(f => (<option key={f.id} value={f.id}>{f.symbol}() - {f.description}</option>))}
              </select>
            </div>
          </div>
          <button onClick={handleExecute} disabled={!selectedColumn || !selectedFunction} className="px-6 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-400">▶ 执行</button>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">执行结果</h4>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">{result.function}([{result.columnName}])</div>
            {typeof result.result === 'object' && result.result.key !== undefined ? (
              <div>
                <div className="text-2xl font-bold text-purple-600">{result.result.value}</div>
                <div className="text-sm text-gray-600">主键：{result.result.key}</div>
                <div className="text-xs text-gray-500">{JSON.stringify(result.result)}</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-purple-600">{typeof result.result === 'number' ? (Number.isInteger(result.result) ? result.result : result.result.toFixed(4)) : JSON.stringify(result.result)}</div>
            )}
          </div>
        </div>
      )}

      {selectedForm && formData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">数据预览（前5条）</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>{getSourceFields().map(f => (<th key={f.id} className={`px-4 py-2 text-left text-xs ${f.id === selectedColumn ? 'text-purple-600 bg-purple-50' : 'text-gray-500'}`}>{f.name}{f.id === selectedColumn && ' ★'}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {formData.slice(0, 5).map((r, i) => (<tr key={i}>{getSourceFields().map(f => (<td key={f.id} className={`px-4 py-2 ${f.id === selectedColumn ? 'text-purple-600 bg-purple-50 font-medium' : ''}`}>{r[f.id] ?? '-'}</td>))}</tr>))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 聚合计算 - 数组统计
// ============================================================
function ArrayAggregationTest() {
  const [arrayVar, setArrayVar] = React.useState({ name: '$scores', values: [85, 92, 78, 95, 88] });
  const [inputValue, setInputValue] = React.useState('');
  const [selectedFunction, setSelectedFunction] = React.useState('');
  const [result, setResult] = React.useState(null);

  const handleAddValue = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) { alert('请输入有效数字'); return; }
    setArrayVar({ ...arrayVar, values: [...arrayVar.values, num] });
    setInputValue('');
  };

  const handleExecute = () => {
    if (!selectedFunction) { alert('请选择聚合函数'); return; }
    if (arrayVar.values.length === 0) { alert('数组不能为空'); return; }
    const keys = arrayVar.values.map((_, i) => i);
    setResult({ function: selectedFunction, result: window.primitiveEngine.executeAggregation(selectedFunction, arrayVar.values, keys) });
  };

  const aggregations = window.DND_PRIMITIVES?.aggregations || [];

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h3 className="font-medium text-teal-800 mb-2">📊 聚合计算 - 数组统计</h3>
        <p className="text-sm text-teal-700">对数组变量进行聚合统计</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">定义数组</h4>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">变量名</label>
          <input type="text" value={arrayVar.name} onChange={(e) => setArrayVar({ ...arrayVar, name: e.target.value })} className="w-48 border rounded-lg px-3 py-2 font-mono" />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">数组内容 ({arrayVar.values.length}个元素)</label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
            {arrayVar.values.map((val, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-800 rounded-full">
                {val}
                <button onClick={() => setArrayVar({ ...arrayVar, values: arrayVar.values.filter((_, i) => i !== idx) })} className="ml-2 text-teal-600">×</button>
              </span>
            ))}
            {arrayVar.values.length === 0 && <span className="text-gray-400">数组为空</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="输入数字" className="w-32 border rounded-lg px-3 py-2" onKeyDown={(e) => e.key === 'Enter' && handleAddValue()} />
          <button onClick={handleAddValue} className="px-4 py-2 bg-teal-600 text-white rounded-lg">添加</button>
          <button onClick={() => setArrayVar({ ...arrayVar, values: [] })} className="px-4 py-2 border text-gray-600 rounded-lg">清空</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">选择聚合函数</h4>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {aggregations.map(f => (
            <button key={f.id} onClick={() => setSelectedFunction(f.id)} className={`p-4 rounded-lg border-2 ${selectedFunction === f.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
              <div className="text-lg font-mono font-bold">{f.symbol}()</div>
              <div className="text-xs text-gray-500 mt-1">{f.description}</div>
            </button>
          ))}
        </div>
        <button onClick={handleExecute} disabled={!selectedFunction || arrayVar.values.length === 0} className="px-6 py-2 bg-teal-600 text-white rounded-lg disabled:bg-gray-400">▶ 执行</button>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">执行结果</h4>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">{result.function}({arrayVar.name}) = {result.function}([{arrayVar.values.join(', ')}])</div>
            {typeof result.result === 'object' && result.result.key !== undefined ? (
              <div>
                <div className="text-2xl font-bold text-teal-600">值：{result.result.value}</div>
                <div className="text-sm text-gray-600">索引：{result.result.key}</div>
                <div className="text-xs text-gray-500">{JSON.stringify(result.result)}</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-teal-600">{typeof result.result === 'number' ? (Number.isInteger(result.result) ? result.result : result.result.toFixed(4)) : JSON.stringify(result.result)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 字符串函数 - 函数测试
// ============================================================
function StringFunctionTest() {
  // 模拟变量
  const [variables, setVariables] = React.useState([
    { id: '$name', name: '姓名', type: 'string', value: '张三丰' },
    { id: '$greeting', name: '问候语', type: 'string', value: 'Hello World' },
    { id: '$code', name: '编码', type: 'string', value: 'ABC-123-XYZ' }
  ]);

  // 函数配置
  const [config, setConfig] = React.useState({
    functionId: '',
    params: {},
    outputVar: '$result'
  });

  // 执行结果
  const [executionResult, setExecutionResult] = React.useState(null);

  // 添加变量
  const handleAddVariable = () => {
    const newVar = {
      id: `$var${Date.now()}`,
      name: `变量${variables.length + 1}`,
      type: 'string',
      value: ''
    };
    setVariables([...variables, newVar]);
  };

  // 更新变量
  const handleUpdateVariable = (index, field, value) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariables(newVars);
  };

  // 删除变量
  const handleDeleteVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // 执行函数
  const handleExecute = () => {
    if (!config.functionId) {
      alert('请先选择函数');
      return;
    }

    const engine = window.primitiveEngine;
    if (!engine) {
      alert('引擎未加载');
      return;
    }

    // 构建变量上下文
    const varContext = {};
    variables.forEach(v => {
      varContext[v.id] = v.value;
    });

    // 获取函数名（去掉str_前缀）
    const funcDef = window.DND_PRIMITIVES.stringFunctions.find(f => f.id === config.functionId);
    if (!funcDef) {
      setExecutionResult({ success: false, error: '未知函数' });
      return;
    }

    const result = engine.executeStringFunction(funcDef.symbol, config.params, varContext);
    setExecutionResult(result);
  };

  const Editor = window.StringFunctionEditor;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 mb-2">📝 字符串函数测试</h3>
        <p className="text-sm text-amber-700">测试20个字符串处理函数</p>
      </div>

      {/* 变量定义 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">模拟变量</h4>
          <button
            onClick={handleAddVariable}
            className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
          >
            + 添加变量
          </button>
        </div>
        <div className="space-y-2">
          {variables.map((v, index) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={v.id}
                onChange={(e) => handleUpdateVariable(index, 'id', e.target.value)}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                placeholder="$变量ID"
              />
              <input
                type="text"
                value={v.name}
                onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="名称"
              />
              <span className="text-gray-500">=</span>
              <input
                type="text"
                value={v.value}
                onChange={(e) => handleUpdateVariable(index, 'value', e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="值"
              />
              <button
                onClick={() => handleDeleteVariable(index)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 函数配置编辑器 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">函数配置</h4>
        {Editor && (
          <Editor
            availableVariables={variables}
            config={config}
            onConfigChange={setConfig}
          />
        )}
      </div>

      {/* 执行按钮和结果 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">执行测试</h4>
        <button
          onClick={handleExecute}
          disabled={!config.functionId}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          ▶ 执行函数
        </button>

        {executionResult && (
          <div className={`mt-4 p-4 rounded-lg ${executionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {executionResult.success ? (
              <div>
                <div className="text-sm text-gray-600 mb-2">执行成功</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600">{config.outputVar || '$result'}</span>
                  <span>=</span>
                  <span className="text-2xl font-bold text-green-600">
                    {typeof executionResult.result === 'string' ? `"${executionResult.result}"` :
                     typeof executionResult.result === 'boolean' ? (executionResult.result ? 'true' : 'false') :
                     Array.isArray(executionResult.result) ? JSON.stringify(executionResult.result) :
                     String(executionResult.result)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  类型: {typeof executionResult.result === 'object' ? (Array.isArray(executionResult.result) ? 'array' : 'object') : typeof executionResult.result}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <div className="font-medium">执行失败</div>
                <div className="text-sm">{executionResult.error}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 函数参考 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">函数参考（20个）</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(window.DND_PRIMITIVES?.stringFunctions || []).map(f => (
            <div 
              key={f.id} 
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-amber-50 hover:border-amber-300"
              onClick={() => setConfig({ ...config, functionId: f.id, params: {} })}
            >
              <div className="font-mono text-sm font-medium text-amber-700">{f.symbol}()</div>
              <div className="text-xs text-gray-600 mt-1">{f.name}</div>
              <div className="text-xs text-gray-400 mt-1 truncate" title={f.example}>{f.example}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 时间函数 - 函数测试
// ============================================================
function TimeFunctionTest() {
  // 模拟变量
  const [variables, setVariables] = React.useState([
    { id: '$orderTime', name: '订单时间', type: 'datetime', value: '2025-12-20 14:30:00' },
    { id: '$birthday', name: '生日', type: 'date', value: '1990-05-15' },
    { id: '$timestamp', name: '时间戳', type: 'number', value: '1734567890123' }
  ]);

  // 函数配置
  const [config, setConfig] = React.useState({
    functionId: '',
    params: {},
    outputVar: '$result'
  });

  // 执行结果
  const [executionResult, setExecutionResult] = React.useState(null);

  // 添加变量
  const handleAddVariable = () => {
    const newVar = {
      id: `$var${Date.now()}`,
      name: `时间${variables.length + 1}`,
      type: 'datetime',
      value: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    setVariables([...variables, newVar]);
  };

  // 更新变量
  const handleUpdateVariable = (index, field, value) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariables(newVars);
  };

  // 删除变量
  const handleDeleteVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // 执行函数
  const handleExecute = () => {
    if (!config.functionId) {
      alert('请先选择函数');
      return;
    }

    const engine = window.primitiveEngine;
    if (!engine) {
      alert('引擎未加载');
      return;
    }

    // 构建变量上下文
    const varContext = {};
    variables.forEach(v => {
      varContext[v.id] = v.value;
    });

    // 获取函数名
    const funcDef = window.DND_PRIMITIVES.timeFunctions.find(f => f.id === config.functionId);
    if (!funcDef) {
      setExecutionResult({ success: false, error: '未知函数' });
      return;
    }

    const result = engine.executeTimeFunction(funcDef.symbol, config.params, varContext);
    setExecutionResult(result);
  };

  const Editor = window.TimeFunctionEditor;

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-medium text-orange-800 mb-2">⏰ 时间函数测试</h3>
        <p className="text-sm text-orange-700">测试15个时间处理函数</p>
      </div>

      {/* 变量定义 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">模拟变量</h4>
          <button
            onClick={handleAddVariable}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
          >
            + 添加变量
          </button>
        </div>
        <div className="space-y-2">
          {variables.map((v, index) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={v.id}
                onChange={(e) => handleUpdateVariable(index, 'id', e.target.value)}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                placeholder="$变量ID"
              />
              <input
                type="text"
                value={v.name}
                onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="名称"
              />
              <select
                value={v.type}
                onChange={(e) => handleUpdateVariable(index, 'type', e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="datetime">时间</option>
                <option value="date">日期</option>
                <option value="number">时间戳</option>
              </select>
              <span className="text-gray-500">=</span>
              <input
                type="text"
                value={v.value}
                onChange={(e) => handleUpdateVariable(index, 'value', e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="值"
              />
              <button
                onClick={() => handleDeleteVariable(index)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          提示：时间格式支持 yyyy-MM-dd、yyyy-MM-dd HH:mm:ss、时间戳等
        </div>
      </div>

      {/* 函数配置编辑器 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">函数配置</h4>
        {Editor && (
          <Editor
            availableVariables={variables}
            config={config}
            onConfigChange={setConfig}
          />
        )}
      </div>

      {/* 执行按钮和结果 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">执行测试</h4>
        <button
          onClick={handleExecute}
          disabled={!config.functionId}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          ▶ 执行函数
        </button>

        {executionResult && (
          <div className={`mt-4 p-4 rounded-lg ${executionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {executionResult.success ? (
              <div>
                <div className="text-sm text-gray-600 mb-2">执行成功</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600">{config.outputVar || '$result'}</span>
                  <span>=</span>
                  <span className="text-2xl font-bold text-green-600">
                    {executionResult.result?._isDate 
                      ? executionResult.result.display
                      : typeof executionResult.result === 'boolean' 
                        ? (executionResult.result ? 'true' : 'false')
                        : String(executionResult.result)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  类型: {executionResult.result?._isDate ? 'datetime' : typeof executionResult.result}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <div className="font-medium">执行失败</div>
                <div className="text-sm">{executionResult.error}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 函数参考 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">函数参考（15个）</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(window.DND_PRIMITIVES?.timeFunctions || []).map(f => (
            <div 
              key={f.id} 
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-orange-50 hover:border-orange-300"
              onClick={() => setConfig({ ...config, functionId: f.id, params: {} })}
            >
              <div className="font-mono text-sm font-medium text-orange-700">{f.symbol}()</div>
              <div className="text-xs text-gray-600 mt-1">{f.name}</div>
              <div className="text-xs text-gray-400 mt-1 truncate" title={f.example}>{f.example}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 格式参考 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-800 mb-4">格式模板参考</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700 mb-2">日期格式</div>
            <div className="space-y-1 text-gray-600">
              <div><code className="bg-gray-100 px-1">yyyy</code> → 年份 (2025)</div>
              <div><code className="bg-gray-100 px-1">MM</code> → 月份 (01-12)</div>
              <div><code className="bg-gray-100 px-1">dd</code> → 日期 (01-31)</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-2">时间格式</div>
            <div className="space-y-1 text-gray-600">
              <div><code className="bg-gray-100 px-1">HH</code> → 小时 (00-23)</div>
              <div><code className="bg-gray-100 px-1">mm</code> → 分钟 (00-59)</div>
              <div><code className="bg-gray-100 px-1">ss</code> → 秒数 (00-59)</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-2">其他格式</div>
            <div className="space-y-1 text-gray-600">
              <div><code className="bg-gray-100 px-1">E</code> → 星期 (周一)</div>
              <div><code className="bg-gray-100 px-1">Q</code> → 季度 (1-4)</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-2">常用组合</div>
            <div className="space-y-1 text-gray-600">
              <div><code className="bg-gray-100 px-1">yyyy-MM-dd</code></div>
              <div><code className="bg-gray-100 px-1">yyyy-MM-dd HH:mm:ss</code></div>
              <div><code className="bg-gray-100 px-1">yyyy年MM月dd日</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出
window.PrimitiveExprTest = PrimitiveExprTest;
