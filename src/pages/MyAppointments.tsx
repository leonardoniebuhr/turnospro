import React from 'react';
import { useTurnos } from '../hooks/useMedical';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, Calendar, User, MapPin, Clock } from 'lucide-react';

export default function MyAppointments() {
  const { user } = useAuthStore();
  const { data: turnos } = useTurnos();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Turnos</h1>
        <p className="text-slate-500 font-medium">Gestiona tus próximas citas y pagos pendientes.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {turnos?.map((turno: any) => (
          <div key={turno.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className={`w-full md:w-48 p-8 flex flex-col items-center justify-center text-center ${
               turno.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
               <p className="text-xs font-black uppercase tracking-widest mb-1">{format(new Date(turno.fechaHoraInicio), 'EEEE', { locale: es })}</p>
               <p className="text-4xl font-black">{format(new Date(turno.fechaHoraInicio), 'd')}</p>
               <p className="font-bold text-lg">{format(new Date(turno.fechaHoraInicio), 'MMM', { locale: es })}</p>
            </div>

            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Profesional</span>
                  </div>
                  <p className="font-bold text-slate-800 text-lg">Dr. {turno.profesional.usuario.nombre} {turno.profesional.usuario.apellido}</p>
                  <p className="text-sm text-blue-600 font-semibold">{turno.profesional.especialidad}</p>
               </div>

               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Horario</span>
                  </div>
                  <p className="font-bold text-slate-800 text-lg">{format(new Date(turno.fechaHoraInicio), 'HH:mm')} hs</p>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin size={14} />
                    <span>Consultorio {turno.consultorio.numero}</span>
                  </div>
               </div>

               <div className="flex flex-col justify-center gap-3">
                  <span className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold ${
                    turno.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {turno.estado}
                  </span>
                  
                  {turno.estado === 'PENDIENTE' && (
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                      <CreditCard size={18} />
                      Pagar con Mercado Pago
                    </button>
                  )}
               </div>
            </div>
          </div>
        ))}

        {(!turnos || turnos.length === 0) && (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No tienes turnos programados</h3>
            <p className="text-slate-500 mt-2">Reserva una nueva cita para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
