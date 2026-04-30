<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## TurnosPro

### Producción (Render + Neon) sin Shell

En Render Free no hay consola/shell para ejecutar `npm run seed`. Para crear el **primer** usuario `SUPERADMIN`, usá el endpoint de bootstrap protegido por token.

1. En Render → Service → **Environment**
   - Seteá `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`
   - Agregá `BOOTSTRAP_TOKEN` (un string largo y aleatorio, solo temporal)
2. Deploy / redeploy del servicio.
3. Llamá una sola vez a:

`POST https://turnospro.onrender.com/api/admin/bootstrap`

Header:
- `x-bootstrap-token: <BOOTSTRAP_TOKEN>`

Body JSON:
```json
{
  "email": "admin@consultorios.com",
  "password": "admin123",
  "nombre": "Admin",
  "apellido": "Principal",
  "dni": "12345678"
}
```

4. **Después** borrá `BOOTSTRAP_TOKEN` de Render para deshabilitar el bootstrap.

### Local

1. `npm install`
2. Copiá `.env.example` a `.env` y ajustá `DATABASE_URL` (Postgres).
3. `npx prisma db push`
4. `npm run seed`
5. `npm run dev`
