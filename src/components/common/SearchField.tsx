import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import styled from '@emotion/styled';

const colors = {
  primary: {
    main: '#1a1a2e',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  secondary: {
    main: '#ff6b6b',
    light: '#ff8787',
    dark: '#fa5252',
  },
  accent: {
    main: '#ff9f43',
    light: '#ffbe76',
    dark: '#f7b067',
  }
};

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      transition: 'all 0.2s ease-in-out',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 159, 67, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accent.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: colors.accent.main,
    },
    transition: 'all 0.2s ease-in-out',
    transform: 'translate(14px, 16px) scale(1)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)',
    }
  },
  '& .MuiInputBase-input': {
    color: '#ffffff',
    padding: '16px 14px',
    paddingRight: '42px',
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    }
  },
  '& .MuiInputAdornment-root': {
    position: 'absolute',
    right: '12px',
    height: '100%',
    maxHeight: 'none',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    '& .MuiSvgIcon-root': {
      fontSize: '20px',
      transition: 'color 0.2s ease-in-out',
    },
    '.Mui-focused &': {
      color: colors.accent.main,
    }
  },
});

interface SearchFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder,
  label,
}) => {
  return (
    <StyledTextField
      fullWidth
      label={label}
      variant="outlined"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchField; 