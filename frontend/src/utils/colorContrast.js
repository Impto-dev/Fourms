// Convert hex color to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate relative luminance
const getRelativeLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio
const getContrastRatio = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

// Check if contrast ratio meets WCAG requirements
export const meetsContrastRequirements = (color1, color2, level = 'AA', size = 'normal') => {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

// Find accessible text color for a background
export const getAccessibleTextColor = (backgroundColor, options = {}) => {
  const {
    lightColor = '#FFFFFF',
    darkColor = '#000000',
    level = 'AA',
    size = 'normal',
  } = options;

  const lightContrast = getContrastRatio(backgroundColor, lightColor);
  const darkContrast = getContrastRatio(backgroundColor, darkColor);

  if (level === 'AAA') {
    const requiredRatio = size === 'large' ? 4.5 : 7;
    return lightContrast >= requiredRatio ? lightColor : darkColor;
  }

  const requiredRatio = size === 'large' ? 3 : 4.5;
  return lightContrast >= requiredRatio ? lightColor : darkColor;
};

// Generate accessible color palette
export const generateAccessiblePalette = (baseColor, options = {}) => {
  const {
    steps = 5,
    minContrast = 4.5,
    lightColor = '#FFFFFF',
    darkColor = '#000000',
  } = options;

  const palette = [];
  const baseRgb = hexToRgb(baseColor);

  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    const color = {
      r: Math.round(baseRgb.r * (1 - factor) + (factor * 255)),
      g: Math.round(baseRgb.g * (1 - factor) + (factor * 255)),
      b: Math.round(baseRgb.b * (1 - factor) + (factor * 255)),
    };

    const hex = `#${[color.r, color.g, color.b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')}`;

    const textColor = getAccessibleTextColor(hex, {
      lightColor,
      darkColor,
      level: 'AA',
      size: 'normal',
    });

    palette.push({
      color: hex,
      textColor,
      contrast: getContrastRatio(hex, textColor),
    });
  }

  return palette;
};

// Generate accessible color combinations
export const generateAccessibleCombinations = (colors, options = {}) => {
  const {
    minContrast = 4.5,
    includeText = true,
  } = options;

  const combinations = [];

  colors.forEach((color1) => {
    colors.forEach((color2) => {
      if (color1 !== color2) {
        const contrast = getContrastRatio(color1, color2);
        if (contrast >= minContrast) {
          combinations.push({
            background: color1,
            foreground: color2,
            contrast,
            textColor: includeText ? getAccessibleTextColor(color1) : null,
          });
        }
      }
    });
  });

  return combinations;
}; 