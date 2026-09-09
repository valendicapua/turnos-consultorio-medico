/* Módulo Pacientes */

let wizardState = {
  step: 1,
  especialidadId: null,
  profesionalId: null,
  fecha: null,
  turnoId: null,
};

function initPacientes() {
  const session = getSession();
  if (!session || session.rol !== "paciente") {
    renderLoginPaciente();
  } else {
    renderDashboardPaciente();
  }
}

/* ---------------- LOGIN / REGISTRO ---------------- */

function renderLoginPaciente(mensaje) {
  const el = document.getElementById("mainContainer");
  el.innerHTML = `
    <h1 class="page-title">Acceso Pacientes</h1>
    <p class="page-subtitle">Iniciá sesión o registrate para solicitar y gestionar tus turnos.</p>
    ${mensaje ? `<div class="alert alert-error">${mensaje}</div>` : ""}
    <div class="grid-2">
      <div class="card">
        <h3>Iniciar sesión</h3>
        <label>Email</label>
        <input type="email" id="loginEmail" placeholder="tu@mail.com" />
        <label>Contraseña</label>
        <input type="password" id="loginPass" placeholder="••••" />
        <div class="actions-row">
          <button class="btn" onclick="loginPaciente()">Ingresar</button>
        </div>
        <p style="font-size:.8rem;color:var(--gris-texto);margin-top:1rem">Prueba: juan@mail.com / 1234</p>
      </div>
      <div class="card">
        <h3>Registrarme</h3>
        <label>Nombre completo</label>
        <input type="text" id="regNombre" placeholder="Nombre y apellido" />
        <label>Email</label>
        <input type="email" id="regEmail" placeholder="tu@mail.com" />
        <label>Contraseña</label>
        <input type="password" id="regPass" placeholder="Elegí una contraseña" />
        <label>Obra social</label>
        <select id="regObraSocial"></select>
        <label>Teléfono (opcional)</label>
        <input type="text" id="regTelefono" placeholder="11-xxxx-xxxx" />
        <div class="actions-row">
          <button class="btn secondary" onclick="registrarPaciente()">Crear cuenta</button>
        </div>
      </div>
    </div>
  `;

  const db = loadDB();
  const select = document.getElementById("regObraSocial");
  select.innerHTML = db.obrasSociales
    .map((o) => `<option value="${o.id}">${o.nombre}</option>`)
    .join("");
}

function loginPaciente() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value;
  const db = loadDB();
  const paciente = db.pacientes.find(
    (p) => p.email.toLowerCase() === email && p.password === pass
  );
  if (!paciente) {
    renderLoginPaciente("Email o contraseña incorrectos. Verificá los datos de prueba o registrate.");
    return;
  }
  setSession({ rol: "paciente", id: paciente.id, nombre: paciente.nombre });
  window.location.reload();
}

function registrarPaciente() {
  const nombre = document.getElementById("regNombre").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const pass = document.getElementById("regPass").value;
  const obraSocialId = document.getElementById("regObraSocial").value;
  const telefono = document.getElementById("regTelefono").value.trim();

  if (!nombre || !email || !pass) {
    renderLoginPaciente("Completá nombre, email y contraseña para registrarte.");
    return;
  }

  const db = loadDB();
  if (db.pacientes.some((p) => p.email.toLowerCase() === email)) {
    renderLoginPaciente("Ya existe una cuenta registrada con ese email.");
    return;
  }

  const nuevo = { id: uid("pac"), nombre, email, password: pass, obraSocialId, telefono };
  db.pacientes.push(nuevo);
  saveDB(db);
  setSession({ rol: "paciente", id: nuevo.id, nombre: nuevo.nombre });
  window.location.reload();
}

/* ---------------- DASHBOARD ---------------- */

