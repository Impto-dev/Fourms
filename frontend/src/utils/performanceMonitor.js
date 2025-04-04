class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.performance = window.performance;
        this.performanceObserver = null;
    }

    /**
     * Start monitoring performance
     */
    start() {
        // Clear existing metrics
        this.metrics.clear();

        // Initialize Performance Observer
        if (window.PerformanceObserver) {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(entry.name, entry.duration);
                }
            });

            // Observe various performance entry types
            this.performanceObserver.observe({ entryTypes: ['measure', 'resource', 'paint'] });
        }

        // Record initial metrics
        this.recordInitialMetrics();
    }

    /**
     * Stop monitoring performance
     */
    stop() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }

    /**
     * Record initial performance metrics
     */
    recordInitialMetrics() {
        // Navigation timing
        const timing = this.performance.timing;
        if (timing) {
            this.recordMetric('domLoading', timing.domLoading - timing.navigationStart);
            this.recordMetric('domInteractive', timing.domInteractive - timing.navigationStart);
            this.recordMetric('domComplete', timing.domComplete - timing.navigationStart);
            this.recordMetric('loadEventEnd', timing.loadEventEnd - timing.navigationStart);
        }

        // Memory usage
        if (window.performance.memory) {
            this.recordMetric('memory', window.performance.memory.usedJSHeapSize);
        }

        // First paint
        const firstPaint = this.performance.getEntriesByType('paint')[0];
        if (firstPaint) {
            this.recordMetric('firstPaint', firstPaint.startTime);
        }
    }

    /**
     * Record a performance metric
     * @param {String} name - Metric name
     * @param {Number} value - Metric value
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(value);
    }

    /**
     * Get all recorded metrics
     * @returns {Object} Object containing all metrics
     */
    getMetrics() {
        const result = {};
        for (const [name, values] of this.metrics) {
            result[name] = {
                values,
                average: this.calculateAverage(values),
                min: Math.min(...values),
                max: Math.max(...values)
            };
        }
        return result;
    }

    /**
     * Calculate average of values
     * @param {Array<Number>} values - Array of values
     * @returns {Number} Average value
     */
    calculateAverage(values) {
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    /**
     * Measure time taken by a function
     * @param {String} name - Measurement name
     * @param {Function} fn - Function to measure
     * @returns {*} Result of the function
     */
    measureFunction(name, fn) {
        this.performance.mark(`${name}-start`);
        const result = fn();
        this.performance.mark(`${name}-end`);
        this.performance.measure(name, `${name}-start`, `${name}-end`);
        return result;
    }

    /**
     * Get performance report
     * @returns {Object} Performance report
     */
    getReport() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                rtt: navigator.connection.rtt,
                downlink: navigator.connection.downlink
            } : null
        };
    }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor }; 