// Icon Manager Component
function IconManager({ 
  isOpen, 
  onClose, 
  projectIcons = [],
  onUpdateProjectIcons,
  pages = [],
  blocks = []
}) {
  const [view, setView] = React.useState('list');
  const [editingIcon, setEditingIcon] = React.useState(null);

  React.useEffect(function() {
    if (!isOpen) {
      setView('list');
      setEditingIcon(null);
    }
  }, [isOpen]);

  var handleAddIcon = function() {
    setEditingIcon({
      id: 'icon-' + Date.now(),
      name: '',
      size: { width: 32, height: 32 },
      image: null,
      action: { type: 'navigatePage', targetPageId: null, targetPopupId: null },
      description: ''
    });
    setView('edit');
  };

  var handleEditIcon = function(icon) {
    setEditingIcon(Object.assign({}, icon));
    setView('edit');
  };

  var handleDeleteIcon = function(iconId) {
    if (confirm('Delete this Icon?')) {
      var updated = projectIcons.filter(function(i) { return i.id !== iconId; });
      onUpdateProjectIcons(updated);
    }
  };

  var handleSaveIcon = function(iconData) {
    var existing = projectIcons.find(function(i) { return i.id === iconData.id; });
    var updated;
    if (existing) {
      updated = projectIcons.map(function(i) { return i.id === iconData.id ? iconData : i; });
    } else {
      updated = projectIcons.concat([iconData]);
    }
    onUpdateProjectIcons(updated);
    setView('list');
    setEditingIcon(null);
  };

  var handleDragStart = function(e, icon) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      iconId: icon.id,
      iconData: icon
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  var popupTemplates = blocks.filter(function(b) { return b.isPopup === true && b.isTemplate === true; });

  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col'
    },
      React.createElement('div', {
        className: 'px-4 py-3 border-b border-gray-200 flex items-center justify-between'
      },
        React.createElement('h3', { className: 'font-semibold text-gray-800' },
          view === 'list' ? 'Icon Manager' : (editingIcon && editingIcon.id && projectIcons.find(function(i) { return i.id === editingIcon.id; }) ? 'Edit Icon' : 'Add Icon')
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-400 hover:text-gray-600 text-xl'
        }, 'X')
      ),
      React.createElement('div', { className: 'flex-1 overflow-auto p-4' },
        view === 'list' ?
          React.createElement(IconListView, {
            icons: projectIcons,
            onAdd: handleAddIcon,
            onEdit: handleEditIcon,
            onDelete: handleDeleteIcon,
            onDragStart: handleDragStart
          }) :
          React.createElement(IconEditView, {
            icon: editingIcon,
            onSave: handleSaveIcon,
            onCancel: function() { setView('list'); setEditingIcon(null); },
            pages: pages,
            popupTemplates: popupTemplates
          })
      )
    )
  );
}

