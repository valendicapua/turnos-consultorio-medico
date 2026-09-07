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
    { id: "prof_1", nombre: "Dra. Laura Gómez", especialidadId: "esp_clin", obrasSociales: ["os_part", "os_osde", "os_swiss"], activo: true, horario: { inicio: "08:00", fin: "13:00" } },
    { id: "prof_2", nombre: "Dr. Martín Pereyra", especialidadId: "esp_pedi", obrasSociales: ["os_part", "os_osde", "os_ioma"], activo: true, horario: { inicio: "09:00", fin: "14:00" } },
    { id: "prof_3", nombre: "Dra. Sofía Ramírez", especialidadId: "esp_card", obrasSociales: ["os_part", "os_swiss", "os_pami"], activo: true, horario: { inicio: "14:00", fin: "18:00" } },
    { id: "prof_4", nombre: "Dr. Iván Torres", especialidadId: "esp_derm", obrasSociales: ["os_part", "os_osde"], activo: true, horario: { inicio: "10:00", fin: "15:00" } },
    { id: "prof_5", nombre: "Dra. Camila Suárez", especialidadId: "esp_gine", obrasSociales: ["os_part", "os_swiss", "os_ioma", "os_pami"], activo: true, horario: { inicio: "08:30", fin: "12:30" } },
  ];

  const pacientes = [
    { id: "pac_1", nombre: "Juan Alvarez", email: "juan@mail.com", password: "1234", obraSocialId: "os_osde", telefono: "11-5555-0001" },
    { id: "pac_2", nombre: "María Fernández", email: "maria@mail.com", password: "1234", obraSocialId: "os_part", telefono: "11-5555-0002" },
  ];

  // Genera turnos de ejemplo para los próximos días
  const turnos = [];
  const horas = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  let count = 0;
  profesionales.forEach((prof, i) => {
    for (let d = 0; d < 3; d++) {
      const fecha = todayISO(d);
      horas.forEach((hora, hIdx) => {
        // deja algunos horarios libres para poder reservar en la demo
        if ((hIdx + d + i) % 3 === 0) {
          count++;
          turnos.push({
            id: uid("turno"),
            pacienteId: count % 4 === 0 ? "pac_1" : count % 4 === 1 ? "pac_2" : null,
            profesionalId: prof.id,
            especialidadId: prof.especialidadId,
            fecha,
            hora,
            estado: count % 4 === 0 ? "confirmado" : count % 4 === 1 ? "atendido" : "libre",
            sobreturno: false,
            notas: count % 4 === 1 ? "Control de rutina. Sin novedades." : "",
            creado: new Date().toISOString(),
          });
        }
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
    return JSON.parse(raw);
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
