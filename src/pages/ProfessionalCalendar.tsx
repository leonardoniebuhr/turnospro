import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTurnos, useConsultorios, useProfesionales, useUpdateTurno, useDeleteTurno, useRegistrarPago } from '../hooks/useMedical';
import { useAuthStore } from '../store/authStore';
import { ChevronLeft, ChevronRight, X, Trash2, CheckCircle2, Clock, Printer, Calendar as CalendarIcon, DollarSign, Info, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function ProfessionalCalendar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [view, setView] = useState<any>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(19);

  const { data: turnos, isLoading } = useTurnos();
  const { data: profesionales } = useProfesionales();
  const { data: consultorios } = useConsultorios();
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => fetch('/api/config').then(res => res.json())
  });

  const minTime = React.useMemo(() => new Date(1972, 0, 1, startHour, 0, 0), [startHour]);
  const maxTime = React.useMemo(() => new Date(1972, 0, 1, endHour, 0, 0), [endHour]);

  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [profesionalFilter, setProfesionalFilter] = useState('');
  const [consultorioFilter, setConsultorioFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  React.useEffect(() => {
    if (config) {
      if (config.horarioApertura) setStartHour(parseInt(config.horarioApertura.split(':')[0]));
      if (config.horarioCierre) setEndHour(parseInt(config.horarioCierre.split(':')[0]));
    }
  }, [config]);

  const updateTurno = useUpdateTurno();
  const deleteTurno = useDeleteTurno();
  const registrarPago = useRegistrarPago();
  const [paymentMode, setPaymentMode] = useState(false);
  const [pagoData, setPagoData] = useState({
    monto: '0',
    metodo: 'EFECTIVO',
    estado: 'COMPLETADO'
  });

  useEffect(() => {
    if (selectedEvent) {
      const turno = selectedEvent.resource;
      const paciente = turno?.paciente;
      const prof = turno?.profesional;
      
      // Auto-calc price
      let price = prof?.arancelParticular || 0;
      if (paciente?.obraSocialId) {
        // Try to find specific coverage price, or fallback to something
        // For now, let's say Obra Social has a fixed coseguro or if OS exists, price is different
        price = prof?.coberturas?.find((c: any) => c.obraSocialId === paciente.obraSocialId)?.precioCoseguro || 0;
      }
      
      setPagoData(prev => ({
        ...prev,
        monto: (turno.pago?.monto || price).toString(),
        metodo: turno.pago?.metodo || 'EFECTIVO',
        estado: turno.pago?.estadoPago || 'COMPLETADO'
      }));
    } else {
      setPaymentMode(false);
    }
  }, [selectedEvent]);

  const handleRegistrarPago = () => {
    if (!selectedEvent) return;
    registrarPago.mutate({
      turnoId: selectedEvent.resource.id,
      monto: pagoData.monto,
      metodo: pagoData.metodo,
      estadoPago: pagoData.estado
    }, {
      onSuccess: () => {
        setPaymentMode(false);
        setSelectedEvent(null);
      }
    });
  };

  const currentPrice = selectedEvent?.resource?.profesional?.arancelParticular || 0;
  const alias = selectedEvent?.resource?.profesional?.aliasTransferencia;
  const cbu = selectedEvent?.resource?.profesional?.cbuTransferencia;
  if (!user) return null;

  const filteredTurnos = turnos?.filter((t: any) => {
    const matchesSpecialty = !specialtyFilter || t.profesional?.especialidad === specialtyFilter;
    const matchesProf = !profesionalFilter || t.profesionalId === profesionalFilter;
    const matchesCons = !consultorioFilter || t.consultorioId === consultorioFilter;
    return matchesSpecialty && matchesProf && matchesCons;
  });

  const events = filteredTurnos?.map((t: any) => ({
    id: t.id,
    title: `${t.paciente?.nombre || ''} ${t.paciente?.apellido || ''} | ${t.profesional?.usuario?.apellido || ''}`,
    start: new Date(t.fechaHoraInicio),
    end: new Date(t.fechaHoraFin),
    resourceId: t.consultorioId,
    resource: t,
    color: t.profesional?.colorCalendario,
    estado: t.estado
  })) || [];

  const resources = consultorios?.map((c: any) => ({
    id: c.id,
    title: `Consultorio ${c.numero} - ${c.nombre}`
  }));

  const specialties = Array.from(new Set(turnos?.map((t: any) => t.profesional?.especialidad).filter(Boolean) || []));

  const eventStyleGetter = (event: any) => {
    const isCancelled = event.estado === 'CANCELADO';
    return {
      style: {
        backgroundColor: isCancelled ? '#94a3b8' : (event.color || '#3b82f6'),
        opacity: isCancelled ? 0.6 : 1,
        textDecoration: isCancelled ? 'line-through' : 'none',
        borderRadius: '12px',
        border: 'none',
        padding: '2px 6px',
        boxShadow: 'none',
        transition: 'all 0.2s ease'
      }
    };
  };

  const handleStatusChange = (status: string) => {
    if (!selectedEvent) return;
    updateTurno.mutate({ id: selectedEvent.id, estado: status }, {
      onSuccess: () => {
        setSelectedEvent(null);
        setIsEditingTime(false);
      }
    });
  };

  const handleTimeUpdate = () => {
    if (!selectedEvent || !editStartTime || !editEndTime) return;
    
    try {
      const baseDate = format(new Date(selectedEvent.resource.fechaHoraInicio), 'yyyy-MM-dd');
      const newStart = new Date(`${baseDate}T${editStartTime}:00`);
      const newEnd = new Date(`${baseDate}T${editEndTime}:00`);

      updateTurno.mutate({ 
        id: selectedEvent.id, 
        fechaHoraInicio: newStart.toISOString(),
        fechaHoraFin: newEnd.toISOString()
      }, {
        onSuccess: () => {
          setSelectedEvent(null);
          setIsEditingTime(false);
        }
      });
    } catch (error) {
      alert('Error al actualizar el horario. Por favor revisa el formato.');
    }
  };

  const startEditingTime = () => {
    if (selectedEvent?.resource) {
      setEditStartTime(format(new Date(selectedEvent.resource.fechaHoraInicio), 'HH:mm'));
      setEditEndTime(format(new Date(selectedEvent.resource.fechaHoraFin), 'HH:mm'));
      setIsEditingTime(true);
    }
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    if (confirm('¿Seguro quieres eliminar este turno definitivamente?')) {
      deleteTurno.mutate(selectedEvent.id, {
        onSuccess: () => setSelectedEvent(null)
      });
    }
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsEditingTime(false);
  };

  return (
    <div className="h-full space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Agenda Médica</h1>
              <p className="text-blue-600 font-black uppercase tracking-widest text-[10px] mt-1">{config?.nombreClinica || "ADMINISTRACIÓN"}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/reservar')}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
          >
            Nuevo Turno
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Especialidad</label>
            <select 
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full bg-white px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none transition-all"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s: any) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Profesional</label>
            <select 
              value={profesionalFilter}
              onChange={(e) => setProfesionalFilter(e.target.value)}
              className="w-full bg-white px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none transition-all"
            >
              <option value="">Todos los profesionales</option>
              {profesionales?.map((p: any) => (
                <option key={p.id} value={p.id}>Dr. {p.usuario.apellido} {p.usuario.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Consultorio</label>
            <select 
              value={consultorioFilter}
              onChange={(e) => setConsultorioFilter(e.target.value)}
              className="w-full bg-white px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none transition-all"
            >
              <option value="">Todos los consultorios</option>
              {consultorios?.map((c: any) => (
                <option key={c.id} value={c.id}>Consultorio {c.numero} ({c.nombre})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" aria-hidden />
              <span className="font-bold text-slate-700">Punto verde</span>
              <span className="text-slate-500">= turno reservado por link público (el color sigue siendo el del profesional).</span>
            </div>
            <Clock size={18} className="text-slate-400 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Rango Horario:</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  min="0" max="23"
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                />
                <span className="text-xs text-slate-400">hs a</span>
                <input 
                  type="number" 
                  min="0" max="23"
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                />
                <span className="text-xs text-slate-400">hs</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">Ajusta el rango para ver los turnos con mayor detalle.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-[750px] relative">
        <Calendar
          localizer={localizer}
          events={events}
          resources={view === 'day' ? resources : undefined}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(v) => setView(v)}
          date={date}
          onNavigate={(d) => setDate(d)}
          onSelectEvent={handleSelectEvent}
          min={minTime}
          max={maxTime}
          step={30}
          timeslots={2}
          messages={{
            next: "Sig.",
            previous: "Ant.",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            noEventsInRange: "No hay turnos en este rango."
          }}
          culture="es"
          eventPropGetter={eventStyleGetter}
          components={{
            event: ({ event }: any) => {
              const viaLink = event.resource?.esPublico === true;
              const timeLabel = format(new Date(event.start), 'HH:mm');
              return (
                <div
                  className="flex items-center gap-1 w-full h-full min-w-0 text-[11px] leading-tight text-white px-0.5 py-0.5"
                  title={viaLink ? 'Reservado por link público' : undefined}
                >
                  {viaLink && (
                    <span
                      className="shrink-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white/90 shadow-sm"
                      aria-hidden
                    />
                  )}
                  <span className="shrink-0 font-black tabular-nums opacity-95">{timeLabel}</span>
                  <span className="truncate font-bold min-w-0">{event.title}</span>
                </div>
              );
            },
            toolbar: (props) => (
              <div className="flex items-center justify-between mb-4 p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button onClick={() => props.onNavigate('PREV')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={20}/></button>
                  <button onClick={() => props.onNavigate('TODAY')} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-800 font-bold text-sm transition-colors">Hoy</button>
                  <button onClick={() => props.onNavigate('NEXT')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronRight size={20}/></button>
                  <h2 className="text-xl font-black text-slate-900 ml-3 capitalize tracking-tight">
                    {props.view === 'day' 
                      ? format(props.date, "eeee d 'de' MMMM", { locale: es })
                      : props.view === 'week'
                      ? `Semana del ${format(startOfWeek(props.date, { weekStartsOn: 1 }), 'd MMMM', { locale: es })}`
                      : format(props.date, 'MMMM yyyy', { locale: es })
                    }
                  </h2>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  {['month', 'week', 'day'].map((v: any) => (
                    <button
                      key={v}
                      onClick={() => props.onView(v)}
                      className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                        props.view === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                    </button>
                  ))}
                </div>
              </div>
            )
          }}
        />

        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-slate-600">Cargando Agenda...</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedEvent(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-slate-900">Detalles del Turno</h2>
                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl">
                    {selectedEvent.resource?.paciente?.nombre?.[0] || 'P'}{selectedEvent.resource?.paciente?.apellido?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedEvent.resource?.paciente?.nombre} {selectedEvent.resource?.paciente?.apellido}</h3>
                    <p className="text-slate-500 font-medium text-sm">Paciente • {selectedEvent.resource?.paciente?.dni ? `DNI ${selectedEvent.resource.paciente.dni}` : 'Sin DNI'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horario</p>
                      {!isEditingTime && (
                        <button 
                          onClick={startEditingTime}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Modificar
                        </button>
                      )}
                    </div>
                    
                    {isEditingTime ? (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={editStartTime}
                            onChange={e => setEditStartTime(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                          <span className="text-[10px] text-slate-400">a</span>
                          <input 
                            type="time" 
                            value={editEndTime}
                            onChange={e => setEditEndTime(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleTimeUpdate}
                            className="flex-1 bg-blue-600 text-white py-1 px-2 rounded-lg text-[10px] font-bold"
                          >
                            OK
                          </button>
                          <button 
                            onClick={() => setIsEditingTime(false)}
                            className="flex-1 bg-slate-200 text-slate-600 py-1 px-2 rounded-lg text-[10px] font-bold"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-800 font-bold">
                         <Clock size={14} className="text-blue-500" />
                         {selectedEvent.resource?.fechaHoraInicio ? format(new Date(selectedEvent.resource.fechaHoraInicio), 'HH:mm') : '--:--'} hs
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Consultorio</p>
                    <p className="text-slate-800 font-bold">№ {selectedEvent.resource?.consultorio?.numero || '-'} - {selectedEvent.resource?.consultorio?.nombre || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Profesional</p>
                  <p className="text-slate-800 font-bold">Dr. {selectedEvent.resource?.profesional?.usuario?.nombre || ''} {selectedEvent.resource?.profesional?.usuario?.apellido || ''}</p>
                  <p className="text-xs text-blue-600 font-bold">{selectedEvent.resource?.profesional?.especialidad || 'S/E'}</p>
                </div>

                {selectedEvent.resource?.esPublico && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                      <LinkIcon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-0.5">Origen del turno</p>
                      <p className="text-sm font-semibold leading-snug">
                        Turno creado a través del link público de reserva (web).
                      </p>
                    </div>
                  </div>
                )}

                {/* Sección de Pago */}
                {!paymentMode ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado de Pago</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedEvent.resource?.pago?.estadoPago === 'COMPLETADO' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">Cobrado • ${selectedEvent.resource.pago.monto}</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase">Pendiente</span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setPaymentMode(true)}
                      className="p-2 bg-white text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <DollarSign size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-widest text-blue-800">Registrar Cobro</h4>
                      <button onClick={() => setPaymentMode(false)} className="text-[10px] font-bold text-slate-400">Volver</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Monto ($)</label>
                        <input 
                          type="number" 
                          value={pagoData.monto}
                          onChange={e => setPagoData({...pagoData, monto: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-blue-100 rounded-xl font-bold text-blue-600 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Método</label>
                        <select 
                          value={pagoData.metodo}
                          onChange={e => setPagoData({...pagoData, metodo: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-blue-100 rounded-xl font-bold text-sm outline-none"
                        >
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="OBRA_SOCIAL">Obra Social</option>
                        </select>
                      </div>
                    </div>

                    {pagoData.metodo === 'TRANSFERENCIA' && (alias || cbu) && (
                      <div className="p-3 bg-white border border-blue-100 rounded-xl space-y-1">
                        <p className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1"><Info size={10}/> Datos de Transferencia</p>
                        {alias && <p className="text-xs font-bold text-slate-700 select-all cursor-pointer">Alias: {alias}</p>}
                        {cbu && <p className="text-xs text-slate-500 font-medium select-all cursor-pointer">CBU: {cbu}</p>}
                      </div>
                    )}

                    <button 
                      onClick={handleRegistrarPago}
                      disabled={registrarPago.isPending}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      Confirmar Cobro
                    </button>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400">Acciones del Turno</p>
                   <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => navigate(`/recetas?pacienteId=${selectedEvent?.resource?.paciente?.id}&profesionalId=${selectedEvent?.resource?.profesional?.id}`)}
                       className="flex-1 min-w-fit px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                     >
                       <Printer size={16} /> Emitir Receta
                     </button>
                     <button 
                       onClick={() => handleStatusChange('CONFIRMADO')}
                       className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                     >
                       <CheckCircle2 size={16} /> Confirmar
                     </button>
                     <button 
                       onClick={() => handleStatusChange('CANCELADO')}
                       className="flex-1 bg-amber-50 text-amber-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
                     >
                       <X size={16} /> Cancelar
                     </button>
                   </div>
                   <button 
                     onClick={handleDelete}
                     className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors mt-4"
                   >
                     <Trash2 size={18} /> Eliminar Turno
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
