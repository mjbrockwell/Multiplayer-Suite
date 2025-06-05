/* ===================================================================
   Extension 1: Foundation Registry - Professional Styling
   ================================================================= */

/* Global extension suite styling */
.roam-extension-suite {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
}

/* Professional buttons */
.roam-extension-suite .professional-button {
  background: #137cbd;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.roam-extension-suite .professional-button:hover {
  background: #106ba3;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.roam-extension-suite .professional-button:active {
  background: #0f5a8f;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.roam-extension-suite .professional-button:focus {
  outline: 2px solid #48aff0;
  outline-offset: 2px;
}

/* Button variants */
.roam-extension-suite .professional-button.secondary {
  background: #f5f8fa;
  color: #182026;
  border: 1px solid #d1d5db;
}

.roam-extension-suite .professional-button.secondary:hover {
  background: #ebf1f5;
  border-color: #a7b6c2;
}

.roam-extension-suite .professional-button.success {
  background: #15b371;
}

.roam-extension-suite .professional-button.success:hover {
  background: #0d8050;
}

.roam-extension-suite .professional-button.warning {
  background: #f29d49;
}

.roam-extension-suite .professional-button.warning:hover {
  background: #e07c24;
}

/* Status indicators */
.roam-extension-suite .status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #15b371;
  margin-right: 6px;
  animation: pulse 2s infinite;
}

.roam-extension-suite .status-indicator.error {
  background: #f55656;
}

.roam-extension-suite .status-indicator.warning {
  background: #f29d49;
}

.roam-extension-suite .status-indicator.inactive {
  background: #bfccd6;
  animation: none;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* Debug panels */
.roam-extension-suite .debug-panel {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.roam-extension-suite .debug-panel .debug-title {
  font-weight: 600;
  color: #137cbd;
  margin-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.roam-extension-suite .debug-panel .debug-item {
  margin: 4px 0;
  padding: 2px 0;
}

.roam-extension-suite .debug-panel .debug-label {
  color: #5c7080;
  font-weight: 500;
}

.roam-extension-suite .debug-panel .debug-value {
  color: #182026;
}

/* Info boxes */
.roam-extension-suite .info-box {
  background: rgba(19, 124, 189, 0.1);
  border: 1px solid rgba(19, 124, 189, 0.2);
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
}

.roam-extension-suite .info-box.success {
  background: rgba(21, 179, 113, 0.1);
  border-color: rgba(21, 179, 113, 0.2);
}

.roam-extension-suite .info-box.warning {
  background: rgba(242, 157, 73, 0.1);
  border-color: rgba(242, 157, 73, 0.2);
}

.roam-extension-suite .info-box.error {
  background: rgba(245, 86, 86, 0.1);
  border-color: rgba(245, 86, 86, 0.2);
}

.roam-extension-suite .info-box .info-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #182026;
}

.roam-extension-suite .info-box .info-content {
  color: #5c7080;
  line-height: 1.4;
}

/* Loading indicators */
.roam-extension-suite .loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #137cbd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Extension coordination indicators */
.roam-extension-suite .extension-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(245, 248, 250, 0.8);
  border-radius: 4px;
  margin: 4px 0;
  font-size: 13px;
}

.roam-extension-suite .extension-status .extension-name {
  font-weight: 500;
  color: #182026;
}

.roam-extension-suite .extension-status .extension-version {
  color: #5c7080;
  font-size: 12px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .roam-extension-suite .professional-button {
    padding: 8px 16px;
    font-size: 16px;
  }
  
  .roam-extension-suite .debug-panel {
    font-size: 12px;
    padding: 10px;
  }
}

/* Dark mode compatibility (when Roam adds it) */
@media (prefers-color-scheme: dark) {
  .roam-extension-suite .debug-panel {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: #f5f8fa;
  }
  
  .roam-extension-suite .debug-panel .debug-value {
    color: #f5f8fa;
  }
  
  .roam-extension-suite .extension-status {
    background: rgba(16, 22, 26, 0.8);
  }
  
  .roam-extension-suite .extension-status .extension-name {
    color: #f5f8fa;
  }
}

/* Animation for extension loading */
.roam-extension-suite .extension-loading {
  opacity: 0;
  animation: fadeInUp 0.3s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Professional focus styles for accessibility */
.roam-extension-suite *:focus {
  outline: 2px solid #48aff0;
  outline-offset: 2px;
}

.roam-extension-suite *:focus:not(:focus-visible) {
  outline: none;
}

/* Ensure good contrast ratios */
.roam-extension-suite .text-muted {
  color: #5c7080;
}

.roam-extension-suite .text-primary {
  color: #137cbd;
}

.roam-extension-suite .text-success {
  color: #15b371;
}

.roam-extension-suite .text-warning {
  color: #f29d49;
}

.roam-extension-suite .text-error {
  color: #f55656;
}