function IconListView(props) {
  var icons = props.icons;
  var onAdd = props.onAdd;
  var onEdit = props.onEdit;
  var onDelete = props.onDelete;
  var onDragStart = props.onDragStart;

  return React.createElement('div', null,
    React.createElement('div', { className: 'mb-4' },
      React.createElement('button', {
        onClick: onAdd,
        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2'
      },
        React.createElement('span', null, '+'),
        React.createElement('span', null, 'Add New Icon')
      )
    ),
    icons.length === 0 ?
      React.createElement('div', { className: 'text-center py-8 text-gray-500' },
        React.createElement('div', { className: 'text-4xl mb-2' }, '🔘'),
        React.createElement('p', null, 'No Icons yet. Click above to add.')
      ) :
      React.createElement('table', { className: 'w-full border-collapse' },
        React.createElement('thead', null,
          React.createElement('tr', { className: 'bg-gray-50' },
            React.createElement('th', { className: 'px-3 py-2 text-left text-sm font-medium text-gray-600 border-b' }, 'Icon'),
            React.createElement('th', { className: 'px-3 py-2 text-left text-sm font-medium text-gray-600 border-b' }, 'Name'),
            React.createElement('th', { className: 'px-3 py-2 text-left text-sm font-medium text-gray-600 border-b' }, 'Description'),
            React.createElement('th', { className: 'px-3 py-2 text-center text-sm font-medium text-gray-600 border-b' }, 'Actions')
          )
        ),
        React.createElement('tbody', null,
          icons.map(function(icon) {
            return React.createElement('tr', { key: icon.id, className: 'hover:bg-gray-50' },
              React.createElement('td', { className: 'px-3 py-2 border-b' },
                React.createElement('div', {
                  draggable: true,
                  onDragStart: function(e) { onDragStart(e, icon); },
                  className: 'w-10 h-10 border border-gray-200 rounded cursor-move flex items-center justify-center bg-white hover:border-blue-400 hover:shadow',
                  title: 'Drag to canvas'
                },
                  icon.image ?
                    React.createElement('img', { src: icon.image.url, alt: icon.name, className: 'max-w-full max-h-full object-contain' }) :
                    React.createElement('span', { className: 'text-gray-400 text-xs' }, 'No img')
                )
              ),
              React.createElement('td', { className: 'px-3 py-2 border-b text-sm text-gray-700' }, icon.name || 'Unnamed'),
              React.createElement('td', { className: 'px-3 py-2 border-b text-sm text-gray-500' }, icon.description || '-'),
              React.createElement('td', { className: 'px-3 py-2 border-b text-center' },
                React.createElement('button', {
                  onClick: function() { onEdit(icon); },
                  className: 'px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded mr-1'
                }, 'Edit'),
                React.createElement('button', {
                  onClick: function() { onDelete(icon.id); },
                  className: 'px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded'
                }, 'Delete')
              )
            );
          })
        )
      ),
    icons.length > 0 ?
      React.createElement('div', { className: 'mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700' },
        'Tip: Hold and drag icon to canvas'
      ) : null
  );
}

