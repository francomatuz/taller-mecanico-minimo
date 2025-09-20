import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, CarRepair, List, Settings } from '@mui/icons-material';
import FichaForm from './components/FichaForm';
import { SupabaseService } from './services/supabaseService';
import FichasList from './components/FichasList';
import AutoHistoryDialog from './components/AutoHistory';
import { FichaAuto } from './types/FichaAuto';
import { AutoConServicio } from './types/Auto';
import './types/electronAPI';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFicha, setEditingFicha] = useState<FichaAuto | null>(null);
  const [fichas, setFichas] = useState<AutoConServicio[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAutoId, setSelectedAutoId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Cargar fichas al iniciar
  useEffect(() => {
    loadFichas();
  }, []);

  const loadFichas = async () => {
    try {
      const data = await SupabaseService.getAllFichas();
      setFichas(data);
    } catch (error) {
      console.error('Error loading fichas:', error);
      showSnackbar('Error al cargar las fichas', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (ficha?: FichaAuto) => {
    setEditingFicha(ficha || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFicha(null);
  };

  const handleSaveFicha = async (ficha: FichaAuto) => {
    try {
      console.log('💾 [APP] Guardando ficha:', ficha);
      let result;
      if (editingFicha && editingFicha.id) {
        console.log('✏️ [APP] Editando ficha existente ID:', editingFicha.id);
        result = await SupabaseService.updateFicha(editingFicha.id, ficha);
      } else {
        console.log('➕ [APP] Creando nueva ficha');
        result = await SupabaseService.insertFicha(ficha);
      }

      console.log('📋 [APP] Resultado del guardado:', result);

      if (result.success) {
        showSnackbar(
          editingFicha ? 'Ficha actualizada correctamente' : 'Ficha creada correctamente',
          'success'
        );
        handleCloseDialog();
        loadFichas();
      } else {
        showSnackbar('Error al guardar la ficha', 'error');
      }
    } catch (error) {
      console.error('💥 [APP] Error saving ficha:', error);
      showSnackbar('Error al guardar la ficha', 'error');
    }
  };

  const handleDeleteFicha = async (id: number) => {
    try {
      const result = await SupabaseService.deleteFicha(id);
      if (result.success) {
        showSnackbar('Ficha eliminada correctamente', 'success');
        loadFichas();
      } else {
        showSnackbar('Error al eliminar la ficha', 'error');
      }
    } catch (error) {
      console.error('Error deleting ficha:', error);
      showSnackbar('Error al eliminar la ficha', 'error');
    }
  };

  const handleEditFicha = (ficha: FichaAuto) => {
    handleOpenDialog(ficha);
  };

  const handleViewHistory = (autoId: number) => {
    setSelectedAutoId(autoId);
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
    setSelectedAutoId(null);
  };

  const handleAddService = (autoId: number) => {
    // Buscar el auto en la lista para obtener sus datos
    const auto = fichas.find(f => f.id === autoId);
    if (auto) {
      // Crear una ficha temporal con los datos del auto para el formulario
      const fichaTemp: FichaAuto = {
        id: auto.id,
        marca: auto.marca,
        modelo: auto.modelo,
        año: auto.año,
        patente: auto.patente,
        numero_chasis: auto.numero_chasis,
        kilometraje: auto.kilometraje,
        fecha_ingreso: new Date().toLocaleDateString('en-CA'),
        fecha_trabajo: '',
        cliente_nombre: auto.cliente_nombre,
        cliente_telefono: auto.cliente_telefono,
        orden_trabajo: '',
        repuestos_utilizados: '',
        trabajo_realizado: '',
        observaciones: '',
        created_at: auto.created_at
      };
      setEditingFicha(fichaTemp);
      setOpenDialog(true);
      setHistoryDialogOpen(false);
    }
  };


  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <CarRepair sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Taller Mecánico - Sistema de Gestión
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="navigation tabs">
            <Tab 
              icon={<List />} 
              label="Lista de Fichas" 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<Settings />} 
              label="Configuración" 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <FichasList
            fichas={fichas}
            onEdit={handleEditFicha}
            onDelete={handleDeleteFicha}
            onRefresh={loadFichas}
            onViewHistory={handleViewHistory}
            onNewFicha={() => handleOpenDialog()}
            onNewService={handleAddService}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" color="text.secondary">
              Configuración
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Aquí podrás configurar las opciones de WhatsApp y otras funcionalidades.
            </Typography>
          </Box>
        </TabPanel>
      </Container>


      {/* Dialog para crear/editar ficha */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          {editingFicha ? 'Editar Ficha de Auto' : 'Nueva Ficha de Auto'}
        </DialogTitle>
        <DialogContent>
          <FichaForm
            ficha={editingFicha}
            onSave={handleSaveFicha}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog de historial de auto */}
      <AutoHistoryDialog
        open={historyDialogOpen}
        onClose={handleCloseHistory}
        autoId={selectedAutoId}
        onEdit={handleEditFicha}
        onAddService={handleAddService}
      />
    </Box>
  );
}

export default App;

