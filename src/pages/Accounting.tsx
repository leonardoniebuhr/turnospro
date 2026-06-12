import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  Calendar as CalendarIcon,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  BriefcaseMedical,
  User,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { useAccounting, useProfesionales, useDeleteTurno, useDeletePago } from '../hooks/useMedical';
import { useAuthStore } from '../store/authStore';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Period = 'dia' | 'semana' | 'mes' | 'personalizado';

export default function Accounting() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('mes');
  const [profesionalId, setProfesionalId] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: profesionales } = useProfesionales();
  const deleteTurno = useDeleteTurno();
  const deletePago = useDeletePago();
  const canManagePago = user && ['SUPERADMIN', 'ADMIN_CONSULTORIO'].includes(user.rol);

  const getDateRange = () => {
    const now = new Date();
    if (period === 'dia') return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    if (period === 'semana') return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
    if (period === 'mes') return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
    if (period === 'personalizado' && customStart && customEnd) {
      return { start: new Date(customStart).toISOString(), end: new Date(customEnd).toISOString() };
    }
    return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
  };

  const { start, end } = getDateRange();
  const { data: turnos, isLoading } = useAccounting({ start, end, profesionalId });

  const totalParticular = turnos?.filter((t: any) => !t.paciente.obraSocialId).reduce((acc: number, t: any) => acc + (t.pago?.monto || 0), 0) || 0;
  const totalObraSocial = turnos?.filter((t: any) => t.paciente.obraSocialId).reduce((acc: number, t: any) => acc + (t.pago?.monto || 0), 0) || 0;
  const totalEfectivo = turnos?.filter((t: any) => t.pago?.metodo === 'EFECTIVO').reduce((acc: number, t: any) => acc + (t.pago?.monto || 0), 0) || 0;
  const totalTransferencia = turnos?.filter((t: any) => t.pago?.metodo === 'TRANSFERENCIA').reduce((acc: number, t: any) => acc + (t.pago?.monto || 0), 0) || 0;
  const totalIngresos = totalParticular + totalObraSocial;

  const handleDeletePago = (turnoId: string) => {
    if (!confirm('¿Eliminar solo el registro de cobro? El turno seguirá en la agenda.')) return;
    deletePago.mutate(turnoId);
  };

  const handleDeleteTurno = (turnoId: string) => {
    if (!confirm('¿Eliminar este turno por completo? Esta acción no se puede deshacer.')) return;
    deleteTurno.mutate(turnoId);
  };

  const exportPDF = () => {
    if (!turnos) return;
    const doc = new jsPDF();
    const selectedProf = profesionales?.find((p: any) => p.id === profesionalId);
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen Contable - TurnosPro', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    doc.text(`Periodo: ${format(new Date(start), 'dd/MM/yyyy')} al ${format(new Date(end), 'dd/MM/yyyy')}`, 14, 35);
    if (selectedProf) {
      doc.text(`Profesional: Dr. ${selectedProf.usuario.nombre} ${selectedProf.usuario.apellido}`, 14, 40);
    }
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Totales del Periodo:', 14, 55);
    doc.setFontSize(10);
    doc.text(`Total Ingresos: $${totalIngresos}`, 14, 62);
    doc.text(`Particulares: $${totalParticular} | Obra Social: $${totalObraSocial}`, 14, 67);
    doc.text(`Efectivo: $${totalEfectivo} | Transferencia: $${totalTransferencia}`, 14, 72);

    const tableData = turnos.map((t: any) => [
      format(new Date(t.fechaHoraInicio), 'dd/MM/yy HH:mm'),
      `${t.paciente.nombre} ${t.paciente.apellido}`,
      t.paciente.obraSocial?.nombre || 'Particular',
      t.pago?.metodo || '-',
      `$${t.pago?.monto || 0}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Fecha', 'Paciente', 'Obra Social', 'Método', 'Monto']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Resumen_Contable_${selectedProf?.usuario.apellido || 'General'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3 group-hover:rotate-0 transition-transform">
            <DollarSign size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Contabilidad</h1>
            <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] mt-1">Gestión de ingresos y liquidaciones</p>
          </div>
        </div>

        <button 
          onClick={exportPDF}
          disabled={!turnos || turnos.length === 0}
          className="flex items-center gap-3 bg-white border-2 border-slate-200 px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
          Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo de Análisis</label>
            <div className="flex flex-wrap gap-2">
              {(['dia', 'semana', 'mes', 'personalizado'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${
                    period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Profesional</label>
            <select
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              <option value="">Todos los profesionales</option>
              {profesionales?.map((p: any) => (
                <option key={p.id} value={p.id}>Dr. {p.usuario.apellido} {p.usuario.nombre}</option>
              ))}
            </select>
          </div>

          {period === 'personalizado' && (
            <>
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Inicio</label>
                <input 
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700"
                />
              </div>
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Fin</label>
                <input 
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AccountingCard 
          title={profesionalId ? "Total del Profesional" : "Ingresos Totales"} 
          value={`$${totalIngresos.toLocaleString()}`} 
          icon={TrendingUp} 
          color="indigo" 
        />
        <AccountingCard title="Particulares" value={`$${totalParticular.toLocaleString()}`} icon={User} color="emerald" />
        <AccountingCard title="Obra Social" value={`$${totalObraSocial.toLocaleString()}`} icon={BriefcaseMedical} color="blue" />
        <AccountingCard title="Efectivo" value={`$${totalEfectivo.toLocaleString()}`} icon={DollarSign} color="amber" />
        <AccountingCard title="Transferencias" value={`$${totalTransferencia.toLocaleString()}`} icon={CreditCard} color="indigo" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 italic uppercase">Detalle de Operaciones</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{turnos?.length || 0} Registros encontrados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Profesional</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe</th>
                <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {turnos?.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-slate-700">{format(new Date(t.fechaHoraInicio), 'dd/MM/yyyy')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{format(new Date(t.fechaHoraInicio), 'HH:mm')} hs</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-black text-slate-900">{t.paciente.nombre} {t.paciente.apellido}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-slate-600">Dr. {t.profesional.usuario.apellido}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      t.paciente.obraSocial ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {t.paciente.obraSocial?.nombre || 'PARTICULAR'}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.pago?.metodo || '-'}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <p className="text-lg font-black text-slate-900 italic tracking-tighter">${(t.pago?.monto || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {canManagePago && t.pago && (
                        <button
                          type="button"
                          onClick={() => handleDeletePago(t.id)}
                          disabled={deletePago.isPending}
                          className="text-[10px] font-black uppercase tracking-tight text-amber-700 hover:underline disabled:opacity-50"
                        >
                          Quitar cobro
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTurno(t.id)}
                        disabled={deleteTurno.isPending}
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tight text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Eliminar turno
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!turnos || turnos.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <FileText size={64} />
                      <p className="font-black uppercase tracking-widest">No hay registros para este periodo</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {turnos && turnos.length > 0 && (
              <tfoot className="bg-slate-50 text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={6} className="px-8 py-6 text-right">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Seleccionado:</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="inline-flex items-center justify-end px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <p className="text-2xl font-black italic tracking-tighter text-slate-900 whitespace-nowrap">
                        ${totalIngresos.toLocaleString()}
                      </p>
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountingCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform`}>
        <Icon size={120} />
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-4 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-8 relative z-10">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </h4>
        <p className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">
          {value}
        </p>
      </div>
    </div>
  );
}
