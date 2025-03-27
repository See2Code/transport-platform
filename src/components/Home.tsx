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

const LogoImage = styled('img')({
  width: '100%',
  height: 'auto',
  filter: 'brightness(0)',
});

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

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '20px',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
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
        <StyledPaper elevation={3}>
          <AnimatedBox
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 6
            }}
          >
            <LogoContainer>
              <LogoImage src="/AESA black.svg" alt="AESA Logo" />
            </LogoContainer>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ff9f43 0%, #ffbe76 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CORE
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                color: 'rgba(0, 0, 0, 0.7)',
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
                color: 'rgba(0, 0, 0, 0.7)',
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
                    color: 'rgba(0, 0, 0, 0.7)',
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
        </StyledPaper>
      </Box>
    </Container>
  );
}

export default Home; 