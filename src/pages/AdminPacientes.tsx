import React, { useState } from 'react';
import { 
  usePacientes, 
  useCreatePaciente, 
  useUpdatePaciente,
  useDeletePaciente,
  useObraSociales
} from '../hooks/useMedical';
import { UserPlus, Search, Edit3, Trash2, X, Phone, Mail, Fingerprint, Calendar, Shield, MapPin, ClipboardList, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPacientes() {
  const [search, setSearch] = useState('');
  const { data: pacientes, isLoading } = usePacientes(search);
  const { data: obrasSociales } = useObraSociales();
  const createMut = useCreatePaciente();
  const updateMut = useUpdatePaciente();
  const deleteMut = useDeletePaciente();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    fechaNacimiento: format(new Date(), 'yyyy-MM-dd'),
    obraSocialId: '',
    numeroAfiliado: '',
    alergias: '',
    antecedentes: '',
    historiaClinica: '',
    observaciones: '',
    direccion: ''
  });

  const handleOpenModal = (p?: any) => {
    if (p) {
      setEditingId(p.id);
      setFormData({
        nombre: p.nombre,
        apellido: p.apellido,
        dni: p.dni,
        telefono: p.telefono,
        email: p.email || '',
        fechaNacimiento: p.fechaNacimiento ? format(new Date(p.fechaNacimiento), 'yyyy-MM-dd') : '',
        obraSocialId: p.obraSocialId || '',
        numeroAfiliado: p.numeroAfiliado || '',
        alergias: p.alergias || '',
        antecedentes: p.antecedentes || '',
        historiaClinica: p.historiaClinica || '',
        observaciones: p.observaciones || '',
        direccion: p.direccion || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '', apellido: '', dni: '', telefono: '', email: '',
        fechaNacimiento: format(new Date(), 'yyyy-MM-dd'),
        obraSocialId: '', numeroAfiliado: '', alergias: '', antecedentes: '',
        historiaClinica: '', observaciones: '', direccion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      fechaNacimiento: new Date(formData.fechaNacimiento).toISOString()
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDeletePatient = (p: any) => {
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido}? Solo se puede si no tiene turnos ni recetas asociadas.`)) return;
    deleteMut.mutate(p.id, {
      onSuccess: () => {
        setIsHistoryOpen(false);
        setSelectedPatient(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Pacientes</h1>
          <p className="text-slate-500 font-medium">Base de datos centralizada de pacientes y su historial básico.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 flex items-center gap-2 transition-all"
        >
          <UserPlus size={20} />
          Nuevo Paciente
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, apellido o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Paciente</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Identificación</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Contacto</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pacientes?.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                      {p.nombre[0]}{p.apellido[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-slate-500">{p.email || 'Sin email'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-slate-600 font-medium">
                   <div className="flex items-center gap-2">
                     <Fingerprint size={14} className="text-slate-400" />
                     {p.dni}
                   </div>
                </td>
                <td className="px-8 py-5 text-slate-600">
                   <div className="flex items-center gap-2 text-sm">
                     <Phone size={14} className="text-slate-400" />
                     {p.telefono}
                   </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setSelectedPatient(p); setIsHistoryOpen(true); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <Calendar size={18} /> Historial
                    </button>
                    <button 
                      onClick={() => handleOpenModal(p)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeletePatient(p)}
                      disabled={deleteMut.isPending}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar paciente"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="p-12 text-center text-slate-400 font-medium italic">Cargando pacientes...</div>}
        {!isLoading && pacientes?.length === 0 && <div className="p-12 text-center text-slate-400 font-medium italic">No se encontraron pacientes.</div>}
      </div>

      <AnimatePresence>
        {isHistoryOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsHistoryOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Agenda de {selectedPatient.nombre}</h2>
                  <p className="text-slate-500 font-medium">Historial completo de turnos</p>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 min-h-0 space-y-4 overscroll-contain">
                {selectedPatient.turnos?.length > 0 ? (
                  selectedPatient.turnos.sort((a:any, b:any) => new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime()).map((t: any) => (
                    <div key={t.id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{format(new Date(t.fechaHoraInicio), 'MMM', { locale: es })}</span>
                          <span className="text-lg font-black text-slate-800 leading-none">{format(new Date(t.fechaHoraInicio), 'd')}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Dr. {t.profesional.usuario.apellido}</p>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-tight">{t.profesional.especialidad}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{format(new Date(t.fechaHoraInicio), 'HH:mm')} hs</p>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                          t.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-600' :
                          t.estado === 'CANCELADO' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {t.estado}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Calendar className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-400 font-bold italic">No hay turnos registrados para este paciente.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
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
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">DNI</label>
                    <input type="text" required value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Fecha de Nacimiento</label>
                    <input type="date" required value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Teléfono</label>
                    <input type="tel" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Obra Social</label>
                    <select 
                      value={formData.obraSocialId} 
                      onChange={e => setFormData({...formData, obraSocialId: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Particular</option>
                      {obrasSociales?.map((os: any) => (
                        <option key={os.id} value={os.id}>{os.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Nº Afiliado</label>
                    <input type="text" value={formData.numeroAfiliado} onChange={e => setFormData({...formData, numeroAfiliado: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Dirección</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle, Número, Localidad" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Antecedentes Médicos</label>
                    <textarea rows={3} value={formData.antecedentes} onChange={e => setFormData({...formData, antecedentes: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cirugías, enfermedades crónicas..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Alergias</label>
                    <textarea rows={3} value={formData.alergias} onChange={e => setFormData({...formData, alergias: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Medicamentos, alimentos..." />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Historia Clínica / Notas Médicas</label>
                  <textarea rows={4} value={formData.historiaClinica} onChange={e => setFormData({...formData, historiaClinica: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalle clínico relevante..." />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Observaciones Administrativas</label>
                  <textarea rows={2} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Comentarios internos..." />
                </div>
              </div>

                <div className="p-8 pt-4 border-t border-slate-100 shrink-0 bg-white">
                <button 
                  type="submit" 
                  disabled={createMut.isPending || updateMut.isPending}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Paciente'}
                </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
