/* ============================================================
   Sistema Web de Gestión de Turnos - Consultorio Médico
   Capa de datos simulada (localStorage). No requiere backend,
   pensada para funcionar 100% en GitHub Pages.
   ============================================================ */

const DB_KEY = "turnos_consultorio_db_v1";

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

// Genera la grilla de horarios (ej: 09:00, 09:30, ...) entre inicio y fin.
function generarHorasSlots(inicio, fin, pasoMin = 30) {
  const horas = [];
  let [h, m] = inicio.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  while (h < hf || (h === hf && m < mf)) {
    horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += pasoMin;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return horas;
}

function seedData() {
  const especialidades = [
    { id: "esp_clin", nombre: "Clínica Médica" },
    { id: "esp_pedi", nombre: "Pediatría" },
    { id: "esp_card", nombre: "Cardiología" },
    { id: "esp_derm", nombre: "Dermatología" },
    { id: "esp_gine", nombre: "Ginecología" },
  ];

  const obrasSociales = [
    { id: "os_part", nombre: "Particular" },
    { id: "os_osde", nombre: "OSDE" },
    { id: "os_swiss", nombre: "Swiss Medical" },
    { id: "os_ioma", nombre: "IOMA" },
    { id: "os_pami", nombre: "PAMI" },
  ];

  const profesionales = [
    { id: "prof_1", nombre: "Dra. Laura Gómez", especialidadId: "esp_clin", obrasSociales: ["os_part", "os_osde", "os_swiss"], activo: true, horario: { inicio: "09:00", fin: "18:00" } },
    { id: "prof_2", nombre: "Dr. Martín Pereyra", especialidadId: "esp_pedi", obrasSociales: ["os_part", "os_osde", "os_ioma"], activo: true, horario: { inicio: "09:00", fin: "18:00" } },
    { id: "prof_3", nombre: "Dra. Sofía Ramírez", especialidadId: "esp_card", obrasSociales: ["os_part", "os_swiss", "os_pami"], activo: true, horario: { inicio: "09:00", fin: "18:00" } },
    { id: "prof_4", nombre: "Dr. Iván Torres", especialidadId: "esp_derm", obrasSociales: ["os_part", "os_osde"], activo: true, horario: { inicio: "09:00", fin: "18:00" } },
    { id: "prof_5", nombre: "Dra. Camila Suárez", especialidadId: "esp_gine", obrasSociales: ["os_part", "os_swiss", "os_ioma", "os_pami"], activo: true, horario: { inicio: "09:00", fin: "18:00" } },
  ];

  const pacientes = [
    { id: "pac_1", nombre: "Juan Alvarez", email: "juan@mail.com", password: "1234", obraSocialId: "os_osde", telefono: "11-5555-0001" },
    { id: "pac_2", nombre: "María Fernández", email: "maria@mail.com", password: "1234", obraSocialId: "os_part", telefono: "11-5555-0002" },
  ];

  // Genera turnos de ejemplo para los próximos días, cubriendo todo
  // el horario habitual de cada profesional (grilla completa, cada 30 min).
  const turnos = [];
  let count = 0;
  profesionales.forEach((prof, i) => {
    const horas = generarHorasSlots(prof.horario.inicio, prof.horario.fin);
    for (let d = 0; d < 3; d++) {
      const fecha = todayISO(d);
      horas.forEach((hora, hIdx) => {
        count++;
        // deja aprox 2 de cada 3 turnos libres para poder reservar en la demo
        const ocupado = (hIdx + d + i) % 3 === 0;
        turnos.push({
          id: uid("turno"),
          pacienteId: ocupado ? (count % 2 === 0 ? "pac_1" : "pac_2") : null,
          profesionalId: prof.id,
          especialidadId: prof.especialidadId,
          fecha,
          hora,
          estado: ocupado ? (count % 2 === 0 ? "confirmado" : "atendido") : "libre",
          sobreturno: false,
          notas: ocupado && count % 2 !== 0 ? "Control de rutina. Sin novedades." : "",
          creado: new Date().toISOString(),
        });
      });
    }
  });

  return {
    especialidades,
    obrasSociales,
    profesionales,
    pacientes,
    turnos,
    notificaciones: [],
    notificacionesInternas: [],
  };
}

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const fresh = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    // Compatibilidad con datos guardados antes de agregar notificaciones internas
    if (!parsed.notificacionesInternas) parsed.notificacionesInternas = [];
    return parsed;
  } catch (e) {
    const fresh = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDB() {
  localStorage.removeItem(DB_KEY);
  return loadDB();
}

// Helpers de sesión (simulan login, sin backend)
const SESSION_KEY = "turnos_consultorio_session_v1";
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch (e) {
    return null;
  }
}
function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function nombreEspecialidad(db, id) {
  const e = db.especialidades.find((x) => x.id === id);
  return e ? e.nombre : "—";
}
function nombreProfesional(db, id) {
  const p = db.profesionales.find((x) => x.id === id);
  return p ? p.nombre : "—";
}
function nombrePaciente(db, id) {
  const p = db.pacientes.find((x) => x.id === id);
  return p ? p.nombre : "—";
}
function nombreObraSocial(db, id) {
  const o = db.obrasSociales.find((x) => x.id === id);
  return o ? o.nombre : "—";
}

