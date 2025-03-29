import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { Invoice, InvoiceItem, YOUR_COMPANY_DETAILS } from '../types/invoices';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const colors = {
  accent: {
    main: '#ff9f43',
    light: '#ffbe76',
    dark: '#f7b067',
  }
};

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: Function;
    lastAutoTable: {
      finalY: number;
    };
  }
}

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

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
});

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  }
}));

const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
  marginTop: '24px',
  marginBottom: '24px',
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: '80px',
  height: '4px',
  margin: '8px 0 24px',
  background: theme.palette.warning.main,
  borderRadius: '2px',
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  marginLeft: theme.spacing(2),
}));

const CreateButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  width: '100%',
  '&:hover': {
    backgroundColor: '#ffbe76',
  },
  '&:active': {
    backgroundColor: '#f7b067',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(255, 159, 67, 0.3)',
    color: 'rgba(255, 255, 255, 0.3)',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#ffbe76',
  },
  '&:active': {
    backgroundColor: '#f7b067',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(255, 159, 67, 0.3)',
    color: 'rgba(255, 255, 255, 0.3)',
  }
}));

const AddButton = styled(Button)({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#ffbe76',
  },
  marginTop: '16px',
});

const OrangeButton = styled(Button)({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  padding: '12px',
  width: '100%',
  marginTop: '24px',
  '&:hover': {
    backgroundColor: '#ffbe76',
  },
  '&:active': {
    backgroundColor: '#f7b067',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(255, 159, 67, 0.3)',
    color: 'rgba(255, 255, 255, 0.3)',
  }
});

const DownloadButton = styled(Button)({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#ffbe76',
  },
});

const StyledButton = styled(Button)({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#ffbe76',
  },
  '&:active': {
    backgroundColor: '#f7b067',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(255, 159, 67, 0.3)',
    color: 'rgba(255, 255, 255, 0.3)',
  }
});

