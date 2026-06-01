import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfDay, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  IdCard, 
  HeartPulse, 
  ChevronRight, 
  CheckCircle2,
  BriefcaseMedical,
  ArrowLeft,
  CreditCard,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = '/api';

export default function PublicBooking() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedProf, setSelectedProf] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientData, setPatientData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    obraSocialId: '',
    nroAfiliado: ''
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  // Queries
  const { data: profesionales } = useQuery({
    queryKey: ['profesionales-public'],
    queryFn: () => fetch(`${API_BASE}/public/profesionales`).then(res => res.json())
  });

  const { data: obrasSociales } = useQuery({
    queryKey: ['obras-sociales-public'],
    queryFn: () => fetch(`${API_BASE}/public/obras-sociales`).then(res => res.json())
  });

  const { data: config } = useQuery({
    queryKey: ['config-public'],
    queryFn: () => fetch(`${API_BASE}/config`).then(res => res.json())
  });

  const whatsappNumber = (config?.whatsapp || '').toString().trim();
  const whatsappDigits = whatsappNumber.replace(/[^\d]/g, '');
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';

  const { data: turnosOcupados } = useQuery({
    queryKey: ['turnos-ocupados', selectedProf?.id, format(selectedDate, 'yyyy-MM-dd')],
    enabled: !!selectedProf,
    queryFn: () => fetch(`${API_BASE}/public/turnos-ocupados?profesionalId=${selectedProf.id}&fecha=${format(selectedDate, 'yyyy-MM-dd')}`).then(res => res.json())
  });

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      const start = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`);
      const end = new Date(start.getTime() + (selectedProf.duracionTurnoDefault || 30) * 60000);

      const res = await fetch(`${API_BASE}/public/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: data.patient,
          booking: {
            profesionalId: selectedProf.id,
            consultorioId: selectedProf.configAgendas?.[0]?.consultorioId || '', // Fallback to first agenda consultorio
            fechaHoraInicio: start.toISOString(),
            fechaHoraFin: end.toISOString()
          }
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al reservar');
      }
      
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      window.scrollTo(0, 0); // Asegurar que el usuario vea el mensaje arriba
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    }
  });

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">¡Turno Reservado!</h2>
            <p className="text-slate-500 font-medium whitespace-pre-wrap">
              {config?.mensajeDefaultTurno || "Hemos registrado tu turno correctamente. Te esperamos."}
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profesional</p>
              <p className="font-bold text-slate-900">Dr. {selectedProf?.usuario?.apellido || 'Profesional'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</p>
                <p className="font-bold text-slate-900">{format(selectedDate, "eeee dd 'de' MMMM", { locale: es })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horario</p>
                <p className="font-bold text-slate-900">{selectedTime} hs</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-4">
             <button 
               onClick={() => {
                 const doc = new jsPDF();
                 doc.setFontSize(22);
                 doc.text("Comprobante de Turno", 14, 22);
                 doc.setFontSize(12);
                 doc.text(`Paciente: ${patientData.nombre} ${patientData.apellido}`, 14, 40);
                 doc.text(`DNI: ${patientData.dni}`, 14, 48);
                 doc.text(`Profesional: Dr. ${selectedProf?.usuario?.apellido}`, 14, 56);
                 doc.text(`Especialidad: ${selectedProf?.especialidad}`, 14, 64);
                 doc.text(`Fecha: ${format(selectedDate, "dd/MM/yyyy")}`, 14, 72);
                 doc.text(`Hora: ${selectedTime} hs`, 14, 80);
                 doc.text(`Lugar: ${config?.nombreClinica || 'Centro Médico'}`, 14, 88);
                 doc.save(`Turno_${patientData.apellido}.pdf`);
               }}
               className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
             >
               <Download size={16} />
               Comprobante
             </button>
             <button 
               onClick={() => window.location.reload()}
               className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg"
             >
               Finalizar
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
            <BriefcaseMedical size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tight">Reserva tu Turno</h1>
          <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">{config?.nombreClinica || "TurnosPro"}</p>
          <p className="text-slate-500 font-medium">Completa los pasos para agendar tu consulta médica</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">1</div>
                  <h2 className="text-xl font-bold text-slate-900">Selecciona Profesional</h2>
                </div>

                <div className="grid gap-4">
                  {profesionales?.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProf(p);
                        handleNext();
                      }}
                      className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all text-left ${
                        selectedProf?.id === p.id 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm overflow-hidden placeholder-avatar">
                        <User size={32} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 uppercase italic">Dr. {p.usuario.nombre} {p.usuario.apellido}</p>
                        <p className="text-sm font-bold text-blue-600">{p.especialidad}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Disponible</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">2</div>
                    <h2 className="text-xl font-bold text-slate-900">Fecha y Horario</h2>
                  </div>
                  <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-slate-600">Volver</button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Calendar Mini */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona el día</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from({ length: 21 }).map((_, offset) => {
                        const date = addDays(new Date(), offset);
                        const isToday = offset === 0;
                        const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                        
                        return (
                          <button
                            key={offset}
                            onClick={() => setSelectedDate(date)}
                            className={`p-4 rounded-2xl border-2 transition-all text-center ${
                              isSelected 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
                              {format(date, 'EEE', { locale: es })}
                            </p>
                            <p className="text-lg font-black text-slate-900 leading-none">
                              {format(date, 'dd')}
                            </p>
                            {isToday && <p className="text-[8px] font-black text-blue-600 uppercase mt-1">Hoy</p>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horarios Disponibles</p>
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {timeSlots.map(time => {
                         const isOcupado = turnosOcupados?.some((t: any) => 
                           format(new Date(t.fechaHoraInicio), 'HH:mm') === time
                         );
                         
                         return (
                          <button
                            key={time}
                            disabled={isOcupado}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                              isOcupado ? 'bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed opacity-50' :
                              selectedTime === time 
                              ? 'border-blue-600 bg-blue-50 text-blue-600' 
                              : 'border-slate-100 hover:border-blue-200 text-slate-600'
                            }`}
                          >
                            {time}
                          </button>
                         );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!selectedTime}
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Continuar
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">3</div>
                    <h2 className="text-xl font-bold text-slate-900">Tus Datos</h2>
                  </div>
                  <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-slate-600">Volver</button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">DNI * (Sin puntos)</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Ej: 35123456"
                        value={patientData.dni}
                        onChange={e => setPatientData({ ...patientData, dni: e.target.value })}
                        className="w-full bg-slate-50 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre *</label>
                    <input 
                      type="text" 
                      value={patientData.nombre}
                      onChange={e => setPatientData({ ...patientData, nombre: e.target.value })}
                      className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido *</label>
                    <input 
                      type="text" 
                      value={patientData.apellido}
                      onChange={e => setPatientData({ ...patientData, apellido: e.target.value })}
                      className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        value={patientData.telefono}
                        onChange={e => setPatientData({ ...patientData, telefono: e.target.value })}
                        className="w-full bg-slate-50 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Obra Social</label>
                    <select 
                      value={patientData.obraSocialId}
                      onChange={e => setPatientData({ ...patientData, obraSocialId: e.target.value })}
                      className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="PARTICULAR">Particular (Sin Obra Social)</option>
                      {obrasSociales?.map((os: any) => (
                        <option key={os.id} value={os.id}>{os.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-800">Resumen del Turno</p>
                    <p className="text-sm text-blue-600">
                      {format(selectedDate, "eeee dd 'de' MMMM", { locale: es })} a las <span className="font-bold">{selectedTime} hs</span> con el <span className="font-bold">Dr. {selectedProf.usuario.apellido}</span>
                    </p>
                  </div>
                </div>

                <button
                  disabled={!patientData.dni || !patientData.nombre || !patientData.apellido || !patientData.telefono}
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg"
                >
                  Continuar al Pago
                </button>
                {(!patientData.dni || !patientData.nombre || !patientData.apellido || !patientData.telefono) && (
                  <p className="text-[10px] text-red-500 font-bold text-center">Completa todos los campos obligatorios (*)</p>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">4</div>
                    <h2 className="text-xl font-bold text-slate-900">Método de Pago</h2>
                  </div>
                  <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-slate-600">Volver</button>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total a abonar</p>
                  <p className="text-5xl font-black text-slate-900 italic">
                    ${(!patientData.obraSocialId || patientData.obraSocialId === 'PARTICULAR') 
                      ? selectedProf.arancelParticular 
                      : (selectedProf.arancelObraSocial || 0)}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    {(!patientData.obraSocialId || patientData.obraSocialId === 'PARTICULAR') ? 'Arancel Particular' : 'Coseguro Obra Social'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div 
                    onClick={() => setSelectedPaymentMethod('EFECTIVO')}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedPaymentMethod === 'EFECTIVO' ? 'border-blue-600 bg-blue-50/30 ring-4 ring-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPaymentMethod === 'EFECTIVO' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <BriefcaseMedical size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-slate-900 uppercase">Pagar en Consultorio</p>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Abona al momento de la consulta en efectivo o débito.</p>
                    </div>
                    {selectedPaymentMethod === 'EFECTIVO' && <CheckCircle2 className="text-blue-600" size={24} />}
                  </div>

                  {selectedProf.aliasTransferencia && (
                    <div 
                      onClick={() => setSelectedPaymentMethod('TRANSFERENCIA')}
                      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-6 ${selectedPaymentMethod === 'TRANSFERENCIA' ? 'border-blue-600 bg-blue-50/20 ring-4 ring-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPaymentMethod === 'TRANSFERENCIA' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <CreditCard size={24} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-black text-slate-900 uppercase">Transferencia / Mercado Pago</p>
                          <p className="text-[10px] text-slate-500 font-medium">Paga ahora y asegura tu lugar.</p>
                        </div>
                        {selectedPaymentMethod === 'TRANSFERENCIA' && <CheckCircle2 className="text-blue-600" size={24} />}
                      </div>

                      {selectedPaymentMethod === 'TRANSFERENCIA' && (
                        <div className="space-y-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500 pb-2">
                          <div className="space-y-4">
                            <p className="text-[11px] font-black text-blue-800 uppercase tracking-widest text-center">Toca el alias para copiar</p>
                            <div 
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedProf.aliasTransferencia); }}
                              className="p-8 bg-white rounded-[2.5rem] border-2 border-blue-100 shadow-sm transition-transform active:scale-95 flex flex-col items-center hover:bg-blue-50 transition-all border-dashed group"
                            >
                              <span className="text-[12px] font-black text-slate-400 italic mb-3 uppercase tracking-tight group-hover:text-blue-400 transition-colors">Alias</span>
                              <p className="text-3xl font-black text-blue-600 tracking-tight break-all leading-none italic">
                                {selectedProf.aliasTransferencia}
                              </p>
                            </div>
                          </div>
                          
                          {selectedProf.cbuTransferencia && (
                            <div className="space-y-1 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CBU / CVU</p>
                              <p onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedProf.cbuTransferencia); }} className="text-sm font-bold text-slate-600 select-all break-all cursor-pointer hover:text-blue-600">
                                {selectedProf.cbuTransferencia}
                              </p>
                            </div>
                          )}
                          
                          <div className="p-6 bg-blue-600 text-white rounded-[2.5rem] space-y-3 shadow-2xl shadow-blue-200 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                              <CreditCard size={48} />
                            </div>
                            <p className="text-lg font-black uppercase italic tracking-tighter leading-none">WhatsApp del Centro</p>
                            <div className="space-y-2">
                              {whatsappDigits ? (
                                <>
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                  >
                                    <Phone size={14} />
                                    Abrir WhatsApp
                                  </a>
                                  <p className="text-[13px] font-bold leading-tight text-white/90 select-all">
                                    {whatsappDigits}
                                  </p>
                                </>
                              ) : (
                                <p className="text-[12px] font-bold leading-tight text-white/80">
                                  (Sin número configurado)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  {!selectedPaymentMethod && (
                    <p className="text-[11px] font-black text-amber-600 uppercase text-center mb-6 flex items-center justify-center gap-2 bg-amber-50 py-2 rounded-xl border border-amber-100">
                       <CreditCard size={14}/> Por favor, selecciona un método de pago
                    </p>
                  )}
                  <button
                    disabled={createBooking.isPending || !selectedPaymentMethod}
                    onClick={() => createBooking.mutate({ patient: patientData, metodoPago: selectedPaymentMethod })}
                    className={`w-full py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${
                      !selectedPaymentMethod 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 hover:-translate-y-1 active:translate-y-0'
                    }`}
                  >
                    {createBooking.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      'Confirmar y Finalizar Reserva'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-400 text-xs font-medium">
          Sistema de TurnosPro • © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
