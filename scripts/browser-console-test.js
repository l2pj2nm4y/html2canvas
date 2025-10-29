// Browser Console Test Script for html2canvas
//
// Usage: Copy and paste this entire script into the browser console on any webpage
// to test html2canvas capture functionality from localhost development server.
//
// This script handles pages that use module loaders (AMD/CommonJS) by temporarily
// disabling them during html2canvas loading to prevent conflicts.
//
// Prerequisites:
// 1. Development server must be running: npm start
// 2. html2canvas.js must be built: npm run build
// 3. Server accessible at http://localhost:8080

// Force load html2canvas bypassing module loaders
(function() {
    const script = document.createElement('script');
    script.src = 'http://localhost:8080/dist/html2canvas.js';
    script.type = 'text/javascript';

    // Store references to module loaders to restore later
    const originalDefine = window.define;
    const originalRequire = window.require;
    const originalExports = window.exports;
    const originalModule = window.module;

    // Temporarily disable module loaders
    if (window.define) {
        window.define = undefined;
    }
    if (window.require) {
        window.require = undefined;
    }
    if (window.exports) {
        window.exports = undefined;
    }
    if (window.module) {
        window.module = undefined;
    }

    script.onload = () => {
        // Restore module loaders
        if (originalDefine) window.define = originalDefine;
        if (originalRequire) window.require = originalRequire;
        if (originalExports) window.exports = originalExports;
        if (originalModule) window.module = originalModule;

        // Now capture the page
        html2canvas(document.body, {
            logging: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'page-capture.png';
            link.href = canvas.toDataURL();
            link.click();
        }).catch(err => {
            console.error('html2canvas error:', err);
        });
    };

    script.onerror = () => {
        console.error('Failed to load html2canvas script');
        // Restore module loaders even on error
        if (originalDefine) window.define = originalDefine;
        if (originalRequire) window.require = originalRequire;
        if (originalExports) window.exports = originalExports;
        if (originalModule) window.module = originalModule;
    };

    document.head.appendChild(script);
})();
