/* Módulo Recepción / Administración */

let recepcionTab = "agenda";

function initRecepcion() {
  const session = getSession();
  if (!session || session.rol !== "recepcion") {
    renderLoginRecepcion();
  } else {
    renderPanelRecepcion();
  }
}

function renderLoginRecepcion() {
  const el = document.getElementById("mainContainer");
  el.innerHTML = `
    <h1 class="page-title">Acceso Recepción / Administración</h1>
    <p class="page-subtitle">Panel interno para gestionar la agenda global del consultorio.</p>
    <div class="card">
      <label>Nombre de usuario</label>
      <input type="text" id="repNombre" placeholder="Ej: Recepción Turno Mañana" value="Recepción" />
      <div class="actions-row">
        <button class="btn" onclick="loginRecepcion()">Ingresar al panel</button>
      </div>
    </div>
  `;
}

function loginRecepcion() {
  const nombre = document.getElementById("repNombre").value.trim() || "Recepción";
  setSession({ rol: "recepcion", id: "recepcion", nombre });
  window.location.reload();
}

function renderPanelRecepcion(alerta) {
  const el = document.getElementById("mainContainer");
  el.innerHTML = `
    <h1 class="page-title">Panel de Recepción / Administración</h1>
    <p class="page-subtitle">Gestión global de agenda, profesionales, especialidades, obras sociales y notificaciones.</p>
    ${alerta ? `<div class="alert alert-${alerta.tipo}">${alerta.msg}</div>` : ""}
    <div class="two-col-panel">
      <div class="card">
        <ul class="sidebar-list">
          <li class="${recepcionTab === "agenda" ? "active" : ""}" onclick="irTab('agenda')">📅 Agenda global</li>
          <li class="${recepcionTab === "sobreturno" ? "active" : ""}" onclick="irTab('sobreturno')">➕ Agregar sobreturno</li>
          <li class="${recepcionTab === "profesionales" ? "active" : ""}" onclick="irTab('profesionales')">🩺 Profesionales</li>
          <li class="${recepcionTab === "especialidades" ? "active" : ""}" onclick="irTab('especialidades')">🏷️ Especialidades</li>
          <li class="${recepcionTab === "obrassociales" ? "active" : ""}" onclick="irTab('obrassociales')">💳 Obras sociales</li>
          <li class="${recepcionTab === "notificaciones" ? "active" : ""}" onclick="irTab('notificaciones')">🔔 Notificaciones</li>
        </ul>
      </div>
      <div id="tabContent"></div>
    </div>
  `;
  renderTabContent();
}

function irTab(tab) {
  recepcionTab = tab;
  renderPanelRecepcion();
}

