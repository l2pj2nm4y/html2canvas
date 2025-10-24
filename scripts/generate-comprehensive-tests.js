/**
 * Generate comprehensive visual test files for html2canvas
 * This script creates extensive test pages for all CSS properties
 */

const fs = require('fs');
const path = require('path');

const testDefinitions = {
    background: {
        'background-image-comprehensive': {
            title: 'Background Image - Comprehensive',
            description: 'All background-image patterns including gradients, multiple backgrounds, and edge cases',
            tests: [
                { name: 'Linear Gradients', items: [
                    'linear-gradient(to right, #3498db, #2ecc71)',
                    'linear-gradient(45deg, #e74c3c, #f39c12)',
                    'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                ]},
                { name: 'Radial Gradients', items: [
                    'radial-gradient(circle, #3498db, #2980b9)',
                    'radial-gradient(ellipse at center, #e74c3c, transparent)',
                    'radial-gradient(circle at top left, #f39c12, #e67e22)',
                ]},
                { name: 'Conic Gradients', items: [
                    'conic-gradient(#3498db, #2ecc71, #f39c12, #3498db)',
                    'conic-gradient(from 45deg, red, yellow, green, blue, red)',
                ]},
                { name: 'Repeating Gradients', items: [
                    'repeating-linear-gradient(45deg, #3498db 0px, #3498db 10px, #2ecc71 10px, #2ecc71 20px)',
                    'repeating-radial-gradient(circle, #e74c3c 0px, #e74c3c 10px, #f39c12 10px, #f39c12 20px)',
                ]},
                { name: 'Multiple Backgrounds', items: [
                    'linear-gradient(45deg, rgba(52,152,219,0.5), transparent), linear-gradient(135deg, rgba(46,204,113,0.5), transparent)',
                    'radial-gradient(circle at 30% 30%, rgba(231,76,60,0.5), transparent), radial-gradient(circle at 70% 70%, rgba(243,156,18,0.5), transparent)',
                ]},
            ]
        },
        'background-position-comprehensive': {
            title: 'Background Position - Comprehensive',
            description: 'All background-position values and combinations',
            tests: [
                { name: 'Keywords', items: ['top', 'right', 'bottom', 'left', 'center', 'top left', 'top right', 'bottom left', 'bottom right', 'center center']},
                { name: 'Percentages', items: ['0% 0%', '50% 50%', '100% 100%', '25% 75%', '75% 25%']},
                { name: 'Lengths', items: ['0px 0px', '10px 20px', '50px 50px', '-10px -10px', '100px 0px']},
                { name: 'Mixed', items: ['left 20px top 30px', 'right 10% bottom 20%', 'center 50px']},
                { name: 'Calc', items: ['calc(50% - 50px) calc(50% - 50px)', 'calc(100% - 20px) calc(100% - 20px)']},
            ]
        },
    },
    borders: {
        'border-styles-comprehensive': {
            title: 'Border Styles - Comprehensive',
            description: 'All border-style values and combinations',
            tests: [
                { name: 'All Styles', items: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']},
                { name: 'Different Sides', items: [
                    { top: 'solid', right: 'dashed', bottom: 'dotted', left: 'double' },
                    { top: 'groove', right: 'ridge', bottom: 'inset', left: 'outset' },
                ]},
                { name: 'With Widths', items: [
                    { style: 'solid', width: '1px' },
                    { style: 'dashed', width: '5px' },
                    { style: 'double', width: '10px' },
                    { style: 'groove', width: '8px' },
                ]},
            ]
        },
    },
};

function generateTestHTML(category, testName, config) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - Visual Test</title>
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
            width: 140px;
            height: 90px;
            margin: 10px;
            display: inline-block;
            vertical-align: top;
            border: 1px solid #ddd;
        }

        .label {
            font-size: 11px;
            color: #666;
            margin: 5px 10px;
            font-weight: 600;
            display: inline-block;
            width: 140px;
            text-align: center;
        }

        ${generateStyles(category, config.tests)}
    </style>
</head>
<body>
    <header>
        <h1>${config.title}</h1>
        <p>${config.description}</p>
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
                ${generateTestSections(config.tests)}
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
        <p>html2canvas Visual Testing Suite - ${config.title}</p>
        <a href="../index.html">← Back to Index</a>
    </footer>

    <script src="../shared/test-runner.js"></script>
</body>
</html>`;
}

function generateStyles(category, tests) {
    let styles = '';
    let counter = 0;

    tests.forEach(section => {
        section.items.forEach((item, idx) => {
            const className = `test-${counter++}`;
            if (typeof item === 'string') {
                styles += `.${className} { background-image: ${item}; }\n`;
            }
        });
    });

    return styles;
}

function generateTestSections(tests) {
    let html = '';
    let counter = 0;

    tests.forEach(section => {
        html += `\n                <div class="test-section">
                    <h3>${section.name}</h3>\n`;

        section.items.forEach((item, idx) => {
            const className = `test-${counter++}`;
            const label = typeof item === 'string' ? item : JSON.stringify(item);

            html += `
                    <div class="sample ${className}"></div>
                    <div class="label">${label.substring(0, 40)}${label.length > 40 ? '...' : ''}</div>\n`;
        });

        html += `                </div>\n`;
    });

    return html;
}

// Generate all test files
Object.entries(testDefinitions).forEach(([category, tests]) => {
    Object.entries(tests).forEach(([testName, config]) => {
        const filePath = path.join(__dirname, '..', 'tests', 'visual-suite', category, `${testName}.html`);
        const html = generateTestHTML(category, testName, config);

        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`Generated: ${filePath}`);
    });
});

console.log('\nComprehensive test generation complete!');
