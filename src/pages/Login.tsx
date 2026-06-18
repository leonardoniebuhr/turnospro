import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { BriefcaseMedical, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isChangingPassword) {
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas nuevas no coinciden');
        return;
      }
      try {
        await api.post('/auth/change-password', { 
          email, 
          currentPassword: password, 
          newPassword 
        });
        setSuccess('Contraseña cambiada exitosamente. Inicia sesión.');
        setIsChangingPassword(false);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError('Credenciales actuales incorrectas o error en el servidor');
      }
    } else {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        login(data.user, data.token);
        navigate('/');
      } catch (err) {
        setError('Credenciales incorrectas');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden"
      >
        <div className="p-8 text-center border-b border-slate-50 bg-blue-600">
           <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4">
             <BriefcaseMedical size={32} />
           </div>
           <h1 className="text-2xl font-bold text-white">TurnosPro</h1>
           <p className="text-blue-100 mt-1">Gestión Médica Profesional</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">{success}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@turnospro.com"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              {isChangingPassword ? 'Contraseña Actual' : 'Contraseña'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isChangingPassword && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva clave"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Repetir Nueva Contraseña</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetir clave"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isChangingPassword ? 'Confirmar Cambio de Clave' : 'Entrar al Panel'}
          </button>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            {!isChangingPassword ? (
              <p className="text-slate-500 text-sm text-center">
                ¿Querés cambiar tu clave?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsChangingPassword(true)} 
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Cambiar clave
                </button>
              </p>
            ) : (
              <p className="text-slate-500 text-sm text-center">
                <button 
                  type="button" 
                  onClick={() => setIsChangingPassword(false)} 
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Volver al Login
                </button>
              </p>
            )}
            
            <p className="text-slate-500 text-sm text-center">
              ¿No tenés cuenta?{' '}
              <Link to="/registro" className="text-blue-600 font-semibold hover:underline">
                Registrate
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

