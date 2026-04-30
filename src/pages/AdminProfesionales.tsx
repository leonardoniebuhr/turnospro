import React, { useState } from 'react';
import { 
  useProfesionales, 
  useCreateProfesional, 
  useUpdateProfesional, 
  useDeleteProfesional,
  useConsultorios,
  useProfHorarios,
  useCreateHorario,
  useDeleteHorario
} from '../hooks/useMedical';
import { UserPlus, Star, Mail, Award, Edit3, Trash2, X, Plus, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function HorariosModal({ prof, onClose }: { prof: any, onClose: () => void }) {
  const { data: horarios, isLoading } = useProfHorarios(prof.id);
  const { data: consultorios } = useConsultorios();
  const createHorario = useCreateHorario();
  const deleteHorario = useDeleteHorario();

  const [newHorario, setNewHorario] = useState({
    consultorioId: '',
    diaSemana: '1',
    horaInicio: '08:00',
    horaFin: '12:00'
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHorario.consultorioId) return alert('Seleccione un consultorio');
    createHorario.mutate({ profId: prof.id, ...newHorario });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Horarios: Dr. {prof.usuario.apellido}</h2>
            <p className="text-slate-500 font-medium">Configura los días y consultorios de atención.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          <form onSubmit={handleAdd} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Consultorio</label>
              <select 
                value={newHorario.consultorioId}
                onChange={e => setNewHorario({...newHorario, consultorioId: e.target.value})}
                className="w-full bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
              >
                <option value="">Seleccionar...</option>
                {consultorios?.map((c: any) => (
                  <option key={c.id} value={c.id}>№ {c.numero} - {c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Día</label>
              <select 
                value={newHorario.diaSemana}
                onChange={e => setNewHorario({...newHorario, diaSemana: e.target.value})}
                className="w-full bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Desde - Hasta</label>
              <div className="flex items-center gap-1">
                <input type="time" value={newHorario.horaInicio} onChange={e => setNewHorario({...newHorario, horaInicio: e.target.value})} className="w-full bg-white px-2 py-2 rounded-xl border border-slate-200 text-xs font-bold" />
                <input type="time" value={newHorario.horaFin} onChange={e => setNewHorario({...newHorario, horaFin: e.target.value})} className="w-full bg-white px-2 py-2 rounded-xl border border-slate-200 text-xs font-bold" />
              </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm">
              Agregar
            </button>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Horarios Configurados</h3>
            <div className="grid gap-3">
              {horarios?.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{DAYS[h.diaSemana]}</p>
                      <p className="text-xs text-slate-500 font-medium">Consultorio № {h.consultorio.numero} • {h.horaInicio} - {h.horaFin} hs</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteHorario.mutate({ id: h.id, profId: prof.id })}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {horarios?.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-400 font-bold italic">No hay horarios configurados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminStaff() {
  const { data: profesionales, isLoading } = useProfesionales();
  const createMut = useCreateProfesional();
  const updateMut = useUpdateProfesional();
  const deleteMut = useDeleteProfesional();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleProf, setScheduleProf] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    especialidad: '',
    matriculaNacional: '',
    matriculaProvincial: '',
    duracionTurnoDefault: '30',
    colorCalendario: '#3b82f6',
    arancelParticular: '0',
    arancelObraSocial: '0',
    aliasTransferencia: '',
    cbuTransferencia: ''
  });

  const handleOpenModal = (p?: any) => {
    if (p) {
      setEditingId(p.id);
      setFormData({
        nombre: p.usuario.nombre,
        apellido: p.usuario.apellido,
        dni: p.usuario.dni,
        email: p.usuario.email,
        especialidad: p.especialidad,
        matriculaNacional: p.matriculaNacional || '',
        matriculaProvincial: p.matriculaProvincial || '',
        duracionTurnoDefault: p.duracionTurnoDefault.toString(),
        colorCalendario: p.colorCalendario,
        arancelParticular: (p.arancelParticular || 0).toString(),
        arancelObraSocial: (p.arancelObraSocial || 0).toString(),
        aliasTransferencia: p.aliasTransferencia || '',
        cbuTransferencia: p.cbuTransferencia || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '', apellido: '', dni: '', email: '', especialidad: '',
        matriculaNacional: '', matriculaProvincial: '', duracionTurnoDefault: '30', colorCalendario: '#3b82f6',
        arancelParticular: '0', arancelObraSocial: '0', aliasTransferencia: '', cbuTransferencia: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate({ id: editingId, ...formData }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createMut.mutate(formData, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center text-center md:text-left flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Médico</h1>
          <p className="text-slate-500 font-medium">Gestiona los profesionales, sus matrículas y especialidades.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 flex items-center gap-2 transition-all font-sans"
        >
          <UserPlus size={20} />
          Invitar Profesional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profesionales?.map((p: any) => (
          <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col overflow-hidden group">
            <div className="p-8 pb-4">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl group-hover:scale-110 transition-transform">
                  {p.usuario.nombre[0]}{p.usuario.apellido[0]}
                </div>
                <div className="flex gap-1 overflow-hidden">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Activo</span>
                  <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.colorCalendario }} />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{p.usuario.nombre} {p.usuario.apellido}</h3>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-4">
                <Star size={14} fill="currentColor" />
                {p.especialidad}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{p.usuario.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Award size={16} className="text-slate-400" />
                  <span>MN: {p.matriculaNacional || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 mt-auto flex gap-2 border-t border-slate-100">
              <button 
                onClick={() => setScheduleProf(p)}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-white text-blue-600 border border-blue-100 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white"
              >
                <Clock size={14} /> Horarios
              </button>
              <button 
                onClick={() => handleOpenModal(p)}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> Perfil
              </button>
              <button 
                onClick={() => { if(confirm('¿Seguro pibe?')){ deleteMut.mutate(p.id) } }}
                className="px-4 py-3 text-red-500 hover:bg-white rounded-xl shadow-sm transition-all flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {scheduleProf && (
          <HorariosModal prof={scheduleProf} onClose={() => setScheduleProf(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Profesional' : 'Nuevo Profesional'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Nombre</label>
                    <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Apellido</label>
                    <input type="text" required value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {!editingId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">DNI</label>
                      <input type="text" required value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Email</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Especialidad</label>
                    <input type="text" required value={formData.especialidad} onChange={e => setFormData({...formData, especialidad: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Color Agenda</label>
                    <input type="color" value={formData.colorCalendario} onChange={e => setFormData({...formData, colorCalendario: e.target.value})} className="w-full h-12 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Matrícula Nac.</label>
                    <input type="text" value={formData.matriculaNacional} onChange={e => setFormData({...formData, matriculaNacional: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Matrícula Prov.</label>
                    <input type="text" value={formData.matriculaProvincial} onChange={e => setFormData({...formData, matriculaProvincial: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Duración Est. (min)</label>
                    <input type="number" value={formData.duracionTurnoDefault} onChange={e => setFormData({...formData, duracionTurnoDefault: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Finanzas y Pagos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Arancel Particular ($)</label>
                      <input type="number" value={formData.arancelParticular} onChange={e => setFormData({...formData, arancelParticular: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Arancel Obra Social ($)</label>
                      <input type="number" value={formData.arancelObraSocial} onChange={e => setFormData({...formData, arancelObraSocial: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Alias Mercado Pago / Transf.</label>
                      <input type="text" value={formData.aliasTransferencia} onChange={e => setFormData({...formData, aliasTransferencia: e.target.value})} placeholder="centro.pago.alias" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">CBU / CVU</label>
                      <input type="text" value={formData.cbuTransferencia} onChange={e => setFormData({...formData, cbuTransferencia: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={createMut.isPending || updateMut.isPending}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Profesional'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
