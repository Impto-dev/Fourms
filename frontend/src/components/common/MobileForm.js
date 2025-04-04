import React from 'react';
import {
  TextField,
  Button,
  Paper,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  Switch,
  Slider,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Clear as ClearIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const MobileForm = ({
  title,
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false,
  error = null,
  success = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = React.useState({});
  const [showPassword, setShowPassword] = React.useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field.name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field) => {
    const commonProps = {
      fullWidth: true,
      margin: 'normal',
      size: isMobile ? 'small' : 'medium',
      sx: {
        '& .MuiInputBase-root': {
          borderRadius: 2,
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderWidth: 2,
          },
          '&:hover fieldset': {
            borderWidth: 2,
          },
          '&.Mui-focused fieldset': {
            borderWidth: 2,
          },
        },
      },
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'tel':
        return (
          <TextField
            {...commonProps}
            type={field.type}
            label={field.label}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            error={!!error?.[field.name]}
            helperText={error?.[field.name]}
            InputProps={{
              endAdornment: formData[field.name] && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleChange(field, '')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        );

      case 'password':
        return (
          <TextField
            {...commonProps}
            type={showPassword[field.name] ? 'text' : 'password'}
            label={field.label}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            required={field.required}
            error={!!error?.[field.name]}
            helperText={error?.[field.name]}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(prev => ({
                      ...prev,
                      [field.name]: !prev[field.name]
                    }))}
                    edge="end"
                  >
                    {showPassword[field.name] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        );

      case 'select':
        return (
          <FormControl
            fullWidth
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            error={!!error?.[field.name]}
          >
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              label={field.label}
              required={field.required}
            >
              {field.options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error?.[field.name] && (
              <Typography color="error" variant="caption">
                {error[field.name]}
              </Typography>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData[field.name] || false}
                onChange={(e) => handleChange(field, e.target.checked)}
                color="primary"
              />
            }
            label={field.label}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
            >
              {field.options.map(option => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={formData[field.name] || false}
                onChange={(e) => handleChange(field, e.target.checked)}
                color="primary"
              />
            }
            label={field.label}
          />
        );

      case 'slider':
        return (
          <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
            <Typography gutterBottom>{field.label}</Typography>
            <Slider
              value={formData[field.name] || field.min || 0}
              onChange={(e, value) => handleChange(field, value)}
              min={field.min}
              max={field.max}
              step={field.step}
              marks={field.marks}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case 'autocomplete':
        return (
          <Autocomplete
            multiple={field.multiple}
            options={field.options}
            value={formData[field.name] || (field.multiple ? [] : null)}
            onChange={(e, value) => handleChange(field, value)}
            renderInput={(params) => (
              <TextField
                {...params}
                {...commonProps}
                label={field.label}
                required={field.required}
                error={!!error?.[field.name]}
                helperText={error?.[field.name]}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.label || option}
                  {...getTagProps({ index })}
                  size={isMobile ? 'small' : 'medium'}
                />
              ))
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: isMobile ? 2 : 3,
        borderRadius: 2,
        maxWidth: 600,
        mx: 'auto',
        mt: 2,
        mb: 4,
      }}
    >
      {title && (
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{ textAlign: 'center', mb: 3 }}
        >
          {title}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map((field) => (
            <Box key={field.name}>
              {renderField(field)}
            </Box>
          ))}

          {error?.general && (
            <Typography color="error" align="center">
              {error.general}
            </Typography>
          )}

          {success && (
            <Typography color="success.main" align="center">
              {success}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
              py: isMobile ? 1 : 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: isMobile ? '1rem' : '1.1rem',
            }}
          >
            {loading ? 'Loading...' : submitText}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default MobileForm; 