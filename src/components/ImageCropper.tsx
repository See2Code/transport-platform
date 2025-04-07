import React, { useState, useCallback, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  Typography,
  IconButton,
  styled
} from '@mui/material';
import { ZoomIn, ZoomOut, Close as CloseIcon } from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';

interface ImageCropperProps {
  open: boolean;
  image: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  aspectRatio?: number;
  circular?: boolean;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    backgroundColor: 'rgba(35, 35, 66, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    margin: '16px',
    overflow: 'hidden'
  }
}));

const DialogHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'linear-gradient(180deg, rgba(255, 159, 67, 0.1) 0%, rgba(255, 159, 67, 0.05) 100%)'
}));

const CropContainer = styled(Box)(({ theme }) => ({
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  '& .ReactCrop': {
    maxHeight: '60vh',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    overflow: 'hidden',
    '& .ReactCrop__crop-selection': {
      borderColor: '#ff9f43',
      borderWidth: '2px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    },
    '& .ReactCrop__drag-handle': {
      backgroundColor: '#ff9f43',
      borderRadius: '50%',
      width: '16px',
      height: '16px',
      border: '2px solid white'
    },
    '& img': {
      maxWidth: '100%',
      maxHeight: '60vh',
      objectFit: 'contain'
    }
  }
}));

const Controls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '0 24px',
  width: '100%',
  maxWidth: '400px'
}));

const ZoomControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  padding: '8px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: '#ff9f43',
  backgroundColor: 'rgba(255, 159, 67, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.2)'
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
  transition: 'all 0.3s ease',
  '&.MuiButton-contained': {
    backgroundColor: '#ff9f43',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#f7b067',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(255, 159, 67, 0.3)'
    }
  },
  '&.MuiButton-outlined': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  }
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: '#ff9f43',
  '& .MuiSlider-thumb': {
    width: '16px',
    height: '16px',
    backgroundColor: '#ff9f43',
    '&:hover, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(255, 159, 67, 0.2)'
    }
  },
  '& .MuiSlider-rail': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '& .MuiSlider-track': {
    backgroundColor: '#ff9f43'
  }
}));

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number | undefined) {
  if (!aspect) {
    // Pre voľný pomer strán použijeme predvolený obdĺžnik
    return {
      unit: '%' as const,
      x: 10,
      y: 10,
      width: 80,
      height: 50
    };
  }

  const cropWidth = Math.min(mediaWidth, mediaHeight * aspect);
  const cropHeight = cropWidth / aspect;

  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: (cropWidth / mediaWidth) * 100,
        height: (cropHeight / mediaHeight) * 100
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function ImageCropper({ open, image, onClose, onSave, aspectRatio, circular = false }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [zoom, setZoom] = useState<number>(1);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const { isDarkMode } = useThemeMode();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, aspectRatio);
    setCrop(crop);
    setCompletedCrop({
      unit: 'px',
      x: (width * (crop.x || 0)) / 100,
      y: (height * (crop.y || 0)) / 100,
      width: (width * crop.width) / 100,
      height: (height * crop.height) / 100
    });
  }, [aspectRatio]);

  const handleZoomChange = (event: Event, newValue: number | number[]) => {
    setZoom(newValue as number);
  };

  const generateCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Použijeme presné rozmery z cropperu
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Ak je kruhový výrez, pripravíme masku
    if (circular) {
      ctx.beginPath();
      ctx.arc(completedCrop.width / 2, completedCrop.height / 2, completedCrop.width / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // Výpočet správneho škálovania
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // Vykreslenie orezaného obrázka
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Konverzia na base64
    const base64Image = canvas.toDataURL('image/png', 1.0);
    onSave(base64Image);
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogHeader>
        <Typography variant="h6" sx={{ color: 'white' }}>
          {aspectRatio ? 'Upraviť profilovú fotku' : 'Upraviť logo firmy'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogHeader>

      <DialogContent>
        <CropContainer>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={circular}
          >
            <img
              ref={imgRef}
              src={image}
              onLoad={onImageLoad}
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
            />
          </ReactCrop>
          {!aspectRatio && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
              Odporúčaná veľkosť: 400x240px
            </Typography>
          )}
        </CropContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <StyledButton variant="outlined" onClick={onClose}>
          Zrušiť
        </StyledButton>
        <StyledButton variant="contained" onClick={generateCroppedImage}>
          Uložiť
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
}

export default ImageCropper; 