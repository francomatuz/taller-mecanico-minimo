import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Build,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { SupabaseService } from '../services/supabaseService';
import { AutoConServicio } from '../types/Auto';

interface StatisticsData {
  // Vehículos
  totalAutos: number;
  marcasPopulares: Array<{ marca: string; count: number }>;
  modelosPopulares: Array<{ modelo: string; count: number }>;
  añosVehiculos: Array<{ año: number; count: number }>;
  
  // Clientes
  totalClientes: number;
  clientesFieles: number;
  clientesRegulares: number;
  clientesConMasServicios: Array<{ nombre: string; servicios: number }>;
  
  // Servicios
  totalServicios: number;
  serviciosPorMes: Array<{ mes: string; count: number }>;
  
  // Temporales
  mesOcupado: { mes: string; servicios: number };
  diaPopular: { dia: string; servicios: number };
  
  // Eficiencia
  autosConMasHistorial: Array<{ patente: string; marca: string; modelo: string; servicios: number }>;
}

const Statistics: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Obtener todos los datos
      const fichas = await SupabaseService.getAllFichas();
      
      // Obtener todos los historiales para análisis detallado
      const historiales = await Promise.all(
        fichas.map(ficha => SupabaseService.getAutoHistory(ficha.id))
      );
      
      const historialValidos = historiales.filter(h => h !== null);
      
      // Calcular estadísticas
      const stats = calculateStatistics(fichas, historialValidos);
      setStatistics(stats);
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateStatistics = (fichas: AutoConServicio[], historiales: any[]): StatisticsData => {
    // Vehículos
    const totalAutos = fichas.length;
    
    // Marcas más populares
    const marcasCount = fichas.reduce((acc, ficha) => {
      acc[ficha.marca] = (acc[ficha.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const marcasPopulares = Object.entries(marcasCount)
      .map(([marca, count]) => ({ marca, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Modelos más populares
    const modelosCount = fichas.reduce((acc, ficha) => {
      acc[ficha.modelo] = (acc[ficha.modelo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const modelosPopulares = Object.entries(modelosCount)
      .map(([modelo, count]) => ({ modelo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Años de vehículos
    const añosCount = fichas.reduce((acc, ficha) => {
      acc[ficha.año] = (acc[ficha.año] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const añosVehiculos = Object.entries(añosCount)
      .map(([año, count]) => ({ año: parseInt(año), count }))
      .sort((a, b) => b.año - a.año);

    // Clientes
    const clientesUnicos = new Set(fichas.map(f => f.cliente_nombre.toLowerCase())).size;
    const clientesFieles = fichas.filter(f => f.cliente_fiel).length;
    const clientesRegulares = totalAutos - clientesFieles;

    // Clientes con más servicios (contando servicios reales, no autos)
    console.log('📊 [STATS] Calculando servicios por cliente...');
    const clientesServicios = historiales.reduce((acc, historial) => {
      const nombre = historial.cliente_nombre;
      const cantidadServicios = historial.servicios.length;
      console.log(`📊 [STATS] Cliente ${nombre}: ${cantidadServicios} servicios`);
      acc[nombre] = (acc[nombre] || 0) + cantidadServicios;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 [STATS] Servicios por cliente calculados:', clientesServicios);

    const clientesConMasServicios = Object.entries(clientesServicios)
      .map(([nombre, servicios]) => ({ nombre, servicios: servicios as number }))
      .sort((a, b) => b.servicios - a.servicios)
      .slice(0, 10);

    console.log('📊 [STATS] Top clientes con más servicios:', clientesConMasServicios);

    // Servicios
    const totalServicios = historiales.reduce((acc, historial) => acc + historial.servicios.length, 0);

    // Servicios por mes (últimos 12 meses)
    const serviciosPorMes = calcularServiciosPorMes(historiales);


    // Mes más ocupado
    const mesOcupado = serviciosPorMes.reduce((max, mes) => 
      mes.count > max.servicios ? { mes: mes.mes, servicios: mes.count } : max,
      { mes: '', servicios: 0 }
    );
    
    console.log('📅 [STATS] Mes más ocupado calculado:', mesOcupado);

    // Día más popular (calculado por día de la semana)
    console.log('📊 [STATS] Calculando día más popular...');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const serviciosPorDia: Record<string, number> = {};
    
    historiales.forEach(historial => {
      historial.servicios.forEach((servicio: any) => {
        const fecha = new Date(servicio.fecha_ingreso);
        const diaSemana = diasSemana[fecha.getDay()];
        serviciosPorDia[diaSemana] = (serviciosPorDia[diaSemana] || 0) + 1;
      });
    });
    
    console.log('📊 [STATS] Servicios por día:', serviciosPorDia);
    
    const diaPopular = Object.entries(serviciosPorDia)
      .reduce((max, [dia, count]) => 
        count > max.servicios ? { dia, servicios: count } : max,
        { dia: 'N/A', servicios: 0 }
      );
    
    console.log('📊 [STATS] Día más popular calculado:', diaPopular);

    // Autos con más historial
    const autosConMasHistorial = historiales
      .map(h => ({
        patente: h.patente,
        marca: h.marca,
        modelo: h.modelo,
        servicios: h.servicios.length
      }))
      .sort((a, b) => b.servicios - a.servicios)
      .slice(0, 10);

    return {
      totalAutos,
      marcasPopulares,
      modelosPopulares,
      añosVehiculos,
      totalClientes: clientesUnicos,
      clientesFieles,
      clientesRegulares,
      clientesConMasServicios,
      totalServicios,
      serviciosPorMes,
      mesOcupado,
      diaPopular,
      autosConMasHistorial
    };
  };

  const calcularServiciosPorMes = (historiales: any[]) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const serviciosPorMes: Record<string, number> = {};
    
    console.log('🔍 [STATS] Total historiales a procesar:', historiales.length);
    
    historiales.forEach((historial, historialIndex) => {
      console.log(`🔍 [STATS] Procesando historial ${historialIndex + 1}: ${historial.patente} (${historial.servicios.length} servicios)`);
      
      historial.servicios.forEach((servicio: any, servicioIndex: number) => {
        const fecha = new Date(servicio.fecha_ingreso);
        
        // Verificar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
          console.warn('📅 [STATS] Fecha inválida encontrada:', servicio.fecha_ingreso);
          return;
        }
        
        const mesAño = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
        serviciosPorMes[mesAño] = (serviciosPorMes[mesAño] || 0) + 1;
        
        // Debug: mostrar cada servicio contado
        console.log(`📅 [STATS] Servicio ${servicioIndex + 1} del auto ${historial.patente}: ${servicio.fecha_ingreso} -> ${mesAño} (total en ${mesAño}: ${serviciosPorMes[mesAño]})`);
      });
    });

    console.log('📊 [STATS] Servicios por mes calculados:', serviciosPorMes);

    return Object.entries(serviciosPorMes)
      .map(([mes, count]) => ({ mes, count }))
      .sort((a, b) => {
        // Ordenar por cantidad de servicios (más servicios primero)
        return b.count - a.count;
      })
      .slice(0, 12);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando estadísticas...
        </Typography>
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="error">
          Error al cargar las estadísticas
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <TrendingUp sx={{ mr: 2 }} />
        Estadísticas del Taller
      </Typography>


      {/* Resumen General */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DirectionsCar color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h3" color="primary">
                {statistics.totalAutos}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Autos Registrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person color="success" sx={{ fontSize: 48 }} />
              <Typography variant="h3" color="success.main">
                {statistics.totalClientes}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Clientes Únicos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Build color="warning" sx={{ fontSize: 48 }} />
              <Typography variant="h3" color="warning.main">
                {statistics.totalServicios}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Servicios Realizados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star color="secondary" sx={{ fontSize: 48 }} />
              <Typography variant="h3" color="secondary.main">
                {statistics.clientesFieles}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Clientes Fieles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estadísticas Detalladas */}
      <Grid container spacing={3}>
        {/* Marcas Más Populares */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏷️ Marcas Más Frecuentes
              </Typography>
              <List dense>
                {statistics.marcasPopulares.slice(0, 5).map((marca, index) => (
                  <ListItem key={marca.marca} sx={{ px: 0 }}>
                    <ListItemText 
                      primary={`${index + 1}. ${marca.marca}`} 
                      secondary={`${marca.count} vehículos`}
                    />
                    <Chip 
                      label={marca.count} 
                      size="small" 
                      color={index === 0 ? 'primary' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Clientes con Más Servicios */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                👥 Clientes con Más Servicios
              </Typography>
              <List dense>
                {statistics.clientesConMasServicios.slice(0, 5).map((cliente, index) => (
                  <ListItem key={cliente.nombre} sx={{ px: 0 }}>
                    <ListItemText 
                      primary={`${index + 1}. ${cliente.nombre}`} 
                      secondary={`${cliente.servicios} servicios`}
                    />
                    <Chip 
                      label={cliente.servicios} 
                      size="small" 
                      color={cliente.servicios >= 3 ? 'success' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>


        {/* Estadísticas Temporales */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Estadísticas Temporales
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mes Más Ocupado
                </Typography>
                <Typography variant="h6" color="success.main">
                  {statistics.mesOcupado.mes}
                </Typography>
                <Typography variant="body2">
                  {statistics.mesOcupado.servicios} servicios
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Día Más Popular
                </Typography>
                <Typography variant="h6" color="info.main">
                  {statistics.diaPopular.dia}
                </Typography>
                <Typography variant="body2">
                  ~{statistics.diaPopular.servicios} servicios
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Clientes Fieles vs Regulares */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Distribución de Clientes
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Clientes Fieles
                </Typography>
                <Typography variant="h5" color="secondary.main">
                  {statistics.clientesFieles}
                </Typography>
                <Typography variant="body2">
                  {statistics.totalAutos > 0 ? Math.round((statistics.clientesFieles / statistics.totalAutos) * 100) : 0}% del total
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Clientes Regulares
                </Typography>
                <Typography variant="h5" color="info.main">
                  {statistics.clientesRegulares}
                </Typography>
                <Typography variant="body2">
                  {statistics.totalAutos > 0 ? Math.round((statistics.clientesRegulares / statistics.totalAutos) * 100) : 0}% del total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Autos con Más Historial */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Autos con Más Historial (Candidatos a Fieles)
              </Typography>
              <Grid container spacing={2}>
                {statistics.autosConMasHistorial.slice(0, 6).map((auto, index) => (
                  <Grid item xs={12} sm={6} md={4} key={auto.patente}>
                    <Paper sx={{ p: 2, backgroundColor: auto.servicios >= 3 ? 'success.light' : 'grey.100' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {auto.patente}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {auto.marca} {auto.modelo}
                      </Typography>
                      <Chip 
                        label={`${auto.servicios} servicios`}
                        size="small"
                        color={auto.servicios >= 3 ? 'success' : auto.servicios >= 2 ? 'warning' : 'default'}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics;
