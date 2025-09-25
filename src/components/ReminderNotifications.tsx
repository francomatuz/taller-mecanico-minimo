import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Slider,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  WhatsApp,
  Settings,
  Send,
} from '@mui/icons-material';
import { reminderSystem, PendingReminder } from '../utils/reminderSystem';

const ReminderNotifications: React.FC = () => {
  const [pendingReminders, setPendingReminders] = useState<PendingReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState(reminderSystem.getConfig());
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  // Cargar recordatorios pendientes
  const loadPendingReminders = async () => {
    setLoading(true);
    try {
      const reminders = await reminderSystem.checkPendingReminders();
      setPendingReminders(reminders);
    } catch (error) {
      console.error('Error cargando recordatorios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar recordatorios
  const handleSendReminders = async () => {
    setSending(true);
    setSendResult(null);
    
    try {
      const result = await reminderSystem.sendPendingReminders();
      setSendResult(result);
      
      // Recargar recordatorios después de enviar
      await loadPendingReminders();
    } catch (error) {
      console.error('Error enviando recordatorios:', error);
      setSendResult({ sent: 0, failed: 0, total: 0 });
    } finally {
      setSending(false);
    }
  };

  // Actualizar configuración
  const updateConfig = (newConfig: Partial<typeof config>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    reminderSystem.setConfig(updatedConfig);
  };

  // Cargar recordatorios al montar el componente
  useEffect(() => {
    loadPendingReminders();
  }, []);

  // Formatear días a meses y días
  const formatDaysToMonths = (days: number): string => {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    
    if (months === 0) {
      return `${remainingDays} días`;
    } else if (remainingDays === 0) {
      return `${months} mes${months > 1 ? 'es' : ''}`;
    } else {
      return `${months} mes${months > 1 ? 'es' : ''} y ${remainingDays} días`;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Notifications sx={{ mr: 1, color: 'warning.main' }} />
            Recordatorios de Servicios
            {pendingReminders.length > 0 && (
              <Chip 
                label={pendingReminders.length} 
                color="warning" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          <Box>
            <IconButton 
              onClick={() => setSettingsOpen(true)}
              title="Configuración"
              sx={{ mr: 1 }}
            >
              <Settings />
            </IconButton>
            <Button
              variant="contained"
              color="success"
              startIcon={sending ? <CircularProgress size={20} /> : <Send />}
              onClick={handleSendReminders}
              disabled={sending || pendingReminders.length === 0}
            >
              {sending ? 'Enviando...' : `Enviar ${pendingReminders.length}`}
            </Button>
          </Box>
        </Box>

        {/* Resultado del envío */}
        {sendResult && (
          <Alert 
            severity={sendResult.sent > 0 ? 'success' : 'warning'} 
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              <strong>Resultado:</strong> {sendResult.sent} enviados, {sendResult.failed} fallidos de {sendResult.total} recordatorios
            </Typography>
          </Alert>
        )}

        {/* Lista de recordatorios */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : pendingReminders.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">
              No hay recordatorios pendientes. Todos los clientes están al día.
            </Typography>
          </Alert>
        ) : (
          <List>
            {pendingReminders.map((reminder) => (
              <ListItem key={reminder.id} divider>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {reminder.cliente_nombre}
                      </Typography>
                      {reminder.cliente_fiel && (
                        <Chip label="Fiel" color="primary" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {reminder.marca} {reminder.modelo} ({reminder.patente})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Último servicio: {new Date(reminder.fecha_trabajo).toLocaleDateString()} 
                        {' • '}
                        <Chip 
                          label={`Hace ${formatDaysToMonths(reminder.daysSinceService)}`}
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end"
                    title="Enviar WhatsApp"
                    onClick={() => {
                      const autoInfo = `${reminder.marca} ${reminder.modelo} (${reminder.patente})`;
                      const monthsSince = Math.floor(reminder.daysSinceService / 30);
                      const message = reminder.cliente_fiel 
                        ? `🏆 *Cliente Fiel - Recordatorio de Servicio*\n\nHola ${reminder.cliente_nombre}!\n\nComo cliente fiel, queremos recordarte que tu vehículo *${autoInfo}* necesita servicio.\n\nHan pasado ${monthsSince} meses desde tu último servicio.\n\n¿Te gustaría agendar una cita?\n\nSaludos,\nTaller Mecánico`
                        : `🔧 *Recordatorio de Servicio*\n\nHola ${reminder.cliente_nombre}!\n\nTu vehículo *${autoInfo}* necesita servicio.\n\nHan pasado ${monthsSince} meses desde tu último servicio.\n\n¿Te gustaría agendar una cita?\n\nSaludos,\nTaller Mecánico`;
                      
                      const cleanPhone = reminder.cliente_telefono.replace(/\D/g, '');
                      const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <WhatsApp color="success" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Botón para recargar */}
        <Box display="flex" justifyContent="center" mt={2}>
          <Button 
            variant="outlined" 
            onClick={loadPendingReminders}
            disabled={loading}
          >
            Recargar Recordatorios
          </Button>
        </Box>
      </CardContent>

      {/* Dialog de configuración */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Settings sx={{ mr: 1 }} />
            Configuración de Recordatorios
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => updateConfig({ enabled: e.target.checked })}
                />
              }
              label="Habilitar recordatorios automáticos"
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recordar después de: {config.monthsAfterService} mes{config.monthsAfterService > 1 ? 'es' : ''}
              </Typography>
              <Slider
                value={config.monthsAfterService}
                onChange={(_, value) => updateConfig({ monthsAfterService: value as number })}
                min={1}
                max={12}
                step={1}
                marks={[
                  { value: 1, label: '1m' },
                  { value: 3, label: '3m' },
                  { value: 6, label: '6m' },
                  { value: 12, label: '12m' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} meses`}
              />
            </Box>
            
            <Alert severity="info">
              <Typography variant="body2">
                Los recordatorios se enviarán automáticamente cuando hayan pasado {config.monthsAfterService} mes{config.monthsAfterService > 1 ? 'es' : ''} desde el último servicio.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ReminderNotifications;
