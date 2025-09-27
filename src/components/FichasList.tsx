import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit,
  Delete,
  PictureAsPdf,
  WhatsApp,
  Search,
  MoreVert,
  Visibility,
  Email,
  Refresh,
  History,
  Add,
} from '@mui/icons-material';
import { FichaAuto } from '../types/FichaAuto';
import { AutoConServicio } from '../types/Auto';
import { generatePDF } from '../utils/pdfGenerator';
import { openWhatsAppWeb, generateReminderMessage, generateFichaCompletaMessage } from '../services/whatsappPuppeteer';
import { SupabaseService } from '../services/supabaseService';
import '../types/electronAPI';

interface FichasListProps {
  fichas: AutoConServicio[];
  onEdit: (ficha: FichaAuto) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onViewHistory?: (autoId: number) => void;
  onNewFicha?: () => void;
  onNewService?: (autoId: number) => void;
}

const FichasList: React.FC<FichasListProps> = ({ fichas, onEdit, onDelete, onRefresh, onViewHistory, onNewFicha, onNewService }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFicha, setSelectedFicha] = useState<FichaAuto | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState<FichaAuto | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFicha, setMenuFicha] = useState<FichaAuto | null>(null);

  const filteredFichas = fichas.filter(ficha =>
    ficha.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ficha.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ficha.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ficha.cliente_telefono.includes(searchTerm) ||
    (ficha.patente && ficha.patente.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ficha.numero_chasis && ficha.numero_chasis.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  // Función para convertir AutoConServicio a FichaAuto para compatibilidad
  const convertToFichaAuto = (auto: AutoConServicio): FichaAuto => {
    return {
      id: auto.id,
      marca: auto.marca,
      modelo: auto.modelo,
      año: auto.año,
      patente: auto.patente,
      numero_chasis: auto.numero_chasis,
      kilometraje: auto.kilometraje,
      fecha_ingreso: auto.fecha_ingreso || '',
      fecha_trabajo: auto.fecha_trabajo,
      cliente_nombre: auto.cliente_nombre,
      cliente_telefono: auto.cliente_telefono,
      cliente_fiel: auto.cliente_fiel || false,
      orden_trabajo: auto.orden_trabajo || '',
      repuestos_utilizados: auto.repuestos_utilizados || '',
      trabajo_realizado: auto.trabajo_realizado || '',
      observaciones: auto.observaciones || '',
      created_at: auto.created_at
    };
  };

  // Función para convertir FichaAuto a AutoConServicio (para el menú)
  const convertToAutoConServicio = (ficha: FichaAuto): AutoConServicio => {
    return {
      id: ficha.id || 0,
      marca: ficha.marca,
      modelo: ficha.modelo,
      año: ficha.año,
      patente: ficha.patente || 'SIN_PATENTE',
      numero_chasis: ficha.numero_chasis,
      cliente_nombre: ficha.cliente_nombre,
      cliente_telefono: ficha.cliente_telefono,
      cliente_fiel: ficha.cliente_fiel || false,
      created_at: ficha.created_at || new Date().toISOString(),
      fecha_ingreso: ficha.fecha_ingreso,
      fecha_trabajo: ficha.fecha_trabajo,
      kilometraje: ficha.kilometraje,
      orden_trabajo: ficha.orden_trabajo,
      repuestos_utilizados: ficha.repuestos_utilizados,
      trabajo_realizado: ficha.trabajo_realizado,
      observaciones: ficha.observaciones
    };
  };

  const handleViewFicha = (ficha: AutoConServicio) => {
    setSelectedFicha(convertToFichaAuto(ficha));
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (ficha: AutoConServicio) => {
    setFichaToDelete(convertToFichaAuto(ficha));
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteConfirm = () => {
    if (fichaToDelete?.id) {
      onDelete(fichaToDelete.id);
    }
    setDeleteDialogOpen(false);
    setFichaToDelete(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, ficha: AutoConServicio) => {
    setAnchorEl(event.currentTarget);
    setMenuFicha(convertToFichaAuto(ficha));
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFicha(null);
  };


  const handleExportPDF = async (ficha: FichaAuto) => {
    try {
      const doc = generatePDF(ficha);
      doc.save(`ficha_${ficha.marca}_${ficha.modelo}_${ficha.año}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
    handleMenuClose();
  };

  const handleWhatsApp = (ficha: FichaAuto) => {
    if (ficha.cliente_telefono) {
      // Generar mensaje de recordatorio
      const autoInfo = `${ficha.marca} ${ficha.modelo} (${ficha.patente})`;
      const ultimoService = ficha.fecha_trabajo || ficha.fecha_ingreso || 'Sin servicios registrados';
      
      const message = generateReminderMessage(
        ficha.cliente_nombre,
        autoInfo,
        ultimoService
      );
      
      // Abrir WhatsApp Web con el mensaje
      openWhatsAppWeb(ficha.cliente_telefono, message);
      
      console.log('📱 WhatsApp abierto para:', ficha.cliente_nombre, ficha.cliente_telefono);
    } else {
      console.warn('⚠️ No hay teléfono disponible para enviar WhatsApp');
      alert('No hay número de teléfono disponible para este cliente');
    }
    handleMenuClose();
  };

  const handleWhatsAppFichaCompleta = async (ficha: FichaAuto) => {
    if (ficha.cliente_telefono) {
      try {
        // Obtener todos los servicios del auto
        const servicios = await SupabaseService.getAllServicesForAuto(ficha.id || 0);
        
        // Generar mensaje completo de ficha
        const message = generateFichaCompletaMessage(ficha, servicios);
        
        // Abrir WhatsApp Web con el mensaje
        openWhatsAppWeb(ficha.cliente_telefono, message);
        
        console.log('📱 WhatsApp Ficha Completa abierto para:', ficha.cliente_nombre, ficha.cliente_telefono);
      } catch (error) {
        console.error('❌ Error obteniendo servicios para WhatsApp:', error);
        alert('Error al obtener los servicios del auto');
      }
    } else {
      console.warn('⚠️ No hay teléfono disponible para enviar WhatsApp');
      alert('No hay número de teléfono disponible para este cliente');
    }
    handleMenuClose();
  };

  const handleEmail = (ficha: FichaAuto) => {
    // Implementar envío por email
    console.log('Enviar por email:', ficha);
    handleMenuClose();
  };


  const getStatusColor = (ficha: AutoConServicio) => {
    if (ficha.fecha_trabajo) {
      return 'success';
    }
    return 'warning';
  };

  const getStatusText = (ficha: AutoConServicio) => {
    if (ficha.fecha_trabajo) {
      return 'Completado';
    }
    return 'En Proceso';
  };

  return (
    <Box sx={{ px: { xs: 0, sm: 1 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Fichas de Autos ({filteredFichas.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            Actualizar
          </Button>
          {onNewFicha && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onNewFicha}
            >
              Nueva Ficha
            </Button>
          )}
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Buscar por cliente, marca, modelo, teléfono, patente o número de chasis..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {filteredFichas.map((ficha) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={ficha.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                      {ficha.marca} {ficha.modelo} ({ficha.año})
                    </Typography>
                    {ficha.patente && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Patente:</strong> {ficha.patente}
                      </Typography>
                    )}
                    {ficha.numero_chasis && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Chasis:</strong> {ficha.numero_chasis}
                      </Typography>
                    )}
                    <Chip
                      label={getStatusText(ficha)}
                      color={getStatusColor(ficha)}
                      size="small"
                    />
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, ficha)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Cliente:</strong> {ficha.cliente_nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Teléfono:</strong> {ficha.cliente_telefono}
                </Typography>
                {ficha.kilometraje && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Kilometraje:</strong> {ficha.kilometraje.toLocaleString()} km
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Ingreso:</strong> {new Date(ficha.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-ES')}
                </Typography>
                {ficha.fecha_trabajo && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Finalizado:</strong> {new Date(ficha.fecha_trabajo + 'T00:00:00').toLocaleDateString('es-ES')}
                  </Typography>
                )}

              </CardContent>

              <Box sx={{ p: 1.5, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => handleViewFicha(ficha)}
                  sx={{ fontSize: '0.75rem', minWidth: '70px' }}
                >
                  Ver
                </Button>
                {onViewHistory && (
                  <Button
                    size="small"
                    startIcon={<History />}
                    onClick={() => onViewHistory(ficha.id)}
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', minWidth: '70px' }}
                  >
                    Historial
                  </Button>
                )}
                {onNewService && (
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => onNewService(ficha.id)}
                    variant="contained"
                    color="primary"
                    sx={{ fontSize: '0.75rem', minWidth: '70px' }}
                  >
                    Nuevo Servicio
                  </Button>
                )}
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => onEdit(convertToFichaAuto(ficha))}
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', minWidth: '70px' }}
                >
                  Editar
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredFichas.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No se encontraron fichas' : 'No hay fichas registradas'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera ficha usando el botón +'}
          </Typography>
        </Box>
      )}

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuFicha && handleViewFicha(convertToAutoConServicio(menuFicha))}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuFicha && onEdit(menuFicha)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuFicha && handleExportPDF(menuFicha)}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportar PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuFicha && handleWhatsApp(menuFicha)}>
          <ListItemIcon>
            <WhatsApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recordatorio WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuFicha && handleWhatsAppFichaCompleta(menuFicha)}>
          <ListItemIcon>
            <WhatsApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Enviar Ficha Completa</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuFicha && handleEmail(menuFicha)}>
          <ListItemIcon>
            <Email fontSize="small" />
          </ListItemIcon>
          <ListItemText>Enviar por Email</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => menuFicha && handleDeleteClick(convertToAutoConServicio(menuFicha))}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog para ver detalles */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          Detalles de la Ficha - {selectedFicha?.marca} {selectedFicha?.modelo}
        </DialogTitle>
        <DialogContent>
          {selectedFicha && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Información del Vehículo
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Marca:</strong> {selectedFicha.marca}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Modelo:</strong> {selectedFicha.modelo}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Año:</strong> {selectedFicha.año}
                  </Typography>
                  {selectedFicha.patente && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Patente:</strong> {selectedFicha.patente}
                    </Typography>
                  )}
                  {selectedFicha.numero_chasis && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Número de Chasis:</strong> {selectedFicha.numero_chasis}
                    </Typography>
                  )}
                  {selectedFicha.kilometraje && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Kilometraje:</strong> {selectedFicha.kilometraje.toLocaleString()} km
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Información del Cliente
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Nombre:</strong> {selectedFicha.cliente_nombre}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Teléfono:</strong> {selectedFicha.cliente_telefono}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Fechas
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fecha de Ingreso:</strong> {new Date(selectedFicha.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-ES')}
                  </Typography>
                  {selectedFicha.fecha_trabajo && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Fecha de Trabajo:</strong> {new Date(selectedFicha.fecha_trabajo + 'T00:00:00').toLocaleDateString('es-ES')}
                    </Typography>
                  )}
                </Grid>
                {selectedFicha.orden_trabajo && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Orden de Trabajo
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedFicha.orden_trabajo}
                    </Typography>
                  </Grid>
                )}
                {selectedFicha.repuestos_utilizados && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Repuestos Utilizados
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedFicha.repuestos_utilizados}
                    </Typography>
                  </Grid>
                )}
                {selectedFicha.trabajo_realizado && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Trabajo Realizado
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedFicha.trabajo_realizado}
                    </Typography>
                  </Grid>
                )}
                {selectedFicha.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedFicha.observaciones}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
          {selectedFicha && (
            <>
              <Button
                startIcon={<Edit />}
                onClick={() => {
                  setViewDialogOpen(false);
                  onEdit(selectedFicha);
                }}
              >
                Editar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar la ficha de {fichaToDelete?.marca} {fichaToDelete?.modelo} 
            del cliente {fichaToDelete?.cliente_nombre}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FichasList;
