# Sistema Web de Gestión de Turnos — Consultorio Médico

Demo estática (HTML + CSS + JavaScript, sin backend) del sistema de gestión de turnos para consultorio médico, pensada para la entrega de **Prácticas Profesionales**. Funciona 100% en el navegador usando `localStorage` como base de datos simulada, lo que la hace ideal para publicar en **GitHub Pages**.

## Módulos incluidos

- **Pacientes**: registro/login, disponibilidad por especialidad y profesional, reserva de turnos guiada (wizard), cancelación y confirmaciones.
- **Médicos**: agenda diaria/semanal, cambio de estado del turno (confirmado, atendido, ausente, cancelado) y notas de atención.
- **Recepción / Administración**: agenda global, alta/baja de profesionales, gestión de especialidades y obras sociales, carga de sobreturnos y envío de notificaciones simuladas.

## Alcance (MVP)

Incluye: ciclo de vida completo del turno, control de accesos simulado por rol, notificaciones/recordatorios simulados, diseño responsivo.

No incluye (fuera de alcance v1): pasarelas de pago online, integración en tiempo real con sistemas externos de Obras Sociales/Prepagas.

## Cómo publicarlo en GitHub Pages

1. Creá un repositorio nuevo en GitHub (por ejemplo `turnos-consultorio`).
2. Subí **todo el contenido de esta carpeta** a la raíz del repositorio (asegurate de que `index.html` quede en la raíz, no dentro de una subcarpeta):
   ```bash
   git init
   git add .
   git commit -m "Demo sistema de turnos consultorio"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/turnos-consultorio.git
   git push -u origin main
   ```
3. En GitHub, andá a **Settings → Pages**.
4. En "Build and deployment", elegí **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
5. Guardá. En 1-2 minutos tu sitio va a estar disponible en:
   `https://TU_USUARIO.github.io/turnos-consultorio/`

No requiere ningún paso de build ni instalación de dependencias: es HTML/CSS/JS puro.

## Datos de prueba

| Rol | Acceso |
|---|---|
| Paciente | `juan@mail.com` / `1234` o `maria@mail.com` / `1234` (o registrar uno nuevo) |
| Médico | Se elige el profesional de una lista (sin contraseña, acceso interno simulado) |
| Recepción | Se ingresa un nombre de usuario libre (sin contraseña, acceso interno simulado) |

Los datos de ejemplo (especialidades, profesionales, obras sociales, turnos) se generan automáticamente la primera vez que se abre el sitio. Cada visitante tiene su propia copia de datos guardada en su navegador. Podés reiniciarlos desde el link "Reiniciar datos de la demo" en el pie de página.

## Estructura del proyecto

```
├── index.html          # Landing y selección de rol
├── pacientes.html       # Módulo Pacientes
├── medicos.html         # Módulo Médicos
├── recepcion.html       # Módulo Recepción / Administración
├── css/
│   └── styles.css       # Estilos compartidos
└── js/
    ├── data.js           # Capa de datos simulada (localStorage)
    ├── nav.js             # Header, navegación y footer compartidos
    ├── pacientes.js
    ├── medicos.js
    └── recepcion.js
```

## Notas para el video / entrega

Esta demo cubre visualmente los tres perfiles descritos en el guion (Pacientes, Médicos, Recepción/Administración) y permite mostrar en vivo: registro de un paciente, solicitud y cancelación de un turno, cambio de estado desde el panel médico, y alta de un profesional o sobreturno desde recepción — útil para las capturas de pantalla o grabación de pantalla del video de presentación.

## Próximos pasos sugeridos (fuera de esta demo)

- Reemplazar la capa `localStorage` por un backend real (API + base de datos) y autenticación segura.
- Integrar notificaciones reales por email/WhatsApp.
- Sumar pruebas automatizadas end-to-end y de API como parte del plan de QA.
