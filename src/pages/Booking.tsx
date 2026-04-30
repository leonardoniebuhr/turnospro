import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfesionales, useConsultorios, usePacientes, useCreateTurno, useTurnos } from '../hooks/useMedical';
import { format, addDays, startOfDay, addMinutes, parse, isWithinInterval, getDay, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Stethoscope, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Booking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedProf, setSelectedProf] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [searchPac, setSearchPac] = useState('');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState('1');
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  
  const { data: profesionales } = useProfesionales();
  const { data: pacientes } = usePacientes(searchPac);
  const createTurno = useCreateTurno();

  // Fetch turnos for the selected professional and date to filter slots
  const startDay = startOfDay(selectedDate).toISOString();
  const endDay = addDays(startOfDay(selectedDate), 1).toISOString();
  const { data: existingTurnos } = useTurnos({ 
    start: startDay, 
    end: endDay, 
    profesionalId: selectedProf?.id 
  });

  const availableSlots = useMemo(() => {
    if (!selectedProf || !selectedDate) return [];
    const diaSemana = getDay(selectedDate);
    const configs = selectedProf.configAgendas.filter((c: any) => c.diaSemana === diaSemana);
    
    if (configs.length === 0) return [];

    const slots: any[] = [];
    const duration = selectedProf.duracionTurnoDefault || 30;

    configs.forEach((config: any) => {
      let current = parse(config.horaInicio, 'HH:mm', selectedDate);
      const end = parse(config.horaFin, 'HH:mm', selectedDate);

      while (current < end) {
        const timeStr = format(current, 'HH:mm');
        
        // Filter out already taken slots
        const isTaken = existingTurnos?.some((t: any) => {
          const tStart = new Date(t.fechaHoraInicio);
          return format(tStart, 'HH:mm') === timeStr && t.estado !== 'CANCELADO';
        });

        if (!isTaken) {
          slots.push({ time: timeStr, config });
        }
        current = addMinutes(current, duration);
      }
    });

    return slots;
  }, [selectedProf, selectedDate, existingTurnos]);

  const handleBooking = async () => {
    if (!selectedConfig) return;
    const [hours, minutes] = selectedTime.split(':');
    const start = new Date(selectedDate);
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createTurno.mutate({
      pacienteId: selectedPaciente.id,
      profesionalId: selectedProf.id,
      consultorioId: selectedConfig.consultorioId,
      fechaHoraInicio: start.toISOString(),
      tipo: 'PRESENCIAL',
      motivoConsulta: 'Consulta General',
      recurrenciaSemanas: recurrenceWeeks
    }, {
      onSuccess: () => setStep(4)
    });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reservar Nuevo Turno</h1>
        <p className="text-slate-500 mt-2 font-medium">Sigue los pasos para confirmar tu cita médica en pocos segundos.</p>
        
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-4 mt-8">
           {[1, 2, 3].map((s) => (
             <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 shadow-inner'
                }`}>
                  {step > s ? <CheckCircle2 size={20} /> : s}
                </div>
                {s < 3 && <div className={`w-20 h-1 transition-all duration-300 ${step >= s + 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />}
             </div>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Stethoscope className="text-blue-600" />
                Selecciona la Especialidad o Profesional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profesionales?.map((prof: any) => (
                  <button
                    key={prof.id}
                    onClick={() => { setSelectedProf(prof); nextStep(); }}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      selectedProf?.id === prof.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{prof.usuario.nombre} {prof.usuario.apellido}</p>
                        <p className="text-sm text-blue-600 font-semibold">{prof.especialidad}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <CalendarIcon className="text-blue-600" />
                  Elegir Fecha y Horario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Fake Date Picker */}
                  <div className="md:col-span-1 space-y-4">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Fecha</p>
                    {[0, 1, 2, 3, 4].map((d) => {
                      const date = addDays(new Date(), d);
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(date)}
                          className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                            format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-50 hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-xs font-bold uppercase">{format(date, 'EEE', { locale: es })}</p>
                          <p className="font-bold">{format(date, 'd MMM', { locale: es })}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Horarios Disponibles</p>
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => { setSelectedTime(slot.time); setSelectedConfig(slot.config); }}
                            className={`p-4 rounded-xl font-bold border-2 transition-all ${
                              selectedTime === slot.time ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-50 text-slate-600 hover:border-slate-200'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <XCircle className="text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-bold text-center">
                          El profesional no tiene horarios configurados o está completo para este día.
                        </p>
                      </div>
                    )}
                    <div className="mt-6 flex items-center gap-3 bg-amber-50 p-4 rounded-2xl text-amber-700">
                       <Clock size={20} />
                       <p className="text-sm font-medium">Cada turno tiene una duración estimada de {selectedProf?.duracionTurnoDefault || 30} min.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-10">
                   <button onClick={prevStep} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all underline">Volver</button>
                   <button onClick={nextStep} disabled={!selectedTime} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50">Siguiente Paso</button>
                </div>
             </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="text-blue-600" />
                  Confirmar Paciente y Datos
                </h3>
                
                <div className="space-y-6">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={20} /></span>
                    <input
                      type="text"
                      placeholder="Buscar paciente por DNI o nombre..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchPac}
                      onChange={(e) => setSearchPac(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {pacientes?.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPaciente(p)}
                        className={`p-4 text-left rounded-xl transition-all border-2 ${
                          selectedPaciente?.id === p.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-slate-800">{p.nombre} {p.apellido}</p>
                        <p className="text-xs text-slate-500 font-medium">DNI: {p.dni} • Tel: {p.telefono}</p>
                      </button>
                    ))}
                  </div>

                  {selectedPaciente && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                           <p className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-1">Resumen de la Cita</p>
                           <h4 className="text-2xl font-black mb-6">Confirmación Final</h4>
                           
                           <div className="grid grid-cols-2 gap-y-4">
                              <div>
                                <p className="text-blue-100 text-sm">Profesional</p>
                                <p className="font-bold">{selectedProf?.usuario.nombre} {selectedProf?.usuario.apellido}</p>
                              </div>
                              <div>
                                <p className="text-blue-100 text-sm">Paciente</p>
                                <p className="font-bold">{selectedPaciente.nombre} {selectedPaciente.apellido}</p>
                              </div>
                              <div>
                                <p className="text-blue-100 text-sm">Horario</p>
                                <p className="font-bold">{format(selectedDate, 'EEEE d MMMM', { locale: es })} a las {selectedTime} hs</p>
                              </div>
                              <div>
                                <p className="text-blue-100 text-sm">Lugar</p>
                                <p className="font-bold">Consultorio {selectedConfig?.consultorio?.numero || selectedConfig?.consultorioId?.slice(0,5)}</p>
                              </div>
                           </div>

                           <div className="mt-8 p-4 bg-white/10 rounded-2xl border border-white/20">
                              <label className="block text-xs font-bold uppercase tracking-widest text-blue-100 mb-2">Turno Recurrente (Opcional)</label>
                              <select 
                                value={recurrenceWeeks}
                                onChange={(e) => setRecurrenceWeeks(e.target.value)}
                                className="w-full bg-white text-blue-900 px-4 py-2 rounded-xl font-bold outline-none"
                              >
                                <option value="1">Solo esta vez</option>
                                <option value="4">Todos los {format(selectedDate, 'EEEE', { locale: es })} (4 semanas)</option>
                                <option value="12">Horario fijo trimestral (12 semanas)</option>
                              </select>
                              <p className="text-[10px] text-blue-100 mt-2 italic">* Se generarán múltiples turnos en el mismo horario semanal.</p>
                           </div>
                        </div>
                        <CheckCircle2 className="absolute -bottom-8 -right-8 text-white/10 w-48 h-48 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-10">
                   <button onClick={prevStep} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all underline">Volver</button>
                   <button 
                    onClick={handleBooking} 
                    disabled={!selectedPaciente || createTurno.isPending}
                    className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {createTurno.isPending ? 'Confirmando...' : 'Confirmar y Reservar'}
                  </button>
                </div>
             </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-2xl text-center flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">¡Turno Confirmado!</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed font-medium">
              Hemos reservado el turno con éxito. Se ha enviado una notificación por WhatsApp al paciente {selectedPaciente.nombre} con los detalles de la cita.
            </p>
            <div className="mt-12 flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => navigate('/agenda')} 
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Ver en la Agenda
              </button>
              <button 
                onClick={() => {
                  setStep(1);
                  setSelectedPaciente(null);
                  setSelectedTime('');
                }} 
                className="bg-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all font-sans"
              >
                Nuevo Turno
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
