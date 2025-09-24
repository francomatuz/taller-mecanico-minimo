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
  Add,
  DirectionsCar,
  Speed,
  PictureAsPdf
} from '@mui/icons-material';
import { AutoHistory } from '../types/Auto';
import { SupabaseService } from '../services/supabaseService';
import { saveServicePDF, saveAllServicesPDF } from '../utils/pdfGenerator';
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
      // Limpiar estado anterior antes de cargar nuevo historial
      setAutoHistory(null);
      loadAutoHistory();
    } else if (!open) {
      // Limpiar estado cuando se cierra el dialog
      setAutoHistory(null);
      setLoading(false);
    }
  }, [open, autoId]);

  const loadAutoHistory = async () => {
    if (!autoId) return;
    
    setLoading(true);
    try {
      const history = await SupabaseService.getAutoHistory(autoId);
      
      if (history) {
        console.log('✅ Historial encontrado. Servicios:', history.servicios?.length || 0);
        console.log('📋 Lista completa de servicios:', history.servicios);
        
        // Debug detallado de cada servicio
        if (history.servicios && history.servicios.length > 0) {
          history.servicios.forEach((servicio, index) => {
            console.log(`🔧 Servicio ${index + 1}:`, {
              id: servicio.id,
              auto_id: servicio.auto_id,
              fecha_ingreso: servicio.fecha_ingreso,
              fecha_trabajo: servicio.fecha_trabajo,
              orden_trabajo: servicio.orden_trabajo,
              trabajo_realizado: servicio.trabajo_realizado,
              repuestos_utilizados: servicio.repuestos_utilizados,
              observaciones: servicio.observaciones
            });
          });
        }
        
        setAutoHistory(history);
      } else {
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
                {' '}| Último servicio: <strong>{formatDate(servicios[0].fecha_trabajo || servicios[0].fecha_ingreso)}</strong>
              </>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
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
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => {
                try {
                  saveAllServicesPDF(autoHistory!);
                } catch (error) {
                  console.error('Error exporting all services PDF:', error);
                }
              }}
              disabled={!autoHistory || autoHistory.servicios.length === 0}
              sx={{ color: 'error.main', borderColor: 'error.main' }}
            >
              Exportar Historial Completo PDF
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {servicios.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ No se encontraron servicios para este auto
            </Alert>
            <DirectionsCar sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay servicios registrados
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Este auto no tiene servicios registrados aún. Esto puede indicar un problema con la creación del primer servicio.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Auto ID: {autoInfo.auto_id}
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
                        📅 Servicio #{servicios.length - index} - {formatDate(servicio.fecha_trabajo || servicio.fecha_ingreso)}
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
                      <Tooltip title="Exportar servicio individual PDF">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            try {
                              saveServicePDF(autoHistory!, index);
                            } catch (error) {
                              console.error('Error exporting service PDF:', error);
                            }
                          }}
                        >
                          <PictureAsPdf />
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