function IconEditView(props) {
  var icon = props.icon;
  var onSave = props.onSave;
  var onCancel = props.onCancel;
  var pages = props.pages;
  var popupTemplates = props.popupTemplates;

  var _formData = React.useState(icon);
  var formData = _formData[0];
  var setFormData = _formData[1];

  var _imagePreview = React.useState(icon.image ? icon.image.url : null);
  var imagePreview = _imagePreview[0];
  var setImagePreview = _imagePreview[1];

  var fileInputRef = React.useRef(null);

  var handleImageUpload = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      var url = event.target.result;
      setImagePreview(url);
      setFormData(function(prev) {
        return Object.assign({}, prev, { image: { url: url, type: 'base64', name: file.name } });
      });
    };
    reader.readAsDataURL(file);
  };

  var updateField = function(field, value) {
    setFormData(function(prev) {
      var update = {};
      update[field] = value;
      return Object.assign({}, prev, update);
    });
  };

  var updateAction = function(field, value) {
    setFormData(function(prev) {
      var newAction = Object.assign({}, prev.action);
      newAction[field] = value;
      return Object.assign({}, prev, { action: newAction });
    });
  };

  var updateSize = function(field, value) {
    var num = parseInt(value) || 32;
    num = Math.max(16, Math.min(128, num));
    setFormData(function(prev) {
      var newSize = Object.assign({}, prev.size);
      newSize[field] = num;
      return Object.assign({}, prev, { size: newSize });
    });
  };

  var handleSubmit = function() {
    if (!formData.name) { alert('Please enter Icon name'); return; }
    if (!formData.image) { alert('Please upload Icon image'); return; }
    onSave(formData);
  };

  return React.createElement('div', { className: 'space-y-4' },
    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Icon Name *'),
      React.createElement('input', {
        type: 'text',
        value: formData.name,
        onChange: function(e) { updateField('name', e.target.value); },
        className: 'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500',
        placeholder: 'e.g., Back to Home'
      })
    ),
    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Default Size'),
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('input', {
          type: 'number',
          value: formData.size.width,
          onChange: function(e) { updateSize('width', e.target.value); },
          className: 'w-20 px-2 py-1 border border-gray-300 rounded text-center',
          min: 16,
          max: 128
        }),
        React.createElement('span', { className: 'text-gray-500' }, 'x'),
        React.createElement('input', {
          type: 'number',
          value: formData.size.height,
          onChange: function(e) { updateSize('height', e.target.value); },
          className: 'w-20 px-2 py-1 border border-gray-300 rounded text-center',
          min: 16,
          max: 128
        }),
        React.createElement('span', { className: 'text-sm text-gray-500' }, 'px')
      )
    ),
    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Icon Image *'),
      React.createElement('div', { className: 'flex items-start space-x-4' },
        React.createElement('div', {
          className: 'w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-400',
          onClick: function() { fileInputRef.current && fileInputRef.current.click(); }
        },
          imagePreview ?
            React.createElement('img', { src: imagePreview, alt: 'Preview', className: 'max-w-full max-h-full object-contain' }) :
            React.createElement('span', { className: 'text-gray-400 text-sm text-center' }, 'Click to upload')
        ),
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: 'image/*',
          onChange: handleImageUpload,
          className: 'hidden'
        }),
        React.createElement('div', { className: 'text-sm text-gray-500' },
          React.createElement('p', null, 'Supports JPG, PNG, GIF, SVG'),
          React.createElement('p', null, 'Transparent background recommended')
        )
      )
    ),
    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Click Action'),
      React.createElement('div', { className: 'space-y-3 p-3 bg-gray-50 rounded' },
        React.createElement('label', { className: 'flex items-start space-x-2 cursor-pointer' },
          React.createElement('input', {
            type: 'radio',
            name: 'actionType',
            checked: formData.action.type === 'navigatePage',
            onChange: function() { updateAction('type', 'navigatePage'); },
            className: 'mt-1'
          }),
          React.createElement('div', { className: 'flex-1' },
            React.createElement('span', { className: 'text-sm text-gray-700' }, 'Navigate to Page'),
            formData.action.type === 'navigatePage' ?
              React.createElement('select', {
                value: formData.action.targetPageId || '',
                onChange: function(e) { updateAction('targetPageId', e.target.value); },
                className: 'mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm'
              },
                React.createElement('option', { value: '' }, 'Select Page'),
                pages.map(function(p) {
                  return React.createElement('option', { key: p.id, value: p.id }, p.name);
                })
              ) : null
          )
        ),
        React.createElement('label', { className: 'flex items-center space-x-2 cursor-pointer' },
          React.createElement('input', {
            type: 'radio',
            name: 'actionType',
            checked: formData.action.type === 'goBack',
            onChange: function() { updateAction('type', 'goBack'); }
          }),
          React.createElement('span', { className: 'text-sm text-gray-700' }, 'Go Back')
        ),
        React.createElement('label', { className: 'flex items-start space-x-2 cursor-pointer' },
          React.createElement('input', {
            type: 'radio',
            name: 'actionType',
            checked: formData.action.type === 'openPopup',
            onChange: function() { updateAction('type', 'openPopup'); },
            className: 'mt-1'
          }),
          React.createElement('div', { className: 'flex-1' },
            React.createElement('span', { className: 'text-sm text-gray-700' }, 'Open Popup'),
            formData.action.type === 'openPopup' ?
              React.createElement('select', {
                value: formData.action.targetPopupId || '',
                onChange: function(e) { updateAction('targetPopupId', e.target.value); },
                className: 'mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm'
              },
                React.createElement('option', { value: '' }, 'Select Popup'),
                popupTemplates.length === 0 ?
                  React.createElement('option', { disabled: true }, 'No popup templates') :
                  popupTemplates.map(function(b) {
                    return React.createElement('option', { key: b.id, value: b.id }, b.id);
                  })
              ) : null
          )
        )
      )
    ),
    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Description'),
      React.createElement('input', {
        type: 'text',
        value: formData.description,
        onChange: function(e) { updateField('description', e.target.value.slice(0, 50)); },
        className: 'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500',
        placeholder: 'Brief description of Icon function',
        maxLength: 50
      }),
      React.createElement('div', { className: 'text-right text-xs text-gray-400' },
        (formData.description ? formData.description.length : 0) + '/50'
      )
    ),
    React.createElement('div', { className: 'flex justify-end space-x-3 pt-4 border-t border-gray-200' },
      React.createElement('button', {
        onClick: onCancel,
        className: 'px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50'
      }, 'Cancel'),
      React.createElement('button', {
        onClick: handleSubmit,
        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
      }, 'Save')
    )
  );
}

window.IconManager = IconManager;
console.log('[DND2] IconManager loaded');