const InvoicesPage: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [currentUser]);

  const fetchInvoices = async () => {
    if (!currentUser?.companyID) return;

    try {
      const q = query(
        collection(db, 'invoices'),
        where('companyID', '==', currentUser.companyID),
        orderBy('issueDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Invoice[];

      setInvoicesList(invoices);
    } catch (error) {
      console.error('Chyba pri načítaní faktúr:', error);
    }
  };

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

  const generatePDF = async (invoice: Invoice): Promise<Blob> => {
    const doc = new jsPDF();
    
    // Hlavička faktúry
    doc.setFontSize(20);
    doc.text('FAKTÚRA', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Číslo: ${invoice.invoiceNumber}`, 20, 30);
    
    // Údaje dodávateľa
    doc.text('Dodávateľ:', 20, 40);
    doc.setFontSize(10);
    doc.text([
      invoice.supplier.name,
      invoice.supplier.address,
      `${invoice.supplier.zip} ${invoice.supplier.city}`,
      `IČO: ${invoice.supplier.ico}`,
      `DIČ: ${invoice.supplier.dic}`,
      invoice.supplier.ic_dph ? `IČ DPH: ${invoice.supplier.ic_dph}` : '',
    ], 20, 50);
    
    // Údaje odberateľa
    doc.setFontSize(12);
    doc.text('Odberateľ:', 120, 40);
    doc.setFontSize(10);
    doc.text([
      invoice.customer.name,
      invoice.customer.address,
      `${invoice.customer.zip} ${invoice.customer.city}`,
      `IČO: ${invoice.customer.ico}`,
      `DIČ: ${invoice.customer.dic}`,
      invoice.customer.ic_dph ? `IČ DPH: ${invoice.customer.ic_dph}` : '',
    ], 120, 50);
    
    // Dátumy
    doc.setFontSize(10);
    doc.text([
      `Dátum vystavenia: ${invoice.issueDate}`,
      `Dátum splatnosti: ${invoice.dueDate}`,
      `Dátum dodania: ${invoice.taxableSupplyDate}`,
    ], 20, 90);
    
    // Položky faktúry
    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${item.unitPrice.toFixed(2)} €`,
      `${item.total.toFixed(2)} €`,
    ]);
    
    // @ts-ignore
    doc.autoTable({
      startY: 100,
      head: [['Popis', 'Množstvo', 'Jedn. cena', 'Spolu']],
      body: tableData,
    });
    
    // Sumár
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text([
      `Základ DPH: ${invoice.subtotal.toFixed(2)} €`,
      `DPH (${invoice.vatRate}%): ${invoice.vatAmount.toFixed(2)} €`,
      `Celkom k úhrade: ${invoice.totalAmount.toFixed(2)} €`,
    ], 150, finalY, { align: 'right' });
    
    // Platobné údaje
    doc.text([
      'Platobné údaje:',
      `IBAN: ${invoice.supplier.iban}`,
      `Variabilný symbol: ${invoice.variableSymbol}`,
    ], 20, finalY + 30);
    
    if (invoice.notes) {
      doc.text('Poznámka:', 20, finalY + 50);
      doc.text(invoice.notes, 20, finalY + 55);
    }
    
    return doc.output('blob');
  };

  const handleCreateInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser?.companyID) {
      alert('Nie ste prihlásený alebo nemáte priradenú firmu.');
      return;
    }

    const newInvoiceNumber = generateInvoiceNumber();

    const finalInvoice: Invoice = {
      id: newInvoiceNumber,
      invoiceNumber: newInvoiceNumber,
      companyID: currentUser.companyID,
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
      createdAt: Timestamp.now(),
      createdBy: currentUser.uid
    };

    try {
      // Uloženie faktúry do Firestore
      const docRef = await addDoc(collection(db, 'invoices'), finalInvoice);
      
      // Generovanie a uloženie PDF
      const pdfBlob = await generatePDF(finalInvoice);
      const storageRef = ref(storage, `invoices/${docRef.id}/${finalInvoice.invoiceNumber}.pdf`);
      await uploadBytes(storageRef, pdfBlob);
      
      // Aktualizácia zoznamu faktúr
      setInvoicesList(prevList => [...prevList, { ...finalInvoice, id: docRef.id }]);

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

      alert(`Faktúra ${newInvoiceNumber} bola úspešne vytvorená a uložená.`);
    } catch (error) {
      console.error('Chyba pri vytváraní faktúry:', error);
      alert('Nastala chyba pri vytváraní faktúry. Skúste to prosím znova.');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const storageRef = ref(storage, `invoices/${invoice.id}/${invoice.invoiceNumber}.pdf`);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Otvorenie PDF v novom okne
      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri sťahovaní PDF. Skúste to prosím znova.');
    }
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>
          Správa faktúr
        </PageTitle>
      </PageHeader>
      <PageDescription>
        Vytvárajte a spravujte faktúry pre vašich zákazníkov
      </PageDescription>

      <StyledPaper>
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
                      sx={{
                        height: '100%',
                        width: '100%',
                        color: '#ff9f43',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 159, 67, 0.1)',
                        }
                      }}
                      onClick={() => removeItem(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            ))}
            <StyledButton
              startIcon={<AddIcon />}
              onClick={addItem}
              variant="contained"
              sx={{ mt: 2 }}
            >
              Pridať ďalšiu položku
            </StyledButton>
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

          <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
            <Grid item>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  backgroundColor: colors.accent.main,
                  color: '#ffffff',
                  padding: '8px 24px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 4px 12px rgba(255, 159, 67, 0.3)',
                  '&:hover': {
                    backgroundColor: colors.accent.light,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(255, 159, 67, 0.4)',
                  },
                  '@media (max-width: 600px)': {
                    width: '100%',
                    justifyContent: 'center'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Vytvoriť a uložiť faktúru'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>
          Zoznam vytvorených faktúr
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
                  <TableCell align="center">Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoicesList.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell align="right">{invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <StyledButton
                        onClick={() => handleDownloadPDF(invoice)}
                        variant="contained"
                        disabled={loading}
                        sx={{ width: 'auto' }}
                      >
                        {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Stiahnuť faktúru'}
                      </StyledButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>
    </PageWrapper>
  );
};

export default InvoicesPage; 