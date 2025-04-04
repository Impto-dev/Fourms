import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Colorize, SwapHoriz } from '@mui/icons-material';
import { meetsContrastRequirements } from '../../utils/colorContrast';

const ColorContrastTester = () => {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#FFFFFF');
  const [swapColors, setSwapColors] = useState(false);

  const handleColorChange = (color, setColor) => {
    if (color.startsWith('#')) {
      setColor(color);
    } else {
      setColor('#' + color);
    }
  };

  const handleSwapColors = () => {
    setSwapColors(!swapColors);
    const temp = foreground;
    setForeground(background);
    setBackground(temp);
  };

  const contrastRatio = meetsContrastRequirements(
    swapColors ? background : foreground,
    swapColors ? foreground : background,
    'AA',
    'normal'
  );

  const largeTextContrast = meetsContrastRequirements(
    swapColors ? background : foreground,
    swapColors ? foreground : background,
    'AA',
    'large'
  );

  const aaaContrast = meetsContrastRequirements(
    swapColors ? background : foreground,
    swapColors ? foreground : background,
    'AAA',
    'normal'
  );

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Color Contrast Tester
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Foreground Color"
            value={swapColors ? background : foreground}
            onChange={(e) =>
              handleColorChange(
                e.target.value,
                swapColors ? setBackground : setForeground
              )
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Colorize />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Background Color"
            value={swapColors ? foreground : background}
            onChange={(e) =>
              handleColorChange(
                e.target.value,
                swapColors ? setForeground : setBackground
              )
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Colorize />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" mb={2}>
            <IconButton onClick={handleSwapColors} color="primary">
              <SwapHoriz />
            </IconButton>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box
            sx={{
              p: 3,
              borderRadius: 1,
              backgroundColor: swapColors ? foreground : background,
              color: swapColors ? background : foreground,
            }}
          >
            <Typography variant="body1">
              This is sample text to demonstrate the contrast between the foreground
              and background colors.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Contrast Results:
            </Typography>
            <Typography
              variant="body2"
              color={contrastRatio ? 'success.main' : 'error.main'}
            >
              WCAG AA (Normal Text): {contrastRatio ? 'Pass' : 'Fail'}
            </Typography>
            <Typography
              variant="body2"
              color={largeTextContrast ? 'success.main' : 'error.main'}
            >
              WCAG AA (Large Text): {largeTextContrast ? 'Pass' : 'Fail'}
            </Typography>
            <Typography
              variant="body2"
              color={aaaContrast ? 'success.main' : 'error.main'}
            >
              WCAG AAA: {aaaContrast ? 'Pass' : 'Fail'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ColorContrastTester; 