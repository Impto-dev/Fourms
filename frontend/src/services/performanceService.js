import { cache } from '../utils/cache';
import { performanceMonitor } from '../utils/performanceMonitor';

class PerformanceService {
    /**
     * Debounce a function
     * @param {Function} fn - Function to debounce
     * @param {Number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(fn, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Throttle a function
     * @param {Function} fn - Function to throttle
     * @param {Number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(fn, limit = 300) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Cache API response
     * @param {String} key - Cache key
     * @param {Function} fetchFn - Function to fetch data
     * @param {Number} ttl - Time to live in seconds
     * @returns {Promise<*>} Cached or fresh data
     */
    static async cacheApiResponse(key, fetchFn, ttl = 300) {
        const cached = cache.get(key);
        if (cached) {
            return cached;
        }

        const data = await fetchFn();
        cache.set(key, data, ttl);
        return data;
    }

    /**
     * Preload images
     * @param {Array<String>} urls - Array of image URLs
     */
    static preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    /**
     * Lazy load images
     * @param {String} selector - CSS selector for images
     */
    static lazyLoadImages(selector = 'img[data-src]') {
        const images = document.querySelectorAll(selector);
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Optimize scroll performance
     * @param {Function} callback - Scroll callback
     * @param {Number} limit - Throttle limit
     */
    static optimizeScroll(callback, limit = 100) {
        const throttledCallback = this.throttle(callback, limit);
        window.addEventListener('scroll', throttledCallback, { passive: true });
        return () => window.removeEventListener('scroll', throttledCallback);
    }

    /**
     * Optimize resize performance
     * @param {Function} callback - Resize callback
     * @param {Number} delay - Debounce delay
     */
    static optimizeResize(callback, delay = 250) {
        const debouncedCallback = this.debounce(callback, delay);
        window.addEventListener('resize', debouncedCallback);
        return () => window.removeEventListener('resize', debouncedCallback);
    }

    /**
     * Measure performance
     * @returns {Object} Performance metrics
     */
    static measurePerformance() {
        performanceMonitor.start();
        return performanceMonitor.getReport();
    }

    /**
     * Optimize React component
     * @param {React.Component} Component - React component
     * @param {Function} areEqual - Custom comparison function
     * @returns {React.Component} Optimized component
     */
    static optimizeComponent(Component, areEqual) {
        return React.memo(Component, areEqual);
    }

    /**
     * Optimize list rendering
     * @param {Array} items - List items
     * @param {Function} renderItem - Item render function
     * @param {Object} options - Configuration options
     * @returns {Array} Rendered items
     */
    static optimizeList(items, renderItem, options = {}) {
        const {
            keyExtractor = item => item.id,
            windowSize = 10,
            overscan = 5
        } = options;

        const [startIndex, setStartIndex] = React.useState(0);
        const [endIndex, setEndIndex] = React.useState(windowSize);

        const visibleItems = items.slice(startIndex, endIndex);
        const totalHeight = items.length * 50; // Assuming each item is 50px tall

        const handleScroll = (e) => {
            const scrollTop = e.target.scrollTop;
            const newStartIndex = Math.floor(scrollTop / 50);
            const newEndIndex = Math.min(
                newStartIndex + windowSize + overscan,
                items.length
            );

            setStartIndex(newStartIndex);
            setEndIndex(newEndIndex);
        };

        return (
            <div
                style={{ height: '100%', overflow: 'auto' }}
                onScroll={this.throttle(handleScroll, 16)}
            >
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {visibleItems.map((item, index) => (
                        <div
                            key={keyExtractor(item)}
                            style={{
                                position: 'absolute',
                                top: (startIndex + index) * 50,
                                width: '100%'
                            }}
                        >
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default PerformanceService; 