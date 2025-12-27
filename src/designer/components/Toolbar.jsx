// Designer Toolbar Component
function DesignerToolbar(props) {
  var page = props.page;
  var canvasType = props.canvasType;
  var setCanvasType = props.setCanvasType;
  var scale = props.scale;
  var setScale = props.setScale;
  var canUndo = props.canUndo;
  var canRedo = props.canRedo;
  var onUndo = props.onUndo;
  var onRedo = props.onRedo;
  var onSave = props.onSave;
  var onClose = props.onClose;
  var hasChanges = props.hasChanges;
  var onOpenEditor = props.onOpenEditor;
  var onOpenGraphicEditor = props.onOpenGraphicEditor;
  var onOpenStylePanel = props.onOpenStylePanel;
  var onOpenIconManager = props.onOpenIconManager;
  var selectedBlockId = props.selectedBlockId;

  return React.createElement('div', {
    className: 'h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0'
  },
    React.createElement('div', { className: 'flex items-center space-x-2' },
      React.createElement('span', { className: 'font-semibold text-gray-700' }, 'Page: '),
      React.createElement('span', { className: 'text-blue-600' }, page.name),
      React.createElement('span', { className: 'text-gray-400 text-sm' }, '(' + page.id + ')'),
      hasChanges ? React.createElement('span', { className: 'text-orange-500 text-sm' }, ' Unsaved') : null
    ),
    React.createElement('div', { className: 'flex items-center space-x-3' },
      React.createElement('button', {
        onClick: onOpenStylePanel,
        className: selectedBlockId ? 'px-3 py-1.5 rounded flex items-center space-x-1 bg-blue-100 text-blue-700 hover:bg-blue-200' : 'px-3 py-1.5 rounded flex items-center space-x-1 bg-gray-100 text-gray-400 cursor-not-allowed',
        title: selectedBlockId ? 'Open Style Panel' : 'Select a block first',
        disabled: !selectedBlockId
      },
        React.createElement('span', null, '🎨'),
        React.createElement('span', null, 'Style')
      ),
      React.createElement('button', {
        onClick: onOpenEditor,
        className: 'px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center space-x-1',
        title: 'Rich Text Editor'
      },
        React.createElement('span', null, '📄'),
        React.createElement('span', null, 'Editor')
      ),
      React.createElement('button', {
        onClick: onOpenGraphicEditor,
        className: 'px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1',
        title: 'Graphic Editor'
      },
        React.createElement('span', null, '✏️'),
        React.createElement('span', null, 'Graphic')
      ),
      React.createElement('button', {
        onClick: function() {
          console.log('[Toolbar] Icon button clicked');
          console.log('[Toolbar] onOpenIconManager:', onOpenIconManager);
          if (onOpenIconManager) {
            onOpenIconManager();
          } else {
            console.error('[Toolbar] onOpenIconManager is undefined!');
          }
        },
        className: 'px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center space-x-1',
        title: 'Icon Manager'
      },
        React.createElement('span', null, '🔘'),
        React.createElement('span', null, 'Icon')
      ),
      React.createElement('div', { className: 'w-px h-6 bg-gray-300' }),
      React.createElement('div', { className: 'flex items-center space-x-1 bg-gray-100 rounded-lg p-1' },
        React.createElement('button', {
          onClick: function() { setCanvasType('PC'); },
          className: canvasType === 'PC' ? 'px-3 py-1 rounded text-sm transition-colors bg-white text-blue-600 shadow' : 'px-3 py-1 rounded text-sm transition-colors text-gray-600 hover:text-gray-900'
        }, '💻 PC'),
        React.createElement('button', {
          onClick: function() { setCanvasType('Mobile'); },
          className: canvasType === 'Mobile' ? 'px-3 py-1 rounded text-sm transition-colors bg-white text-blue-600 shadow' : 'px-3 py-1 rounded text-sm transition-colors text-gray-600 hover:text-gray-900'
        }, '📱 Mobile')
      ),
      React.createElement('div', { className: 'w-px h-6 bg-gray-300' }),
      React.createElement('button', {
        onClick: onUndo,
        disabled: !canUndo,
        className: !canUndo ? 'px-3 py-1.5 rounded text-gray-300' : 'px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100',
        title: 'Undo (Ctrl+Z)'
      }, '↶ Undo'),
      React.createElement('button', {
        onClick: onRedo,
        disabled: !canRedo,
        className: !canRedo ? 'px-3 py-1.5 rounded text-gray-300' : 'px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100',
        title: 'Redo (Ctrl+Y)'
      }, '↷ Redo'),
      React.createElement('div', { className: 'w-px h-6 bg-gray-300' }),
      React.createElement('div', { className: 'flex items-center space-x-1' },
        React.createElement('span', { className: 'text-sm text-gray-500' }, 'Zoom:'),
        React.createElement('select', {
          value: scale,
          onChange: function(e) { setScale(parseInt(e.target.value)); },
          className: 'px-2 py-1.5 border border-gray-300 rounded text-sm'
        },
          React.createElement('option', { value: 50 }, '50%'),
          React.createElement('option', { value: 75 }, '75%'),
          React.createElement('option', { value: 100 }, '100%'),
          React.createElement('option', { value: 125 }, '125%'),
          React.createElement('option', { value: 150 }, '150%'),
          React.createElement('option', { value: 200 }, '200%')
        )
      ),
      React.createElement('div', { className: 'w-px h-6 bg-gray-300' }),
      React.createElement('button', {
        onClick: onSave,
        className: 'px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700'
      }, '💾 Save'),
      React.createElement('button', {
        onClick: onClose,
        className: 'px-4 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100'
      }, 'Close')
    )
  );
}

window.DesignerToolbar = DesignerToolbar;
console.log('[DND2] Toolbar.jsx loaded');
