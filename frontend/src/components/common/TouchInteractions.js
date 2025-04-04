import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

const TouchInteractions = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  longPressDuration = 500,
  doubleTapDelay = 300,
  swipeThreshold = 50,
}) => {
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const tapTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(e);
      }
    }, longPressDuration);
  };

  const handleTouchMove = (e) => {
    // Clear long press timer if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (!touchStartRef.current || !touchEndRef.current) return;

    const { x: startX, y: startY } = touchStartRef.current;
    const { x: endX, y: endY } = touchEndRef.current;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Check for swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e);
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e);
        }
      }
    } else {
      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e);
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e);
        }
      }
    }

    // Check for taps
    const currentTime = Date.now();
    const tapLength = currentTime - touchStartRef.current.time;

    if (tapLength < 300) { // Consider it a tap if less than 300ms
      if (currentTime - lastTapRef.current < doubleTapDelay) {
        // Double tap
        if (onDoubleTap) {
          onDoubleTap(e);
        }
        lastTapRef.current = 0;
      } else {
        // Single tap
        if (onTap) {
          onTap(e);
        }
        lastTapRef.current = currentTime;
      }
    }

    // Reset touch points
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const handleTouchCancel = () => {
    // Clear timers on touch cancel
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup timers on unmount
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      sx={{
        touchAction: 'none', // Prevent default touch behaviors
        WebkitTouchCallout: 'none', // Prevent iOS callout
        WebkitUserSelect: 'none', // Prevent text selection
        userSelect: 'none',
      }}
    >
      {children}
    </Box>
  );
};

export default TouchInteractions; 