import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Edit,
  Print,
  Add,
  CalendarToday,
  DirectionsCar,
  Build,
  Person,
  Phone,
  Speed
} from '@mui/icons-material';
import { AutoHistory, Servicio } from '../types/Auto';
import { SupabaseService } from '../services/supabaseService';
import '../types/electronAPI';

interface AutoHistoryProps {
  open: boolean;
  onClose: () => void;
  autoId: number | null;
  onEdit: (ficha: any) => void;
  onAddService: (autoId: number) => void;
}

const AutoHistoryDialog: React.FC<AutoHistoryProps> = ({
  open,
  onClose,
  autoId,
  onEdit,
  onAddService
}) => {
  const [autoHistory, setAutoHistory] = useState<AutoHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && autoId) {
      loadAutoHistory();
    }
  }, [open, autoId]);

  const loadAutoHistory = async () => {
    if (!autoId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Cargando historial para auto ID:', autoId);
      // Llamar a la función real para obtener el historial del auto
      const history = await SupabaseService.getAutoHistory(autoId);
      console.log('📋 Datos recibidos del historial:', history);
      
      if (history) {
        console.log('✅ Historial encontrado. Servicios:', history.servicios?.length || 0);
        
        // Si history es un array, tomar el primer elemento
        const autoHistoryData = Array.isArray(history) ? history[0] : history;
        console.log('📋 Datos procesados:', autoHistoryData);
        
        setAutoHistory(autoHistoryData);
      } else {
        console.log('❌ No se encontró historial para el auto ID:', autoId);
        setAutoHistory(null);
      }
    } catch (error) {
      console.error('💥 Error loading auto history:', error);
      setAutoHistory(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES');
  };

  const getServiceStatus = (fechaTrabajo?: string) => {
    if (!fechaTrabajo) {
      return <Chip label="En Proceso" color="warning" size="small" />;
    }
    return <Chip label="Completado" color="success" size="small" />;
  };

  const handleClose = () => {
    setAutoHistory(null);
    onClose();
  };

  if (!autoHistory) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            {loading ? <CircularProgress /> : <Typography>No se encontró información</Typography>}
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const { servicios = [] } = autoHistory;
  const autoInfo = autoHistory;

  console.log('🎨 Renderizando historial. autoInfo:', autoInfo);
  console.log('🎨 Servicios para mostrar:', servicios);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              🚗 {autoInfo.marca || 'Sin marca'} {autoInfo.modelo || 'Sin modelo'} {autoInfo.año || 'Sin año'} - {autoInfo.patente || 'Sin patente'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              👤 {autoInfo.cliente_nombre || 'Sin nombre'} | 📞 {autoInfo.cliente_telefono || 'Sin teléfono'}
              {autoInfo.numero_chasis && ` | 🔧 Chasis: ${autoInfo.numero_chasis}`}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            📋 Total de servicios: <strong>{servicios.length}</strong>
            {servicios.length > 0 && (
              <>
                {' '}| Último servicio: <strong>{formatDate(servicios[0].fecha_ingreso)}</strong>
              </>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => onAddService(autoInfo.auto_id)}
              color="primary"
            >
              Agregar Nuevo Servicio
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => onEdit(autoInfo)}
            >
              Editar Info del Auto
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {servicios.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DirectionsCar sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay servicios registrados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega el primer servicio para comenzar el historial
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {servicios.map((servicio, index) => (
              <Card key={servicio.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        📅 Servicio #{servicios.length - index} - {formatDate(servicio.fecha_ingreso)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        {getServiceStatus(servicio.fecha_trabajo)}
                        {servicio.kilometraje && (
                          <Chip 
                            icon={<Speed />} 
                            label={`${servicio.kilometraje.toLocaleString()} km`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Editar servicio">
                        <IconButton size="small" onClick={() => onEdit({ ...autoInfo, ...servicio })}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Imprimir servicio">
                        <IconButton size="small">
                          <Print />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {servicio.orden_trabajo && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          🔧 Orden de Trabajo:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {servicio.orden_trabajo}
                        </Typography>
                      </Grid>
                    )}

                    {servicio.trabajo_realizado && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          ✅ Trabajo Realizado:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {servicio.trabajo_realizado}
                        </Typography>
                      </Grid>
                    )}

                    {servicio.repuestos_utilizados && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          🔩 Repuestos Utilizados:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {servicio.repuestos_utilizados}
                        </Typography>
                      </Grid>
                    )}

                    {servicio.observaciones && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          📝 Observaciones:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {servicio.observaciones}
                        </Typography>
                      </Grid>
                    )}

                    {servicio.fecha_trabajo && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          🏁 Fecha de Finalización:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {formatDate(servicio.fecha_trabajo)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutoHistoryDialog;
