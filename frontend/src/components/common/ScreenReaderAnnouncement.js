import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { getLiveRegionAttributes } from '../../utils/accessibility';

const ScreenReaderAnnouncement = ({ message, priority = 'polite' }) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // Clear the announcement after a short delay
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Box
      component="div"
      {...getLiveRegionAttributes({
        live: priority,
        atomic: true,
      })}
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(1px, 1px, 1px, 1px)',
        whiteSpace: 'nowrap',
      }}
    >
      {announcement}
    </Box>
  );
};

export default ScreenReaderAnnouncement; 