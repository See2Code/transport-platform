import React, { useState, useEffect, ChangeEvent, FormEvent, FC } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Invoice, InvoiceItem, YOUR_COMPANY_DETAILS } from '../types/invoices';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, downloadFile } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

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
    autoTable: (options: any) => void;
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
  color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43',
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

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const InvoicesPage: FC = () => {
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
  const [vatRate, setVatRate] = useState<number>(23);
  const [loading, setLoading] = useState(false);
  const [downloadingInvoices, setDownloadingInvoices] = useState<{ [key: string]: boolean }>({});
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [companySettings, setCompanySettings] = useState({
    logo: null as File | null,
    signatureAndStamp: null as File | null,
    logoPreview: '',
    signatureAndStampPreview: '',
    logoName: '',
    signatureAndStampName: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
    fetchCompanySettings();
  }, [currentUser]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const invoicesPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const invoiceData = docSnapshot.data() as Invoice;
        const userDocRef = doc(db, 'users', invoiceData.createdBy);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        return {
          ...invoiceData,
          id: docSnapshot.id,
          createdByName: userData?.displayName || 'Neznámy používateľ'
        };
      });

      const invoices = await Promise.all(invoicesPromises);
      setInvoicesList(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    if (!currentUser?.companyID) return;

    try {
      const settingsRef = doc(db, 'companySettings', currentUser.companyID);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setCompanySettings(prev => ({
          ...prev,
          logoPreview: data.logoUrl || '',
          signatureAndStampPreview: data.signatureAndStampUrl || '',
          logoName: data.logoName || '',
          signatureAndStampName: data.signatureAndStampName || '',
        }));
      }
    } catch (error) {
      console.error('Chyba pri načítaní nastavení firmy:', error);
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

    if (field === 'quantity' || field === 'unitPrice') {
      const numValue = Number(value);
      if (field === 'quantity') {
        item.quantity = isNaN(numValue) ? 0 : numValue;
      } else {
        item.unitPrice = isNaN(numValue) ? 0 : numValue;
      }
      item.total = (item.quantity || 0) * (item.unitPrice || 0);
    } else {
      // @ts-ignore
      item[field] = value;
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
    
    // Pridanie loga ak existuje
    if (companySettings.logoPreview) {
      try {
        const logoImg = new Image();
        logoImg.src = companySettings.logoPreview;
        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            doc.addImage(logoImg, 'PNG', 20, 10, 40, 40);
            resolve(null);
          };
          logoImg.onerror = reject;
        });
      } catch (error) {
        console.error('Chyba pri načítaní loga:', error);
      }
    }
    
    // Hlavička faktúry
    doc.setFontSize(20);
    doc.text('FAKTÚRA', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Číslo: ${invoice.invoiceNumber}`, 20, 30);
    
    // Dodávateľ
    doc.text('Dodávateľ:', 20, 40);
    doc.text([
      invoice.supplier.name,
      invoice.supplier.address,
      `${invoice.supplier.zip} ${invoice.supplier.city}`,
      invoice.supplier.country,
      `IČO: ${invoice.supplier.ico}`,
      `DIČ: ${invoice.supplier.dic}`,
      `IČ DPH: ${invoice.supplier.ic_dph}`,
    ], 20, 45);
    
    // Odberateľ
    doc.text('Odberateľ:', 20, 80);
    doc.text([
      invoice.customer.name,
      invoice.customer.address,
      `${invoice.customer.zip} ${invoice.customer.city}`,
      invoice.customer.country,
      `IČO: ${invoice.customer.ico}`,
      `DIČ: ${invoice.customer.dic}`,
      `IČ DPH: ${invoice.customer.ic_dph}`,
    ], 20, 85);
    
    // Dátumy
    doc.text([
      `Dátum vystavenia: ${invoice.issueDate}`,
      `Dátum splatnosti: ${invoice.dueDate}`,
      `Dátum dodania: ${invoice.taxableSupplyDate}`,
    ], 20, 120);
    
    // Položky faktúry
    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${item.unitPrice.toFixed(2)} €`,
      `${item.total.toFixed(2)} €`,
    ]);
    
    (doc as any).autoTable({
      startY: 130,
      head: [['Popis', 'Množstvo', 'Jedn. cena', 'Spolu']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
      },
      margin: { left: 20, right: 20 },
    });
    
    // Sumár
    const finalY = (doc as any).lastAutoTable.finalY + 10;
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

    // Pridanie pečiatky a podpisu
    if (companySettings.signatureAndStampPreview) {
      try {
        const signatureImg = new Image();
        signatureImg.src = companySettings.signatureAndStampPreview;
        await new Promise((resolve, reject) => {
          signatureImg.onload = () => {
            doc.addImage(signatureImg, 'PNG', 20, finalY + 80, 170, 40);
            resolve(null);
          };
          signatureImg.onerror = reject;
        });
      } catch (error) {
        console.error('Chyba pri načítaní pečiatky a podpisu:', error);
      }
    }
    
    return doc.output('blob');
  };

  const handleCreateInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser?.companyID) {
      alert('Nie ste prihlásený alebo nemáte priradenú firmu.');
      return;
    }

    setLoading(true);
    try {
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

      // Uloženie faktúry do Firestore
      const docRef = await addDoc(collection(db, 'invoices'), finalInvoice);
      
      // Generovanie a nahratie PDF
      try {
        const pdfBlob = await generatePDF(finalInvoice);
        const storageRef = ref(storage, `invoices/${docRef.id}/${finalInvoice.invoiceNumber}.pdf`);
        await uploadBytes(storageRef, pdfBlob);
      } catch (pdfError) {
        console.error('Chyba pri generovaní alebo nahrávaní PDF:', pdfError);
        // Pokračujeme aj keď sa PDF nepodarilo nahrať
      }

      // Aktualizácia zoznamu faktúr
      await fetchInvoices();

      // Reset formulára
      setNewInvoiceCustomer({ name: '', address: '', city: '', zip: '', country: 'Slovensko', ico: '', dic: '', ic_dph: '' });
      setNewInvoiceItems([{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setNewInvoiceDates({
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        taxableSupplyDate: new Date().toISOString().split('T')[0],
      });
      setNewInvoiceNotes('');
      setVatRate(23);

      alert(`Faktúra ${newInvoiceNumber} bola úspešne vytvorená a uložená.`);
    } catch (error) {
      console.error('Chyba pri vytváraní faktúry:', error);
      alert('Nastala chyba pri vytváraní faktúry. Skúste to prosím znova.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingInvoices(prev => ({ ...prev, [invoice.id]: true }));
      
      // Najprv sa pokúsime vygenerovať nové PDF
      const pdfBlob = await generatePDF(invoice);
      
      // Vytvorenie URL pre Blob a stiahnutie
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri sťahovaní PDF. Skúste to prosím znova.');
    } finally {
      setDownloadingInvoices(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const handlePreviewPDF = async (invoice: Invoice) => {
    try {
      setPreviewInvoice(invoice);
      const pdfBlob = await generatePDF(invoice);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfData(reader.result as string);
        setPreviewOpen(true);
      };
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error('Chyba pri otváraní náhľadu PDF:', error);
      alert('Nastala chyba pri otváraní náhľadu PDF. Skúste to prosím znova.');
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewInvoice(null);
    setPdfData(null);
  };

  const fillTestData = () => {
    // Náhodné údaje pre odberateľa
    setNewInvoiceCustomer({
      name: 'Test Company s.r.o.',
      address: 'Testovacia 123',
      city: 'Bratislava',
      zip: '123 45',
      country: 'Slovensko',
      ico: '12345678',
      dic: 'SK1234567890',
      ic_dph: 'SK1234567890',
    });

    // Náhodné položky faktúry
    const testItems = [
      {
        id: Date.now(),
        description: 'Test služba 1',
        quantity: 2,
        unitPrice: 150.00,
        total: 300.00
      },
      {
        id: Date.now() + 1,
        description: 'Test služba 2',
        quantity: 3,
        unitPrice: 75.50,
        total: 226.50
      },
      {
        id: Date.now() + 2,
        description: 'Test služba 3',
        quantity: 1,
        unitPrice: 200.00,
        total: 200.00
      }
    ];
    setNewInvoiceItems(testItems);

    // Dátumy
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);
    
    setNewInvoiceDates({
      issueDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      taxableSupplyDate: today.toISOString().split('T')[0],
    });

    // DPH a poznámka
    setVatRate(20);
    setNewInvoiceNotes('Toto je testovacia faktúra pre testovacie účely.');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileChange = async (field: 'logo' | 'signatureAndStamp', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser?.companyID) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      
      // Vytvorenie referencie pre nový súbor
      const storageRef = ref(storage, `companies/${currentUser.companyID}/${field}`);
      
      // Nahratie nového súboru
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Aktualizácia stavu
      reader.onloadend = () => {
        setCompanySettings(prev => ({
          ...prev,
          [field]: file,
          [`${field}Preview`]: reader.result as string,
          [`${field}Name`]: file.name,
        }));
      };
      reader.readAsDataURL(file);

      // Uloženie URL do Firestore
      const settingsRef = doc(db, 'companySettings', currentUser.companyID);
      await setDoc(settingsRef, {
        [`${field}Url`]: downloadUrl,
        [`${field}Name`]: file.name,
        companyID: currentUser.companyID,
        updatedAt: Timestamp.now(),
      }, { merge: true });

    } catch (error) {
      console.error('Chyba pri nahrávaní súboru:', error);
      alert('Nastala chyba pri nahrávaní súboru. Skúste to prosím znova.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async (field: 'logo' | 'signatureAndStamp') => {
    if (!currentUser?.companyID) return;

    try {
      setLoading(true);
      const settingsRef = doc(db, 'companySettings', currentUser.companyID);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const fileUrl = data[`${field}Url`];

        if (fileUrl) {
          // Vytvorenie referencie na súbor v Storage
          const storageRef = ref(storage, `companies/${currentUser.companyID}/${field}`);
          
          // Vymazanie súboru z Storage
          await deleteObject(storageRef);

          // Aktualizácia Firestore
          await setDoc(settingsRef, {
            [`${field}Url`]: null,
            [`${field}Name`]: '',
            updatedAt: Timestamp.now(),
          }, { merge: true });

          // Aktualizácia stavu
          setCompanySettings(prev => ({
            ...prev,
            [field]: null,
            [`${field}Preview`]: '',
            [`${field}Name`]: '',
          }));
        }
      }
    } catch (error) {
      console.error('Chyba pri odoberaní súboru:', error);
      alert('Nastala chyba pri odoberaní súboru. Skúste to prosím znova.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const lastMonthInvoices = invoicesList.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      return invoiceDate >= lastMonth && invoiceDate <= thisMonth;
    });

    return {
      count: lastMonthInvoices.length,
      totalWithoutVat: lastMonthInvoices.reduce((sum, invoice) => sum + invoice.subtotal, 0),
      totalWithVat: lastMonthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      averageInvoiceValue: lastMonthInvoices.length > 0 
        ? lastMonthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) / lastMonthInvoices.length 
        : 0,
    };
  };

  const statistics = calculateStatistics();

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      // Najprv vymažeme faktúru z Firestore
      const invoiceRef = doc(db, 'invoices', invoice.id);
      await deleteDoc(invoiceRef);
      
      // Pokúsime sa vymazať PDF súbor zo Storage, ale pokračujeme aj ak sa to nepodarí
      try {
        const pdfRef = ref(storage, `invoices/${invoice.id}/${invoice.invoiceNumber}.pdf`);
        await deleteObject(pdfRef);
      } catch (error) {
        console.error('Chyba pri mazaní PDF (ignorované):', error);
        // Ignorujeme chybu pri mazaní PDF - faktúra sa vymaže aj tak
      }

      // Aktualizácia lokálneho zoznamu faktúr
      const updatedInvoices = invoicesList.filter(inv => inv.id !== invoice.id);
      setInvoicesList(updatedInvoices);

      setSnackbar({
        open: true,
        message: `Faktúra ${invoice.invoiceNumber} bola úspešne vymazaná.`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Chyba pri mazaní faktúry:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri mazaní faktúry.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewInvoiceCustomer({
      name: invoice.customer.name,
      address: invoice.customer.address,
      city: invoice.customer.city,
      zip: invoice.customer.zip,
      country: invoice.customer.country,
      ico: invoice.customer.ico,
      dic: invoice.customer.dic,
      ic_dph: invoice.customer.ic_dph || '',
    });
    setNewInvoiceItems(invoice.items);
    setNewInvoiceDates({
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      taxableSupplyDate: invoice.taxableSupplyDate,
    });
    setNewInvoiceNotes(invoice.notes || '');
    setVatRate(invoice.vatRate);
    setTabValue(0);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>
          Správa faktúr
        </PageTitle>
      </PageHeader>
      <PageDescription>
        Vytvárajte a spravujte faktúry pre vašich zákazníkov
      </PageDescription>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: colors.accent.main,
                fontWeight: 'bold',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.accent.main,
            },
          }}
        >
          <Tab label="Vystaviť faktúru" />
          <Tab label="Štatistiky" />
          <Tab label="Nastavenia" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
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

            <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
              <Grid item>
                <Button
                  onClick={fillTestData}
                  variant="outlined"
                  sx={{
                    color: colors.accent.main,
                    borderColor: colors.accent.main,
                    '&:hover': {
                      borderColor: colors.accent.light,
                      backgroundColor: 'rgba(255, 159, 67, 0.1)',
                    },
                  }}
                >
                  Test
                </Button>
              </Grid>
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
        </StyledPaper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'rgba(28, 28, 45, 0.35)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Počet faktúr za posledný mesiac
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: colors.accent.main }}>
                  {statistics.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'rgba(28, 28, 45, 0.35)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Celková suma bez DPH
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: colors.accent.main }}>
                  {statistics.totalWithoutVat.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'rgba(28, 28, 45, 0.35)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Celková suma s DPH
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: colors.accent.main }}>
                  {statistics.totalWithVat.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'rgba(28, 28, 45, 0.35)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Priemerná hodnota faktúry
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: colors.accent.main }}>
                  {statistics.averageInvoiceValue.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <StyledPaper>
          <Typography variant="h6" gutterBottom>
            Nastavenia firmy
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: colors.accent.main, width: 56, height: 56 }}>
                      <img 
                        src={companySettings.logoPreview || '/placeholder-logo.png'} 
                        alt="Logo" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </Avatar>
                  }
                  title="Logo firmy"
                  subheader={companySettings.logoName || 'Žiadne logo nahrané'}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Odporúčame nahrať obrázok vo formáte PNG s priehľadným pozadím
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        component="label"
                        disabled={loading}
                        sx={{
                          backgroundColor: colors.accent.main,
                          '&:hover': {
                            backgroundColor: colors.accent.light,
                          }
                        }}
                      >
                        {companySettings.logo ? 'Zmeniť logo' : 'Nahrať logo'}
                        <input
                          type="file"
                          hidden
                          accept="image/png"
                          onChange={(e) => handleFileChange('logo', e)}
                        />
                      </Button>
                      {companySettings.logo && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveFile('logo')}
                          disabled={loading}
                        >
                          Odstrániť
                        </Button>
                      )}
                    </Box>
                    {companySettings.logo && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        borderRadius: 1, 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Náhľad loga:
                        </Typography>
                        <img 
                          src={companySettings.logoPreview} 
                          alt="Náhľad loga" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }} 
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: colors.accent.main, width: 56, height: 56 }}>
                      <img 
                        src={companySettings.signatureAndStampPreview || '/placeholder-signature.png'} 
                        alt="Pečiatka a podpis" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </Avatar>
                  }
                  title="Pečiatka s podpisom"
                  subheader={companySettings.signatureAndStampName || 'Žiadna pečiatka s podpisom nahraná'}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Odporúčame nahrať obrázok vo formáte PNG s priehľadným pozadím
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        component="label"
                        disabled={loading}
                        sx={{
                          backgroundColor: colors.accent.main,
                          '&:hover': {
                            backgroundColor: colors.accent.light,
                          }
                        }}
                      >
                        {companySettings.signatureAndStamp ? 'Zmeniť pečiatku s podpisom' : 'Nahrať pečiatku s podpisom'}
                        <input
                          type="file"
                          hidden
                          accept="image/png"
                          onChange={(e) => handleFileChange('signatureAndStamp', e)}
                        />
                      </Button>
                      {companySettings.signatureAndStamp && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveFile('signatureAndStamp')}
                          disabled={loading}
                        >
                          Odstrániť
                        </Button>
                      )}
                    </Box>
                    {companySettings.signatureAndStamp && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        borderRadius: 1, 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Náhľad pečiatky s podpisom:
                        </Typography>
                        <img 
                          src={companySettings.signatureAndStampPreview} 
                          alt="Náhľad pečiatky s podpisom" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }} 
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </StyledPaper>
      </TabPanel>

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
                <TableCell>Vytvoril</TableCell>
                <TableCell>Dátum vytvorenia</TableCell>
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
                  <TableCell>{invoice.createdByName}</TableCell>
                  <TableCell>
                    {format(invoice.createdAt.toDate(), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell align="right">{invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        onClick={() => handlePreviewPDF(invoice)}
                        sx={{
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          }
                        }}
                        title="Náhľad faktúry"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={downloadingInvoices[invoice.id]}
                        sx={{
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          }
                        }}
                        title="Stiahnuť faktúru"
                      >
                        {downloadingInvoices[invoice.id] ? (
                          <CircularProgress size={24} sx={{ color: colors.accent.main }} />
                        ) : (
                          <DownloadIcon />
                        )}
                      </IconButton>
                      <IconButton
                        onClick={() => handleEditInvoice(invoice)}
                        sx={{
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          }
                        }}
                        title="Upraviť faktúru"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setInvoiceToDelete(invoice);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          }
                        }}
                        title="Vymazať faktúru"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog pre náhľad PDF */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.35)' : 'rgba(255, 255, 255, 0.95)'
        }}>
          <Typography variant="h6">
            Náhľad faktúry {previewInvoice?.invoiceNumber}
          </Typography>
          <IconButton
            onClick={handleClosePreview}
            sx={{
              color: colors.accent.main,
              '&:hover': {
                backgroundColor: 'rgba(255, 159, 67, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          {previewInvoice && pdfData && (
            <iframe
              src={pdfData}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.35)' : 'rgba(255, 255, 255, 0.95)'
        }}>
          <Button
            onClick={handleClosePreview}
            sx={{
              color: colors.accent.main,
              '&:hover': {
                backgroundColor: 'rgba(255, 159, 67, 0.1)',
              }
            }}
          >
            Zatvoriť
          </Button>
          {previewInvoice && (
            <Button
              onClick={() => handleDownloadPDF(previewInvoice)}
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{
                backgroundColor: colors.accent.main,
                '&:hover': {
                  backgroundColor: colors.accent.light,
                }
              }}
            >
              Stiahnuť faktúru
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog pre potvrdenie vymazania */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Vymazať faktúru?</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať faktúru {invoiceToDelete?.invoiceNumber}? Táto akcia sa nedá vrátiť späť.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            Zrušiť
          </Button>
          <Button
            onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete)}
            color="error"
            variant="contained"
          >
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
};

export default InvoicesPage; 