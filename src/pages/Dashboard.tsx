import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStats, useTurnos } from '../hooks/useMedical';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';

const data = [
  { name: 'Lun', turnos: 12 },
  { name: 'Mar', turnos: 19 },
  { name: 'Mie', turnos: 15 },
  { name: 'Jue', turnos: 22 },
  { name: 'Vie', turnos: 30 },
  { name: 'Sab', turnos: 10 },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = React.useState('mes');
  const { data: stats, isLoading } = useStats(period);
  const { data: recentTurnos } = useTurnos({ start: new Date().toISOString() });

  if (!user) return null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, {user.nombre}</h1>
          <p className="text-slate-500 font-medium">Este es el resumen de actividad para hoy, {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setPeriod('dia')}
            className={`px-4 py-2 text-sm font-semibold transition-all rounded-lg ${period === 'dia' ? 'text-slate-600 bg-white shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Día
          </button>
          <button 
            onClick={() => setPeriod('semana')}
            className={`px-4 py-2 text-sm font-semibold transition-all rounded-lg ${period === 'semana' ? 'text-slate-600 bg-white shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Semana
          </button>
          <button 
            onClick={() => setPeriod('mes')}
            className={`px-4 py-2 text-sm font-semibold transition-all rounded-lg ${period === 'mes' ? 'text-slate-600 bg-white shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {user.rol !== 'PACIENTE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title={`Turnos de la ${period === 'dia' ? 'jornada' : period === 'semana' ? 'semana' : 'mes'}`}
            value={stats?.turnosMes || 0} 
            icon={Calendar} 
            color="blue" 
          />
          <StatCard 
            title="Ingresos" 
            value={`$${stats?.ingresos?.toLocaleString() ?? 0}`} 
            icon={DollarSign} 
            color="emerald" 
          />
          <StatCard 
            title="Turnos Web (Link)" 
            value={stats?.turnosWeb || 0} 
            icon={TrendingUp} 
            color="indigo" 
          />
          <StatCard 
            title="Pacientes Registrados" 
            value={stats?.totalPacientes || 0} 
            icon={Users} 
            color="amber" 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Flujo de Turnos Semanal
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTurnos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="turnos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTurnos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Turnos Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-sm md:text-base">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Próximos Turnos</h3>
              <Link to="/agenda" className="text-blue-600 font-bold hover:underline">Ver todos</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Hora</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Profesional</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTurnos?.slice(0, 5)?.map((turno: any) => (
                    <tr key={turno.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 font-medium text-slate-900">{turno.paciente.nombre} {turno.paciente.apellido}</td>
                      <td className="px-8 py-4 text-slate-600">{format(new Date(turno.fechaHoraInicio), 'HH:mm')} hs</td>
                      <td className="px-8 py-4 text-slate-600">{turno.profesional.usuario.nombre}</td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          turno.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-600' : 
                          turno.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {turno.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!recentTurnos || recentTurnos.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-slate-400">No hay turnos registrados para hoy</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar activity */}
        <div className="space-y-8">
           <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-lg shadow-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Reserva Web</h3>
                <TrendingUp size={20} className="text-indigo-200" />
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Confirmados vía link</p>
                  <p className="text-3xl font-black">{stats?.turnosWeb || 0}</p>
                </div>
                <p className="text-xs text-indigo-100 italic">Turnos generados por pacientes desde el link público.</p>
              </div>
              <Link to="/agenda" className="mt-8 block w-full py-3 bg-white text-indigo-600 text-center rounded-xl font-bold hover:bg-white/90 transition-all">
                Ver Calendario
              </Link>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Actividad de Notificaciones</h3>
            <div className="space-y-6">
              {[
                { type: 'Conf.', msg: 'Turno confirmado WhatsApp', time: '10:15', status: 'OK' },
                { type: 'Recor.', msg: 'Recordatorio enviado SMS', time: '09:30', status: 'OK' },
                { type: 'Pago', msg: 'Expiración de pago MercadoPago', time: '08:45', status: 'ERR' },
              ].map((act, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${act.status === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {act.status === 'OK' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{act.msg}</p>
                      <p className="text-xs text-slate-500">{act.time} hs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 stroke-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600 stroke-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600 stroke-indigo-600',
    amber: 'bg-amber-50 text-amber-600 stroke-amber-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight size={14} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </motion.div>
  );
}