function renderDashboardPaciente(alerta) {
  const session = getSession();
  const db = loadDB();
  const paciente = db.pacientes.find((p) => p.id === session.id);
  const misTurnos = db.turnos
    .filter((t) => t.pacienteId === session.id)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const el = document.getElementById("mainContainer");
  el.innerHTML = `
    <h1 class="page-title">Hola, ${paciente.nombre.split(" ")[0]} 👋</h1>
    <p class="page-subtitle">Obra social: ${nombreObraSocial(db, paciente.obraSocialId)}</p>
    ${alerta ? `<div class="alert alert-${alerta.tipo}">${alerta.msg}</div>` : ""}

    <div class="card">
      <div class="flex-between">
        <h3 style="margin:0">Mis turnos</h3>
        <button class="btn" onclick="abrirWizard()">+ Solicitar turno</button>
      </div>
      <div class="table-wrap">
        ${
          misTurnos.length === 0
            ? `<div class="empty-state">Todavía no tenés turnos solicitados.</div>`
            : `<table class="responsive-table">
                <thead><tr><th>Fecha</th><th>Hora</th><th>Especialidad</th><th>Profesional</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  ${misTurnos
                    .map(
                      (t) => `
                    <tr>
                      <td data-label="Fecha">${formatFecha(t.fecha)}</td>
                      <td data-label="Hora">${t.hora}</td>
                      <td data-label="Especialidad">${nombreEspecialidad(db, t.especialidadId)}</td>
                      <td data-label="Profesional">${nombreProfesional(db, t.profesionalId)}</td>
                      <td data-label="Estado"><span class="${estadoBadgeClass(t.estado)}">${t.estado}</span></td>
                      <td>${
                        ["confirmado", "pendiente"].includes(t.estado)
                          ? `<button class="btn danger small" onclick="cancelarTurno('${t.id}')">Cancelar</button>`
                          : ""
                      }</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
        }
      </div>
    </div>

    <div id="wizardCard"></div>
  `;
}

function cancelarTurno(turnoId) {
  if (!confirm("¿Confirmás que querés cancelar este turno?")) return;
  const db = loadDB();
  const turno = db.turnos.find((t) => t.id === turnoId);
  if (turno) {
    const pacienteId = turno.pacienteId;
    const pacienteNombre = nombrePaciente(db, pacienteId);
    const prof = db.profesionales.find((p) => p.id === turno.profesionalId);
    turno.estado = "libre";
    turno.pacienteId = null;
    simularEnvioNotificacion(db, {
      pacienteId,
      mensaje: `Turno del ${formatFecha(turno.fecha)} ${turno.hora} cancelado correctamente.`,
      canales: ["email", "whatsapp"],
    });
    const msgInterno = `El turno de ${pacienteNombre} con ${prof ? prof.nombre : "—"} del ${formatFecha(turno.fecha)} ${turno.hora} fue cancelado por el paciente.`;
    notificarInterno(db, { destino: "medico", profesionalId: turno.profesionalId, tipo: "cancelacion", mensaje: msgInterno });
    notificarInterno(db, { destino: "recepcion", tipo: "cancelacion", mensaje: msgInterno });
    saveDB(db);
  }
  renderDashboardPaciente({ tipo: "success", msg: "Turno cancelado. El horario vuelve a quedar disponible." });
}

/* ---------------- WIZARD DE RESERVA ---------------- */

function abrirWizard() {
  wizardState = { step: 1, especialidadId: null, profesionalId: null, fecha: null, turnoId: null };
  renderWizard();
  document.getElementById("wizardCard").scrollIntoView({ behavior: "smooth" });
}

function wizardStepsHtml() {
  const labels = ["Especialidad", "Profesional", "Fecha y horario", "Confirmar"];
  return `<div class="wizard-steps">${labels
    .map((l, i) => {
      const n = i + 1;
      const cls = n < wizardState.step ? "done" : n === wizardState.step ? "active" : "";
      return `<span class="${cls}">${n}. ${l}</span>`;
    })
    .join("")}</div>`;
}

function renderWizard() {
  const db = loadDB();
  const card = document.getElementById("wizardCard");

  if (wizardState.step === 1) {
    card.innerHTML = `
      <div class="card">
        <h3>Solicitar turno</h3>
        ${wizardStepsHtml()}
        <p>Elegí la especialidad que necesitás:</p>
        <div class="pill-group">
          ${db.especialidades
            .map((e) => `<span class="pill" onclick="elegirEspecialidad('${e.id}')">${e.nombre}</span>`)
            .join("")}
        </div>
        <div class="actions-row">
          <button class="btn secondary" onclick="cerrarWizard()">Cancelar</button>
        </div>
      </div>`;
  } else if (wizardState.step === 2) {
    const profesionales = db.profesionales.filter(
      (p) => p.especialidadId === wizardState.especialidadId && p.activo
    );
    card.innerHTML = `
      <div class="card">
        <h3>Solicitar turno</h3>
        ${wizardStepsHtml()}
        <p>Especialidad: <strong>${nombreEspecialidad(db, wizardState.especialidadId)}</strong></p>
        <p>Elegí un profesional:</p>
        <div class="grid-2">
          ${
            profesionales.length === 0
              ? `<div class="empty-state">No hay profesionales activos en esta especialidad por el momento.</div>`
              : profesionales
                  .map(
                    (p) => `
              <div class="card" style="cursor:pointer;margin-bottom:0" onclick="elegirProfesional('${p.id}')">
                <strong>${p.nombre}</strong>
                <div class="tag-list">${p.obrasSociales.map((o) => `<span class="tag">${nombreObraSocial(db, o)}</span>`).join("")}</div>
                <p style="font-size:.85rem;color:var(--gris-texto);margin-bottom:0">Atiende ${p.horario.inicio} a ${p.horario.fin} hs</p>
              </div>`
                  )
                  .join("")
          }
        </div>
        <div class="actions-row">
          <button class="btn secondary" onclick="wizardState.step=1; renderWizard()">Volver</button>
          <button class="btn secondary" onclick="cerrarWizard()">Cancelar</button>
        </div>
      </div>`;
  } else if (wizardState.step === 3) {
    const fecha = wizardState.fecha || todayISO(0);
    wizardState.fecha = fecha;
    const turnosDia = db.turnos
      .filter((t) => t.profesionalId === wizardState.profesionalId && t.fecha === fecha)
      .sort((a, b) => a.hora.localeCompare(b.hora));
    const fechasPosibles = [0, 1, 2].map((d) => todayISO(d));

    card.innerHTML = `
      <div class="card">
        <h3>Solicitar turno</h3>
        ${wizardStepsHtml()}
        <p>Profesional: <strong>${nombreProfesional(db, wizardState.profesionalId)}</strong></p>
        <label>Fecha</label>
        <div class="pill-group">
          ${fechasPosibles
            .map(
              (f) =>
                `<span class="pill ${f === fecha ? "active" : ""}" onclick="cambiarFecha('${f}')">${formatFecha(f)}</span>`
            )
            .join("")}
        </div>
        <label>Agenda del día (los horarios en gris ya están reservados)</label>
        <div class="slot-grid">
          ${
            turnosDia.length === 0
              ? `<div class="empty-state" style="grid-column:1/-1">No hay horarios cargados ese día. Probá otra fecha.</div>`
              : turnosDia
                  .map((t) => {
                    const libre = t.estado === "libre";
                    const selected = wizardState.turnoId === t.id;
                    return `<div class="slot ${libre ? "" : "ocupado"} ${selected ? "selected" : ""}" ${
                      libre ? `onclick="elegirHorario('${t.id}')"` : ""
                    } title="${libre ? "Disponible" : "Reservado"}">${t.hora}</div>`;
                  })
                  .join("")
          }
        </div>
        <div class="actions-row">
          <button class="btn secondary" onclick="wizardState.step=2; renderWizard()">Volver</button>
          <button class="btn" ${!wizardState.turnoId ? "disabled" : ""} onclick="wizardState.step=4; renderWizard()">Continuar</button>
          <button class="btn secondary" onclick="cerrarWizard()">Cancelar</button>
        </div>
      </div>`;
  } else if (wizardState.step === 4) {
    const turno = db.turnos.find((t) => t.id === wizardState.turnoId);
    card.innerHTML = `
      <div class="card">
        <h3>Confirmar turno</h3>
        ${wizardStepsHtml()}
        <div class="alert alert-info">
          Especialidad: <strong>${nombreEspecialidad(db, turno.especialidadId)}</strong><br>
          Profesional: <strong>${nombreProfesional(db, turno.profesionalId)}</strong><br>
          Fecha: <strong>${formatFecha(turno.fecha)}</strong> — Hora: <strong>${turno.hora}</strong>
        </div>
        <div class="actions-row">
          <button class="btn secondary" onclick="wizardState.step=3; renderWizard()">Volver</button>
          <button class="btn" onclick="confirmarReserva()">Confirmar turno</button>
          <button class="btn secondary" onclick="cerrarWizard()">Cancelar</button>
        </div>
      </div>`;
  }
}

function elegirEspecialidad(id) {
  wizardState.especialidadId = id;
  wizardState.step = 2;
  renderWizard();
}
function elegirProfesional(id) {
  wizardState.profesionalId = id;
  wizardState.fecha = null;
  wizardState.turnoId = null;
  wizardState.step = 3;
  renderWizard();
}
function cambiarFecha(fecha) {
  wizardState.fecha = fecha;
  wizardState.turnoId = null;
  renderWizard();
}
function elegirHorario(turnoId) {
  wizardState.turnoId = turnoId;
  renderWizard();
}
function cerrarWizard() {
  document.getElementById("wizardCard").innerHTML = "";
}

function confirmarReserva() {
  const session = getSession();
  const db = loadDB();
  const turno = db.turnos.find((t) => t.id === wizardState.turnoId);
  if (!turno || turno.estado !== "libre") {
    renderDashboardPaciente({ tipo: "error", msg: "Ese horario ya no está disponible. Intentá con otro." });
    return;
  }
  turno.estado = "confirmado";
  turno.pacienteId = session.id;
  const { avisos } = simularEnvioNotificacion(db, {
    pacienteId: session.id,
    mensaje: `Turno confirmado para el ${formatFecha(turno.fecha)} a las ${turno.hora}.`,
    canales: ["email", "whatsapp"],
  });
  const prof = db.profesionales.find((p) => p.id === turno.profesionalId);
  notificarInterno(db, {
    destino: "medico",
    profesionalId: turno.profesionalId,
    tipo: "turno_asignado",
    mensaje: `Nuevo turno asignado: ${session.nombre} el ${formatFecha(turno.fecha)} a las ${turno.hora}.`,
  });
  if (agendaCompleta(db, turno.profesionalId, turno.fecha)) {
    const msgLlena = `La agenda de ${prof ? prof.nombre : "—"} para el ${formatFecha(turno.fecha)} está completa.`;
    notificarInterno(db, { destino: "medico", profesionalId: turno.profesionalId, tipo: "agenda_llena", mensaje: msgLlena });
    notificarInterno(db, { destino: "recepcion", tipo: "agenda_llena", mensaje: msgLlena });
  }
  saveDB(db);
  const avisoTxt = avisos.length ? ` (${avisos.join(", ")}, no se pudo enviar por ese medio)` : "";
  renderDashboardPaciente({
    tipo: "success",
    msg: `¡Turno confirmado! Te enviamos un recordatorio (simulado) por email y WhatsApp.${avisoTxt}`,
  });
}
