import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
}));

const Sidebar = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    width: '300px',
    padding: theme.spacing(3),
  },
}));

const ResponsiveLayout = ({ mainContent, sidebar, header, footer }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <StyledBox>
      {header}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          flex: 1,
          width: '100%',
        }}
      >
        {sidebar && (
          <Sidebar
            sx={{
              order: isTablet ? 2 : 1,
              borderRight: isTablet ? 'none' : `1px solid ${theme.palette.divider}`,
              borderTop: isTablet ? `1px solid ${theme.palette.divider}` : 'none',
            }}
          >
            {sidebar}
          </Sidebar>
        )}
        <MainContent
          sx={{
            order: isTablet ? 1 : 2,
            maxWidth: isMobile ? '100%' : 'calc(100% - 300px)',
          }}
        >
          {mainContent}
        </MainContent>
      </Box>
      {footer}
    </StyledBox>
  );
};

export default ResponsiveLayout; 