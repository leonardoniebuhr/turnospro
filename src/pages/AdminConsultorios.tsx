import React, { useState } from 'react';
import { useConsultorios, useCreateConsultorio, useUpdateConsultorio, useDeleteConsultorio } from '../hooks/useMedical';
import { MapPin, Plus, Edit3, Trash2, Cpu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminConsultorios() {
  const { data: consultorios, isLoading } = useConsultorios();
  const createMut = useCreateConsultorio();
  const updateMut = useUpdateConsultorio();
  const deleteMut = useDeleteConsultorio();
// ...

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    nombre: '',
    capacidad: '1',
    ubicacion: '',
    equipamiento: ''
  });

  const handleOpenModal = (c?: any) => {
    if (c) {
      setEditingId(c.id);
      setFormData({
        numero: c.numero.toString(),
        nombre: c.nombre,
        capacidad: c.capacidad.toString(),
        ubicacion: c.ubicacion || '',
        equipamiento: JSON.parse(c.equipamiento).join(', ')
      });
    } else {
      setEditingId(null);
      setFormData({ numero: '', nombre: '', capacidad: '1', ubicacion: '', equipamiento: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      equipamiento: formData.equipamiento.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Consultorios</h1>
          <p className="text-slate-500 font-medium">Administra los espacios físicos y su equipamiento.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Consultorio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultorios?.map((c: any) => (
          <div key={c.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Consultorio {c.numero}</p>
                <h3 className="text-xl font-bold text-slate-900">{c.nombre}</h3>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <MapPin size={24} className="text-slate-400" />
              </div>
            </div>
            
            <div className="p-8 flex-1 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Cpu size={14} />
                  Equipamiento
                </p>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(c.equipamiento).map((item: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg border border-blue-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-600">
                  <p className="font-medium">Capacidad: <span className="font-bold text-slate-900">{c.capacidad} pers.</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${c.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">{c.activo ? 'Disponible' : 'Inactivo'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => handleOpenModal(c)}
                className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={16} /> Editar
              </button>
              <button 
                onClick={() => { if(confirm('¿Desea eliminar el consultorio?')){ deleteMut.mutate(c.id) } }}
                className="px-4 py-3 text-red-500 hover:bg-white rounded-xl shadow-sm transition-all flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

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
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Consultorio' : 'Añadir Consultorio'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Número</label>
                    <input type="number" required value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Capacidad</label>
                    <input type="number" required value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Nombre Descriptivo</label>
                  <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Equipamiento (separado por coma)</label>
                  <textarea rows={3} value={formData.equipamiento} onChange={e => setFormData({...formData, equipamiento: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button 
                  type="submit" 
                  disabled={createMut.isPending || updateMut.isPending}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Consultorio'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
