import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  useRecetaTemplates, 
  useCreateRecetaTemplate, 
  useDeleteRecetaTemplate,
  useRecetas,
  useCreateReceta,
  useProfesionales,
  usePacientes,
  usePaciente
} from '../hooks/useMedical';
import { 
  Plus, 
  Printer, 
  FileText, 
  Search, 
  Trash2, 
  History, 
  Layout, 
  ChevronRight,
  User,
  Activity,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Recetas() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPacId = searchParams.get('pacienteId');
  const initialProfId = searchParams.get('profesionalId');

  const [activeTab, setActiveTab] = useState<'emitir' | 'historial' | 'plantillas'>('emitir');
  const { data: templates } = useRecetaTemplates();
  const { data: recetas } = useRecetas();
  const { data: profesionales } = useProfesionales();
  const [searchPac, setSearchPac] = useState('');
  const { data: pacientes } = usePacientes(searchPac);
  const { data: qPaciente } = usePaciente(initialPacId || undefined);

  const createTemplate = useCreateRecetaTemplate();
  const deleteTemplate = useDeleteRecetaTemplate();
  const createReceta = useCreateReceta();

  const [selectedProf, setSelectedProf] = useState<any>(null);
  const [selectedPac, setSelectedPac] = useState<any>(null);

  // Pre-load from URL
  useEffect(() => {
    if (initialProfId && profesionales) {
      const prof = profesionales.find((p: any) => p.id === initialProfId);
      if (prof) setSelectedProf(prof);
    }
  }, [initialProfId, profesionales]);

  useEffect(() => {
    if (qPaciente) {
      setSelectedPac(qPaciente);
    }
  }, [qPaciente]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [recetaContent, setRecetaContent] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ nombre: '', contenido: '' });

  const printRef = useRef<HTMLDivElement>(null);

  const handleApplyTemplate = (t: any) => {
    setSelectedTemplate(t);
    setRecetaContent(t.contenido);
  };

  const handleEmitir = () => {
    if (!selectedProf || !selectedPac || !recetaContent) {
      alert('Complete todos los campos necesarios');
      return;
    }
    createReceta.mutate({
      profesionalId: selectedProf.id,
      pacienteId: selectedPac.id,
      contenido: recetaContent,
      diagnostico
    }, {
      onSuccess: () => {
        alert('Receta emitida con éxito');
        setActiveTab('historial');
        // Reset
        setRecetaContent('');
        setDiagnostico('');
        setSelectedPac(null);
      }
    });
  };

  const handlePrint = (receta?: any) => {
    const data = receta || {
      profesional: selectedProf,
      paciente: selectedPac,
      contenido: recetaContent,
      diagnostico,
      createdAt: new Date()
    };

    if (!data.profesional || !data.paciente) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Receta Médica - ${data.paciente.apellido}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .prof-info h1 { margin: 0; color: #1d4ed8; font-size: 24px; }
            .prof-info p { margin: 2px 0; font-size: 14px; color: #64748b; }
            .date { font-weight: bold; color: #64748b; }
            .pac-info { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
            .pac-info h2 { margin: 0 0 10px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
            .pac-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .pac-grid div span { font-weight: bold; color: #334155; }
            .content { min-height: 300px; font-size: 18px; white-space: pre-wrap; padding: 10px; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; pt: 20px; text-align: center; font-style: italic; color: #94a3b8; font-size: 12px; }
            .signature { margin-top: 100px; border-top: 1px solid #1e293b; width: 200px; margin-left: auto; text-align: center; pt: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="prof-info">
              <h1>Dr. ${data.profesional.usuario.apellido} ${data.profesional.usuario.nombre}</h1>
              <p>${data.profesional.especialidad}</p>
              <p>M.N. ${data.profesional.matriculaNacional} ${data.profesional.matriculaProvincial ? `| M.P. ${data.profesional.matriculaProvincial}` : ''}</p>
            </div>
            <div class="date">
              ${format(new Date(data.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
            </div>
          </div>

          <div class="pac-info">
            <h2>Datos del Paciente</h2>
            <div class="pac-grid">
              <div>Paciente: <span>${data.paciente.apellido}, ${data.paciente.nombre}</span></div>
              <div>DNI: <span>${data.paciente.dni}</span></div>
              <div>Obra Social: <span>${data.paciente.obraSocial?.nombre || 'Particular'}</span></div>
              <div>Nº Afiliado: <span>${data.paciente.numeroAfiliado || '-'}</span></div>
            </div>
          </div>

          <div class="content">
            ${data.diagnostico ? `<div style="margin-bottom: 20px;"><strong>Diagnóstico:</strong> ${data.diagnostico}</div>` : ''}
            ${data.contenido}
          </div>

          <div class="signature">
            Firma y Sello
          </div>

          <div class="footer">
            Generado por TurnosPro - Sistema de Gestión Médica
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recetas y Órdenes</h1>
          <p className="text-slate-500 font-medium">Gestión de prescripciones médicas y plantillas estándar.</p>
        </div>
        
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('emitir')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'emitir' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Plus size={18} /> Emitir
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'historial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <History size={18} /> Historial
          </button>
          <button 
            onClick={() => setActiveTab('plantillas')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'plantillas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Layout size={18} /> Plantillas
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'emitir' && (
          <motion.div 
            key="emitir"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Config Side */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Médico Solicitante</label>
                  <select 
                    value={selectedProf?.id || ''}
                    onChange={e => setSelectedProf(profesionales?.find((p: any) => p.id === e.target.value))}
                    className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar Médico...</option>
                    {profesionales?.map((p: any) => (
                      <option key={p.id} value={p.id}>Dr. {p.usuario.apellido} {p.usuario.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Paciente</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o DNI..."
                      value={searchPac}
                      onChange={e => setSearchPac(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {pacientes?.map((p: any) => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedPac(p)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedPac?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-100">
                          {p.apellido ? p.apellido[0] : 'P'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{p.apellido}, {p.nombre}</p>
                          <p className="text-[10px] text-slate-500">{p.obraSocial?.nombre || 'Particular'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPac && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-blue-600 rounded-2xl text-white space-y-2 shadow-lg shadow-blue-100"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Datos Seleccionados</p>
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <p className="text-sm font-bold">{selectedPac.apellido}, {selectedPac.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} />
                      <p className="text-xs font-medium">{selectedPac.obraSocial?.nombre || 'Particular'} - {selectedPac.numeroAfiliado || 'S/N'}</p>
                    </div>
                    <button onClick={() => setSelectedPac(null)} className="w-full mt-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors">CAMBIAR PACIENTE</button>
                  </motion.div>
                )}
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Usar Plantilla</h3>
                <div className="grid gap-2">
                  {templates?.map((t: any) => (
                    <button 
                      key={t.id}
                      onClick={() => handleApplyTemplate(t)}
                      className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-white hover:border-blue-200 border border-transparent rounded-2xl text-xs font-bold text-slate-700 transition-all flex items-center justify-between group"
                    >
                      {t.nombre}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                  {templates?.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No hay plantillas guardadas</p>
                  )}
                </div>
              </div>
            </div>

            {/* Editor Side */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Emisión de Receta / Orden</h2>
                  {selectedTemplate && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Plantilla: {selectedTemplate.nombre}
                    </span>
                  )}
                </div>

                <div className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Diagnóstico (Opcional)</label>
                    <input 
                      type="text" 
                      value={diagnostico}
                      onChange={e => setDiagnostico(e.target.value)}
                      placeholder="Ej: Control anual, Faringitis aguda..."
                      className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contenido de la Orden / Receta</label>
                    <textarea 
                      value={recetaContent}
                      onChange={e => setRecetaContent(e.target.value)}
                      placeholder="Escriba aquí las indicaciones, medicamentos o tipos de estudios..."
                      className="w-full flex-1 bg-slate-50 px-6 py-6 rounded-[2rem] border border-slate-200 text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-4">
                  <button 
                    onClick={() => handlePrint()}
                    className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <Printer size={20} /> Previsualizar
                  </button>
                  <button 
                    onClick={handleEmitir}
                    className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                    <FileText size={20} /> Emitir y Guardar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'historial' && (
          <motion.div 
            key="historial"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4"
          >
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Registro Histórico</h2>
                <p className="text-sm text-slate-500">Consulta y vuelve a imprimir órdenes emitidas anteriormente.</p>
              </div>
              <div className="p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-4">Fecha</th>
                      <th className="px-4 py-4">Médico</th>
                      <th className="px-4 py-4">Paciente</th>
                      <th className="px-4 py-4">Diagnóstico</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recetas?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-slate-400" />
                             <span className="text-sm font-bold text-slate-700">{format(new Date(r.createdAt), 'dd/MM/yy HH:mm')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-900">Dr. {r.profesional?.usuario?.apellido || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{r.profesional?.especialidad || 'S/E'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-900">{r.paciente?.apellido || 'N/A'}, {r.paciente?.nombre || ''}</p>
                          <p className="text-xs text-slate-500">{r.paciente?.obraSocial?.nombre || 'Particular'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {r.diagnostico || 'Sin diagnóstico'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => handlePrint(r)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Re-imprimir"
                          >
                            <Printer size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {recetas?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <FileText className="mx-auto text-slate-200 mb-4" size={48} />
                          <p className="text-slate-400 font-bold">No se han emitido recetas aún.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'plantillas' && (
          <motion.div 
            key="plantillas"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setNewTemplate({ nombre: '', contenido: '' });
                  setIsTemplateModalOpen(true);
                }}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Nueva Plantilla
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates?.map((t: any) => (
                <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <FileText size={24} />
                    </div>
                    <button 
                      onClick={() => deleteTemplate.mutate(t.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t.nombre}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3 mb-6 font-medium leading-relaxed">
                    {t.contenido}
                  </p>
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Default Template</span>
                    <button 
                      onClick={() => {
                        setActiveTab('emitir');
                        handleApplyTemplate(t);
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Usar ahora
                    </button>
                  </div>
                </div>
              ))}
              {templates?.length === 0 && (
                <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <Layout className="text-slate-200 mb-4" size={64} />
                  <p className="text-slate-400 font-black text-xl mb-2">No hay plantillas</p>
                  <p className="text-slate-500 font-medium">Comienza creando una plantilla para ahorrar tiempo en tus consultas.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Modal */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsTemplateModalOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Nueva Plantilla</h2>
                  <p className="text-slate-500 font-medium">Crea un modelo estándar para tus recetas u órdenes.</p>
                </div>
                <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre de la Plantilla</label>
                  <input 
                    type="text" 
                    value={newTemplate.nombre}
                    onChange={e => setNewTemplate({...newTemplate, nombre: e.target.value})}
                    placeholder="Ej: Análisis de sangre completo"
                    className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contenido Predeterminado</label>
                  <textarea 
                    rows={8}
                    value={newTemplate.contenido}
                    onChange={e => setNewTemplate({...newTemplate, contenido: e.target.value})}
                    placeholder="Escriba el texto que aparecerá por defecto..."
                    className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                   <button 
                    onClick={() => setIsTemplateModalOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 font-sans"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (!newTemplate.nombre || !newTemplate.contenido) return;
                      createTemplate.mutate(newTemplate, {
                        onSuccess: () => setIsTemplateModalOpen(false)
                      });
                    }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
                  >
                    Guardar Plantilla
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
