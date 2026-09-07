/* Módulo Médicos */

let medicosView = { modo: "dia", fecha: null };

function initMedicos() {
  const session = getSession();
  if (!session || session.rol !== "medico") {
    renderLoginMedico();
  } else {
    medicosView.fecha = medicosView.fecha || todayISO(0);
    renderPanelMedico();
  }
}

function renderLoginMedico(mensaje) {
  const db = loadDB();
  const el = document.getElementById("mainContainer");
  el.innerHTML = `
    <h1 class="page-title">Acceso Profesionales</h1>
    <p class="page-subtitle">Seleccioná tu perfil para ver tu agenda (acceso simulado para la demo).</p>
    ${mensaje ? `<div class="alert alert-error">${mensaje}</div>` : ""}
    <div class="card">
      <label>Profesional</label>
      <select id="selectProfesional">
        ${db.profesionales
          .filter((p) => p.activo)
          .map((p) => `<option value="${p.id}">${p.nombre} — ${nombreEspecialidad(db, p.especialidadId)}</option>`)
          .join("")}
      </select>
      <div class="actions-row">
        <button class="btn" onclick="loginMedico()">Ingresar a mi agenda</button>
      </div>
    </div>
  `;
}

function loginMedico() {
  const id = document.getElementById("selectProfesional").value;
  const db = loadDB();
  const prof = db.profesionales.find((p) => p.id === id);
  if (!prof) return;
  setSession({ rol: "medico", id: prof.id, nombre: prof.nombre });
  window.location.reload();
}

function renderPanelMedico(alerta) {
  const session = getSession();
  const db = loadDB();
  const prof = db.profesionales.find((p) => p.id === session.id);

  const fechasSemana = [0, 1, 2, 3, 4, 5, 6].map((d) => todayISO(d));
  const fechasAgenda = medicosView.modo === "dia" ? [medicosView.fecha] : fechasSemana;

  const turnos = db.turnos
    .filter((t) => t.profesionalId === prof.id && fechasAgenda.includes(t.fecha) && t.pacienteId)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const el = document.getElementById("mainContainer");
  el.innerHTML = `
    <h1 class="page-title">Agenda de ${prof.nombre}</h1>
    <p class="page-subtitle">${nombreEspecialidad(db, prof.especialidadId)} · Horario habitual ${prof.horario.inicio} a ${prof.horario.fin} hs</p>
    ${alerta ? `<div class="alert alert-${alerta.tipo}">${alerta.msg}</div>` : ""}

    <div class="card">
      <div class="flex-between">
        <div class="pill-group" style="margin:0">
          <span class="pill ${medicosView.modo === "dia" ? "active" : ""}" onclick="cambiarModo('dia')">Vista diaria</span>
          <span class="pill ${medicosView.modo === "semana" ? "active" : ""}" onclick="cambiarModo('semana')">Vista semanal</span>
        </div>
        ${
          medicosView.modo === "dia"
            ? `<select onchange="cambiarFechaMedico(this.value)" style="width:auto">
                ${fechasSemana.map((f) => `<option value="${f}" ${f === medicosView.fecha ? "selected" : ""}>${formatFecha(f)}</option>`).join("")}
              </select>`
            : ""
        }
      </div>

      <div class="table-wrap" style="margin-top:1rem">
        ${
          turnos.length === 0
            ? `<div class="empty-state">No hay turnos con pacientes asignados en este rango.</div>`
            : `<table>
                <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Estado</th><th>Nota</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${turnos
                    .map(
                      (t) => `
                    <tr>
                      <td>${formatFecha(t.fecha)}</td>
                      <td>${t.hora}${t.sobreturno ? ' <span class="tag">sobreturno</span>' : ""}</td>
                      <td>${nombrePaciente(db, t.pacienteId)}</td>
                      <td><span class="${estadoBadgeClass(t.estado)}">${t.estado}</span></td>
                      <td style="max-width:220px">
                        <input type="text" value="${(t.notas || "").replace(/"/g, "&quot;")}" placeholder="Agregar nota..." onchange="guardarNota('${t.id}', this.value)" />
                      </td>
                      <td>
                        <select onchange="cambiarEstado('${t.id}', this.value)" style="width:auto">
                          ${["confirmado", "atendido", "ausente", "cancelado"]
                            .map((e) => `<option value="${e}" ${t.estado === e ? "selected" : ""}>${e}</option>`)
                            .join("")}
                        </select>
                      </td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
        }
      </div>
    </div>
  `;
}

function cambiarModo(modo) {
  medicosView.modo = modo;
  renderPanelMedico();
}
function cambiarFechaMedico(fecha) {
  medicosView.fecha = fecha;
  renderPanelMedico();
}

function cambiarEstado(turnoId, estado) {
  const db = loadDB();
  const turno = db.turnos.find((t) => t.id === turnoId);
  if (!turno) return;
  turno.estado = estado;
  if (estado === "cancelado") {
    turno.pacienteId = null;
    turno.estado = "libre";
  }
  saveDB(db);
  renderPanelMedico({ tipo: "success", msg: "Estado del turno actualizado." });
}

function guardarNota(turnoId, nota) {
  const db = loadDB();
  const turno = db.turnos.find((t) => t.id === turnoId);
  if (!turno) return;
  turno.notas = nota;
  saveDB(db);
}
