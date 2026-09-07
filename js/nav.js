/* Header, navegación y footer compartidos entre páginas */

function renderHeader(activePage) {
  const session = getSession();
  let sessionHtml = "";

  if (session) {
    const label =
      session.rol === "paciente"
        ? `Paciente: ${session.nombre}`
        : session.rol === "medico"
        ? `Dr/a.: ${session.nombre}`
        : "Recepción / Administración";
    sessionHtml = `
      <div class="session-chip">
        <span>${label}</span>
        <button onclick="cerrarSesion()">Salir</button>
      </div>`;
  }

  const links = [
    { href: "index.html", key: "inicio", label: "Inicio" },
    { href: "pacientes.html", key: "pacientes", label: "Pacientes" },
    { href: "medicos.html", key: "medicos", label: "Médicos" },
    { href: "recepcion.html", key: "recepcion", label: "Recepción" },
  ];

  const navHtml = links
    .map(
      (l) =>
        `<a href="${l.href}" class="${l.key === activePage ? "active" : ""}">${l.label}</a>`
    )
    .join("");

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <header class="topbar">
      <div class="brand"><span class="logo">🩺</span> Consultorio Digital</div>
      <nav class="mainnav">${navHtml}</nav>
      ${sessionHtml}
    </header>
  `
  );
}

function renderFooter() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <footer class="sitefooter">
      Sistema Web de Gestión de Turnos para Consultorio Médico — Proyecto académico (Prácticas Profesionales).<br>
      Demo estática sin backend: los datos se guardan localmente en tu navegador (localStorage).
      <div style="margin-top:.4rem"><a href="#" onclick="return reiniciarDemo()">Reiniciar datos de la demo</a></div>
    </footer>
  `
  );
}

function cerrarSesion() {
  clearSession();
  window.location.href = "index.html";
}

function reiniciarDemo() {
  if (confirm("Esto borrará los datos guardados en este navegador y volverá a cargar la demo con datos de ejemplo. ¿Continuar?")) {
    resetDB();
    clearSession();
    window.location.href = "index.html";
  }
  return false;
}

function requireSession(rolEsperado, redirectIfMissing) {
  const s = getSession();
  if (!s || s.rol !== rolEsperado) {
    window.location.href = redirectIfMissing;
    return null;
  }
  return s;
}