function renderTabContent() {
  const container = document.getElementById("tabContent");
  const db = loadDB();

  if (recepcionTab === "agenda") {
    const turnos = [...db.turnos].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    container.innerHTML = `
      <div class="card">
        <div class="flex-between">
          <h3 style="margin:0">Agenda global (próximos 3 días)</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Hora</th><th>Profesional</th><th>Especialidad</th><th>Paciente</th><th>Estado</th></tr></thead>
            <tbody>
              ${turnos
                .map(
                  (t) => `
                <tr>
                  <td>${formatFecha(t.fecha)}</td>
                  <td>${t.hora}${t.sobreturno ? ' <span class="tag">sobreturno</span>' : ""}</td>
                  <td>${nombreProfesional(db, t.profesionalId)}</td>
                  <td>${nombreEspecialidad(db, t.especialidadId)}</td>
                  <td>${t.pacienteId ? nombrePaciente(db, t.pacienteId) : "—"}</td>
                  <td><span class="${estadoBadgeClass(t.estado)}">${t.estado}</span></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  } else if (recepcionTab === "sobreturno") {
    container.innerHTML = `
      <div class="card">
        <h3>Agregar sobreturno</h3>
        <p style="color:var(--gris-texto)">Creá un horario extra fuera de la grilla habitual para atender una urgencia. Se generará como turno libre, disponible para asignar a un paciente.</p>
        <label>Profesional</label>
        <select id="stProfesional">
          ${db.profesionales.filter((p) => p.activo).map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("")}
        </select>
        <label>Fecha</label>
        <input type="date" id="stFecha" value="${todayISO(0)}" />
        <label>Hora</label>
        <input type="time" id="stHora" value="13:00" />
        <label>Paciente (opcional, asignar directamente)</label>
        <select id="stPaciente">
          <option value="">— Dejar libre —</option>
          ${db.pacientes.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("")}
        </select>
        <div class="actions-row">
          <button class="btn" onclick="crearSobreturno()">Crear sobreturno</button>
        </div>
      </div>`;
  } else if (recepcionTab === "profesionales") {
    container.innerHTML = `
      <div class="card">
        <h3>Alta de profesional</h3>
        <label>Nombre</label>
        <input type="text" id="pfNombre" placeholder="Dr/a. Nombre Apellido" />
        <label>Especialidad</label>
        <select id="pfEspecialidad">
          ${db.especialidades.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join("")}
        </select>
        <label>Obras sociales que atiende</label>
        <div class="pill-group" id="pfObrasSociales">
          ${db.obrasSociales
            .map((o) => `<span class="pill" data-id="${o.id}" onclick="this.classList.toggle('active')">${o.nombre}</span>`)
            .join("")}
        </div>
        <div class="grid-2">
          <div>
            <label>Horario desde</label>
            <input type="time" id="pfDesde" value="09:00" />
          </div>
          <div>
            <label>Horario hasta</label>
            <input type="time" id="pfHasta" value="13:00" />
          </div>
        </div>
        <div class="actions-row">
          <button class="btn" onclick="crearProfesional()">Dar de alta</button>
        </div>
      </div>

      <div class="card">
        <h3>Profesionales registrados</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Especialidad</th><th>Horario</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              ${db.profesionales
                .map(
                  (p) => `
                <tr>
                  <td>${p.nombre}</td>
                  <td>${nombreEspecialidad(db, p.especialidadId)}</td>
                  <td>${p.horario.inicio} - ${p.horario.fin}</td>
                  <td><span class="badge ${p.activo ? "badge-confirmado" : "badge-cancelado"}">${p.activo ? "activo" : "inactivo"}</span></td>
                  <td><button class="btn small ${p.activo ? "danger" : "secondary"}" onclick="toggleProfesional('${p.id}')">${p.activo ? "Dar de baja" : "Reactivar"}</button></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  } else if (recepcionTab === "especialidades") {
    container.innerHTML = `
      <div class="card">
        <h3>Especialidades</h3>
        <div class="tag-list">
          ${db.especialidades
            .map(
              (e) =>
                `<span class="tag">${e.nombre} <a href="#" onclick="return eliminarEspecialidad('${e.id}')" style="color:var(--rojo);margin-left:.3rem">✕</a></span>`
            )
            .join("")}
        </div>
        <label>Nueva especialidad</label>
        <input type="text" id="nuevaEspecialidad" placeholder="Ej: Traumatología" />
        <div class="actions-row">
          <button class="btn" onclick="agregarEspecialidad()">Agregar</button>
        </div>
      </div>`;
  } else if (recepcionTab === "obrassociales") {
    container.innerHTML = `
      <div class="card">
        <h3>Obras sociales / Prepagas</h3>
        <div class="tag-list">
          ${db.obrasSociales
            .map(
              (o) =>
                `<span class="tag">${o.nombre} <a href="#" onclick="return eliminarObraSocial('${o.id}')" style="color:var(--rojo);margin-left:.3rem">✕</a></span>`
            )
            .join("")}
        </div>
        <label>Nueva obra social</label>
        <input type="text" id="nuevaObraSocial" placeholder="Ej: Medifé" />
        <div class="actions-row">
          <button class="btn" onclick="agregarObraSocial()">Agregar</button>
        </div>
      </div>`;
  } else if (recepcionTab === "notificaciones") {
    const notifs = [...db.notificaciones].reverse();
    container.innerHTML = `
      <div class="card">
        <h3>Enviar notificación manual</h3>
        <label>Destinatario</label>
        <select id="notifDestino">
          <option value="paciente">Todos los pacientes con turno próximo</option>
          <option value="profesional">Todos los profesionales</option>
        </select>
        <label>Mensaje</label>
        <textarea id="notifMensaje" rows="2" placeholder="Ej: Recordamos que el consultorio permanecerá cerrado el feriado."></textarea>
        <div class="actions-row">
          <button class="btn" onclick="enviarNotificacion()">Enviar (simulado)</button>
        </div>
      </div>
      <div class="card">
        <h3>Historial de notificaciones</h3>
        ${
          notifs.length === 0
            ? `<div class="empty-state">Todavía no se enviaron notificaciones.</div>`
            : `<div class="table-wrap"><table>
                <thead><tr><th>Fecha</th><th>Destinatario</th><th>Mensaje</th></tr></thead>
                <tbody>
                  ${notifs
                    .map(
                      (n) =>
                        `<tr><td>${new Date(n.fecha).toLocaleString("es-AR")}</td><td>${n.destinatario}</td><td>${n.mensaje}</td></tr>`
                    )
                    .join("")}
                </tbody>
              </table></div>`
        }
      </div>`;
  }
}

