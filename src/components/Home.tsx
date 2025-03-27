import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  styled,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Styled komponenty
const LogoContainer = styled(Box)({
  width: '150px',
  height: 'auto',
  marginBottom: '20px',
  opacity: 0.8,
  transition: 'opacity 0.3s ease-in-out',
  '&:hover': {
    opacity: 1,
  },
});

const LogoImage = styled('img')<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  width: '100%',
  height: 'auto',
  filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  padding: '15px 40px',
  fontSize: '1.1rem',
  width: '100%',
  maxWidth: '300px',
  marginBottom: '20px',
  borderRadius: '12px',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const GreenGradientButton = styled(GradientButton)({
  background: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
  color: 'white',
});

const OrangeGradientButton = styled(GradientButton)({
  background: 'linear-gradient(135deg, #ff9f43 0%, #ffa502 100%)',
  color: 'white',
});

const StyledBox = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  background: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  borderRadius: '20px',
  padding: '32px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  backdropFilter: 'blur(20px)',
  boxShadow: isDarkMode 
    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: isDarkMode 
      ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
      : '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
  '@media (max-width: 600px)': {
    padding: '24px',
  }
}));

const AnimatedBox = styled(Box)({
  animation: 'fadeIn 0.6s ease-out',
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
});

function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <StyledBox isDarkMode={isDarkMode}>
          <AnimatedBox
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 6
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <LogoImage src="/AESA black.svg" alt="AESA Logo" isDarkMode={isDarkMode} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                textAlign: 'center',
                color: isDarkMode ? '#ffffff' : '#000000',
                fontWeight: 600,
                mb: 4
              }}
            >
              CORE
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                maxWidth: '600px'
              }}
            >
              Komplexné riešenie pre správu vašej dopravnej spoločnosti
            </Typography>
          </AnimatedBox>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <GreenGradientButton
              onClick={() => navigate('/login')}
              variant="contained"
            >
              Prihlásiť sa
            </GreenGradientButton>

            <OrangeGradientButton
              onClick={() => navigate('/register')}
              variant="contained"
            >
              Registrovať firmu
            </OrangeGradientButton>
          </Box>

          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                mb: 2
              }}
            >
              Výhody nášho systému:
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
                textAlign: 'left'
              }}
            >
              {[
                'Správa vozového parku',
                'Evidencia vodičov',
                'Plánovanie trás',
                'Sledovanie nákladov',
                'Tímová spolupráca',
                'Automatické reporty',
                'Jednoduchá fakturácia',
                'Mobilná aplikácia'
              ].map((feature, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    '&:before': {
                      content: '""',
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: index % 2 === 0 ? '#ff9f43' : '#ff6b6b',
                      marginRight: '10px'
                    }
                  }}
                >
                  {feature}
                </Typography>
              ))}
            </Box>
          </Box>
        </StyledBox>
      </Box>
    </Container>
  );
}

export default Home; 