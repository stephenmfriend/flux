/**
 * Global error handlers for development
 * Makes all errors surface immediately with full context
 */

if (import.meta.env.DEV) {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', {
      reason: event.reason,
      promise: event.promise,
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
    });

    // Optionally show visual overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff0000;
      color: white;
      padding: 20px;
      z-index: 999999;
      font-family: monospace;
      white-space: pre-wrap;
    `;
    overlay.textContent = `🚨 Unhandled Promise Rejection\n${event.reason?.message || event.reason}\n\n${event.reason?.stack || ''}`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'margin-top: 10px; padding: 5px 10px; cursor: pointer;';
    closeBtn.onclick = () => overlay.remove();
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);
  });

  // Catch regular errors
  window.addEventListener('error', (event) => {
    console.error('🚨 Unhandled Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
    });
  });

  console.log('✅ Dev error handlers installed');
}
