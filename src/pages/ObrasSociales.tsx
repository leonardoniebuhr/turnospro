import React, { useState } from 'react';
import { 
  useObraSociales, 
  useCreateObraSocial, 
  useUpdateObraSocial,
  useDeleteObraSocial
} from '../hooks/useMedical';
import { Shield, Search, Edit3, Trash2, X, Phone, Mail, Building2, CheckCircle2, DollarSign, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ObrasSociales() {
  const [search, setSearch] = useState('');
  const { data: obrasSociales, isLoading } = useObraSociales();
  const createMut = useCreateObraSocial();
  const updateMut = useUpdateObraSocial();
  const deleteMut = useDeleteObraSocial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    cuit: '',
    telefono: '',
    email: '',
    direccion: '',
    web: '',
    tipoCobertura: 'OBRA_SOCIAL',
    planDefault: '',
    arancelConsulta: 0,
    arancelPractica: 0,
    coseguro: 0,
    requiereAutorizacion: false,
    requiereDerivacion: false,
    especialidadesCubiertas: '[]',
    observaciones: '',
    contactoNombre: '',
    contactoTelefono: '',
    activo: true
  });

  const handleOpenModal = (os?: any) => {
    if (os) {
      setEditingId(os.id);
      setFormData({
        nombre: os.nombre,
        codigo: os.codigo,
        cuit: os.cuit || '',
        telefono: os.telefono || '',
        email: os.email || '',
        direccion: os.direccion || '',
        web: os.web || '',
        tipoCobertura: os.tipoCobertura || 'OBRA_SOCIAL',
        planDefault: os.planDefault || '',
        arancelConsulta: os.arancelConsulta || 0,
        arancelPractica: os.arancelPractica || 0,
        coseguro: os.coseguro || 0,
        requiereAutorizacion: os.requiereAutorizacion || false,
        requiereDerivacion: os.requiereDerivacion || false,
        especialidadesCubiertas: os.especialidadesCubiertas || '[]',
        observaciones: os.observaciones || '',
        contactoNombre: os.contactoNombre || '',
        contactoTelefono: os.contactoTelefono || '',
        activo: os.activo !== undefined ? os.activo : true
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '', codigo: '', cuit: '', telefono: '', email: '',
        direccion: '', web: '', tipoCobertura: 'OBRA_SOCIAL', planDefault: '',
        arancelConsulta: 0, arancelPractica: 0, coseguro: 0,
        requiereAutorizacion: false, requiereDerivacion: false,
        especialidadesCubiertas: '[]', observaciones: '',
        contactoNombre: '', contactoTelefono: '', activo: true
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

  const handleDelete = (os: any) => {
    if (!confirm(`¿Eliminar la obra social ${os.nombre}?`)) return;
    deleteMut.mutate(os.id);
  };

  const filteredData = obrasSociales?.filter((os: any) => 
    os.nombre.toLowerCase().includes(search.toLowerCase()) || 
    os.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Obras Sociales y Prepagas</h1>
          <p className="text-slate-500 font-medium">Gestiona las coberturas, aranceles y datos de contacto.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 flex items-center gap-2 transition-all"
        >
          <Shield size={20} />
          Nueva Obra Social
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Obra Social</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Contacto</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Aranceles Base</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData?.map((os: any) => (
              <tr key={os.id} className={`hover:bg-slate-50 transition-colors group ${!os.activo ? 'opacity-50' : ''}`}>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                      {os.codigo.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        {os.nombre} 
                        {!os.activo && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase font-black">Inactivo</span>}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">{os.tipoCobertura} • Código: {os.codigo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-slate-600">
                   <div className="space-y-1">
                     {os.telefono && <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-slate-400" /> {os.telefono}</div>}
                     {os.email && <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-slate-400" /> {os.email}</div>}
                     {!os.telefono && !os.email && <span className="text-xs text-slate-400 italic">Sin contacto</span>}
                   </div>
                </td>
                <td className="px-8 py-5 text-slate-600">
                   <div className="space-y-1 text-sm font-medium">
                     <p>Consulta: <span className="text-slate-900">${os.arancelConsulta}</span></p>
                     <p>Coseguro: <span className="text-slate-900">${os.coseguro}</span></p>
                   </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(os)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    {os.activo && (
                      <button 
                        type="button"
                        onClick={() => handleDelete(os)}
                        disabled={deleteMut.isPending}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Desactivar"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="p-12 text-center text-slate-400 font-medium italic">Cargando obras sociales...</div>}
        {!isLoading && filteredData?.length === 0 && <div className="p-12 text-center text-slate-400 font-medium italic">No se encontraron resultados.</div>}
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
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Obra Social' : 'Nueva Obra Social'}</h2>
                    <p className="text-sm font-medium text-slate-500">Completa los datos administrativos y aranceles</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="p-8 space-y-8 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                  
                  {/* Sección Principal */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                      <Shield size={14} /> Datos Principales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Nombre *</label>
                        <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Ej: OSDE" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Código *</label>
                        <input type="text" required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase" placeholder="Ej: OSD" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Tipo de Cobertura</label>
                        <select value={formData.tipoCobertura} onChange={e => setFormData({...formData, tipoCobertura: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                          <option value="OBRA_SOCIAL">Obra Social</option>
                          <option value="PREPAGA">Prepaga</option>
                          <option value="SINDICAL">Sindical</option>
                          <option value="MONOTRIBUTO">Monotributo</option>
                          <option value="PAMI">PAMI</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">CUIT</label>
                        <input type="text" value={formData.cuit} onChange={e => setFormData({...formData, cuit: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Plan Predeterminado</label>
                        <input type="text" value={formData.planDefault} onChange={e => setFormData({...formData, planDefault: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Ej: Plan 210" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Aranceles */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                      <DollarSign size={14} /> Aranceles Base
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Valor Consulta ($)</label>
                        <input type="number" min="0" step="0.01" value={formData.arancelConsulta} onChange={e => setFormData({...formData, arancelConsulta: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Valor Práctica ($)</label>
                        <input type="number" min="0" step="0.01" value={formData.arancelPractica} onChange={e => setFormData({...formData, arancelPractica: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Coseguro Paciente ($)</label>
                        <input type="number" min="0" step="0.01" value={formData.coseguro} onChange={e => setFormData({...formData, coseguro: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Contacto Institucional */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                      <Phone size={14} /> Información de Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Teléfono General</label>
                        <input type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Email de Autorizaciones/Gestión</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Página Web</label>
                        <input type="url" value={formData.web} onChange={e => setFormData({...formData, web: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="https://" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Dirección Delegación</label>
                        <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Requisitos y Auditoría */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                      <Activity size={14} /> Requisitos y Auditoría
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={formData.requiereAutorizacion} onChange={e => setFormData({...formData, requiereAutorizacion: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-bold text-slate-700">Requiere Autorización Previa</span>
                        </label>
                      </div>
                      <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={formData.requiereDerivacion} onChange={e => setFormData({...formData, requiereDerivacion: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-bold text-slate-700">Requiere Orden de Derivación</span>
                        </label>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Contacto Interno (Auditor/Representante)</label>
                        <input type="text" value={formData.contactoNombre} onChange={e => setFormData({...formData, contactoNombre: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Nombre de la persona" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Teléfono Directo Contacto Interno</label>
                        <input type="tel" value={formData.contactoTelefono} onChange={e => setFormData({...formData, contactoTelefono: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Observaciones Generales</label>
                    <textarea rows={3} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Fechas de facturación, normativas específicas..." />
                  </div>

                  {editingId && (
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-bold text-slate-700">Obra Social Activa</span>
                      </label>
                    </div>
                  )}

                </div>

                <div className="p-8 pt-4 border-t border-slate-100 shrink-0 bg-white">
                  <button 
                    type="submit" 
                    disabled={createMut.isPending || updateMut.isPending}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    {editingId ? 'Guardar Cambios' : 'Registrar Obra Social'}
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
