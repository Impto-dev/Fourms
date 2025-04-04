import React, { useEffect, useRef } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import PerformanceService from '../services/performanceService';

/**
 * Performance optimization wrapper component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Boolean} props.measureRender - Whether to measure render time
 * @param {Boolean} props.measureMount - Whether to measure mount time
 * @param {Boolean} props.measureUpdate - Whether to measure update count
 * @param {Boolean} props.debounceScroll - Whether to debounce scroll events
 * @param {Boolean} props.debounceResize - Whether to debounce resize events
 * @param {Boolean} props.cacheApi - Whether to cache API responses
 * @param {String} props.name - Component name for metrics
 * @returns {React.ReactElement} Performance optimized component
 */
const PerformanceOptimizer = ({
    children,
    measureRender = false,
    measureMount = false,
    measureUpdate = false,
    debounceScroll = false,
    debounceResize = false,
    cacheApi = false,
    name = 'PerformanceOptimizer'
}) => {
    const {
        useDebouncedScroll,
        useDebouncedResize,
        useCachedApi,
        getMetrics,
        startMonitoring,
        stopMonitoring,
        setComponentName
    } = usePerformance({
        measureRender,
        measureMount,
        measureUpdate,
        debounceScroll,
        debounceResize,
        cacheApi
    });

    const scrollCleanup = useRef(null);
    const resizeCleanup = useRef(null);

    useEffect(() => {
        setComponentName(name);
        startMonitoring();

        return () => {
            stopMonitoring();
            if (scrollCleanup.current) {
                scrollCleanup.current();
            }
            if (resizeCleanup.current) {
                resizeCleanup.current();
            }
        };
    }, [name, setComponentName, startMonitoring, stopMonitoring]);

    // Setup scroll optimization
    useEffect(() => {
        if (debounceScroll) {
            scrollCleanup.current = useDebouncedScroll(() => {
                performanceMonitor.recordMetric(`${name}-scroll`, performance.now());
            });
        }
    }, [debounceScroll, name, useDebouncedScroll]);

    // Setup resize optimization
    useEffect(() => {
        if (debounceResize) {
            resizeCleanup.current = useDebouncedResize(() => {
                performanceMonitor.recordMetric(`${name}-resize`, performance.now());
            });
        }
    }, [debounceResize, name, useDebouncedResize]);

    // Optimize child components
    const optimizedChildren = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return PerformanceService.optimizeComponent(child);
        }
        return child;
    });

    return (
        <div className="performance-optimizer">
            {optimizedChildren}
        </div>
    );
};

export default PerformanceOptimizer; 