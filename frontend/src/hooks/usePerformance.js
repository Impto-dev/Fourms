import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';
import PerformanceService from '../services/performanceService';

/**
 * Hook for performance optimization
 * @param {Object} options - Configuration options
 * @returns {Object} Performance utilities
 */
export const usePerformance = (options = {}) => {
    const {
        measureRender = false,
        measureMount = false,
        measureUpdate = false,
        debounceScroll = false,
        debounceResize = false,
        cacheApi = false
    } = options;

    const componentName = useRef(null);
    const mountTime = useRef(null);
    const updateCount = useRef(0);

    // Measure component render time
    useEffect(() => {
        if (measureRender) {
            const startTime = performance.now();
            return () => {
                const endTime = performance.now();
                performanceMonitor.recordMetric(
                    `${componentName.current}-render`,
                    endTime - startTime
                );
            };
        }
    }, [measureRender]);

    // Measure component mount time
    useEffect(() => {
        if (measureMount) {
            mountTime.current = performance.now();
            return () => {
                const unmountTime = performance.now();
                performanceMonitor.recordMetric(
                    `${componentName.current}-mount`,
                    unmountTime - mountTime.current
                );
            };
        }
    }, [measureMount]);

    // Measure component update count
    useEffect(() => {
        if (measureUpdate) {
            updateCount.current += 1;
            performanceMonitor.recordMetric(
                `${componentName.current}-updates`,
                updateCount.current
            );
        }
    });

    // Debounced scroll handler
    const useDebouncedScroll = useCallback((callback, delay = 100) => {
        return PerformanceService.optimizeScroll(callback, delay);
    }, []);

    // Debounced resize handler
    const useDebouncedResize = useCallback((callback, delay = 250) => {
        return PerformanceService.optimizeResize(callback, delay);
    }, []);

    // Cached API call
    const useCachedApi = useCallback(async (key, fetchFn, ttl = 300) => {
        if (!cacheApi) {
            return fetchFn();
        }
        return PerformanceService.cacheApiResponse(key, fetchFn, ttl);
    }, [cacheApi]);

    // Get performance metrics
    const getMetrics = useCallback(() => {
        return performanceMonitor.getMetrics();
    }, []);

    // Start performance monitoring
    const startMonitoring = useCallback(() => {
        performanceMonitor.start();
    }, []);

    // Stop performance monitoring
    const stopMonitoring = useCallback(() => {
        performanceMonitor.stop();
    }, []);

    // Set component name for metrics
    const setComponentName = useCallback((name) => {
        componentName.current = name;
    }, []);

    return {
        useDebouncedScroll,
        useDebouncedResize,
        useCachedApi,
        getMetrics,
        startMonitoring,
        stopMonitoring,
        setComponentName
    };
}; 