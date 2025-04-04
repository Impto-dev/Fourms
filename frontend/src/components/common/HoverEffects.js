import React from 'react';
import { Box, useTheme } from '@mui/material';
import { useAnimation } from '../../utils/animations';

const HoverEffects = ({
  children,
  effect = 'scale',
  scale = 1.05,
  elevation = 4,
  transition = 'all 0.2s ease-in-out',
  ...props
}) => {
  const theme = useTheme();
  const { animationStyle } = useAnimation(effect);

  return (
    <Box
      sx={{
        transition,
        '&:hover': {
          transform: `scale(${scale})`,
          boxShadow: theme.shadows[elevation],
          ...animationStyle,
        },
        '&:focus': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
        },
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
        },
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default HoverEffects; 