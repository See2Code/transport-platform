import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Invoice, InvoiceItem, YOUR_COMPANY_DETAILS } from '../types/invoices';

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

const InvoicesPage: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [newInvoiceCustomer, setNewInvoiceCustomer] = useState({
    name: '', address: '', city: '', zip: '', country: 'Slovensko', ico: '', dic: '', ic_dph: '',
  });
  const [newInvoiceItems, setNewInvoiceItems] = useState<InvoiceItem[]>([
    { id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [newInvoiceDates, setNewInvoiceDates] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    taxableSupplyDate: new Date().toISOString().split('T')[0],
  });
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');
  const [vatRate, setVatRate] = useState<number>(20);

  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;
    return { subtotal, vatAmount, totalAmount };
  };

  const { subtotal, vatAmount, totalAmount } = calculateTotals(newInvoiceItems);

  const handleCustomerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInvoiceCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInvoiceDates(prev => ({ ...prev, [name]: value }));
  };

  const handleVatRateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVatRate(parseFloat(e.target.value) || 0);
  };

  const handleItemChange = (index: number, field: keyof Omit<InvoiceItem, 'id' | 'total'>, value: string | number) => {
    const updatedItems = [...newInvoiceItems];
    const item = updatedItems[index];

    // @ts-ignore
    item[field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      item.quantity = field === 'quantity' ? Number(value) : item.quantity;
      item.unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
      item.total = (item.quantity || 0) * (item.unitPrice || 0);
    }

    setNewInvoiceItems(updatedItems);
  };

  const addItem = () => {
    setNewInvoiceItems([
      ...newInvoiceItems,
      { id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    if (newInvoiceItems.length <= 1) return;
    const updatedItems = newInvoiceItems.filter((_, i) => i !== index);
    setNewInvoiceItems(updatedItems);
  };

  const generateInvoiceNumber = (): string => {
    const year = new Date().getFullYear();
    const nextId = invoicesList.length + 1;
    return `${year}${nextId.toString().padStart(4, '0')}`;
  };

  const handleCreateInvoice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newInvoiceNumber = generateInvoiceNumber();

    const finalInvoice: Invoice = {
      id: newInvoiceNumber,
      invoiceNumber: newInvoiceNumber,
      issueDate: newInvoiceDates.issueDate,
      dueDate: newInvoiceDates.dueDate,
      taxableSupplyDate: newInvoiceDates.taxableSupplyDate,
      supplier: YOUR_COMPANY_DETAILS,
      customer: newInvoiceCustomer,
      items: newInvoiceItems.map(item => ({ ...item })),
      subtotal: subtotal,
      vatRate: vatRate,
      vatAmount: vatAmount,
      totalAmount: totalAmount,
      variableSymbol: newInvoiceNumber,
      notes: newInvoiceNotes,
    };

    setInvoicesList(prevList => [...prevList, finalInvoice]);

    // Reset formulára
    setNewInvoiceCustomer({ name: '', address: '', city: '', zip: '', country: 'Slovensko', ico: '', dic: '', ic_dph: '' });
    setNewInvoiceItems([{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setNewInvoiceDates({
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      taxableSupplyDate: new Date().toISOString().split('T')[0],
    });
    setNewInvoiceNotes('');
    setVatRate(20);

    console.log('Nová faktúra vytvorená:', finalInvoice);
    alert(`Faktúra ${newInvoiceNumber} bola vytvorená a pridaná do zoznamu.`);
  };

  return (
    <StyledPaper>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Správa Faktúr
      </Typography>

      <form onSubmit={handleCreateInvoice}>
        <StyledFieldset>
          <StyledLegend>Odberateľ</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Názov firmy"
                name="name"
                value={newInvoiceCustomer.name}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Ulica a číslo"
                name="address"
                value={newInvoiceCustomer.address}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Mesto"
                name="city"
                value={newInvoiceCustomer.city}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="PSČ"
                name="zip"
                value={newInvoiceCustomer.zip}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Krajina"
                name="country"
                value={newInvoiceCustomer.country}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="IČO"
                name="ico"
                value={newInvoiceCustomer.ico}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="DIČ"
                name="dic"
                value={newInvoiceCustomer.dic}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="IČ DPH"
                name="ic_dph"
                value={newInvoiceCustomer.ic_dph}
                onChange={handleCustomerChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </StyledFieldset>

        <StyledFieldset>
          <StyledLegend>Dátumy a DPH</StyledLegend>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Dátum vystavenia"
                name="issueDate"
                value={newInvoiceDates.issueDate}
                onChange={handleDateChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Dátum splatnosti"
                name="dueDate"
                value={newInvoiceDates.dueDate}
                onChange={handleDateChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Dátum dodania (DUZP)"
                name="taxableSupplyDate"
                value={newInvoiceDates.taxableSupplyDate}
                onChange={handleDateChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="number"
                label="Sadzba DPH (%)"
                name="vatRate"
                value={vatRate}
                onChange={handleVatRateChange}
                variant="outlined"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </StyledFieldset>

        <StyledFieldset>
          <StyledLegend>Položky Faktúry</StyledLegend>
          {newInvoiceItems.map((item, index) => (
            <Grid container spacing={2} key={item.id} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  required
                  label="Popis položky"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Množstvo"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                  variant="outlined"
                  inputProps={{ min: 0, step: "any" }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Jedn. cena (€)"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                  variant="outlined"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Suma (€)"
                  value={item.total.toFixed(2)}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                {newInvoiceItems.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => removeItem(index)}
                    sx={{ height: '100%', width: '100%' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={addItem}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Pridať ďalšiu položku
          </Button>
        </StyledFieldset>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Poznámka"
              value={newInvoiceNotes}
              onChange={(e) => setNewInvoiceNotes(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Základ DPH: {subtotal.toFixed(2)} €
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                DPH ({vatRate}%): {vatAmount.toFixed(2)} €
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Celkom k úhrade: {totalAmount.toFixed(2)} €
              </Typography>
            </Box>
          </Grid>
        </Grid>

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
          Vytvoriť a uložiť faktúru
        </Button>
      </form>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Zoznam Vytvorených Faktúr
      </Typography>
      
      {invoicesList.length === 0 ? (
        <Typography color="text.secondary">
          Zatiaľ neboli vytvorené žiadne faktúry.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Číslo faktúry</TableCell>
                <TableCell>Dátum vystavenia</TableCell>
                <TableCell>Odberateľ</TableCell>
                <TableCell align="right">Suma (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoicesList.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.customer.name}</TableCell>
                  <TableCell align="right">{invoice.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </StyledPaper>
  );
};

export default InvoicesPage; 