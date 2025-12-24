/**
 * 统计模块 - 配置向导组件
 * 提供统计配置的分步向导界面
 */

function StatisticsWizard({ projectId, forms, fields, statistics, editingStatistic, onComplete, onCancel }) {
  const [step, setStep] = React.useState(1);
  const [config, setConfig] = React.useState({
    source: { type: '基础表', formId: '', formName: '' },
    filters: [],
    direction: '纵向',
    timeFieldId: '',
    timeGranularity: '月度',
    purpose: '统计表',
    groupFields: [],
    statisticFields: [],
    aggregation: 'sum',
    valueTypes: ['绝对值'],
    compareTypes: [],
    sortBy: '',
    sortOrder: 'desc',
    topN: null,
    showSubtotal: false,
    crossTableField: '',
    output: { showTable: true, showChart: false, chartType: '折线图' },
    storageType: '虚表',
    name: ''
  });

  // 虚表预览状态
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // 如果是编辑模式，初始化配置
  React.useEffect(() => {
    if (editingStatistic) {
      setConfig({
        source: editingStatistic.source || config.source,
        filters: editingStatistic.filters || [],
        direction: editingStatistic.config?.direction || '纵向',
        timeFieldId: editingStatistic.config?.timeFieldId || '',
        timeGranularity: editingStatistic.config?.timeGranularity || '月度',
        purpose: editingStatistic.config?.purpose || '统计表',
        groupFields: editingStatistic.config?.groupFields || [],
        statisticFields: editingStatistic.config?.statisticFields || [],
        aggregation: editingStatistic.config?.aggregation || 'sum',
        valueTypes: editingStatistic.config?.valueTypes || ['绝对值'],
        compareTypes: editingStatistic.config?.compareTypes || [],
        sortBy: editingStatistic.config?.sortBy || '',
        sortOrder: editingStatistic.config?.sortOrder || 'desc',
        topN: editingStatistic.config?.topN || null,
        showSubtotal: editingStatistic.config?.showSubtotal || false,
        crossTableField: editingStatistic.config?.crossTableField || '',
        output: editingStatistic.output || { showTable: true, showChart: false, chartType: '折线图' },
        storageType: editingStatistic.storageType || '实表',
        name: editingStatistic.name || ''
      });
    }
  }, [editingStatistic]);

  // 获取可用的数据源列表
  const getAvailableSources = () => {
    const sources = [];
    forms.filter(f => f.subType === '独立基础表' || f.subType === '关联基础表').forEach(f => sources.push({ type: '基础表', id: f.id, name: f.name }));
    forms.filter(f => f.subType === '衍生表').forEach(f => sources.push({ type: '衍生表', id: f.id, name: f.name }));
    forms.filter(f => f.subType === '合表').forEach(f => sources.push({ type: '合表', id: f.id, name: f.name }));
    statistics.filter(s => s.storageType === '实表' || s.storageType === '临时表').forEach(s => sources.push({ type: '统计表', id: s.id, name: s.name }));
    return sources;
  };

  // 获取选中数据源的字段列表
  const getSourceFields = () => {
    if (!config.source.formId) return [];
    
    if (config.source.type === '统计表') {
      const stat = statistics.find(s => s.id === config.source.formId);
      if (!stat || !stat.data || stat.data.length === 0) return [];
      return Object.keys(stat.data[0]).filter(key => key !== 'id' && key !== 'createdAt').map(key => ({
        id: key, name: key, type: typeof stat.data[0][key] === 'number' ? '数值' : '文本'
      }));
    }
    
    const form = forms.find(f => f.id === config.source.formId);
    if (!form || !form.structure || !form.structure.fields) return [];
    
    return form.structure.fields.map(sf => {
      const fieldInfo = fields.find(f => f.id === sf.fieldId);
      return {
        id: sf.fieldId,
        name: fieldInfo?.name || sf.fieldId,
        type: fieldInfo?.type || '未知',
        nature: fieldInfo?.nature || '基础字段'
      };
    });
  };

  const getNumericFields = () => getSourceFields().filter(f => f.type === '整数' || f.type === '浮点数' || f.type === '小数' || f.type === '数值');
  const getTimeFields = () => getSourceFields().filter(f => f.type === '日期' || f.type === '时间' || f.type === '日期时间');
  const getGroupableFields = () => getSourceFields().filter(f => f.nature === '属性字段' || f.type === '文本' || f.type === '整数');

  const timeGranularityOptions = [
    { value: '年度', label: '年度' }, { value: '季度', label: '季度' }, { value: '月度', label: '月度' },
    { value: '旬度', label: '旬度' }, { value: '周度', label: '周度' }, { value: '日度', label: '日度' },
    { value: '时', label: '小时' }, { value: '分', label: '分钟' }, { value: '秒', label: '秒' }
  ];

  const getAvailableCompareTypes = () => {
    const granularity = config.timeGranularity;
    const options = [];
    
    if (granularity === '季度') options.push({ value: '年同比', label: '年同比' });
    else if (granularity === '月度') { options.push({ value: '季同比', label: '季同比' }); options.push({ value: '年同比', label: '年同比' }); }
    else if (granularity === '旬度') { options.push({ value: '月同比', label: '月同比' }); options.push({ value: '季同比', label: '季同比' }); options.push({ value: '年同比', label: '年同比' }); }
    else if (granularity === '周度') { options.push({ value: '月同比', label: '月同比' }); options.push({ value: '年同比', label: '年同比' }); }
    else if (granularity === '日度') { options.push({ value: '周同比', label: '周同比' }); options.push({ value: '旬同比', label: '旬同比' }); options.push({ value: '月同比', label: '月同比' }); options.push({ value: '季同比', label: '季同比' }); options.push({ value: '年同比', label: '年同比' }); }
    else if (granularity === '时') { options.push({ value: '日同比', label: '日同比' }); options.push({ value: '周同比', label: '周同比' }); options.push({ value: '月同比', label: '月同比' }); options.push({ value: '年同比', label: '年同比' }); }
    else if (granularity === '分') { options.push({ value: '时同比', label: '时同比' }); options.push({ value: '日同比', label: '日同比' }); options.push({ value: '月同比', label: '月同比' }); options.push({ value: '年同比', label: '年同比' }); }
    else if (granularity === '秒') { options.push({ value: '分同比', label: '分同比' }); options.push({ value: '时同比', label: '时同比' }); options.push({ value: '日同比', label: '日同比' }); options.push({ value: '月同比', label: '月同比' }); options.push({ value: '年同比', label: '年同比' }); }
    
    return options;
  };

  const updateConfig = (updates) => setConfig(prev => ({ ...prev, ...updates }));

  const handleNext = () => {
    if (step === 1 && !config.source.formId) { alert('请选择数据来源'); return; }
    if (step === 3) {
      if (config.direction === '纵向') {
        if (!config.timeFieldId) { alert('请选择时间字段'); return; }
        if (config.statisticFields.length === 0) { alert('请选择至少一个统计字段'); return; }
      } else {
        if (config.groupFields.length === 0) { alert('请选择至少一个划分字段'); return; }
        if (config.statisticFields.length === 0) { alert('请选择至少一个统计字段'); return; }
      }
    }
    if (step === 4 && config.storageType !== '虚表' && !config.name.trim()) { alert('请输入统计表名称'); return; }
    
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handlePrev = () => { if (step > 1) setStep(step - 1); };

  // 构建统计数据对象
  const buildStatisticData = () => {
    return {
      name: config.name || `统计_${Date.now()}`,
      storageType: config.storageType,
      source: config.source,
      filters: config.filters,
      config: {
        direction: config.direction,
        timeFieldId: config.timeFieldId,
        timeGranularity: config.timeGranularity,
        valueTypes: config.valueTypes,
        compareTypes: config.compareTypes,
        purpose: config.purpose,
        groupFields: config.groupFields,
        sortBy: config.sortBy,
        sortOrder: config.sortOrder,
        topN: config.topN,
        showSubtotal: config.showSubtotal,
        crossTableField: config.crossTableField,
        statisticFields: config.statisticFields,
        aggregation: config.aggregation
      },
      output: config.output,
      lastUpdated: new Date().toISOString(),
      data: [],
      dataRange: null
    };
  };

  // 执行统计计算
  const executeStatistics = async () => {
    let sourceData = [];
    if (config.source.type === '统计表') {
      const sourceStat = statistics.find(s => s.id === config.source.formId);
      sourceData = sourceStat?.data || [];
    } else {
      sourceData = await window.dndDB.getFormDataList(projectId, config.source.formId);
    }
    
    const statisticData = buildStatisticData();
    
    if (sourceData.length > 0) {
      const result = window.StatisticsEngine.execute(sourceData, statisticData);
      statisticData.data = result.data;
      statisticData.dataRange = result.dataRange;
    }
    
    return statisticData;
  };

  // 虚表预览
  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const statisticData = await executeStatistics();
      setPreviewData(statisticData);
      setShowPreview(true);
    } catch (error) {
      console.error('预览失败:', error);
      alert('预览失败: ' + error.message);
    }
    setPreviewLoading(false);
  };

  // 从预览保存为实表/临时表
  const handleSaveFromPreview = async (saveType) => {
    if (!previewData) return;
    
    try {
      const dataToSave = {
        ...previewData,
        storageType: saveType,
        name: config.name || `统计_${Date.now()}`
      };
      
      // 如果没有名称，提示输入
      if (!dataToSave.name || dataToSave.name.startsWith('统计_')) {
        const inputName = prompt('请输入统计表名称:', dataToSave.name);
        if (!inputName) return;
        dataToSave.name = inputName;
      }
      
      await window.dndDB.addStatistic(projectId, dataToSave);
      alert(`已保存为${saveType}：${dataToSave.name}`);
      setShowPreview(false);
      onComplete();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      // 虚表：显示预览
      if (config.storageType === '虚表') {
        await handlePreview();
        return;
      }

      // 实表/临时表：直接保存
      const statisticData = await executeStatistics();
      
      if (editingStatistic) {
        await window.dndDB.updateStatistic(projectId, editingStatistic.id, statisticData);
      } else {
        await window.dndDB.addStatistic(projectId, statisticData);
      }
      
      onComplete();
    } catch (error) {
      console.error('保存统计配置失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[{ num: 1, label: '选择数据源' }, { num: 2, label: '检索筛选' }, { num: 3, label: '统计配置' }, { num: 4, label: '输出设置' }].map((s, index) => (
        <React.Fragment key={s.num}>
          {index > 0 && <div className="w-12 h-0.5 bg-gray-300"></div>}
          <div className={`flex items-center ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>{s.num}</div>
            <span className="ml-2 text-sm font-medium">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{editingStatistic ? '编辑统计配置' : '新建统计分析'}</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      {renderStepIndicator()}

      {/* 步骤1：选择数据源 */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">数据类型</label>
            <div className="flex space-x-4">
              {['基础表', '衍生表', '合表', '统计表'].map(type => (
                <label key={type} className="flex items-center cursor-pointer">
                  <input type="radio" name="sourceType" checked={config.source.type === type} onChange={() => updateConfig({ source: { type, formId: '', formName: '' }, filters: [] })} className="mr-2" />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择{config.source.type}</label>
            <select
              value={config.source.formId}
              onChange={(e) => {
                const selected = getAvailableSources().find(s => s.id === e.target.value);
                updateConfig({ source: { ...config.source, formId: e.target.value, formName: selected?.name || '' }, filters: [] });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">请选择...</option>
              {getAvailableSources().filter(s => s.type === config.source.type).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          {config.source.formId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700"><strong>已选择：</strong>{config.source.formName}</div>
              <div className="text-sm text-blue-600 mt-2">共 {getSourceFields().length} 个字段，其中 {getNumericFields().length} 个数值字段，{getTimeFields().length} 个时间字段</div>
            </div>
          )}
        </div>
      )}

      {/* 步骤2：检索筛选 */}
      {step === 2 && (
        <SearchFilterPanel
          projectId={projectId}
          sourceFormId={config.source.formId}
          sourceType={config.source.type}
          fields={fields}
          forms={forms}
          statistics={statistics}
          filters={config.filters}
          onFiltersChange={(filters) => updateConfig({ filters })}
        />
      )}

      {/* 步骤3：统计配置 */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">统计方向</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-50" style={{ borderColor: config.direction === '纵向' ? '#3B82F6' : '#E5E7EB' }}>
                <input type="radio" name="direction" checked={config.direction === '纵向'} onChange={() => updateConfig({ direction: '纵向' })} className="mr-3" />
                <div><div className="font-medium">纵向统计（时间维度）</div><div className="text-sm text-gray-500">按时间粒度统计，支持同比、环比</div></div>
              </label>
              <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-50" style={{ borderColor: config.direction === '横向' ? '#3B82F6' : '#E5E7EB' }}>
                <input type="radio" name="direction" checked={config.direction === '横向'} onChange={() => updateConfig({ direction: '横向' })} className="mr-3" />
                <div><div className="font-medium">横向统计（分组维度）</div><div className="text-sm text-gray-500">按字段分组统计，支持占比分析</div></div>
              </label>
            </div>
          </div>

          {/* 纵向统计配置 */}
          {config.direction === '纵向' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">时间字段 <span className="text-red-500">*</span></label>
                  <select value={config.timeFieldId} onChange={(e) => updateConfig({ timeFieldId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">请选择...</option>
                    {getTimeFields().map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">时间粒度 <span className="text-red-500">*</span></label>
                  <select value={config.timeGranularity} onChange={(e) => updateConfig({ timeGranularity: e.target.value, compareTypes: [] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {timeGranularityOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">统计字段 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {getNumericFields().map(f => (
                    <label key={f.id} className="flex items-center px-3 py-1.5 bg-white rounded border cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={config.statisticFields.some(sf => sf.fieldId === f.id)} onChange={(e) => {
                        if (e.target.checked) updateConfig({ statisticFields: [...config.statisticFields, { fieldId: f.id, fieldName: f.name }] });
                        else updateConfig({ statisticFields: config.statisticFields.filter(sf => sf.fieldId !== f.id) });
                      }} className="mr-2" />
                      <span className="text-sm">{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">聚合方式</label>
                  <select value={config.aggregation} onChange={(e) => updateConfig({ aggregation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="sum">SUM 求和</option>
                    <option value="avg">AVG 平均值</option>
                    <option value="count">COUNT 计数</option>
                    <option value="max">MAX 最大值</option>
                    <option value="min">MIN 最小值</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">统计方式</label>
                  <div className="flex flex-wrap gap-2">
                    {['绝对值', '环比', '累计'].map(type => (
                      <label key={type} className="flex items-center px-3 py-1.5 bg-white rounded border cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={config.valueTypes.includes(type)} onChange={(e) => {
                          if (e.target.checked) updateConfig({ valueTypes: [...config.valueTypes, type] });
                          else updateConfig({ valueTypes: config.valueTypes.filter(t => t !== type) });
                        }} className="mr-2" />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {getAvailableCompareTypes().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">同比类型</label>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableCompareTypes().map(opt => (
                      <label key={opt.value} className="flex items-center px-3 py-1.5 bg-white rounded border cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={config.compareTypes.includes(opt.value)} onChange={(e) => {
                          if (e.target.checked) updateConfig({ compareTypes: [...config.compareTypes, opt.value] });
                          else updateConfig({ compareTypes: config.compareTypes.filter(t => t !== opt.value) });
                        }} className="mr-2" />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 横向统计配置 */}
          {config.direction === '横向' && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">统计目的</label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer"><input type="radio" name="purpose" checked={config.purpose === '统计表'} onChange={() => updateConfig({ purpose: '统计表' })} className="mr-2" /><span className="text-sm">生成统计表</span></label>
                  <label className="flex items-center cursor-pointer"><input type="radio" name="purpose" checked={config.purpose === '占比分析'} onChange={() => updateConfig({ purpose: '占比分析' })} className="mr-2" /><span className="text-sm">占比分析</span></label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">划分字段 <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500 mb-2">选择多个字段可实现多级分组，第一个字段为主分组</p>
                <div className="flex flex-wrap gap-2">
                  {getGroupableFields().map(f => {
                    const index = config.groupFields.findIndex(gf => gf.fieldId === f.id);
                    return (
                      <label key={f.id} className={`flex items-center px-3 py-1.5 rounded border cursor-pointer ${index >= 0 ? 'bg-purple-100 border-purple-400' : 'bg-white hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={index >= 0} onChange={(e) => {
                          if (e.target.checked) updateConfig({ groupFields: [...config.groupFields, { fieldId: f.id, fieldName: f.name }] });
                          else updateConfig({ groupFields: config.groupFields.filter(gf => gf.fieldId !== f.id), crossTableField: config.crossTableField === f.id ? '' : config.crossTableField });
                        }} className="mr-2" />
                        <span className="text-sm">{f.name}</span>
                        {index >= 0 && <span className="ml-1 text-xs text-purple-600">({index + 1})</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {config.groupFields.length >= 2 && (
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">交叉表设置（可选）</label>
                  <p className="text-xs text-gray-500 mb-2">选择一个划分字段作为列，生成透视表样式的交叉分析</p>
                  <select value={config.crossTableField || ''} onChange={(e) => updateConfig({ crossTableField: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">不使用交叉表</option>
                    {config.groupFields.map(gf => (<option key={gf.fieldId} value={gf.fieldId}>将"{gf.fieldName}"作为列</option>))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">统计字段 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {getNumericFields().map(f => (
                    <label key={f.id} className="flex items-center px-3 py-1.5 bg-white rounded border cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={config.statisticFields.some(sf => sf.fieldId === f.id)} onChange={(e) => {
                        if (e.target.checked) updateConfig({ statisticFields: [...config.statisticFields, { fieldId: f.id, fieldName: f.name }] });
                        else updateConfig({ statisticFields: config.statisticFields.filter(sf => sf.fieldId !== f.id) });
                      }} className="mr-2" />
                      <span className="text-sm">{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">聚合方式</label>
                  <select value={config.aggregation} onChange={(e) => updateConfig({ aggregation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="sum">SUM 求和</option>
                    <option value="avg">AVG 平均值</option>
                    <option value="count">COUNT 计数</option>
                    <option value="max">MAX 最大值</option>
                    <option value="min">MIN 最小值</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top N 筛选</label>
                  <select value={config.topN || ''} onChange={(e) => updateConfig({ topN: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">显示全部</option>
                    <option value="5">Top 5</option>
                    <option value="10">Top 10</option>
                    <option value="20">Top 20</option>
                    <option value="50">Top 50</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序字段</label>
                  <select value={config.sortBy || ''} onChange={(e) => updateConfig({ sortBy: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">默认（按首字段降序）</option>
                    {config.statisticFields.map(sf => (<option key={sf.fieldId} value={sf.fieldId}>{sf.fieldName}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序方向</label>
                  <select value={config.sortOrder || 'desc'} onChange={(e) => updateConfig({ sortOrder: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="desc">降序（从大到小）</option>
                    <option value="asc">升序（从小到大）</option>
                  </select>
                </div>
              </div>

              {config.groupFields.length >= 2 && !config.crossTableField && (
                <div className="flex items-center">
                  <input type="checkbox" id="showSubtotal" checked={config.showSubtotal || false} onChange={(e) => updateConfig({ showSubtotal: e.target.checked })} className="mr-2" />
                  <label htmlFor="showSubtotal" className="text-sm text-gray-700 cursor-pointer">显示小计行（按第一个划分字段分组统计）</label>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 步骤4：输出设置 */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">表现形式</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer"><input type="checkbox" checked={config.output.showTable} onChange={(e) => updateConfig({ output: { ...config.output, showTable: e.target.checked } })} className="mr-2" /><span className="text-sm">统计表</span></label>
              <label className="flex items-center cursor-pointer"><input type="checkbox" checked={config.output.showChart} onChange={(e) => updateConfig({ output: { ...config.output, showChart: e.target.checked } })} className="mr-2" /><span className="text-sm">统计图</span></label>
            </div>
          </div>

          {config.output.showChart && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">图表类型</label>
              <select value={config.output.chartType} onChange={(e) => updateConfig({ output: { ...config.output, chartType: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="折线图">折线图</option>
                <option value="柱状图">柱状图</option>
                <option value="饼图">饼图</option>
                <option value="点线图">点线图</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">存储方式</label>
            <div className="flex space-x-4">
              {[{ type: '虚表', desc: '仅查看，不保存' }, { type: '临时表', desc: '登录期间保存' }, { type: '实表', desc: '永久保存到数据库' }].map(({ type, desc }) => (
                <label key={type} className="flex items-center cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50" style={{ borderColor: config.storageType === type ? '#3B82F6' : '#E5E7EB' }}>
                  <input type="radio" name="storageType" checked={config.storageType === type} onChange={() => updateConfig({ storageType: type })} className="mr-2" />
                  <div><div className="text-sm font-medium">{type}</div><div className="text-xs text-gray-500">{desc}</div></div>
                </label>
              ))}
            </div>
          </div>

          {config.storageType !== '虚表' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">统计表名称 <span className="text-red-500">*</span></label>
              <input type="text" value={config.name} onChange={(e) => updateConfig({ name: e.target.value })} placeholder="请输入统计表名称..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">配置预览</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>数据来源：{config.source.formName || '-'}</div>
              <div>检索条件：{config.filters.length > 0 ? `${config.filters.length} 个条件` : '无'}</div>
              <div>统计方向：{config.direction}</div>
              {config.direction === '纵向' && (<><div>时间粒度：{config.timeGranularity}</div><div>统计字段：{config.statisticFields.map(f => f.fieldName).join(', ') || '-'}</div><div>统计方式：{[...config.valueTypes, ...config.compareTypes].join(', ') || '-'}</div></>)}
              {config.direction === '横向' && (<><div>统计目的：{config.purpose}</div><div>划分字段：{config.groupFields.map(f => f.fieldName).join(', ') || '-'}</div><div>统计字段：{config.statisticFields.map(f => f.fieldName).join(', ') || '-'}</div></>)}
              <div>聚合方式：{config.aggregation.toUpperCase()}</div>
              <div>存储方式：{config.storageType}</div>
            </div>
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <div>{step > 1 && <button onClick={handlePrev} className="px-4 py-2 text-gray-700 hover:text-gray-900">← 上一步</button>}</div>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
          {step === 2 && <button onClick={() => setStep(3)} className="px-4 py-2 text-blue-600 hover:text-blue-700">跳过</button>}
          <button 
            onClick={handleNext} 
            disabled={previewLoading}
            className={`px-4 py-2 rounded-lg ${previewLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {previewLoading ? '计算中...' : (step === 4 ? (config.storageType === '虚表' ? '预览' : '生成统计') : '下一步 →')}
          </button>
        </div>
      </div>

      {/* 虚表预览模态框 - 使用增强版预览组件 */}
      {showPreview && previewData && (
        <StatisticsPreview
          previewData={previewData}
          config={config}
          statistics={statistics}
          onClose={() => setShowPreview(false)}
          onSave={handleSaveFromPreview}
        />
      )}
    </div>
  );
}

// 导出到全局
window.StatisticsWizard = StatisticsWizard;