function formatFecha(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function estadoBadgeClass(estado) {
  return (
    {
      libre: "badge badge-libre",
      pendiente: "badge badge-pendiente",
      confirmado: "badge badge-confirmado",
      atendido: "badge badge-atendido",
      ausente: "badge badge-ausente",
      cancelado: "badge badge-cancelado",
    }[estado] || "badge"
  );
}

/* ---------------- Notificaciones (simuladas) ----------------
   Simula el envío de una notificación al paciente, por email y/o
   WhatsApp, usando los datos de contacto con los que se registró.
   No envía nada real: solo deja constancia en el historial. */

function simularEnvioNotificacion(db, { pacienteId, mensaje, canales, etiqueta }) {
  const paciente = pacienteId ? db.pacientes.find((p) => p.id === pacienteId) : null;
  const contacto = {};
  const canalesEfectivos = [];
  const avisos = [];

  if (canales.includes("email")) {
    if (paciente && paciente.email) {
      contacto.email = paciente.email;
      canalesEfectivos.push("email");
    } else if (paciente) {
      avisos.push("no tiene email registrado");
    }
  }
  if (canales.includes("whatsapp")) {
    if (paciente && paciente.telefono) {
      contacto.telefono = paciente.telefono;
      canalesEfectivos.push("whatsapp");
    } else if (paciente) {
      avisos.push("no tiene teléfono registrado");
    }
  }

  const notif = {
    id: uid("notif"),
    pacienteId: pacienteId || null,
    etiqueta: etiqueta || (paciente ? paciente.nombre : "Todos"),
    canal: canalesEfectivos,
    contacto,
    mensaje,
    fecha: new Date().toISOString(),
  };
  db.notificaciones.push(notif);
  return { notif, avisos };
}

function canalBadgeHtml(canal) {
  return canal === "email"
    ? '<span class="tag">📧 Email</span>'
    : canal === "whatsapp"
    ? '<span class="tag">💬 WhatsApp</span>'
    : `<span class="tag">${canal}</span>`;
}

/* ---------------- Notificaciones internas ----------------
   Avisos entre módulos (médico / recepción) cuando pasa algo
   relevante con la agenda: turno cancelado, turno asignado,
   o agenda de un profesional completa. Se guardan en el mismo
   localStorage simulado, no se envían por email/WhatsApp. */

function notificarInterno(db, { destino, profesionalId, tipo, mensaje }) {
  db.notificacionesInternas = db.notificacionesInternas || [];
  const notif = {
    id: uid("intnotif"),
    destino, // "medico" | "recepcion"
    profesionalId: profesionalId || null,
    tipo, // "cancelacion" | "turno_asignado" | "agenda_llena"
    mensaje,
    leida: false,
    fecha: new Date().toISOString(),
  };
  db.notificacionesInternas.push(notif);
  return notif;
}

function agendaCompleta(db, profesionalId, fecha) {
  const turnosDia = db.turnos.filter((t) => t.profesionalId === profesionalId && t.fecha === fecha);
  return turnosDia.length > 0 && turnosDia.every((t) => t.estado !== "libre");
}

function tipoNotifInternaLabel(tipo) {
  return (
    {
      cancelacion: "Cancelación",
      turno_asignado: "Turno asignado",
      agenda_llena: "Agenda completa",
    }[tipo] || tipo
  );
}

function tipoNotifInternaClass(tipo) {
  return (
    {
      cancelacion: "badge badge-cancelado",
      turno_asignado: "badge badge-confirmado",
      agenda_llena: "badge badge-pendiente",
    }[tipo] || "badge"
  );
}
