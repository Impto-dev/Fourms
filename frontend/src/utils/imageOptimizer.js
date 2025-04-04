import React from 'react';
import { Box } from '@mui/material';

const ImageOptimizer = ({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  style,
  loading = 'lazy',
  placeholder = null,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = (e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    setIsLoading(false);
    if (onError) onError(e);
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!sizes) return null;
    return sizes
      .map((size) => `${src}?width=${size} ${size}w`)
      .join(', ');
  };

  return (
    <Box
      position="relative"
      width={width}
      height={height}
      className={className}
      style={style}
    >
      {isLoading && placeholder && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {placeholder}
        </Box>
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        srcSet={generateSrcSet()}
        sizes={sizes ? sizes.map(size => `${size}px`).join(', ') : undefined}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </Box>
  );
};

export default ImageOptimizer; 