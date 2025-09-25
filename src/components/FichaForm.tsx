import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { FichaAuto, FichaFormData } from '../types/FichaAuto';
import '../types/electronAPI';

interface FichaFormProps {
  ficha?: FichaAuto | null;
  onSave: (ficha: FichaAuto) => void;
  onCancel: () => void;
}

const marcasComunes = [
  'Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Volkswagen',
  'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki',
  'Peugeot', 'Renault', 'Fiat', 'BMW', 'Mercedes-Benz', 'Audi',
  'Volvo', 'Seat', 'Skoda', 'Opel', 'Citroën', 'Dacia', 'Otra'
];

const FichaForm: React.FC<FichaFormProps> = ({ ficha, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FichaFormData>({
    marca: '',
    modelo: '',
    año: new Date().getFullYear().toString(),
    patente: '',
    numero_chasis: '',
    kilometraje: '',
    fecha_ingreso: new Date().toLocaleDateString('en-CA'), // Formato YYYY-MM-DD
    fecha_trabajo: '',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_fiel: false, // Por defecto no es cliente fiel
    orden_trabajo: '',
    repuestos_utilizados: '',
    trabajo_realizado: '',
    observaciones: '',
  });

  const [errors, setErrors] = useState<Partial<FichaFormData>>({});
  const [existingAuto, setExistingAuto] = useState<any>(null);
  const [checkingPatente, setCheckingPatente] = useState(false);

  // Scroll con teclado (flechas arriba/abajo)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // Solo hacer scroll si no estamos en ningún campo de entrada
        const activeElement = document.activeElement;
        const isInputField = activeElement?.tagName === 'INPUT' || 
                           activeElement?.tagName === 'TEXTAREA' || 
                           activeElement?.tagName === 'SELECT' ||
                           activeElement?.getAttribute('role') === 'textbox';
        
        if (!isInputField) {
          event.preventDefault();
          
          // Obtener el contenedor del formulario
          const formContainer = document.querySelector('[data-form-container]') as HTMLElement;
          if (formContainer) {
            const scrollAmount = 50; // Píxeles a desplazar
            
            if (event.key === 'ArrowDown') {
              formContainer.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
              });
            } else if (event.key === 'ArrowUp') {
              formContainer.scrollBy({
                top: -scrollAmount,
                behavior: 'smooth'
              });
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (ficha) {
      setFormData({
        marca: ficha.marca || '',
        modelo: ficha.modelo || '',
        año: ficha.año?.toString() || new Date().getFullYear().toString(),
        patente: ficha.patente || '',
        numero_chasis: ficha.numero_chasis || '',
        kilometraje: ficha.kilometraje?.toString() || '',
        fecha_ingreso: ficha.fecha_ingreso || new Date().toLocaleDateString('en-CA'),
        fecha_trabajo: ficha.fecha_trabajo || '',
        cliente_nombre: ficha.cliente_nombre || '',
        cliente_telefono: ficha.cliente_telefono || '',
        cliente_fiel: ficha.cliente_fiel || false,
        orden_trabajo: ficha.orden_trabajo || '',
        repuestos_utilizados: ficha.repuestos_utilizados || '',
        trabajo_realizado: ficha.trabajo_realizado || '',
        observaciones: ficha.observaciones || '',
      });
    }
  }, [ficha]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FichaFormData> = {};

    if (!formData.marca.trim()) newErrors.marca = 'La marca es requerida';
    if (!formData.modelo.trim()) newErrors.modelo = 'El modelo es requerido';
    if (!formData.año || parseInt(formData.año) < 1900 || parseInt(formData.año) > new Date().getFullYear() + 1) {
      newErrors.año = 'El año debe ser válido';
    }
    if (!formData.patente.trim()) {
      newErrors.patente = 'La patente es obligatoria';
    } else {
      // Validar formato de patente argentina y chilena
      const patenteArgentinaRegex = /^[A-Z]{2,3}[0-9]{3}[A-Z]{0,2}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
      const patenteChilenaRegex = /^[A-Z]{4}[0-9]{2}$/;
      
      if (!patenteArgentinaRegex.test(formData.patente.trim()) && !patenteChilenaRegex.test(formData.patente.trim())) {
        newErrors.patente = 'Formato de patente inválido (Ej: ABC123, ABCD12, AB123CD)';
      }
    }
    
    // Validar kilometraje creciente si el auto ya existe
    if (formData.kilometraje && ficha && ficha.id) {
      // Aquí podríamos agregar validación de kilometraje creciente
      // Por ahora solo validamos que sea un número positivo
      const km = parseInt(formData.kilometraje);
      if (isNaN(km) || km < 0) {
        newErrors.kilometraje = 'El kilometraje debe ser un número válido';
      }
    }
    if (!formData.cliente_nombre.trim()) newErrors.cliente_nombre = 'El nombre del cliente es requerido';
    if (!formData.cliente_telefono.trim()) newErrors.cliente_telefono = 'El teléfono del cliente es requerido';
    if (formData.kilometraje && (parseInt(formData.kilometraje) < 0 || parseInt(formData.kilometraje) > 999999)) {
      newErrors.kilometraje = 'El kilometraje debe ser válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FichaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Verificar patente existente cuando se complete el campo
    if (field === 'patente' && typeof value === 'string' && value.trim().length >= 6) {
      checkExistingPatente(value.trim());
    }

    // Validación en tiempo real para trabajo realizado
    if (field === 'trabajo_realizado' && typeof value === 'string') {
      const trabajo = value.trim();
      if (trabajo.length > 0 && trabajo.length < 3) {
        setErrors(prev => ({ ...prev, trabajo_realizado: 'El trabajo realizado debe tener al menos 3 caracteres' }));
      } else if (trabajo.length >= 3) {
        setErrors(prev => ({ ...prev, trabajo_realizado: undefined }));
      }
    }
  };

  const checkExistingPatente = async (patente: string) => {
    setCheckingPatente(true);
    try {
      // Temporalmente deshabilitado hasta que funcione correctamente
      // const auto = await SupabaseService.searchAutoByPatente(patente);
      // setExistingAuto(auto);
      setExistingAuto(null);
    } catch (error) {
      console.error('Error checking patente:', error);
      setExistingAuto(null);
    } finally {
      setCheckingPatente(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Verificar si el trabajo realizado está vacío o es muy corto
    if (!formData.trabajo_realizado || formData.trabajo_realizado.trim() === '') {
      setErrors(prev => ({ ...prev, trabajo_realizado: 'El trabajo realizado es obligatorio' }));
      return;
    }

    // Verificar que el trabajo realizado tenga al menos 3 caracteres
    if (formData.trabajo_realizado.trim().length < 3) {
      setErrors(prev => ({ ...prev, trabajo_realizado: 'El trabajo realizado debe tener al menos 3 caracteres' }));
      return;
    }

    const fichaData: FichaAuto = {
      marca: formData.marca.trim(),
      modelo: formData.modelo.trim(),
      año: parseInt(formData.año),
      patente: formData.patente.trim(),
      numero_chasis: formData.numero_chasis.trim() || undefined,
      kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : undefined,
      fecha_ingreso: formData.fecha_ingreso,
      fecha_trabajo: formData.fecha_trabajo || undefined,
      cliente_nombre: formData.cliente_nombre.trim(),
      cliente_telefono: formData.cliente_telefono.trim(),
      cliente_fiel: formData.cliente_fiel,
      orden_trabajo: formData.orden_trabajo.trim() || undefined,
      repuestos_utilizados: formData.repuestos_utilizados.trim() || undefined,
      trabajo_realizado: formData.trabajo_realizado.trim() || undefined,
      observaciones: formData.observaciones.trim() || undefined,
    };

    console.log('💾 [FORM] Enviando ficha para guardar:', fichaData);
    onSave(fichaData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ mt: 2, maxHeight: '80vh', overflow: 'auto' }}
        data-form-container
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary">
            Información del Vehículo
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ↑↓ Scroll en el formulario
          </Typography>
        </Box>

        {existingAuto && !ficha && (
          <Box sx={{ 
            bgcolor: 'info.light', 
            color: 'info.contrastText', 
            p: 2, 
            borderRadius: 1, 
            mb: 2,
            border: '1px solid',
            borderColor: 'info.main'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              🚗 Auto Existente Detectado
            </Typography>
            <Typography variant="body2">
              Este auto ya está registrado. Al guardar se agregará un <strong>nuevo servicio</strong> al historial.
              Los datos del cliente se actualizarán si son diferentes.
            </Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.marca}>
              <InputLabel>Marca</InputLabel>
              <Select
                value={formData.marca}
                onChange={(e) => handleInputChange('marca', e.target.value)}
                label="Marca"
              >
                {marcasComunes.map((marca) => (
                  <MenuItem key={marca} value={marca}>
                    {marca}
                  </MenuItem>
                ))}
              </Select>
              {errors.marca && <FormHelperText>{errors.marca}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Modelo"
              value={formData.modelo}
              onChange={(e) => handleInputChange('modelo', e.target.value)}
              error={!!errors.modelo}
              helperText={errors.modelo}
              placeholder="Ej: Corolla, Civic, Focus"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Año"
              type="number"
              value={formData.año}
              onChange={(e) => handleInputChange('año', e.target.value)}
              error={!!errors.año}
              helperText={errors.año}
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Patente"
              value={formData.patente}
              onChange={(e) => handleInputChange('patente', e.target.value.toUpperCase())}
              error={!!errors.patente}
              helperText={
                errors.patente || 
                (checkingPatente ? "Verificando..." : 
                 existingAuto ? `✅ Auto existente: ${existingAuto.marca} ${existingAuto.modelo} ${existingAuto.año}` :
                 "Obligatorio - Ej: ABC123 (AR), ABCD12 (CL), AB123CD (AR)")
              }
              placeholder="ABC123"
              required
              InputProps={{
                endAdornment: checkingPatente ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    <CircularProgress size={16} />
                  </Box>
                ) : existingAuto ? (
                  <Box sx={{ color: 'success.main', mr: 1 }}>
                    ✓
                  </Box>
                ) : null
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Número de Chasis"
              value={formData.numero_chasis}
              onChange={(e) => handleInputChange('numero_chasis', e.target.value.toUpperCase())}
              helperText="Opcional"
              placeholder="17 dígitos"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Kilometraje"
              type="number"
              value={formData.kilometraje}
              onChange={(e) => handleInputChange('kilometraje', e.target.value)}
              error={!!errors.kilometraje}
              helperText={errors.kilometraje || 'Opcional'}
              inputProps={{ min: 0, max: 999999 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Fecha de Ingreso"
              value={formData.fecha_ingreso ? new Date(formData.fecha_ingreso + 'T00:00:00') : new Date()}
              onChange={(date) => {
                if (date && !isNaN(date.getTime())) {
                  // Usar toLocaleDateString para evitar problemas de zona horaria
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  handleInputChange('fecha_ingreso', `${year}-${month}-${day}`);
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.fecha_ingreso,
                  helperText: errors.fecha_ingreso
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Fecha de Trabajo"
              value={formData.fecha_trabajo ? new Date(formData.fecha_trabajo + 'T00:00:00') : null}
              onChange={(date) => {
                if (date && !isNaN(date.getTime())) {
                  // Usar toLocaleDateString para evitar problemas de zona horaria
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  handleInputChange('fecha_trabajo', `${year}-${month}-${day}`);
                } else {
                  handleInputChange('fecha_trabajo', '');
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Opcional'
                }
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom color="primary">
          Información del Cliente
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre del Cliente"
              value={formData.cliente_nombre}
              onChange={(e) => handleInputChange('cliente_nombre', e.target.value)}
              error={!!errors.cliente_nombre}
              helperText={errors.cliente_nombre}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.cliente_telefono}
              onChange={(e) => handleInputChange('cliente_telefono', e.target.value)}
              error={!!errors.cliente_telefono}
              helperText={errors.cliente_telefono}
              placeholder="Ej: +54 9 11 1234-5678"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.cliente_fiel}
                  onChange={(e) => handleInputChange('cliente_fiel', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                    🏆 Cliente Fiel/VIP
                  </Typography>
                  <Typography variant="body2" component="div" color="text.secondary">
                    Activar para enviar recordatorios automáticos de servicios
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mt: 1 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom color="primary">
          Detalles del Trabajo
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Orden de Trabajo"
              multiline
              rows={3}
              value={formData.orden_trabajo}
              onChange={(e) => handleInputChange('orden_trabajo', e.target.value)}
              placeholder="Describe la orden de trabajo solicitada..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Repuestos Utilizados"
              multiline
              rows={3}
              value={formData.repuestos_utilizados}
              onChange={(e) => handleInputChange('repuestos_utilizados', e.target.value)}
              placeholder="Lista de repuestos utilizados..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Trabajo Realizado"
              multiline
              rows={4}
              value={formData.trabajo_realizado}
              onChange={(e) => handleInputChange('trabajo_realizado', e.target.value)}
              placeholder="Describe detalladamente el trabajo realizado..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              multiline
              rows={3}
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales..."
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{ minWidth: 100 }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            {ficha ? 'Actualizar' : 'Guardar'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default FichaForm;

