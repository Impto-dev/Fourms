import { useState, useRef, useEffect } from 'react';
import { KEYS } from '../utils/accessibility';

const useKeyboardNavigation = ({
  items = [],
  initialIndex = 0,
  onSelect,
  onNavigate,
  loop = true,
  orientation = 'vertical',
  disabled = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // Update item refs when items change
  useEffect(() => {
    itemRefs.current = items.map((_, i) => itemRefs.current[i] || null);
  }, [items]);

  // Focus management
  const focusItem = (index) => {
    if (itemRefs.current[index]) {
      itemRefs.current[index].focus();
    }
  };

  // Navigation handlers
  const handleKeyDown = (e) => {
    if (disabled) return;

    let newIndex = activeIndex;

    switch (e.key) {
      case KEYS.ARROW_UP:
        if (orientation === 'vertical') {
          e.preventDefault();
          newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? items.length - 1 : activeIndex;
        }
        break;

      case KEYS.ARROW_DOWN:
        if (orientation === 'vertical') {
          e.preventDefault();
          newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : loop ? 0 : activeIndex;
        }
        break;

      case KEYS.ARROW_LEFT:
        if (orientation === 'horizontal') {
          e.preventDefault();
          newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? items.length - 1 : activeIndex;
        }
        break;

      case KEYS.ARROW_RIGHT:
        if (orientation === 'horizontal') {
          e.preventDefault();
          newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : loop ? 0 : activeIndex;
        }
        break;

      case KEYS.HOME:
        e.preventDefault();
        newIndex = 0;
        break;

      case KEYS.END:
        e.preventDefault();
        newIndex = items.length - 1;
        break;

      case KEYS.ENTER:
      case KEYS.SPACE:
        e.preventDefault();
        if (onSelect) {
          onSelect(items[activeIndex], activeIndex);
        }
        return;

      default:
        return;
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      focusItem(newIndex);
      if (onNavigate) {
        onNavigate(items[newIndex], newIndex);
      }
    }
  };

  // Focus trap
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = (e) => {
      if (!container.contains(e.target)) {
        focusItem(activeIndex);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [activeIndex]);

  // Set initial focus
  useEffect(() => {
    if (items.length > 0) {
      focusItem(activeIndex);
    }
  }, []);

  return {
    containerRef,
    itemRefs,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    focusItem,
  };
};

export default useKeyboardNavigation; 