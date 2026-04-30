import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { 
  Users, 
  Calendar, 
  Settings as SettingsIcon, 
  BriefcaseMedical, 
  UserSquare2, 
  LogOut, 
  LayoutDashboard,
  Clock,
  MapPin,
  ClipboardList,
  FileText,
  DollarSign
} from 'lucide-react';

// Pages (will implement next)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfessionalCalendar from './pages/ProfessionalCalendar';
import Booking from './pages/Booking';
import AdminConsultorios from './pages/AdminConsultorios';
import AdminProfesionales from './pages/AdminProfesionales';
import AdminPacientes from './pages/AdminPacientes';
import MyAppointments from './pages/MyAppointments';
import Recetas from './pages/Recetas';
import PublicBooking from './pages/PublicBooking';
import Settings from './pages/Settings';
import Accounting from './pages/Accounting';

const queryClient = new QueryClient();

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['SUPERADMIN', 'ADMIN_CONSULTORIO', 'PROFESIONAL', 'RECEPCIONISTA'] },
    { label: 'Mi Agenda', icon: Calendar, path: '/agenda', roles: ['PROFESIONAL'] },
    { label: 'Todos los Turnos', icon: ClipboardList, path: '/agenda', roles: ['RECEPCIONISTA', 'SUPERADMIN'] },
    { label: 'Reservar Turno', icon: Clock, path: '/reservar', roles: ['PACIENTE', 'RECEPCIONISTA'] },
    { label: 'Mis Turnos', icon: ClipboardList, path: '/mis-turnos', roles: ['PACIENTE'] },
    { label: 'Contabilidad', icon: DollarSign, path: '/contabilidad', roles: ['SUPERADMIN', 'ADMIN_CONSULTORIO'] },
    { label: 'Profesionales', icon: BriefcaseMedical, path: '/admin-profesionales', roles: ['SUPERADMIN', 'ADMIN_CONSULTORIO'] },
    { label: 'Consultorios', icon: MapPin, path: '/admin-consultorios', roles: ['SUPERADMIN', 'ADMIN_CONSULTORIO'] },
    { label: 'Pacientes', icon: UserSquare2, path: '/pacientes', roles: ['SUPERADMIN', 'RECEPCIONISTA', 'PROFESIONAL'] },
    { label: 'Recetas y Órdenes', icon: FileText, path: '/recetas', roles: ['SUPERADMIN', 'PROFESIONAL', 'RECEPCIONISTA'] },
    { label: 'Configuración', icon: SettingsIcon, path: '/configuracion', roles: ['SUPERADMIN', 'ADMIN_CONSULTORIO'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.rol));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <BriefcaseMedical size={24} />
          </div>
          <span className="font-bold text-slate-800 text-lg uppercase tracking-tight">TurnosPro</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user.nombre[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-800 truncate">{user.nombre}</p>
              <p className="text-xs text-slate-500 capitalize">{user.rol.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />
          <Route path="/agenda" element={
            <PrivateRoute roles={['PROFESIONAL', 'RECEPCIONISTA', 'SUPERADMIN']}>
              <Layout><ProfessionalCalendar /></Layout>
            </PrivateRoute>
          } />
          <Route path="/mis-turnos" element={
            <PrivateRoute roles={['PACIENTE']}>
              <Layout><MyAppointments /></Layout>
            </PrivateRoute>
          } />
          <Route path="/reservar" element={
            <PrivateRoute roles={['PACIENTE', 'RECEPCIONISTA', 'PROFESIONAL', 'SUPERADMIN', 'ADMIN_CONSULTORIO']}>
              <Layout><Booking /></Layout>
            </PrivateRoute>
          } />
          <Route path="/admin-consultorios" element={
            <PrivateRoute roles={['SUPERADMIN', 'ADMIN_CONSULTORIO']}>
              <Layout><AdminConsultorios /></Layout>
            </PrivateRoute>
          } />
          <Route path="/admin-profesionales" element={
            <PrivateRoute roles={['SUPERADMIN', 'ADMIN_CONSULTORIO']}>
              <Layout><AdminProfesionales /></Layout>
            </PrivateRoute>
          } />
          <Route path="/pacientes" element={
            <PrivateRoute roles={['SUPERADMIN', 'RECEPCIONISTA', 'PROFESIONAL']}>
              <Layout><AdminPacientes /></Layout>
            </PrivateRoute>
          } />
          <Route path="/recetas" element={
            <PrivateRoute roles={['SUPERADMIN', 'PROFESIONAL', 'RECEPCIONISTA']}>
              <Layout><Recetas /></Layout>
            </PrivateRoute>
          } />
          <Route path="/contabilidad" element={
            <PrivateRoute roles={['SUPERADMIN', 'ADMIN_CONSULTORIO']}>
              <Layout><Accounting /></Layout>
            </PrivateRoute>
          } />
          <Route path="/configuracion" element={
            <PrivateRoute roles={['SUPERADMIN', 'ADMIN_CONSULTORIO']}>
              <Layout><Settings /></Layout>
            </PrivateRoute>
          } />
          <Route path="/reservar-turno" element={<PublicBooking />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
