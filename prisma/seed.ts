import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Superadmin
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@consultorios.com' },
    update: {},
    create: {
      email: 'admin@consultorios.com',
      dni: '12345678',
      passwordHash: hashedAdminPassword,
      nombre: 'Admin',
      apellido: 'Principal',
      rol: 'SUPERADMIN',
    }
  });

  // 2. Consultorios
  const consultorios = [
    { numero: 1, nombre: 'Consultorio General 1', equipamiento: JSON.stringify(['camilla', 'escritorio', 'computadora']), capacidad: 1 },
    { numero: 2, nombre: 'Consultorio General 2', equipamiento: JSON.stringify(['camilla', 'escritorio', 'computadora']), capacidad: 1 },
    { numero: 3, nombre: 'Consultorio Pediatría', equipamiento: JSON.stringify(['camilla', 'escritorio', 'computadora', 'juegos']), capacidad: 1 },
    { numero: 4, nombre: 'Consultorio Ecografía', equipamiento: JSON.stringify(['camilla', 'escritorio', 'computadora', 'ecógrafo']), capacidad: 1 },
    { numero: 5, nombre: 'Consultorio Ginecología', equipamiento: JSON.stringify(['camilla ginecológica', 'escritorio', 'computadora']), capacidad: 1 },
  ];

  for (const c of consultorios) {
    await prisma.consultorio.upsert({
      where: { numero: c.numero },
      update: {},
      create: c,
    });
  }

  // 3. Profesionales
  const especialidades = ['Cardiología', 'Pediatría', 'Ginecología', 'Traumatología', 'Dermatología', 'Nutrición'];
  const profsData = [];

  for (let i = 1; i <= 10; i++) {
    const email = `profesional${i}@consultorios.com`;
    const hashedPassword = await bcrypt.hash('profesional123', 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        dni: `prof-${i}`,
        passwordHash: hashedPassword,
        nombre: `Dr. ${i}`,
        apellido: `ApellidoProf ${i}`,
        rol: 'PROFESIONAL',
      }
    });

    const prof = await prisma.profesional.upsert({
      where: { usuarioId: user.id },
      update: {},
      create: {
        usuarioId: user.id,
        especialidad: especialidades[i % especialidades.length],
        matriculaNacional: `MN-${1000 + i}`,
        matriculaProvincial: `MP-${2000 + i}`,
        duracionTurnoDefault: i % 2 === 0 ? 30 : 20,
        colorCalendario: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1'][i % 5],
      }
    });
    profsData.push(prof);
  }

  // 4. Agendas para los profesionales
  const allConsultorios = await prisma.consultorio.findMany();
  for (const prof of profsData) {
    // Cada profesional atiende 2 o 3 días a la semana
    const dias = [1, 3, 5].slice(0, 2 + (Math.floor(Math.random() * 2)));
    for (const dia of dias) {
      await prisma.configuracionAgenda.create({
        data: {
          profesionalId: prof.id,
          consultorioId: allConsultorios[Math.floor(Math.random() * allConsultorios.length)].id,
          diaSemana: dia,
          horaInicio: '09:00',
          horaFin: '13:00',
          activo: true,
        }
      });
    }
  }

  // 5. Pacientes
  for (let i = 1; i <= 20; i++) {
    const email = `paciente${i}@gmail.com`;
    const hashedPassword = await bcrypt.hash('paciente123', 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        dni: `pac-${i}`,
        passwordHash: hashedPassword,
        nombre: `Paciente ${i}`,
        apellido: `ApellidoPac ${i}`,
        rol: 'PACIENTE',
      }
    });

    await prisma.paciente.create({
      data: {
        usuarioId: user.id,
        nombre: `Paciente ${i}`,
        apellido: `ApellidoPac ${i}`,
        dni: `pac-${i}`,
        telefono: `1234567${i}`,
        email: email,
        fechaNacimiento: new Date(1990, 0, i),
      }
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
