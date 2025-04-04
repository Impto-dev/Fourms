import { keyframes } from '@mui/material/styles';

// Fade animations
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// Slide animations
export const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(20px);
    opacity: 0;
  }
`;

// Scale animations
export const scaleIn = keyframes`
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

export const scaleOut = keyframes`
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
`;

// Rotate animations
export const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Bounce animations
export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

// Shake animations
export const shake = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
`;

// Animation presets
export const animationPresets = {
  fadeIn: {
    animation: `${fadeIn} 0.3s ease-in-out`,
  },
  fadeOut: {
    animation: `${fadeOut} 0.3s ease-in-out`,
  },
  slideIn: {
    animation: `${slideIn} 0.3s ease-out`,
  },
  slideOut: {
    animation: `${slideOut} 0.3s ease-in`,
  },
  scaleIn: {
    animation: `${scaleIn} 0.2s ease-out`,
  },
  scaleOut: {
    animation: `${scaleOut} 0.2s ease-in`,
  },
  rotate: {
    animation: `${rotate} 1s linear infinite`,
  },
  bounce: {
    animation: `${bounce} 1s ease infinite`,
  },
  shake: {
    animation: `${shake} 0.5s ease-in-out`,
  },
};

// Animation hooks
export const useAnimation = (animation, duration = 300) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  };

  return {
    isAnimating,
    startAnimation,
    animationStyle: isAnimating ? animationPresets[animation] : {},
  };
};

// Transition presets
export const transitionPresets = {
  default: {
    transition: 'all 0.3s ease-in-out',
  },
  fast: {
    transition: 'all 0.15s ease-in-out',
  },
  slow: {
    transition: 'all 0.5s ease-in-out',
  },
  bounce: {
    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}; 