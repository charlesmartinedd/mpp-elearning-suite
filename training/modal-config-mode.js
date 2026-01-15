/**
 * Modal Config Mode - Reusable SweetAlert2 Position Picker
 *
 * Allows you to drag modals to desired positions and export a JSON config.
 *
 * Usage:
 *   1. Add this script to your project
 *   2. Press Ctrl+Shift+P to toggle config mode
 *   3. Trigger modals and drag them to desired positions
 *   4. Press Ctrl+Shift+S to download config JSON
 *   5. Use ModalConfigMode.loadConfig(json) to apply saved positions
 *
 * @version 1.0.0
 */
(function() {
  'use strict';

  const ModalConfigMode = {
    isActive: false,
    positions: {},
    indicator: null,
    dragState: null,

    /**
     * Initialize the config mode listeners
     */
    init() {
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+P to toggle config mode
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          e.preventDefault();
          this.toggle();
        }
        // Ctrl+Shift+S to save/export config
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
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
        console.log('[ModalConfigMode] Config mode ON - Modals are now draggable');
      } else {
        this.hideIndicator();
        console.log('[ModalConfigMode] Config mode OFF');
      }
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
          CONFIG MODE - Drag modals to position | Ctrl+Shift+S to save
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      `;
      document.body.appendChild(this.indicator);
    },

    /**
     * Hide the config mode indicator
     */
    hideIndicator() {
      if (this.indicator) {
        this.indicator.remove();
        this.indicator = null;
      }
    },

    /**
     * Observe DOM for Swal modals and make them draggable
     */
    observeModals() {
      const observer = new MutationObserver((mutations) => {
        if (!this.isActive) return;

        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const popup = node.querySelector?.('.swal2-popup') ||
                           (node.classList?.contains('swal2-popup') ? node : null);
              if (popup && !popup.dataset.configEnabled) {
                this.enableDragging(popup);
              }
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
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

        popup.style.position = 'fixed';
        popup.style.margin = '0';
        popup.style.top = startTop + 'px';
        popup.style.left = startLeft + 'px';
        popup.style.transform = 'none';

        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        popup.style.left = (startLeft + deltaX) + 'px';
        popup.style.top = (startTop + deltaY) + 'px';

        updateBadge();
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        // Save position
        const rect = popup.getBoundingClientRect();
        const modalId = this.generateModalId(popup);

        this.positions[modalId] = {
          top: ((rect.top / window.innerHeight) * 100).toFixed(2) + '%',
          left: ((rect.left / window.innerWidth) * 100).toFixed(2) + '%'
        };

        console.log(`[ModalConfigMode] Saved position for "${modalId}":`, this.positions[modalId]);
      };

      popup.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Generate a unique ID for a modal based on its title
     */
    generateModalId(popup) {
      const title = popup.querySelector('.swal2-title')?.textContent || '';
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
        version: '1.0',
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
     * Apply saved position to a modal
     */
    applyPosition(popup) {
      if (!this.savedPositions) return;

      const modalId = this.generateModalId(popup);
      const position = this.savedPositions[modalId];

      if (position) {
        popup.style.position = 'fixed';
        popup.style.top = position.top;
        popup.style.left = position.left;
        popup.style.transform = 'none';
        popup.style.margin = '0';
        console.log(`[ModalConfigMode] Applied position for "${modalId}"`);
      }
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
