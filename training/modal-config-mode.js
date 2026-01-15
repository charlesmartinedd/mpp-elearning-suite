/**
 * Modal Config Mode - Enhanced Position & Highlight Picker
 *
 * Allows you to configure modals, scroll positions, and highlight areas.
 *
 * Usage:
 *   1. Add this script to your project
 *   2. Press Ctrl+Shift+P to toggle config mode
 *   3. Scroll page, drag modals, and position highlight box
 *   4. Press Ctrl+Shift+S to download config JSON
 *   5. Use ModalConfigMode.loadConfig(json) to apply saved positions
 *
 * @version 2.0.0
 */
(function() {
  'use strict';

  const ModalConfigMode = {
    isActive: false,
    positions: {},
    indicator: null,
    dragState: null,
    highlightBox: null,
    currentStepId: null,

    /**
     * Initialize the config mode listeners
     */
    init() {
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+P to toggle config mode (case-insensitive)
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          this.toggle();
        }
        // Ctrl+Shift+S to save/export config (case-insensitive)
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          this.exportConfig();
        }
      });

      // Watch for Swal modals appearing
      this.observeModals();

      console.log('[ModalConfigMode] Initialized. Press Ctrl+Shift+P to toggle config mode.');
    },

    /**
     * Toggle config mode on/off
     */
    toggle() {
      this.isActive = !this.isActive;

      if (this.isActive) {
        this.showIndicator();
        this.createHighlightBox();
        // Enable dragging on any existing modals (especially Shepherd tour modals)
        const existingShepherd = document.querySelector('.shepherd-element');
        if (existingShepherd && !existingShepherd.dataset.configEnabled) {
          console.log('[ModalConfigMode] Found existing Shepherd modal, enabling drag');
          this.enableDragging(existingShepherd);
          // Store current step ID
          this.currentStepId = this.generateModalId(existingShepherd);
        }
        // Allow page scrolling in config mode
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';
        console.log('[ModalConfigMode] Config mode ON - Modals draggable, highlight box active');
      } else {
        this.hideIndicator();
        this.removeHighlightBox();
        console.log('[ModalConfigMode] Config mode OFF');
      }
    },

    /**
     * Create the draggable/resizable highlight box
     */
    createHighlightBox() {
      if (this.highlightBox) return;

      this.highlightBox = document.createElement('div');
      this.highlightBox.id = 'config-highlight-box';
      this.highlightBox.innerHTML = `
        <div class="highlight-label">HIGHLIGHT AREA - Drag to move, corners to resize</div>
        <div class="resize-handle resize-nw" data-resize="nw"></div>
        <div class="resize-handle resize-ne" data-resize="ne"></div>
        <div class="resize-handle resize-sw" data-resize="sw"></div>
        <div class="resize-handle resize-se" data-resize="se"></div>
      `;
      this.highlightBox.style.cssText = `
        position: fixed;
        border: 4px solid #c9a227;
        border-radius: 8px;
        background: transparent;
        z-index: 99998;
        cursor: move;
        width: 300px;
        height: 200px;
        top: 30%;
        left: 30%;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.7);
        pointer-events: auto;
      `;

      // Add styles for resize handles and label
      const style = document.createElement('style');
      style.id = 'highlight-box-styles';
      style.textContent = `
        #config-highlight-box .highlight-label {
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          background: #c9a227;
          color: #1a2744;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          white-space: nowrap;
        }
        #config-highlight-box .resize-handle {
          position: absolute;
          width: 16px;
          height: 16px;
          background: #c9a227;
          border: 2px solid #1a2744;
          border-radius: 4px;
        }
        #config-highlight-box .resize-nw { top: -8px; left: -8px; cursor: nw-resize; }
        #config-highlight-box .resize-ne { top: -8px; right: -8px; cursor: ne-resize; }
        #config-highlight-box .resize-sw { bottom: -8px; left: -8px; cursor: sw-resize; }
        #config-highlight-box .resize-se { bottom: -8px; right: -8px; cursor: se-resize; }
      `;
      document.head.appendChild(style);
      document.body.appendChild(this.highlightBox);

      this.enableHighlightDragResize();
    },

    /**
     * Enable drag and resize for highlight box
     */
    enableHighlightDragResize() {
      const box = this.highlightBox;
      let isDragging = false;
      let isResizing = false;
      let resizeDir = null;
      let startX, startY, startLeft, startTop, startWidth, startHeight;

      const onMouseDown = (e) => {
        const handle = e.target.closest('.resize-handle');
        if (handle) {
          isResizing = true;
          resizeDir = handle.dataset.resize;
        } else if (e.target === box || e.target.classList.contains('highlight-label')) {
          isDragging = true;
        } else {
          return;
        }

        const rect = box.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        startWidth = rect.width;
        startHeight = rect.height;
        e.preventDefault();
        e.stopPropagation();
      };

      const onMouseMove = (e) => {
        if (!isDragging && !isResizing) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        if (isDragging) {
          box.style.left = (startLeft + deltaX) + 'px';
          box.style.top = (startTop + deltaY) + 'px';
        } else if (isResizing) {
          let newLeft = startLeft;
          let newTop = startTop;
          let newWidth = startWidth;
          let newHeight = startHeight;

          if (resizeDir.includes('e')) newWidth = startWidth + deltaX;
          if (resizeDir.includes('w')) {
            newWidth = startWidth - deltaX;
            newLeft = startLeft + deltaX;
          }
          if (resizeDir.includes('s')) newHeight = startHeight + deltaY;
          if (resizeDir.includes('n')) {
            newHeight = startHeight - deltaY;
            newTop = startTop + deltaY;
          }

          // Minimum size
          if (newWidth >= 100) {
            box.style.width = newWidth + 'px';
            box.style.left = newLeft + 'px';
          }
          if (newHeight >= 80) {
            box.style.height = newHeight + 'px';
            box.style.top = newTop + 'px';
          }
        }
      };

      const onMouseUp = () => {
        if (isDragging || isResizing) {
          this.saveHighlightPosition();
        }
        isDragging = false;
        isResizing = false;
        resizeDir = null;
      };

      box.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Save highlight box position for current step
     */
    saveHighlightPosition() {
      if (!this.highlightBox || !this.currentStepId) return;

      const rect = this.highlightBox.getBoundingClientRect();

      // Initialize position entry if not exists
      if (!this.positions[this.currentStepId]) {
        this.positions[this.currentStepId] = {};
      }

      this.positions[this.currentStepId].scrollY = window.scrollY;
      this.positions[this.currentStepId].highlight = {
        top: ((rect.top / window.innerHeight) * 100).toFixed(2) + '%',
        left: ((rect.left / window.innerWidth) * 100).toFixed(2) + '%',
        width: rect.width + 'px',
        height: rect.height + 'px'
      };

      console.log(`[ModalConfigMode] Saved highlight for "${this.currentStepId}":`,
        this.positions[this.currentStepId].highlight);
    },

    /**
     * Remove the highlight box
     */
    removeHighlightBox() {
      if (this.highlightBox) {
        this.highlightBox.remove();
        this.highlightBox = null;
      }
      const style = document.getElementById('highlight-box-styles');
      if (style) style.remove();
    },

    /**
     * Show visual indicator that config mode is active
     */
    showIndicator() {
      if (this.indicator) return;

      this.indicator = document.createElement('div');
      this.indicator.id = 'modal-config-indicator';
      this.indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff6b35;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          font-weight: 600;
          z-index: 999999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <span style="
            width: 10px;
            height: 10px;
            background: #fff;
            border-radius: 50%;
            animation: pulse 1s infinite;
          "></span>
          CONFIG MODE - Scroll | Drag modal | Position highlight | Ctrl+Shift+S to save
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          /* Override ALL position rules from index.html when dragging */
          body.config-mode-active .shepherd-element[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-center[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-top[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-bottom[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-top-left[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-top-right[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-bottom-left[data-config-enabled],
          body.config-mode-active.tour-active .shepherd-element.pos-bottom-right[data-config-enabled],
          body.config-mode-active .shepherd-element.tour-redesigned[data-config-enabled] {
            transform: none !important;
            transition: none !important;
            top: var(--drag-top, 50%) !important;
            left: var(--drag-left, 50%) !important;
            right: auto !important;
            bottom: auto !important;
          }
        </style>
      `;
      document.body.appendChild(this.indicator);
      document.body.classList.add('config-mode-active');
    },

    /**
     * Hide the config mode indicator
     */
    hideIndicator() {
      if (this.indicator) {
        this.indicator.remove();
        this.indicator = null;
      }
      document.body.classList.remove('config-mode-active');
    },

    /**
     * Observe DOM for Swal AND Shepherd modals and make them draggable
     */
    observeModals() {
      const observer = new MutationObserver((mutations) => {
        if (!this.isActive) return;

        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Check for SweetAlert2 modals
              const swalPopup = node.querySelector?.('.swal2-popup') ||
                           (node.classList?.contains('swal2-popup') ? node : null);
              if (swalPopup && !swalPopup.dataset.configEnabled) {
                this.enableDragging(swalPopup);
              }

              // Check for Shepherd.js tour modals
              const shepherdPopup = node.querySelector?.('.shepherd-element') ||
                           (node.classList?.contains('shepherd-element') ? node : null);
              if (shepherdPopup && !shepherdPopup.dataset.configEnabled) {
                this.enableDragging(shepherdPopup);
              }
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Also check for existing Shepherd modals when config mode is toggled
      this.enableExistingModals = () => {
        document.querySelectorAll('.shepherd-element:not([data-config-enabled])').forEach(el => {
          this.enableDragging(el);
        });
      };
    },

    /**
     * Make a Swal popup draggable
     */
    enableDragging(popup) {
      popup.dataset.configEnabled = 'true';

      // Add drag handle styling
      popup.style.cursor = 'move';
      popup.style.transition = 'none';

      // Add position badge
      const badge = document.createElement('div');
      badge.id = 'position-badge';
      badge.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: #fff;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        white-space: nowrap;
        z-index: 1;
      `;
      popup.style.position = 'fixed';
      popup.appendChild(badge);

      // Update badge with current position
      const updateBadge = () => {
        const rect = popup.getBoundingClientRect();
        const topPct = ((rect.top / window.innerHeight) * 100).toFixed(1);
        const leftPct = ((rect.left / window.innerWidth) * 100).toFixed(1);
        badge.textContent = `top: ${topPct}% | left: ${leftPct}%`;
      };
      updateBadge();

      // Drag handlers
      let isDragging = false;
      let startX, startY, startLeft, startTop;

      const onMouseDown = (e) => {
        // Don't drag if clicking on buttons or inputs
        if (e.target.closest('button, input, textarea, select, a')) return;

        isDragging = true;
        const rect = popup.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;

        // Use CSS variables so !important rules can read them
        popup.style.setProperty('--drag-top', startTop + 'px');
        popup.style.setProperty('--drag-left', startLeft + 'px');

        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Use CSS variables so !important rules can read them
        popup.style.setProperty('--drag-left', (startLeft + deltaX) + 'px');
        popup.style.setProperty('--drag-top', (startTop + deltaY) + 'px');

        updateBadge();
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        // Save position with new structure
        const rect = popup.getBoundingClientRect();
        const modalId = this.generateModalId(popup);
        this.currentStepId = modalId;

        // Initialize position entry if not exists
        if (!this.positions[modalId]) {
          this.positions[modalId] = {};
        }

        this.positions[modalId].scrollY = window.scrollY;
        this.positions[modalId].modal = {
          top: ((rect.top / window.innerHeight) * 100).toFixed(2) + '%',
          left: ((rect.left / window.innerWidth) * 100).toFixed(2) + '%'
        };

        console.log(`[ModalConfigMode] Saved modal position for "${modalId}":`, this.positions[modalId].modal);
      };

      popup.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Generate a unique ID for a modal based on its title
     */
    generateModalId(popup) {
      // Check for SweetAlert2 title or Shepherd.js title
      const title = popup.querySelector('.swal2-title')?.textContent ||
                    popup.querySelector('.shepherd-text h3')?.textContent ||
                    popup.dataset.shepherdStepId ||
                    '';
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) || `modal-${Date.now()}`;
      return id;
    },

    /**
     * Export positions config as JSON file download
     */
    exportConfig() {
      if (Object.keys(this.positions).length === 0) {
        alert('No modal positions captured yet. Drag some modals first!');
        return;
      }

      const config = {
        version: '2.0',
        capturedAt: new Date().toISOString(),
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        positions: this.positions
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'modal-positions.json';
      a.click();

      URL.revokeObjectURL(url);
      console.log('[ModalConfigMode] Config exported:', config);
    },

    /**
     * Load and apply a saved config
     * @param {Object|string} config - Config object or JSON string
     */
    loadConfig(config) {
      if (typeof config === 'string') {
        config = JSON.parse(config);
      }

      if (!config.positions) {
        console.error('[ModalConfigMode] Invalid config - missing positions');
        return;
      }

      this.savedPositions = config.positions;
      console.log('[ModalConfigMode] Config loaded:', Object.keys(config.positions).length, 'positions');

      // Apply to any currently open modal
      const popup = document.querySelector('.swal2-popup');
      if (popup) {
        this.applyPosition(popup);
      }
    },

    /**
     * Apply saved position to a modal (v2.0 format with modal/highlight)
     */
    applyPosition(popup) {
      if (!this.savedPositions) return;

      const modalId = this.generateModalId(popup);
      const posData = this.savedPositions[modalId];

      if (posData) {
        // Handle v2.0 format with modal key
        const modalPos = posData.modal || posData;

        popup.style.position = 'fixed';
        popup.style.top = modalPos.top;
        popup.style.left = modalPos.left;
        popup.style.transform = 'none';
        popup.style.margin = '0';
        console.log(`[ModalConfigMode] Applied modal position for "${modalId}"`);

        // Apply scroll position if specified
        if (posData.scrollY !== undefined) {
          window.scrollTo({ top: posData.scrollY, behavior: 'smooth' });
        }

        // Apply highlight if specified
        if (posData.highlight) {
          this.showHighlight(posData.highlight);
        }
      }
    },

    /**
     * Show highlight cutout during tour playback
     */
    showHighlight(highlightConfig) {
      // Remove existing highlight
      this.hideHighlight();

      const highlight = document.createElement('div');
      highlight.id = 'tour-highlight-cutout';
      highlight.style.cssText = `
        position: fixed;
        top: ${highlightConfig.top};
        left: ${highlightConfig.left};
        width: ${highlightConfig.width};
        height: ${highlightConfig.height};
        border: 4px solid #c9a227;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.7);
        z-index: 99998;
        pointer-events: none;
      `;
      document.body.appendChild(highlight);
      console.log('[ModalConfigMode] Highlight shown:', highlightConfig);
    },

    /**
     * Hide highlight cutout
     */
    hideHighlight() {
      const existing = document.getElementById('tour-highlight-cutout');
      if (existing) existing.remove();
    },

    /**
     * Auto-apply positions to new modals (call after loadConfig)
     */
    enableAutoApply() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const popup = node.querySelector?.('.swal2-popup') ||
                           (node.classList?.contains('swal2-popup') ? node : null);
              if (popup && !popup.dataset.positionApplied) {
                popup.dataset.positionApplied = 'true';
                // Small delay to ensure Swal has finished positioning
                setTimeout(() => this.applyPosition(popup), 50);
              }
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
      console.log('[ModalConfigMode] Auto-apply enabled');
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModalConfigMode.init());
  } else {
    ModalConfigMode.init();
  }

  // Expose globally for manual use
  window.ModalConfigMode = ModalConfigMode;

})();