function crearSobreturno() {
  const profesionalId = document.getElementById("stProfesional").value;
  const fecha = document.getElementById("stFecha").value;
  const hora = document.getElementById("stHora").value;
  const pacienteId = document.getElementById("stPaciente").value || null;

  if (!fecha || !hora) {
    renderPanelRecepcion({ tipo: "error", msg: "Completá fecha y hora para el sobreturno." });
    return;
  }

  const db = loadDB();
  const prof = db.profesionales.find((p) => p.id === profesionalId);
  db.turnos.push({
    id: uid("turno"),
    pacienteId,
    profesionalId,
    especialidadId: prof.especialidadId,
    fecha,
    hora,
    estado: pacienteId ? "confirmado" : "libre",
    sobreturno: true,
    notas: "",
    creado: new Date().toISOString(),
  });
  if (pacienteId) {
    db.notificaciones.push({
      id: uid("notif"),
      destinatario: "paciente",
      mensaje: `Se te asignó un sobreturno el ${formatFecha(fecha)} a las ${hora}.`,
      fecha: new Date().toISOString(),
    });
  }
  saveDB(db);
  recepcionTab = "agenda";
  renderPanelRecepcion({ tipo: "success", msg: "Sobreturno creado correctamente." });
}

function crearProfesional() {
  const nombre = document.getElementById("pfNombre").value.trim();
  const especialidadId = document.getElementById("pfEspecialidad").value;
  const desde = document.getElementById("pfDesde").value;
  const hasta = document.getElementById("pfHasta").value;
  const obrasSociales = Array.from(document.querySelectorAll("#pfObrasSociales .pill.active")).map(
    (el) => el.dataset.id
  );

  if (!nombre) {
    renderPanelRecepcion({ tipo: "error", msg: "Ingresá el nombre del profesional." });
    return;
  }

  const db = loadDB();
  db.profesionales.push({
    id: uid("prof"),
    nombre,
    especialidadId,
    obrasSociales,
    activo: true,
    horario: { inicio: desde, fin: hasta },
  });
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: `Profesional "${nombre}" dado de alta correctamente.` });
}

function toggleProfesional(id) {
  const db = loadDB();
  const prof = db.profesionales.find((p) => p.id === id);
  if (!prof) return;
  prof.activo = !prof.activo;
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: `Profesional ${prof.activo ? "reactivado" : "dado de baja"}.` });
}

function agregarEspecialidad() {
  const nombre = document.getElementById("nuevaEspecialidad").value.trim();
  if (!nombre) return;
  const db = loadDB();
  db.especialidades.push({ id: uid("esp"), nombre });
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: `Especialidad "${nombre}" agregada.` });
}

function eliminarEspecialidad(id) {
  const db = loadDB();
  db.especialidades = db.especialidades.filter((e) => e.id !== id);
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: "Especialidad eliminada." });
  return false;
}

function agregarObraSocial() {
  const nombre = document.getElementById("nuevaObraSocial").value.trim();
  if (!nombre) return;
  const db = loadDB();
  db.obrasSociales.push({ id: uid("os"), nombre });
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: `Obra social "${nombre}" agregada.` });
}

function eliminarObraSocial(id) {
  const db = loadDB();
  db.obrasSociales = db.obrasSociales.filter((o) => o.id !== id);
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: "Obra social eliminada." });
  return false;
}

function enviarNotificacion() {
  const destino = document.getElementById("notifDestino").value;
  const mensaje = document.getElementById("notifMensaje").value.trim();
  if (!mensaje) {
    renderPanelRecepcion({ tipo: "error", msg: "Escribí un mensaje antes de enviar." });
    return;
  }
  const db = loadDB();
  db.notificaciones.push({
    id: uid("notif"),
    destinatario: destino,
    mensaje,
    fecha: new Date().toISOString(),
  });
  saveDB(db);
  renderPanelRecepcion({ tipo: "success", msg: "Notificación enviada (simulada vía email/mensajería)." });
}
