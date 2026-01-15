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
    modalWasDragged: false,
    highlightWasMoved: false,

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
        z-index: 999998;
        cursor: move;
        width: 300px;
        height: 200px;
        top: 30%;
        left: 30%;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.85);
        pointer-events: auto !important;
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
          width: 20px;
          height: 20px;
          background: #c9a227;
          border: 2px solid #1a2744;
          border-radius: 4px;
          z-index: 999999;
          pointer-events: auto !important;
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
     * Always gets step ID fresh from Shepherd API to avoid stale references
     */
    saveHighlightPosition(forceStepId = null) {
      if (!this.highlightBox) return;

      // Get current step ID from Shepherd API (most reliable)
      const stepId = forceStepId ||
                     this.getCurrentStepId() ||
                     this.currentStepId;

      if (!stepId) return;

      // Sync our tracking variables
      this.currentStepId = stepId;
      this.lastStepTitle = stepId;

      const rect = this.highlightBox.getBoundingClientRect();

      // Initialize position entry if not exists
      if (!this.positions[stepId]) {
        this.positions[stepId] = {};
      }

      this.positions[stepId].scrollY = window.scrollY;
      this.positions[stepId].highlight = {
        top: ((rect.top / window.innerHeight) * 100).toFixed(2) + '%',
        left: ((rect.left / window.innerWidth) * 100).toFixed(2) + '%',
        width: rect.width + 'px',
        height: rect.height + 'px'
      };

      console.log(`[ModalConfigMode] Saved highlight for "${stepId}":`,
        this.positions[stepId].highlight);
    },

    /**
     * Save modal position for current step (only if it was dragged)
     */
    saveModalPosition(modal) {
      if (!modal || !this.currentStepId) return;

      // Only save if modal was actually dragged by user
      if (!this.modalWasDragged) {
        console.log(`[ModalConfigMode] Modal not dragged, skipping save for "${this.currentStepId}"`);
        return;
      }

      const rect = modal.getBoundingClientRect();

      // Initialize position entry if not exists
      if (!this.positions[this.currentStepId]) {
        this.positions[this.currentStepId] = {};
      }

      this.positions[this.currentStepId].modal = {
        top: ((rect.top / window.innerHeight) * 100).toFixed(2) + '%',
        left: ((rect.left / window.innerWidth) * 100).toFixed(2) + '%'
      };

      console.log(`[ModalConfigMode] Saved modal for "${this.currentStepId}":`,
        this.positions[this.currentStepId].modal);

      // Reset flag for next step
      this.modalWasDragged = false;
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
     * Show visual indicator that config mode is active (with save buttons)
     */
    showIndicator() {
      if (this.indicator) return;

      this.indicator = document.createElement('div');
      this.indicator.id = 'modal-config-indicator';
      this.indicator.innerHTML = `
        <div class="config-toolbar" style="
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a2744;
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          z-index: 999999;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          gap: 15px;
        ">
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; background: #ff6b35; border-radius: 50%; animation: pulse 1s infinite;"></span>
            <strong>CONFIG MODE</strong>
          </span>
          <span style="color: #888;">|</span>
          <span id="config-step-label" style="color: #c9a227;">No step active</span>
          <span style="color: #888;">|</span>
          <button id="config-save-step" style="
            background: #c9a227;
            color: #1a2744;
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
          ">💾 Save Step</button>
          <button id="config-export-all" style="
            background: #4a5568;
            color: white;
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
          ">📥 Export All</button>
          <span id="config-save-count" style="
            background: #2d3748;
            padding: 4px 10px;
            border-radius: 10px;
            font-size: 12px;
          ">0 saved</span>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          #config-save-step:hover { background: #d4af37; }
          #config-export-all:hover { background: #5a6578; }
          .config-save-flash {
            animation: saveFlash 0.5s ease;
          }
          @keyframes saveFlash {
            0%, 100% { background: #c9a227; }
            50% { background: #4ade80; }
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

      // Attach button handlers
      document.getElementById('config-save-step').addEventListener('click', () => this.saveCurrentStep());
      document.getElementById('config-export-all').addEventListener('click', () => this.exportConfig());

      // Update saved count
      this.updateSaveCount();
    },

    /**
     * Save current step's positions (called by Save Step button)
     */
    saveCurrentStep() {
      const shepherdModal = document.querySelector('.shepherd-element');
      if (!shepherdModal) {
        alert('No tour step active. Start the tour first!');
        return;
      }

      // Get step ID from Shepherd API (most reliable)
      const resolvedStepId = this.getCurrentStepId();

      if (!resolvedStepId) {
        alert('Could not identify current step.');
        return;
      }

      // Sync both tracking variables
      this.currentStepId = resolvedStepId;
      this.lastStepTitle = resolvedStepId;

      // Save highlight position with explicit step ID
      if (this.highlightBox) {
        this.saveHighlightPosition(resolvedStepId);
      }

      // Save modal position (force save regardless of drag state)
      const rect = shepherdModal.getBoundingClientRect();
      if (!this.positions[resolvedStepId]) {
        this.positions[resolvedStepId] = {};
      }
      this.positions[resolvedStepId].scrollY = window.scrollY;
      this.positions[resolvedStepId].modal = {
        top: ((rect.top / window.innerHeight) * 100).toFixed(2) + '%',
        left: ((rect.left / window.innerWidth) * 100).toFixed(2) + '%'
      };

      // Visual feedback
      const btn = document.getElementById('config-save-step');
      btn.classList.add('config-save-flash');
      btn.textContent = '✓ Saved!';
      setTimeout(() => {
        btn.classList.remove('config-save-flash');
        btn.textContent = '💾 Save Step';
      }, 1000);

      // Update count and label
      this.updateSaveCount();
      console.log(`[ModalConfigMode] Manually saved step "${resolvedStepId}":`, this.positions[resolvedStepId]);
    },

    /**
     * Update the saved count display
     */
    updateSaveCount() {
      const countEl = document.getElementById('config-save-count');
      if (countEl) {
        const count = Object.keys(this.positions).length;
        countEl.textContent = `${count} saved`;
      }
    },

    /**
     * Update the step label in toolbar
     */
    updateStepLabel(stepName) {
      const labelEl = document.getElementById('config-step-label');
      if (labelEl) {
        labelEl.textContent = stepName ? `Step: ${stepName.substring(0, 25)}` : 'No step active';
      }
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
     * Uses polling to reliably detect step changes
     */
    observeModals() {
      // Track last known step to detect changes
      this.lastStepTitle = '';

      // Polling interval for step change detection (more reliable than MutationObserver)
      let pollCount = 0;
      this.stepPollInterval = setInterval(() => {
        if (!this.isActive) return;
        pollCount++;
        if (pollCount % 25 === 0) { // Log every 5 seconds
          console.log(`[ModalConfigMode] Poll #${pollCount}, lastStep: "${this.lastStepTitle}", currentStepId: "${this.currentStepId}"`);
        }
        this.checkForStepChange();
      }, 200);

      // Also watch for new modals being added
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
                this.currentStepId = this.generateModalId(swalPopup);
                console.log(`[ModalConfigMode] New SweetAlert detected: "${this.currentStepId}"`);
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
     * Get current step ID from Shepherd's API (most reliable source)
     */
    getCurrentStepId() {
      // Try Shepherd's active tour API first (most reliable)
      if (window.Shepherd?.activeTour?.currentStep?.id) {
        return window.Shepherd.activeTour.currentStep.id;
      }
      // Fallback to DOM attribute
      const shepherdModal = document.querySelector('.shepherd-element');
      if (shepherdModal?.dataset?.shepherdStepId) {
        return shepherdModal.dataset.shepherdStepId;
      }
      // Last resort: use title text
      const titleEl = shepherdModal?.querySelector('.shepherd-text h3');
      if (titleEl?.textContent) {
        return titleEl.textContent
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
      }
      return null;
    },

    /**
     * Check for Shepherd step changes (called by polling interval)
     */
    checkForStepChange() {
      const shepherdModal = document.querySelector('.shepherd-element');
      if (!shepherdModal) {
        // Only log once when modal disappears
        if (this._hadModal) {
          console.log('[ModalConfigMode] Modal disappeared');
          this._hadModal = false;
        }
        return;
      }
      this._hadModal = true;

      // Use Shepherd's API to get current step (most reliable)
      const stepId = this.getCurrentStepId();

      // Debug: log first detection
      if (!this._firstCheck) {
        this._firstCheck = true;
        console.log(`[ModalConfigMode] First check - stepId: "${stepId}", lastStepTitle: "${this.lastStepTitle}"`);
      }

      if (!stepId || stepId === this.lastStepTitle) return;

      // Step has changed!
      console.log(`[ModalConfigMode] Step change detected: "${this.lastStepTitle}" -> "${stepId}"`);

      // SAVE current positions BEFORE changing steps
      if (this.currentStepId && this.highlightBox) {
        this.saveHighlightPosition();
        this.saveModalPosition(shepherdModal);
        console.log(`[ModalConfigMode] Auto-saved for: "${this.currentStepId}"`);
      }

      // Update to the new step
      this.lastStepTitle = stepId;
      this.currentStepId = stepId;  // Use the step ID directly
      console.log(`[ModalConfigMode] Now on step: "${this.currentStepId}"`);

      // Update toolbar step label
      const displayTitle = shepherdModal.querySelector('.shepherd-text h3')?.textContent || stepId;
      this.updateStepLabel(displayTitle);

      // RESTORE saved positions if returning to a previously configured step
      const savedPos = this.positions[this.currentStepId];
      if (savedPos) {
        console.log(`[ModalConfigMode] Restoring saved positions for: "${this.currentStepId}"`);

        // Restore modal position
        if (savedPos.modal) {
          shepherdModal.style.setProperty('--drag-top', savedPos.modal.top);
          shepherdModal.style.setProperty('--drag-left', savedPos.modal.left);
        }

        // Restore highlight position
        if (savedPos.highlight && this.highlightBox) {
          this.highlightBox.style.top = savedPos.highlight.top;
          this.highlightBox.style.left = savedPos.highlight.left;
          this.highlightBox.style.width = savedPos.highlight.width;
          this.highlightBox.style.height = savedPos.highlight.height;
        }
      }

      // Update highlight box label to show current step
      if (this.highlightBox) {
        const label = this.highlightBox.querySelector('.highlight-label');
        if (label) {
          const displayTitle = shepherdModal.querySelector('.shepherd-text h3')?.textContent || stepId;
          label.textContent = `STEP: ${displayTitle.substring(0, 25)} - Drag to move`;
        }
      }

      // Enable dragging if not already enabled
      if (!shepherdModal.dataset.configEnabled) {
        this.enableDragging(shepherdModal);
      }
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

        // Sync both tracking variables to prevent stale references
        this.currentStepId = modalId;
        this.lastStepTitle = modalId;

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

        // Reset flag - we already saved directly, don't need auto-save to overwrite
        this.modalWasDragged = false;
      };

      popup.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Generate a unique ID for a modal - PREFERS Shepherd API for consistency
     */
    generateModalId(popup) {
      // FIRST: Try Shepherd's API (most reliable for tour modals)
      const shepherdStepId = this.getCurrentStepId();
      if (shepherdStepId) {
        return shepherdStepId;
      }

      // SECOND: Check DOM attribute
      if (popup.dataset && popup.dataset.shepherdStepId) {
        return popup.dataset.shepherdStepId;
      }

      // FALLBACK: Use title text for SweetAlert2 or other modals
      const title = popup.querySelector?.('.swal2-title')?.textContent ||
                    popup.querySelector?.('.shepherd-text h3')?.textContent ||
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

    // Store captured viewport for responsive scaling (set when loading config)
    capturedViewport: { width: 1280, height: 720 },

    /**
     * Show highlight cutout during tour playback (with responsive scaling)
     */
    showHighlight(highlightConfig) {
      // Remove existing highlight
      this.hideHighlight();

      // Calculate scale factors for responsive sizing
      const scaleX = window.innerWidth / this.capturedViewport.width;
      const scaleY = window.innerHeight / this.capturedViewport.height;

      // Parse and scale pixel values, keep percentage values as-is
      const scaleValue = (value, scale) => {
        if (typeof value === 'string' && value.endsWith('px')) {
          const px = parseFloat(value);
          return Math.round(px * scale) + 'px';
        }
        return value; // percentages pass through unchanged
      };

      const scaledWidth = scaleValue(highlightConfig.width, scaleX);
      const scaledHeight = scaleValue(highlightConfig.height, scaleY);

      const highlight = document.createElement('div');
      highlight.id = 'tour-highlight-cutout';
      highlight.style.cssText = `
        position: fixed;
        top: ${highlightConfig.top};
        left: ${highlightConfig.left};
        width: ${scaledWidth};
        height: ${scaledHeight};
        border: 4px solid #c9a227;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.85);
        z-index: 99998;
        pointer-events: none;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(highlight);
      console.log('[ModalConfigMode] Highlight shown (scaled):', {
        original: { width: highlightConfig.width, height: highlightConfig.height },
        scaled: { width: scaledWidth, height: scaledHeight },
        scale: { x: scaleX.toFixed(2), y: scaleY.toFixed(2) }
      });
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
