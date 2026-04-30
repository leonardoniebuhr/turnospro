import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersercret_change_this_in_production';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.rol)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      next();
    };
  };

  // --- API Routes ---

  // --- Bootstrap (primer superadmin) ---
  // Render Free no incluye Shell: este endpoint crea el usuario inicial de forma segura.
  // Se habilita SOLO si existe BOOTSTRAP_TOKEN en el entorno.
  // Uso: POST /api/admin/bootstrap con header "x-bootstrap-token" y body { email, password, nombre, apellido, dni }
  app.post('/api/admin/bootstrap', async (req, res) => {
    const token = process.env.BOOTSTRAP_TOKEN;
    if (!token) return res.status(404).json({ message: 'Not found' });

    const provided = String(req.headers['x-bootstrap-token'] || '');
    if (!provided || provided !== token) return res.status(401).json({ message: 'Unauthorized' });

    const { email, password, nombre, apellido, dni } = req.body || {};
    if (!email || !password || !nombre || !apellido || !dni) {
      return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }

    try {
      const existingAdmin = await prisma.user.findFirst({ where: { rol: 'SUPERADMIN' } });
      if (existingAdmin) {
        return res.status(409).json({ message: 'Ya existe un SUPERADMIN. Deshabilitá BOOTSTRAP_TOKEN.' });
      }

      const dup = await prisma.user.findFirst({
        where: { OR: [{ email: String(email).trim().toLowerCase() }, { dni: String(dni).trim() }] }
      });
      if (dup) return res.status(400).json({ message: 'El correo o el DNI ya están registrados.' });

      const passwordHash = await bcrypt.hash(String(password), 10);
      const user = await prisma.user.create({
        data: {
          email: String(email).trim().toLowerCase(),
          passwordHash,
          nombre: String(nombre).trim(),
          apellido: String(apellido).trim(),
          dni: String(dni).trim(),
          rol: 'SUPERADMIN'
        }
      });

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token: jwtToken,
        user: { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre, apellido: user.apellido }
      });
    } catch (error) {
      console.error('Error en bootstrap:', error);
      return res.status(500).json({ message: 'No se pudo crear el superadmin.' });
    }
  });

  // --- Global Config ---
  app.get('/api/config', async (req, res) => {
    let config = await prisma.configGlobal.findUnique({ where: { id: 'singleton' } });
    if (!config) {
      config = await prisma.configGlobal.create({
        data: {
          nombreClinica: 'TurnosPro',
          horarioApertura: '08:00',
          horarioCierre: '19:00',
          mensajeDefaultTurno: 'Tu turno ha sido reservado con éxito. ¡Te esperamos!',
          whatsapp: ''
        }
      });
    }
    res.json(config);
  });

  app.put('/api/config', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      const config = await prisma.configGlobal.upsert({
        where: { id: 'singleton' },
        update: req.body,
        create: { id: 'singleton', ...req.body }
      });
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar configuración' });
    }
  });

  // --- Public Booking Endpoints ---
  app.get('/api/public/profesionales', async (req, res) => {
    const profesionales = await prisma.profesional.findMany({
      include: { 
        usuario: true,
        configAgendas: true 
      },
      where: { activo: true }
    });
    res.json(profesionales);
  });

  app.get('/api/public/obras-sociales', async (req, res) => {
    const os = await prisma.obraSocial.findMany({ where: { activo: true } });
    res.json(os);
  });

  app.get('/api/public/turnos-ocupados', async (req, res) => {
    const { profesionalId, fecha } = req.query;
    if (!profesionalId || !fecha) return res.status(400).json({ message: 'Faltan parámetros' });
    
    const startOfDay = new Date(`${fecha}T00:00:00`);
    const endOfDay = new Date(`${fecha}T23:59:59`);

    const turnos = await prisma.turno.findMany({
      where: {
        profesionalId: profesionalId as string,
        fechaHoraInicio: { gte: startOfDay, lte: endOfDay },
        estado: { not: 'CANCELADO' }
      },
      select: { fechaHoraInicio: true, fechaHoraFin: true }
    });
    res.json(turnos);
  });

  app.post('/api/public/reservar', async (req, res) => {
    const { patient, booking } = req.body;
    try {
      // 1. Find or create patient
      let paciente = await prisma.paciente.findUnique({ where: { dni: patient.dni } });
      
      const obraSocialId = patient.obraSocialId === 'PARTICULAR' ? null : (patient.obraSocialId || null);

      if (!paciente) {
        paciente = await prisma.paciente.create({
          data: {
            dni: patient.dni,
            nombre: patient.nombre,
            apellido: patient.apellido,
            email: patient.email,
            telefono: patient.telefono,
            obraSocialId: obraSocialId,
            fechaNacimiento: new Date(1990, 0, 1) // Default or ask in form
          }
        });
      } else {
        // Update patient info if they exist? (Optional, but good for keeping phone/email fresh)
        await prisma.paciente.update({
          where: { id: paciente.id },
          data: {
            telefono: patient.telefono,
            email: patient.email,
            obraSocialId: obraSocialId
          }
        });
      }

      // 2. Check for overlap (No sobreturnos via public booking)
      const start = new Date(booking.fechaHoraInicio);
      const end = new Date(booking.fechaHoraFin);

      const overlap = await prisma.turno.findFirst({
        where: {
          profesionalId: booking.profesionalId,
          fechaHoraInicio: { lt: end },
          fechaHoraFin: { gt: start },
          estado: { not: 'CANCELADO' }
        }
      });

      if (overlap) {
        return res.status(400).json({ message: 'El horario seleccionado ya no está disponible.' });
      }

      // Ensure we have a consultorioId
      let finalConsultorioId = booking.consultorioId;
      
      // Auto-assign consultorio based on day of week
      const dateObj = new Date(booking.fechaHoraInicio);
      const dayOfWeek = dateObj.getDay(); // 0 (Sun) to 6 (Sat)
      
      const prof = await prisma.profesional.findUnique({
        where: { id: booking.profesionalId },
        include: { 
          configAgendas: {
            where: { diaSemana: dayOfWeek, activo: true }
          } 
        }
      });

      if (prof?.configAgendas && prof.configAgendas.length > 0) {
        finalConsultorioId = prof.configAgendas[0].consultorioId;
      } else if (!finalConsultorioId && prof?.configAgendas?.[0]) {
        // Fallback to first available if day specific is not found but others exist
        finalConsultorioId = prof.configAgendas[0].consultorioId;
      }

      if (!finalConsultorioId) {
        return res.status(400).json({ message: 'El profesional no tiene asignado un consultorio para este día.' });
      }

      // 3. Create appointment
      const turno = await prisma.turno.create({
        data: {
          pacienteId: paciente.id,
          profesionalId: booking.profesionalId,
          consultorioId: finalConsultorioId,
          fechaHoraInicio: start,
          fechaHoraFin: end,
          estado: 'PENDIENTE',
          motivoConsulta: 'Reserva Online',
          esPublico: true,
          canalReserva: 'PUBLICO'
        }
      });

      // Create initial payment record if method provided
      if (booking.metodoPago) {
        let monto = 0;
        const profData = await prisma.profesional.findUnique({ where: { id: booking.profesionalId } });
        if (paciente.obraSocialId) {
          monto = profData?.arancelObraSocial || 0;
        } else {
          monto = profData?.arancelParticular || 0;
        }

        await prisma.pago.create({
          data: {
            turnoId: turno.id,
            monto,
            metodo: booking.metodoPago,
            estadoPago: 'PENDIENTE'
          }
        });
      }

      res.json(turno);
    } catch (error) {
      console.error('Error en reserva pública:', error);
      res.status(500).json({ message: 'Error al procesar la reserva.' });
    }
  });

  // Auth: Registro (pacientes)
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, nombre, apellido, dni, telefono, fechaNacimiento } = req.body;
    if (!email || !password || !nombre || !apellido || !dni || !fechaNacimiento) {
      return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }
    try {
      const dup = await prisma.user.findFirst({
        where: { OR: [{ email: String(email).trim() }, { dni: String(dni).trim() }] }
      });
      if (dup) {
        return res.status(400).json({ message: 'El correo o el DNI ya están registrados.' });
      }
      const dupPac = await prisma.paciente.findUnique({ where: { dni: String(dni).trim() } });
      if (dupPac) {
        return res.status(400).json({ message: 'Ya existe un paciente con ese DNI.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: String(email).trim().toLowerCase(),
          passwordHash,
          nombre: String(nombre).trim(),
          apellido: String(apellido).trim(),
          dni: String(dni).trim(),
          telefono: telefono ? String(telefono).trim() : null,
          rol: 'PACIENTE'
        }
      });

      await prisma.paciente.create({
        data: {
          usuarioId: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          dni: user.dni,
          telefono: telefono ? String(telefono).trim() : '',
          fechaNacimiento: new Date(fechaNacimiento)
        }
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre, apellido: user.apellido }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ message: 'No se pudo completar el registro.' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Intentando login para: ${email}`);
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.log(`Usuario no encontrado: ${email}`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log(`Contraseña incorrecta para: ${email}`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log(`Login exitoso para: ${email} (Rol: ${user.rol})`);
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, user: { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre, apellido: user.apellido } });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // --- Consultorios ---
  app.get('/api/consultorios', authenticateToken, async (req, res) => {
    const consultorios = await prisma.consultorio.findMany({ where: { activo: true } });
    res.json(consultorios);
  });

  // --- Turnos CRUD ---
  app.put('/api/turnos/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, fechaHoraInicio, consultorioId, motivoConsulta } = req.body;
      
      const existing = await prisma.turno.findUnique({ where: { id } });
      if (!existing) return res.sendStatus(404);

      const prof = await prisma.profesional.findUnique({ where: { id: existing.profesionalId } });
      const duration = prof?.duracionTurnoDefault || 30;
      
      const start = fechaHoraInicio ? new Date(fechaHoraInicio) : existing.fechaHoraInicio;
      const end = new Date(start.getTime() + duration * 60000);

      const turno = await prisma.turno.update({
        where: { id },
        data: { 
          estado, 
          fechaHoraInicio: start, 
          fechaHoraFin: end,
          consultorioId: consultorioId || existing.consultorioId,
          motivoConsulta: motivoConsulta || existing.motivoConsulta
        }
      });
      res.json(turno);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar turno' });
    }
  });

  app.delete('/api/turnos/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.turno.delete({ where: { id: req.params.id } });
      res.sendStatus(204);
    } catch (error) {
      res.status(400).json({ message: 'Error al eliminar turno' });
    }
  });


  app.post('/api/consultorios', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      const { numero, nombre, equipamiento, capacidad, ubicacion } = req.body;
      const consultorio = await prisma.consultorio.create({
        data: { numero: parseInt(numero), nombre, equipamiento: JSON.stringify(equipamiento), capacidad: parseInt(capacidad), ubicacion }
      });
      res.json(consultorio);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear consultorio' });
    }
  });

  app.put('/api/consultorios/:id', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, equipamiento, capacidad, ubicacion, activo } = req.body;
      const consultorio = await prisma.consultorio.update({
        where: { id },
        data: { nombre, equipamiento: JSON.stringify(equipamiento), capacidad: parseInt(capacidad), ubicacion, activo }
      });
      res.json(consultorio);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar consultorio' });
    }
  });

  // --- Profesionales CRUD ---
  app.post('/api/profesionales', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      const { email, nombre, apellido, dni, especialidad, matriculaNacional, matriculaProvincial, duracionTurnoDefault, colorCalendario, arancelParticular, arancelObraSocial, aliasTransferencia, cbuTransferencia } = req.body;
      
      const hashedPassword = await bcrypt.hash('profesional123', 10);
      const user = await prisma.user.create({
        data: { email, nombre, apellido, dni, passwordHash: hashedPassword, rol: 'PROFESIONAL' }
      });

      const prof = await prisma.profesional.create({
        data: {
          usuarioId: user.id,
          especialidad,
          matriculaNacional,
          matriculaProvincial,
          duracionTurnoDefault: parseInt(duracionTurnoDefault),
          colorCalendario,
          arancelParticular: parseFloat(arancelParticular || 0),
          arancelObraSocial: parseFloat(arancelObraSocial || 0),
          aliasTransferencia,
          cbuTransferencia
        }
      });
      res.json(prof);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear profesional' });
    }
  });

  app.put('/api/profesionales/:id', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      const { id } = req.params;
      const { especialidad, matriculaNacional, matriculaProvincial, duracionTurnoDefault, colorCalendario, activo, arancelParticular, arancelObraSocial, aliasTransferencia, cbuTransferencia } = req.body;
      const prof = await prisma.profesional.update({
        where: { id },
        data: { 
          especialidad, 
          matriculaNacional, 
          matriculaProvincial, 
          duracionTurnoDefault: parseInt(duracionTurnoDefault), 
          colorCalendario, 
          activo,
          arancelParticular: parseFloat(arancelParticular || 0),
          arancelObraSocial: parseFloat(arancelObraSocial || 0),
          aliasTransferencia,
          cbuTransferencia
        }
      });
      res.json(prof);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar profesional' });
    }
  });

  // --- Pagos ---
  app.post('/api/turnos/:id/pago', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { monto, metodo, estadoPago, nota } = req.body;
      
      const pago = await prisma.pago.upsert({
        where: { turnoId: id },
        update: {
          monto: parseFloat(monto),
          metodo,
          estadoPago,
          fechaPago: estadoPago === 'COMPLETADO' ? new Date() : null
        },
        create: {
          turnoId: id,
          monto: parseFloat(monto),
          metodo,
          estadoPago,
          fechaPago: estadoPago === 'COMPLETADO' ? new Date() : null
        }
      });

      // Update turno status if payment completed? (optional)
      if (estadoPago === 'COMPLETADO') {
        await prisma.turno.update({
          where: { id },
          data: { updatedAt: new Date() } // Trigger update
        });
      }

      res.json(pago);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Error al registrar pago' });
    }
  });

  // Profesionales
  app.get('/api/profesionales', async (req, res) => {
    const profesionales = await prisma.profesional.findMany({
      include: { usuario: true, configAgendas: true },
      where: { activo: true }
    });
    res.json(profesionales);
  });

  app.get('/api/profesionales/:id/horarios', authenticateToken, async (req, res) => {
    const horarios = await prisma.configuracionAgenda.findMany({
      where: { profesionalId: req.params.id },
      include: { consultorio: true }
    });
    res.json(horarios);
  });

  app.post('/api/profesionales/:id/horarios', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      const { id } = req.params;
      const { consultorioId, diaSemana, horaInicio, horaFin } = req.body;
      
      const config = await prisma.configuracionAgenda.create({
        data: {
          profesionalId: id,
          consultorioId,
          diaSemana: parseInt(diaSemana),
          horaInicio,
          horaFin
        }
      });
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear horario' });
    }
  });

  app.delete('/api/profesionales/horarios/:id', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    try {
      await prisma.configuracionAgenda.delete({ where: { id: req.params.id } });
      res.sendStatus(204);
    } catch (error) {
      res.status(400).json({ message: 'Error al eliminar horario' });
    }
  });

  // Obras Sociales
  app.get('/api/obras-sociales', authenticateToken, async (req, res) => {
    const os = await prisma.obraSocial.findMany({ where: { activo: true } });
    res.json(os);
  });

  // Recipes (Recetas)
  app.get('/api/receta-templates', authenticateToken, async (req, res) => {
    const templates = await prisma.recetaTemplate.findMany({ where: { activo: true } });
    res.json(templates);
  });

  app.post('/api/receta-templates', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO', 'PROFESIONAL']), async (req, res) => {
    try {
      const template = await prisma.recetaTemplate.create({ data: req.body });
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear plantilla' });
    }
  });

  app.delete('/api/receta-templates/:id', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO', 'PROFESIONAL']), async (req, res) => {
    try {
      await prisma.recetaTemplate.update({ where: { id: req.params.id }, data: { activo: false } });
      res.sendStatus(204);
    } catch (error) {
      res.status(400).json({ message: 'Error al eliminar plantilla' });
    }
  });

  app.get('/api/recetas', authenticateToken, async (req, res) => {
    const recetas = await prisma.receta.findMany({
      include: {
        profesional: { include: { usuario: true } },
        paciente: { include: { obraSocial: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(recetas);
  });

  app.post('/api/recetas', authenticateToken, async (req, res) => {
    try {
      const receta = await prisma.receta.create({
        data: req.body,
        include: {
          profesional: { include: { usuario: true } },
          paciente: { include: { obraSocial: true } }
        }
      });
      res.json(receta);
    } catch (error) {
      res.status(400).json({ message: 'Error al emitir receta' });
    }
  });

  // Patients (CRUD)
  app.get('/api/pacientes', authenticateToken, async (req, res) => {
    const search = req.query.search as string;
    const pacientes = await prisma.paciente.findMany({
      where: search ? {
        OR: [
          { nombre: { contains: search } },
          { apellido: { contains: search } },
          { dni: { contains: search } }
        ]
      } : {},
      include: {
        obraSocial: true,
        turnos: {
          include: {
            profesional: { include: { usuario: true } },
            consultorio: true
          }
        }
      }
    });
    res.json(pacientes);
  });

  app.post('/api/pacientes', authenticateToken, async (req, res) => {
    try {
      const data = req.body;
      const paciente = await prisma.paciente.create({
        data: {
          ...data,
          obraSocialId: data.obraSocialId || null
        }
      });
      res.json(paciente);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear paciente' });
    }
  });

  app.get('/api/pacientes/:id', authenticateToken, async (req, res) => {
    try {
      const paciente = await prisma.paciente.findUnique({
        where: { id: req.params.id },
        include: { obraSocial: true, turnos: { include: { profesional: { include: { usuario: true } } } } }
      });
      res.json(paciente);
    } catch (error) {
      res.status(404).json({ message: 'Paciente no encontrado' });
    }
  });

  app.put('/api/pacientes/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const paciente = await prisma.paciente.update({
        where: { id },
        data: {
          ...data,
          obraSocialId: data.obraSocialId || null
        }
      });
      res.json(paciente);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar paciente' });
    }
  });

  // Appointments (Turnos)
  app.get('/api/turnos', authenticateToken, async (req, res) => {
    const { start, end, profesionalId, consultorioId } = req.query;
    const userRole = (req as any).user.rol;
    const userId = (req as any).user.id;

    let where: any = {};
    if (start && end) {
      where.fechaHoraInicio = { gte: new Date(start as string), lte: new Date(end as string) };
    }
    if (profesionalId) where.profesionalId = profesionalId;
    if (consultorioId) where.consultorioId = consultorioId;

    // Filter by role
    if (userRole === 'PROFESIONAL') {
      const prof = await prisma.profesional.findUnique({ where: { usuarioId: userId } });
      where.profesionalId = prof?.id;
    } else if (userRole === 'PACIENTE') {
      const pac = await prisma.paciente.findUnique({ where: { usuarioId: userId } });
      where.pacienteId = pac?.id;
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        paciente: true,
        profesional: { include: { usuario: true } },
        consultorio: true,
        pago: true
      }
    });
    res.json(turnos);
  });

  app.delete('/api/consultorios/:id', authenticateToken, authorize(['SUPERADMIN']), async (req, res) => {
    try {
      await prisma.consultorio.delete({ where: { id: req.params.id } });
      res.sendStatus(204);
    } catch (error) {
      res.status(400).json({ message: 'No se puede eliminar un consultorio con turnos asociados. Desactívelo en su lugar.' });
    }
  });

  app.delete('/api/profesionales/:id', authenticateToken, authorize(['SUPERADMIN']), async (req, res) => {
    try {
      const prof = await prisma.profesional.findUnique({ where: { id: req.params.id }, include: { usuario: true } });
      if (!prof) return res.sendStatus(404);
      
      // We must handle related records or just warn
      // For this app, let's allow it but warn if there are turnos
      const turnosCount = await prisma.turno.count({ where: { profesionalId: req.params.id } });
      if (turnosCount > 0) {
        return res.status(400).json({ message: `No se puede eliminar: el profesional tiene ${turnosCount} turnos registrados. Primero debe eliminarlos o cancelar.` });
      }

      await prisma.configuracionAgenda.deleteMany({ where: { profesionalId: req.params.id } });
      await prisma.profesional.delete({ where: { id: req.params.id } });
      await prisma.user.delete({ where: { id: prof.usuarioId } });
      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error interno al eliminar profesional.' });
    }
  });

  app.post('/api/turnos', authenticateToken, async (req, res) => {
    const { pacienteId, profesionalId, consultorioId, fechaHoraInicio, tipo, motivoConsulta, esSobreturno, recurrenciaSemanas } = req.body;
    
    try {
      const prof = await prisma.profesional.findUnique({ where: { id: profesionalId } });
      const duration = prof?.duracionTurnoDefault || 30;
      
      const numSemanas = parseInt(recurrenciaSemanas) || 1;

      const createdTurnos = await prisma.$transaction(
        Array.from({ length: numSemanas }).map((_, i) => {
          const start = new Date(fechaHoraInicio);
          start.setDate(start.getDate() + (i * 7));
          const end = new Date(start.getTime() + duration * 60000);

          return prisma.turno.create({
            data: {
              pacienteId,
              profesionalId,
              consultorioId,
              fechaHoraInicio: start,
              fechaHoraFin: end,
              tipo,
              motivoConsulta,
              esSobreturno: esSobreturno || false,
              esPublico: false,
              canalReserva: 'INTERNO'
            }
          });
        })
      );

      res.json({ count: createdTurnos.length });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Error al crear turno(s)' });
    }
  });

  // Dashboard Stats
  app.get('/api/stats', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    const { period } = req.query;
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default to month
    
    if (period === 'dia') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'semana') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    }

    const turnosPeriodo = await prisma.turno.count({ where: { fechaHoraInicio: { gte: startDate } } });
    const turnosWeb = await prisma.turno.count({ where: { fechaHoraInicio: { gte: startDate }, esPublico: true } });
    
    const ingresos = await prisma.pago.aggregate({ 
      where: { estadoPago: 'COMPLETADO', fechaPago: { gte: startDate } },
      _sum: { monto: true } 
    });
    
    const totalProfesionales = await prisma.profesional.count({ where: { activo: true } });
    const totalPacientes = await prisma.paciente.count();

    res.json({
      turnosMes: turnosPeriodo, // Keeping the same key name for frontend compatibility or updating it
      turnosWeb,
      ingresos: ingresos._sum.monto || 0,
      totalProfesionales,
      totalPacientes
    });
  });

  // Accounting (Contabilidad)
  app.get('/api/accounting', authenticateToken, authorize(['SUPERADMIN', 'ADMIN_CONSULTORIO']), async (req, res) => {
    const { start, end, profesionalId } = req.query;
    
    let where: any = {};
    if (start && end) {
      where.fechaHoraInicio = { gte: new Date(start as string), lte: new Date(end as string) };
    }
    if (profesionalId) {
      where.profesionalId = profesionalId;
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        paciente: { include: { obraSocial: true } },
        profesional: { include: { usuario: true } },
        pago: true
      },
      orderBy: { fechaHoraInicio: 'desc' }
    });

    res.json(turnos);
  });
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const host = process.env.NODE_ENV === 'production' ? 'todas las interfaces' : 'localhost';
    console.log(`Servidor TurnosPro en puerto ${PORT} (${host}) — en red local: http://<IP-de-esta-PC>:${PORT}`);
  });
}

startServer();
