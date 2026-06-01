import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Clock, 
  MessageSquare, 
  Save,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

const API_BASE = '/api';

export default function Settings() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => fetch(`${API_BASE}/config`).then(res => res.json())
  });

  const publicBookingLink = `${window.location.origin}/reservar-turno`;
  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicBookingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('No se pudo copiar el link. Por favor copialo manualmente.');
    }
  };

  const updateConfig = useMutation({
    mutationFn: (newConfig: any) => fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newConfig)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombreClinica: formData.get('nombreClinica'),
      horarioApertura: formData.get('horarioApertura'),
      horarioCierre: formData.get('horarioCierre'),
      mensajeDefaultTurno: formData.get('mensajeDefaultTurno'),
      whatsapp: formData.get('whatsapp'),
    };
    updateConfig.mutate(data);
  };

  if (isLoading) return <div className="p-8 text-slate-400 font-bold">Cargando configuración...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tight">Configuración del Sistema</h1>
          <p className="text-slate-500 font-medium text-sm">Ajusta los parámetros globales de la plataforma y el link público</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Link Público */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Info className="text-blue-600" size={20} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Link Público de Reserva</h2>
                <p className="text-xs text-slate-500 font-medium">Compartilo para que pidan turnos desde la web.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={copyPublicLink}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link</label>
            <input
              type="text"
              value={publicBookingLink}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 italic">Tip: al tocar el campo, queda seleccionado para copiar rápido.</p>
          </div>
        </div>

        {/* Identidad */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <Info className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Identidad de la Clínica</h2>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Centro / Clínica</label>
            <input 
              type="text" 
              name="nombreClinica"
              defaultValue={config?.nombreClinica}
              placeholder="Ej: Centro Médico de Día"
              className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Horarios de Atención</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora de Apertura</label>
              <input 
                type="time" 
                name="horarioApertura"
                defaultValue={config?.horarioApertura}
                className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora de Cierre</label>
              <input 
                type="time" 
                name="horarioCierre"
                defaultValue={config?.horarioCierre}
                className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Info size={14} />
            Este horario define los límites visuales del calendario en la PC.
          </p>
        </div>

        {/* Mensajes */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Mensaje de Confirmación</h2>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mensaje para el Paciente (Link Público)</label>
            <textarea 
              name="mensajeDefaultTurno"
              rows={4}
              defaultValue={config?.mensajeDefaultTurno}
              placeholder="Ej: Tu turno ha sido registrado. Recuerda traer tu orden médica."
              className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            />
            <p className="text-[10px] text-slate-400 italic">Este mensaje aparecerá cuando el paciente termine de reservar su turno por el link oficial.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp de contacto (Centro Médico)</label>
            <input 
              type="text" 
              name="whatsapp"
              defaultValue={config?.whatsapp}
              placeholder="Ej: 5491122334455"
              className="w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 italic">Número para que los pacientes envíen sus comprobantes. Incluir código de país sin el +.</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {success && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl inline-block"
              >
                ¡Configuración guardada con éxito!
              </motion.p>
            )}
          </div>
          <button 
            type="submit"
            disabled={updateConfig.isPending}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg"
          >
            {updateConfig.isPending ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </form>
    </div>
  );
}
