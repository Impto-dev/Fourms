import { createTheme } from '@mui/material/styles';
import {
  generateAccessiblePalette,
  getAccessibleTextColor,
  meetsContrastRequirements,
} from '../utils/colorContrast';

// Base colors
const primaryColor = '#1976d2';
const secondaryColor = '#dc004e';
const errorColor = '#d32f2f';
const warningColor = '#ed6c02';
const infoColor = '#0288d1';
const successColor = '#2e7d32';

// Generate accessible color palettes
const primaryPalette = generateAccessiblePalette(primaryColor);
const secondaryPalette = generateAccessiblePalette(secondaryColor);
const errorPalette = generateAccessiblePalette(errorColor);
const warningPalette = generateAccessiblePalette(warningColor);
const infoPalette = generateAccessiblePalette(infoColor);
const successPalette = generateAccessiblePalette(successColor);

// Create accessible theme
const theme = createTheme({
  palette: {
    primary: {
      main: primaryPalette[2].color,
      light: primaryPalette[1].color,
      dark: primaryPalette[3].color,
      contrastText: primaryPalette[2].textColor,
    },
    secondary: {
      main: secondaryPalette[2].color,
      light: secondaryPalette[1].color,
      dark: secondaryPalette[3].color,
      contrastText: secondaryPalette[2].textColor,
    },
    error: {
      main: errorPalette[2].color,
      light: errorPalette[1].color,
      dark: errorPalette[3].color,
      contrastText: errorPalette[2].textColor,
    },
    warning: {
      main: warningPalette[2].color,
      light: warningPalette[1].color,
      dark: warningPalette[3].color,
      contrastText: warningPalette[2].textColor,
    },
    info: {
      main: infoPalette[2].color,
      light: infoPalette[1].color,
      dark: infoPalette[3].color,
      contrastText: infoPalette[2].textColor,
    },
    success: {
      main: successPalette[2].color,
      light: successPalette[1].color,
      dark: successPalette[3].color,
      contrastText: successPalette[2].textColor,
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          padding: '8px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryPalette[2].color,
            },
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: primaryPalette[2].color,
          textDecoration: 'underline',
          '&:hover': {
            color: primaryPalette[3].color,
          },
        },
      },
    },
  },
});

export default theme; 