// Icon Manager Component - Floating Panel Version
function IconManager(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var projectIcons = props.projectIcons || [];
  var onUpdateProjectIcons = props.onUpdateProjectIcons;
  var pages = props.pages || [];
  var blocks = props.blocks || [];

  var _view = React.useState('list');
  var view = _view[0];
  var setView = _view[1];

  var _editingIcon = React.useState(null);
  var editingIcon = _editingIcon[0];
  var setEditingIcon = _editingIcon[1];

  // Panel position state
  var _position = React.useState({ x: 50, y: 100 });
  var position = _position[0];
  var setPosition = _position[1];

  // Drag state
  var _dragging = React.useState(false);
  var dragging = _dragging[0];
  var setDragging = _dragging[1];

  var _dragOffset = React.useState({ x: 0, y: 0 });
  var dragOffset = _dragOffset[0];
  var setDragOffset = _dragOffset[1];

  React.useEffect(function() {
    if (!isOpen) {
      setView('list');
      setEditingIcon(null);
    }
  }, [isOpen]);

  // Panel drag handlers
  var handleMouseDown = function(e) {
    if (e.target.closest('.panel-content')) return;
    setDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  React.useEffect(function() {
    if (!dragging) return;
    
    var handleMouseMove = function(e) {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    
    var handleMouseUp = function() {
      setDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return function() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset]);

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
    console.log('[IconManager] Drag start:', icon.name);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      iconId: icon.id,
      iconData: icon
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  var popupTemplates = blocks.filter(function(b) { return b.isPopup === true && b.isTemplate === true; });

  if (!isOpen) return null;

  // Floating panel style (no overlay)
  var panelStyle = {
    position: 'fixed',
    left: position.x + 'px',
    top: position.y + 'px',
    zIndex: 1000,
    width: '400px',
    maxHeight: '70vh',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  };

  var headerStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'move',
    backgroundColor: '#f9fafb',
    borderRadius: '8px 8px 0 0'
  };

  return React.createElement('div', { style: panelStyle },
    // Header - draggable
    React.createElement('div', {
      style: headerStyle,
      onMouseDown: handleMouseDown
    },
      React.createElement('h3', { style: { fontWeight: 600, color: '#1f2937', margin: 0 } },
        view === 'list' ? '🔘 Icon Manager' : (editingIcon && projectIcons.find(function(i) { return i.id === editingIcon.id; }) ? 'Edit Icon' : 'Add Icon')
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement('span', { style: { fontSize: '12px', color: '#9ca3af' } }, 'Drag to move'),
        React.createElement('button', {
          onClick: onClose,
          style: { background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer' }
        }, 'X')
      )
    ),
    // Content
    React.createElement('div', {
      className: 'panel-content',
      style: { flex: 1, overflow: 'auto', padding: '16px' }
    },
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
  );
}

function IconListView(props) {
  var icons = props.icons;
  var onAdd = props.onAdd;
  var onEdit = props.onEdit;
  var onDelete = props.onDelete;
  var onDragStart = props.onDragStart;

  return React.createElement('div', null,
    // Add button
    React.createElement('button', {
      onClick: onAdd,
      style: {
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    },
      React.createElement('span', null, '+'),
      React.createElement('span', null, 'Add New Icon')
    ),
    // Empty state
    icons.length === 0 ?
      React.createElement('div', { style: { textAlign: 'center', padding: '32px', color: '#9ca3af' } },
        React.createElement('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '🔘'),
        React.createElement('p', null, 'No Icons yet')
      ) :
      // Icon list
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        icons.map(function(icon) {
          return React.createElement('div', {
            key: icon.id,
            style: {
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              gap: '12px'
            }
          },
            // Draggable icon
            React.createElement('div', {
              draggable: true,
              onDragStart: function(e) { onDragStart(e, icon); },
              style: {
                width: '48px',
                height: '48px',
                border: '2px dashed #d1d5db',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                cursor: 'grab'
              },
              title: 'Drag to canvas'
            },
              icon.image ?
                React.createElement('img', {
                  src: icon.image.url,
                  alt: icon.name,
                  style: { maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }
                }) :
                React.createElement('span', { style: { color: '#9ca3af', fontSize: '12px' } }, 'No img')
            ),
            // Info
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontWeight: 500, color: '#374151' } }, icon.name || 'Unnamed'),
              React.createElement('div', { style: { fontSize: '12px', color: '#9ca3af' } }, icon.description || '-')
            ),
            // Actions
            React.createElement('div', { style: { display: 'flex', gap: '4px' } },
              React.createElement('button', {
                onClick: function() { onEdit(icon); },
                style: { padding: '4px 8px', fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }
              }, 'Edit'),
              React.createElement('button', {
                onClick: function() { onDelete(icon.id); },
                style: { padding: '4px 8px', fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }
              }, 'Delete')
            )
          );
        })
      ),
    // Tip
    icons.length > 0 ?
      React.createElement('div', {
        style: {
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#eff6ff',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#3b82f6'
        }
      }, '💡 Drag icon to canvas to place it') : null
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

  var inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

  var labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px'
  };

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

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
    // Name
    React.createElement('div', null,
      React.createElement('label', { style: labelStyle }, 'Icon Name *'),
      React.createElement('input', {
        type: 'text',
        value: formData.name,
        onChange: function(e) { updateField('name', e.target.value); },
        style: inputStyle,
        placeholder: 'e.g., Back to Home'
      })
    ),
    // Size
    React.createElement('div', null,
      React.createElement('label', { style: labelStyle }, 'Default Size'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement('input', {
          type: 'number',
          value: formData.size.width,
          onChange: function(e) { updateSize('width', e.target.value); },
          style: Object.assign({}, inputStyle, { width: '80px', textAlign: 'center' }),
          min: 16,
          max: 128
        }),
        React.createElement('span', null, 'x'),
        React.createElement('input', {
          type: 'number',
          value: formData.size.height,
          onChange: function(e) { updateSize('height', e.target.value); },
          style: Object.assign({}, inputStyle, { width: '80px', textAlign: 'center' }),
          min: 16,
          max: 128
        }),
        React.createElement('span', { style: { color: '#9ca3af', fontSize: '12px' } }, 'px')
      )
    ),
    // Image
    React.createElement('div', null,
      React.createElement('label', { style: labelStyle }, 'Icon Image *'),
      React.createElement('div', { style: { display: 'flex', gap: '16px' } },
        React.createElement('div', {
          onClick: function() { fileInputRef.current && fileInputRef.current.click(); },
          style: {
            width: '80px',
            height: '80px',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: '#f9fafb'
          }
        },
          imagePreview ?
            React.createElement('img', { src: imagePreview, alt: 'Preview', style: { maxWidth: '70px', maxHeight: '70px', objectFit: 'contain' } }) :
            React.createElement('span', { style: { color: '#9ca3af', fontSize: '12px', textAlign: 'center' } }, 'Click to upload')
        ),
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: 'image/*',
          onChange: handleImageUpload,
          style: { display: 'none' }
        }),
        React.createElement('div', { style: { fontSize: '12px', color: '#9ca3af' } },
          React.createElement('p', null, 'JPG, PNG, GIF, SVG'),
          React.createElement('p', null, 'Transparent BG recommended')
        )
      )
    ),
    // Action
    React.createElement('div', null,
      React.createElement('label', { style: labelStyle }, 'Click Action'),
      React.createElement('div', { style: { padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' } },
        // Navigate
        React.createElement('label', { style: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', cursor: 'pointer' } },
          React.createElement('input', {
            type: 'radio',
            name: 'actionType',
            checked: formData.action.type === 'navigatePage',
            onChange: function() { updateAction('type', 'navigatePage'); },
            style: { marginTop: '2px' }
          }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('span', { style: { fontSize: '14px' } }, 'Navigate to Page'),
            formData.action.type === 'navigatePage' ?
              React.createElement('select', {
                value: formData.action.targetPageId || '',
                onChange: function(e) { updateAction('targetPageId', e.target.value); },
                style: Object.assign({}, inputStyle, { marginTop: '4px' })
              },
                React.createElement('option', { value: '' }, 'Select Page'),
                pages.map(function(p) { return React.createElement('option', { key: p.id, value: p.id }, p.name); })
              ) : null
          )
        ),
        // Go Back
        React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' } },
          React.createElement('input', {
            type: 'radio',
            name: 'actionType',
            checked: formData.action.type === 'goBack',
            onChange: function() { updateAction('type', 'goBack'); }
          }),
          React.createElement('span', { style: { fontSize: '14px' } }, 'Go Back')
        ),
        // Open Popup
        React.createElement('label', { style: { display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' } },
          React.createElement('input', {
            type: 'radio',
            name: 'actionType',
            checked: formData.action.type === 'openPopup',
            onChange: function() { updateAction('type', 'openPopup'); },
            style: { marginTop: '2px' }
          }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('span', { style: { fontSize: '14px' } }, 'Open Popup'),
            formData.action.type === 'openPopup' ?
              React.createElement('select', {
                value: formData.action.targetPopupId || '',
                onChange: function(e) { updateAction('targetPopupId', e.target.value); },
                style: Object.assign({}, inputStyle, { marginTop: '4px' })
              },
                React.createElement('option', { value: '' }, 'Select Popup'),
                popupTemplates.length === 0 ?
                  React.createElement('option', { disabled: true }, 'No popup templates') :
                  popupTemplates.map(function(b) { return React.createElement('option', { key: b.id, value: b.id }, b.id); })
              ) : null
          )
        )
      )
    ),
    // Description
    React.createElement('div', null,
      React.createElement('label', { style: labelStyle }, 'Description'),
      React.createElement('input', {
        type: 'text',
        value: formData.description,
        onChange: function(e) { updateField('description', e.target.value.slice(0, 50)); },
        style: inputStyle,
        placeholder: 'Brief description',
        maxLength: 50
      })
    ),
    // Buttons
    React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' } },
      React.createElement('button', {
        onClick: onCancel,
        style: { padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer' }
      }, 'Cancel'),
      React.createElement('button', {
        onClick: handleSubmit,
        style: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
      }, 'Save')
    )
  );
}

window.IconManager = IconManager;
console.log('[DND2] IconManager loaded');
