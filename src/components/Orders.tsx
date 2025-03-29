import React, { useState, ChangeEvent, FormEvent } from 'react';
import { OrderFormData } from '../types/orders';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.35)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const StyledFieldset = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  background: theme.palette.mode === 'dark'
    ? 'rgba(35, 35, 66, 0.35)'
    : 'rgba(245, 245, 245, 0.95)',
  border: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)'}`,
}));

const StyledLegend = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0, 1),
  color: theme.palette.primary.main,
  fontWeight: 600,
  fontSize: '1.1rem',
  marginBottom: theme.spacing(2),
}));

const OrdersForm: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [ordersList, setOrdersList] = useState<OrderFormData[]>([]);
  const [formData, setFormData] = useState<OrderFormData>({
    clientCompany: '',
    clientReference: '',
    loadingPlace_street: '',
    loadingPlace_city: '',
    loadingPlace_zip: '',
    loadingPlace_country: 'Slovensko',
    loadingDateTime: '',
    loadingContactPerson: '',
    unloadingPlace_street: '',
    unloadingPlace_city: '',
    unloadingPlace_zip: '',
    unloadingPlace_country: '',
    unloadingDateTime: '',
    unloadingContactPerson: '',
    goodsDescription: '',
    weightKg: '',
    dimensionsL: '',
    dimensionsW: '',
    dimensionsH: '',
    quantity: '',
    carrierCompany: '',
    carrierContact: '',
    carrierVehicleReg: '',
    carrierPrice: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Pridanie novej objednávky do zoznamu
      setOrdersList(prevList => [...prevList, { ...formData }]);
      
      // Reset formulára
      setFormData({
        clientCompany: '',
        clientReference: '',
        loadingPlace_street: '',
        loadingPlace_city: '',
        loadingPlace_zip: '',
        loadingPlace_country: 'Slovensko',
        loadingDateTime: '',
        loadingContactPerson: '',
        unloadingPlace_street: '',
        unloadingPlace_city: '',
        unloadingPlace_zip: '',
        unloadingPlace_country: '',
        unloadingDateTime: '',
        unloadingContactPerson: '',
        goodsDescription: '',
        weightKg: '',
        dimensionsL: '',
        dimensionsW: '',
        dimensionsH: '',
        quantity: '',
        carrierCompany: '',
        carrierContact: '',
        carrierVehicleReg: '',
        carrierPrice: '',
      });

      console.log('Odoslané dáta objednávky:', formData);
      alert('Objednávka bola vytvorená a pridaná do zoznamu.');
    } catch (error) {
      console.error('Chyba pri odosielaní objednávky:', error);
      alert('Nastala chyba pri odosielaní objednávky. Skúste to prosím znova.');
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Nová Objednávka Prepravy
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <StyledFieldset>
          <StyledLegend>Klient (Objednávateľ)</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Názov firmy klienta"
                name="clientCompany"
                value={formData.clientCompany}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Referencia klienta"
                name="clientReference"
                value={formData.clientReference}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </StyledFieldset>

        <StyledFieldset>
          <StyledLegend>Miesto a Čas Nakládky</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Ulica a číslo"
                name="loadingPlace_street"
                value={formData.loadingPlace_street}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Mesto"
                name="loadingPlace_city"
                value={formData.loadingPlace_city}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="PSČ"
                name="loadingPlace_zip"
                value={formData.loadingPlace_zip}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Krajina"
                name="loadingPlace_country"
                value={formData.loadingPlace_country}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="datetime-local"
                label="Dátum a čas nakládky"
                name="loadingDateTime"
                value={formData.loadingDateTime}
                onChange={handleChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kontaktná osoba (nakládka)"
                name="loadingContactPerson"
                value={formData.loadingContactPerson}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </StyledFieldset>

        <StyledFieldset>
          <StyledLegend>Miesto a Čas Vykládky</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Ulica a číslo"
                name="unloadingPlace_street"
                value={formData.unloadingPlace_street}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Mesto"
                name="unloadingPlace_city"
                value={formData.unloadingPlace_city}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="PSČ"
                name="unloadingPlace_zip"
                value={formData.unloadingPlace_zip}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Krajina"
                name="unloadingPlace_country"
                value={formData.unloadingPlace_country}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="datetime-local"
                label="Dátum a čas vykládky"
                name="unloadingDateTime"
                value={formData.unloadingDateTime}
                onChange={handleChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kontaktná osoba (vykládka)"
                name="unloadingContactPerson"
                value={formData.unloadingContactPerson}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </StyledFieldset>

        <StyledFieldset>
          <StyledLegend>Popis Tovaru</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Popis tovaru"
                name="goodsDescription"
                value={formData.goodsDescription}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Množstvo (napr. počet paliet)"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Váha (kg)"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                variant="outlined"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Dĺžka"
                  name="dimensionsL"
                  value={formData.dimensionsL}
                  onChange={handleChange}
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
                <Typography sx={{ color: 'text.secondary' }}>x</Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Šírka"
                  name="dimensionsW"
                  value={formData.dimensionsW}
                  onChange={handleChange}
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
                <Typography sx={{ color: 'text.secondary' }}>x</Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Výška"
                  name="dimensionsH"
                  value={formData.dimensionsH}
                  onChange={handleChange}
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Grid>
          </Grid>
        </StyledFieldset>

        <StyledFieldset>
          <StyledLegend>Dopravca (Vykonávateľ)</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Názov firmy dopravcu"
                name="carrierCompany"
                value={formData.carrierCompany}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kontakt na dopravcu"
                name="carrierContact"
                value={formData.carrierContact}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="EČV Vozidla"
                name="carrierVehicleReg"
                value={formData.carrierVehicleReg}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cena za prepravu (€)"
                name="carrierPrice"
                value={formData.carrierPrice}
                onChange={handleChange}
                variant="outlined"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
          </Grid>
        </StyledFieldset>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{
            mt: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1.1rem',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(255, 159, 67, 0.3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 24px rgba(255, 159, 67, 0.4)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          Vytvoriť Objednávku
        </Button>
      </form>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Zoznam Objednávok
      </Typography>
      
      {ordersList.length === 0 ? (
        <Typography color="text.secondary">
          Zatiaľ neboli vytvorené žiadne objednávky.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Klient</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell>Nakládka</TableCell>
                <TableCell>Vykládka</TableCell>
                <TableCell>Tovar</TableCell>
                <TableCell align="right">Cena (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersList.map((order, index) => (
                <TableRow key={index}>
                  <TableCell>{order.clientCompany}</TableCell>
                  <TableCell>{order.clientReference}</TableCell>
                  <TableCell>{order.loadingPlace_city}</TableCell>
                  <TableCell>{order.unloadingPlace_city}</TableCell>
                  <TableCell>{order.goodsDescription}</TableCell>
                  <TableCell align="right">{order.carrierPrice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </StyledPaper>
  );
};

export default OrdersForm; 