// 表单数据查看组件
function FormDataViewer({ projectId, form, fields, onClose }) {
  const [dataList, setDataList] = React.useState([]);
  const [editingData, setEditingData] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);

  // 加载数据
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const list = await window.dndDB.getFormDataList(projectId, form.id);
      setDataList(list);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  // 获取字段详情
  const getFieldDetail = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  // 删除数据
  const handleDelete = async (data) => {
    if (!confirm(`确定要删除这条数据吗？`)) {
      return;
    }

    try {
      await window.dndDB.deleteFormData(projectId, form.id, data.id);
      alert('删除成功！');
      loadData();
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  };

  // 编辑数据
  const handleEdit = (data) => {
    setEditingData(data);
    setShowEditModal(true);
  };

  // 关闭编辑弹窗
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingData(null);
    loadData();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 my-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                查看表单：{form.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                共 {dataList.length} 条数据
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {form.structure && form.type === '对象表单' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    {/* 主键字段 */}
                    <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                      {(() => {
                        const field = getFieldDetail(form.structure.primaryKey);
                        return field ? field.name : '主键';
                      })()}
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        主键
                      </span>
                    </th>
                    
                    {/* 其他字段 */}
                    {form.structure.fields.map((f, idx) => {
                      const field = getFieldDetail(f.fieldId);
                      return field ? (
                        <th key={idx} className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                          {field.name}
                          {field.nature === '衍生字段' && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                              衍生
                            </span>
                          )}
                        </th>
                      ) : null;
                    })}
                    
                    {/* 操作列 */}
                    <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataList.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={form.structure.fields.length + 2} 
                        className="px-4 py-8 text-center text-gray-500 border border-gray-300"
                      >
                        暂无数据，请点击"添加数据"录入
                      </td>
                    </tr>
                  ) : (
                    dataList.map((data, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {/* 主键值 */}
                        <td className="px-4 py-2 border border-gray-300 text-sm">
                          {data[form.structure.primaryKey]}
                        </td>
                        
                        {/* 其他字段值 */}
                        {form.structure.fields.map((f, idx) => (
                          <td key={idx} className="px-4 py-2 border border-gray-300 text-sm">
                            {data[f.fieldId] !== undefined ? data[f.fieldId] : '-'}
                          </td>
                        ))}
                        
                        {/* 操作按钮 */}
                        <td className="px-4 py-2 border border-gray-300 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(data)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(data)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">表单结构未构建或不支持查看</p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 编辑数据弹窗 */}
      {showEditModal && editingData && (
        <FormDataEditor projectId={projectId} form={form}
          fields={fields}
          data={editingData}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
}

window.FormDataViewer = FormDataViewer;