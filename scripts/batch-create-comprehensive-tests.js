#!/usr/bin/env node

/**
 * Batch creates comprehensive test files for html2canvas visual suite
 * This generates all missing comprehensive test files based on templates
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'tests', 'visual-suite');

// Template for comprehensive tests
function createTestHTML(config) {
    const { title, description, category, property, tests } = config;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Comprehensive Test</title>
    <link rel="stylesheet" href="../shared/test-template.css">
    <script src="../../../dist/html2canvas.js"></script>
    <style>
        .test-section {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }

        .test-section h3 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 16px;
        }

        .sample {
            width: 180px;
            height: 120px;
            margin: 10px;
            display: inline-block;
            vertical-align: top;
            border: 2px solid #ddd;
        }

        .label {
            font-size: 11px;
            color: #666;
            margin: 5px 10px;
            font-weight: 600;
            display: inline-block;
            width: 180px;
            text-align: center;
        }

        ${generateStyles(tests)}
    </style>
</head>
<body>
    <header>
        <h1>${title} - Comprehensive Test</h1>
        <p>${description}</p>
    </header>

    <div class="controls">
        <button id="capture-btn" class="btn-primary">Capture Canvas</button>
        <div class="status-group">
            <span id="status" class="status"></span>
            <span id="timing" class="timing"></span>
        </div>
    </div>

    <div class="split-view">
        <div class="view-panel">
            <div class="panel-header">HTML Version</div>
            <div class="panel-content" id="html-samples">
                ${generateTestSections(tests)}
            </div>
        </div>

        <div class="view-panel">
            <div class="panel-header">Canvas Version</div>
            <div class="panel-content" id="canvas-output">
                <div class="placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p>Click "Capture Canvas" to render</p>
                </div>
            </div>
        </div>
    </div>

    <footer>
        <p>html2canvas Visual Testing Suite - Comprehensive ${title}</p>
        <a href="../index.html">← Back to Index</a>
    </footer>

    <script src="../shared/test-runner.js"></script>
</body>
</html>`;
}

function generateStyles(tests) {
    let css = '';
    let counter = 0;

    tests.forEach(section => {
        section.items.forEach(item => {
            const className = `test-${counter++}`;
            css += `.${className} { ${item.css} }\n`;
        });
    });

    return css;
}

function generateTestSections(tests) {
    let html = '';
    let counter = 0;

    tests.forEach(section => {
        html += `\n                <div class="test-section">
                    <h3>${section.name}</h3>\n`;

        section.items.forEach(item => {
            const className = `test-${counter++}`;
            html += `                    <div class="sample ${className}"></div>
                    <div class="label">${item.label}</div>\n`;
        });

        html += `                </div>\n`;
    });

    return html;
}

// Test configurations
const testConfigs = {
    'background-size-comprehensive': {
        title: 'Background Size',
        description: 'Testing all background-size values and combinations',
        category: 'background',
        property: 'background-size',
        tests: [
            {
                name: 'Keywords',
                items: [
                    { label: 'auto', css: 'background-size: auto; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%233498db\\"/></svg>"); background-repeat: no-repeat;' },
                    { label: 'cover', css: 'background-size: cover; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%23e74c3c\\"/></svg>"); background-repeat: no-repeat;' },
                    { label: 'contain', css: 'background-size: contain; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%232ecc71\\"/></svg>"); background-repeat: no-repeat;' },
                ]
            },
            {
                name: 'Length Values',
                items: [
                    { label: '50px 50px', css: 'background-size: 50px 50px; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%23f39c12\\"/></svg>"); background-repeat: no-repeat;' },
                    { label: '100px 50px', css: 'background-size: 100px 50px; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%239b59b6\\"/></svg>"); background-repeat: no-repeat;' },
                    { label: '50px 100px', css: 'background-size: 50px 100px; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%231abc9c\\"/></svg>"); background-repeat: no-repeat;' },
                ]
            },
            {
                name: 'Percentage Values',
                items: [
                    { label: '50% 50%', css: 'background-size: 50% 50%; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%23e67e22\\"/></svg>"); background-repeat: no-repeat;' },
                    { label: '100% 100%', css: 'background-size: 100% 100%; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%23c0392b\\"/></svg>"); background-repeat: no-repeat;' },
                    { label: '75% auto', css: 'background-size: 75% auto; background-image: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"60\\" height=\\"60\\"><circle cx=\\"30\\" cy=\\"30\\" r=\\"25\\" fill=\\"%2334495e\\"/></svg>"); background-repeat: no-repeat;' },
                ]
            },
        ]
    }
};

// Create files
Object.entries(testConfigs).forEach(([filename, config]) => {
    const filePath = path.join(baseDir, config.category, `${filename}.html`);
    const html = createTestHTML(config);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓ Created: ${filePath}`);
});

console.log('\\nDone! Created comprehensive test files.');
