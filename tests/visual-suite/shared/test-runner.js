/**
 * Shared test runner for html2canvas visual testing suite
 * Handles capture, comparison, and display logic
 */

class VisualTestRunner {
    constructor() {
        this.captureBtn = document.getElementById('capture-btn');
        this.statusElement = document.getElementById('status');
        this.timingElement = document.getElementById('timing');
        this.canvasOutput = document.getElementById('canvas-output');
        this.htmlSamples = document.getElementById('html-samples');

        this.init();
    }

    init() {
        // Bind capture button
        if (this.captureBtn) {
            this.captureBtn.addEventListener('click', () => this.capture());
        }

        // Auto-capture on load
        window.addEventListener('load', () => {
            setTimeout(() => this.capture(), 500);
        });
    }

    async capture() {
        if (!this.htmlSamples) {
            this.showError('No test samples found');
            return;
        }

        this.updateStatus('capturing', 'Capturing...');
        this.disableButton(true);

        const startTime = performance.now();

        try {
            // Capture the HTML samples
            const canvas = await html2canvas(this.htmlSamples, {
                logging: false,
                backgroundColor: '#ffffff',
                scale: window.devicePixelRatio || 1
            });

            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(0);

            // Display the canvas
            this.displayCanvas(canvas);
            this.updateStatus('success', `Captured successfully`);
            this.updateTiming(`${duration}ms`);

        } catch (error) {
            console.error('Capture error:', error);
            this.showError(error.message);
        } finally {
            this.disableButton(false);
        }
    }

    displayCanvas(canvas) {
        // Clear previous canvas
        this.canvasOutput.innerHTML = '';

        // Add new canvas - scale down to match HTML size for 1:1 comparison
        const scale = window.devicePixelRatio || 1;
        canvas.style.display = 'block';
        canvas.style.width = (canvas.width / scale) + 'px';
        canvas.style.height = (canvas.height / scale) + 'px';
        this.canvasOutput.appendChild(canvas);
    }

    updateStatus(type, message) {
        if (!this.statusElement) return;

        this.statusElement.className = `status ${type}`;
        this.statusElement.textContent = message;
    }

    updateTiming(time) {
        if (!this.timingElement) return;
        this.timingElement.textContent = `Capture time: ${time}`;
    }

    showError(message) {
        this.updateStatus('error', `Error: ${message}`);
        this.canvasOutput.innerHTML = `
            <div class="placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Capture failed: ${message}</p>
            </div>
        `;
    }

    disableButton(disabled) {
        if (!this.captureBtn) return;
        this.captureBtn.disabled = disabled;
    }
}

// Initialize test runner when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VisualTestRunner();
});
