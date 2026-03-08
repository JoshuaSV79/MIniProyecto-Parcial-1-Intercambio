// =============================================
// SWAPIFY - Sistema de Intercambio de Regalos
// JavaScript Principal
// Autores: Joshua Veloz, Salvador Olivares
// =============================================

// --- Estado ---
let participantes = [];
let exclusiones = {};
let eventoSeleccionado = '';
let presupuestoSeleccionado = '';

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Swapify cargado correctamente');

  // Navegación principal
  document.getElementById('btnEmpezar').addEventListener('click', () => irA('organizador'));
  document.getElementById('btnIrParticipantes').addEventListener('click', irAParticipantes);
  document.getElementById('btnIrExclusiones').addEventListener('click', irAExclusiones);
  document.getElementById('btnIrDetalles').addEventListener('click', () => {
    guardarExclusiones();
    irA('detalles');
  });
  document.getElementById('btnRealizarSorteo').addEventListener('click', validarYMostrarOpciones);
  document.getElementById('btnVerDatos').addEventListener('click', mostrarDatosEvento);
  document.getElementById('btnSortear').addEventListener('click', ejecutarSorteo);

  // Participantes
  document.getElementById('btnAñadir').addEventListener('click', agregarParticipante);
  document.getElementById('inputNombre').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarParticipante();
  });

  // Evento
  document.querySelectorAll('.btn-evento').forEach(btn => {
    btn.addEventListener('click', () => seleccionarEvento(btn));
  });
  document.getElementById('btnOtroEvento').addEventListener('click', mostrarInputOtro);

  // Presupuesto
  document.querySelectorAll('.btn-pres').forEach(btn => {
    btn.addEventListener('click', () => seleccionarPresupuesto(btn));
  });
  document.getElementById('otroMonto').addEventListener('input', (e) => {
    if (e.target.value) {
      document.querySelectorAll('.btn-pres').forEach(b => {
        b.classList.remove('btn-dark');
        b.classList.add('btn-outline-dark');
      });
      presupuestoSeleccionado = '$' + e.target.value;
    }
  });

  // Drag and Drop
  configurarDragAndDrop();

  // Fechas sugeridas
  generarFechasSugeridas();

  // Cargar datos previos
  cargarDatosGuardados();
});

// =============================================
// NAVEGACIÓN ENTRE SECCIONES
// =============================================

function irA(seccionId) {
  // Ocultar TODAS las secciones con clase oculto
  document.querySelectorAll('.step-card').forEach(s => {
    s.classList.add('oculto');
  });
  // Mostrar la indicada
  const seccion = document.getElementById(seccionId);
  if (seccion) {
    seccion.classList.remove('oculto');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function irAParticipantes() {
  const nombreOrg = document.getElementById('nombreOrg').value.trim();
  if (!nombreOrg) {
    mostrarAlerta('Por favor ingresa el nombre del organizador.', 'warning');
    return;
  }

  localStorage.setItem('organizador', nombreOrg);
  localStorage.setItem('incluirOrganizador', document.getElementById('incluirOrg').checked);

  const incluir = document.getElementById('incluirOrg').checked;
  if (incluir && !participantes.includes(nombreOrg)) {
    participantes.unshift(nombreOrg);
  } else if (!incluir) {
    participantes = participantes.filter(p => p !== nombreOrg);
  }

  guardarParticipantes();
  renderizarListaParticipantes();
  irA('participantes');
}

function irAExclusiones() {
  if (participantes.length < 3) {
    mostrarAlerta('Necesitas al menos 3 participantes para continuar.', 'warning');
    return;
  }
  cargarZonaArrastre();
  cargarListaExclusiones();
  irA('exclusiones');
}

// =============================================
// PARTICIPANTES
// =============================================

function agregarParticipante() {
  const input = document.getElementById('inputNombre');
  const nombre = input.value.trim();

  if (!nombre) {
    mostrarAlerta('Escribe un nombre para agregar.', 'warning');
    return;
  }
  if (participantes.includes(nombre)) {
    mostrarAlerta('Este participante ya existe.', 'warning');
    return;
  }

  participantes.push(nombre);
  guardarParticipantes();
  renderizarListaParticipantes();
  input.value = '';
  input.focus();
}

function eliminarParticipante(nombre) {
  participantes = participantes.filter(p => p !== nombre);
  delete exclusiones[nombre];
  for (let key in exclusiones) {
    exclusiones[key] = exclusiones[key].filter(e => e !== nombre);
  }
  guardarParticipantes();
  guardarExclusiones();
  renderizarListaParticipantes();
}

function renderizarListaParticipantes() {
  const lista = document.getElementById('listaParticipantes');
  lista.innerHTML = '';

  const orgName = localStorage.getItem('organizador');
  const incluido = localStorage.getItem('incluirOrganizador') === 'true';

  participantes.forEach((nombre, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.style.cssText = 'border-radius:10px; margin-bottom:4px; border:1px solid #e2e8f0;';

    let badge = '';
    if (incluido && nombre === orgName) {
      badge = ' <span class="badge bg-primary ms-2" style="font-size:0.7rem;">Organizador</span>';
    }

    li.innerHTML = `
      <span><strong class="text-primary">${index + 1}.</strong> ${nombre}${badge}</span>
      ${(incluido && nombre === orgName) ? '' : `<button class="btn btn-sm btn-outline-danger btn-eliminar" data-nombre="${nombre}" style="border-radius:50%;width:28px;height:28px;padding:0;">&times;</button>`}
    `;
    lista.appendChild(li);
  });

  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => eliminarParticipante(btn.dataset.nombre));
  });

  document.getElementById('contadorPart').textContent = participantes.length + ' participante(s). No hay límite.';
}

// =============================================
// DRAG AND DROP (API HTML5)
// =============================================

function configurarDragAndDrop() {
  const zona = document.getElementById('zonaExclusion');

  zona.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    zona.classList.add('over');
  });

  zona.addEventListener('dragleave', () => {
    zona.classList.remove('over');
  });

  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    zona.classList.remove('over');
    const nombre = e.dataTransfer.getData('text/plain');
    if (nombre) {
      mostrarModalExclusiones(nombre);
    }
  });
}

function cargarZonaArrastre() {
  const contenedor = document.getElementById('listaArrastre');
  contenedor.innerHTML = '';

  participantes.forEach(nombre => {
    const chip = document.createElement('div');
    chip.className = 'chip-draggable';
    chip.textContent = nombre;
    chip.setAttribute('draggable', 'true');

    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', nombre);
      e.dataTransfer.effectAllowed = 'move';
      chip.style.opacity = '0.5';
    });

    chip.addEventListener('dragend', () => {
      chip.style.opacity = '1';
    });

    contenedor.appendChild(chip);
  });
}

function mostrarModalExclusiones(nombre) {
  let modal = document.getElementById('modalExclusiones');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'modalExclusiones';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';

  const excluidos = exclusiones[nombre] || [];
  const otrosParticipantes = participantes.filter(p => p !== nombre);

  let checksHTML = otrosParticipantes.map(p => `
    <div class="form-check" style="padding:8px 12px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px;">
      <input class="form-check-input" type="checkbox" value="${p}" id="excl_${nombre}_${p}" ${excluidos.includes(p) ? 'checked' : ''}>
      <label class="form-check-label" for="excl_${nombre}_${p}" style="cursor:pointer;">${p}</label>
    </div>
  `).join('');

  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:2rem;width:90%;max-width:400px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <h3 style="color:#1e40af;font-size:1.1rem;font-weight:700;margin-bottom:4px;">${nombre} no sortea a:</h3>
      <p style="font-size:0.85rem;color:#6b7280;margin-bottom:12px;">Selecciona con casillas a quién(es) excluir.</p>
      <div id="checkboxesExcl">${checksHTML}</div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button id="btnCancelarExcl" class="btn btn-outline-secondary" style="flex:1;">Cancelar</button>
        <button id="btnGuardarExcl" class="btn btn-primary" style="flex:1;">Hecho</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCancelarExcl').addEventListener('click', () => modal.remove());
  document.getElementById('btnGuardarExcl').addEventListener('click', () => {
    const checks = document.querySelectorAll('#checkboxesExcl input[type="checkbox"]:checked');
    const seleccionados = Array.from(checks).map(c => c.value);
    if (seleccionados.length > 0) {
      exclusiones[nombre] = seleccionados;
    } else {
      delete exclusiones[nombre];
    }
    guardarExclusiones();
    cargarListaExclusiones();
    modal.remove();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function cargarListaExclusiones() {
  const contenedor = document.getElementById('listaExclActuales');
  contenedor.innerHTML = '';

  const keys = Object.keys(exclusiones);
  if (keys.length === 0) {
    contenedor.innerHTML = '<p style="font-size:0.85rem;color:#9ca3af;margin-top:12px;">Aún no hay exclusiones. Arrastra un nombre al buzón.</p>';
    return;
  }

  contenedor.innerHTML = '<h4 style="font-size:0.85rem;font-weight:600;color:#374151;margin-top:12px;margin-bottom:8px;">Exclusiones establecidas:</h4>';

  keys.forEach(persona => {
    const excl = exclusiones[persona];
    if (excl && excl.length > 0) {
      const div = document.createElement('div');
      div.style.cssText = 'background:#fef2f2;padding:8px 12px;border-radius:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;border:1px solid #fecaca;';
      div.innerHTML = `
        <span style="font-size:0.85rem;"><strong>${persona}</strong> no regala a: <span style="color:#dc2626;">${excl.join(', ')}</span></span>
        <button class="btn btn-sm btn-outline-danger btn-quitar-excl" data-nombre="${persona}" style="border-radius:50%;width:24px;height:24px;padding:0;font-size:14px;line-height:1;">&times;</button>
      `;
      contenedor.appendChild(div);
    }
  });

  contenedor.querySelectorAll('.btn-quitar-excl').forEach(btn => {
    btn.addEventListener('click', () => {
      delete exclusiones[btn.dataset.nombre];
      guardarExclusiones();
      cargarListaExclusiones();
    });
  });
}

// =============================================
// TIPO DE EVENTO
// =============================================

function seleccionarEvento(btn) {
  document.querySelectorAll('.btn-evento').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-outline-primary');
  });
  btn.classList.remove('btn-outline-primary');
  btn.classList.add('btn-primary');
  eventoSeleccionado = btn.textContent.trim();
  document.getElementById('nombreEvento').classList.add('oculto');
}

function mostrarInputOtro() {
  const input = document.getElementById('nombreEvento');
  input.classList.remove('oculto');
  input.focus();
  document.querySelectorAll('.btn-evento').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-outline-primary');
  });
  eventoSeleccionado = '';
}

// =============================================
// FECHAS SUGERIDAS
// =============================================

function generarFechasSugeridas() {
  const contenedor = document.getElementById('fechasSugeridas');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  const hoy = new Date();
  const fechasCercanas = [];

  for (let i = 1; fechasCercanas.length < 3 && i < 30; i++) {
    const dia = new Date(hoy.getTime() + i * 86400000);
    const diaSemana = dia.getDay();
    if (diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
      fechasCercanas.push(new Date(dia));
    }
  }

  fechasCercanas.forEach(fecha => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-info btn-sm';
    btn.style.borderRadius = '20px';
    btn.textContent = fecha.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    btn.addEventListener('click', () => {
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      document.getElementById('fechaEvento').value = yyyy + '-' + mm + '-' + dd;
      contenedor.querySelectorAll('button').forEach(b => {
        b.classList.remove('btn-info');
        b.classList.add('btn-outline-info');
      });
      btn.classList.remove('btn-outline-info');
      btn.classList.add('btn-info');
    });
    contenedor.appendChild(btn);
  });
}

// =============================================
// PRESUPUESTO
// =============================================

function seleccionarPresupuesto(btn) {
  document.querySelectorAll('.btn-pres').forEach(b => {
    b.classList.remove('btn-dark');
    b.classList.add('btn-outline-dark');
  });
  btn.classList.remove('btn-outline-dark');
  btn.classList.add('btn-dark');
  presupuestoSeleccionado = btn.textContent.trim();
  document.getElementById('otroMonto').value = '';
}

// =============================================
// LOCALSTORAGE - GUARDAR / RECUPERAR
// =============================================

function guardarParticipantes() {
  localStorage.setItem('participantes', JSON.stringify(participantes));
}

function guardarExclusiones() {
  localStorage.setItem('exclusiones', JSON.stringify(exclusiones));
}

function guardarDatosEvento() {
  const nombreEvento = eventoSeleccionado || document.getElementById('nombreEvento').value.trim();
  const fechaEvento = document.getElementById('fechaEvento').value;
  const otroMonto = document.getElementById('otroMonto').value;
  const presupuesto = presupuestoSeleccionado || (otroMonto ? '$' + otroMonto : '');

  localStorage.setItem('nombreEvento', nombreEvento);
  localStorage.setItem('fechaEvento', fechaEvento);
  localStorage.setItem('presupuesto', presupuesto);
}

function cargarDatosGuardados() {
  const org = localStorage.getItem('organizador');
  const incl = localStorage.getItem('incluirOrganizador');
  const parts = localStorage.getItem('participantes');
  const excls = localStorage.getItem('exclusiones');

  if (org) document.getElementById('nombreOrg').value = org;
  if (incl !== null) document.getElementById('incluirOrg').checked = incl === 'true';
  if (parts) {
    participantes = JSON.parse(parts);
    renderizarListaParticipantes();
  }
  if (excls) {
    exclusiones = JSON.parse(excls);
  }
}

// =============================================
// VALIDAR Y MOSTRAR OPCIONES
// =============================================

function validarYMostrarOpciones() {
  const nombreEvento = eventoSeleccionado || document.getElementById('nombreEvento').value.trim();
  const fechaEvento = document.getElementById('fechaEvento').value;
  const otroMonto = document.getElementById('otroMonto').value;
  const presupuesto = presupuestoSeleccionado || (otroMonto ? '$' + otroMonto : '');

  if (!nombreEvento) {
    mostrarAlerta('Selecciona o escribe el tipo de evento.', 'warning');
    return;
  }
  if (!fechaEvento) {
    mostrarAlerta('Selecciona una fecha para la celebración.', 'warning');
    return;
  }
  if (!presupuesto) {
    mostrarAlerta('Selecciona o escribe un presupuesto.', 'warning');
    return;
  }

  guardarDatosEvento();
  guardarParticipantes();
  guardarExclusiones();

  irA('opciones');
}

// =============================================
// MOSTRAR DATOS DEL EVENTO (desde localStorage)
// =============================================

function mostrarDatosEvento() {
  // LEER TODO DESDE LOCALSTORAGE (NO de memoria RAM - requisito rúbrica)
  const organizador = localStorage.getItem('organizador');
  const nombreEvento = localStorage.getItem('nombreEvento');
  const fechaEvento = localStorage.getItem('fechaEvento');
  const presupuesto = localStorage.getItem('presupuesto');
  const partsJSON = localStorage.getItem('participantes');
  const exclJSON = localStorage.getItem('exclusiones');

  const parts = partsJSON ? JSON.parse(partsJSON) : [];
  const excls = exclJSON ? JSON.parse(exclJSON) : {};

  let fechaFormateada = 'No definida';
  if (fechaEvento) {
    const partes = fechaEvento.split('-');
    fechaFormateada = new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  let exclusionesHTML = '<span style="color:#9ca3af;">Sin exclusiones</span>';
  const keysExcl = Object.keys(excls);
  if (keysExcl.length > 0) {
    exclusionesHTML = keysExcl.map(k =>
      '<strong>' + k + '</strong> no regala a: <span style="color:#dc2626;">' + excls[k].join(', ') + '</span>'
    ).join('<br>');
  }

  let modal = document.getElementById('modalDatos');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'modalDatos';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';

  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:2rem;width:90%;max-width:500px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <h3 style="color:#1e40af;font-size:1.2rem;font-weight:700;text-align:center;margin-bottom:4px;">📋 Datos del Evento</h3>
      <p style="font-size:0.75rem;color:#9ca3af;text-align:center;margin-bottom:16px;">(Información leída desde localStorage)</p>

      <div style="background:#eff6ff;padding:12px;border-radius:10px;margin-bottom:8px;">
        <span style="font-size:0.75rem;color:#6b7280;display:block;">Organizador(a)</span>
        <span style="font-weight:600;">${organizador || 'N/A'}</span>
      </div>
      <div style="background:#eff6ff;padding:12px;border-radius:10px;margin-bottom:8px;">
        <span style="font-size:0.75rem;color:#6b7280;display:block;">Celebración</span>
        <span style="font-weight:600;">${nombreEvento || 'N/A'}</span>
      </div>
      <div style="background:#eff6ff;padding:12px;border-radius:10px;margin-bottom:8px;">
        <span style="font-size:0.75rem;color:#6b7280;display:block;">Fecha</span>
        <span style="font-weight:600;">${fechaFormateada}</span>
      </div>
      <div style="background:#eff6ff;padding:12px;border-radius:10px;margin-bottom:8px;">
        <span style="font-size:0.75rem;color:#6b7280;display:block;">Presupuesto</span>
        <span style="font-weight:600;color:#16a34a;">${presupuesto || 'N/A'}</span>
      </div>
      <div style="background:#eff6ff;padding:12px;border-radius:10px;margin-bottom:8px;">
        <span style="font-size:0.75rem;color:#6b7280;display:block;">Participantes (${parts.length})</span>
        <span style="font-weight:600;">${parts.join(', ') || 'N/A'}</span>
      </div>
      <div style="background:#fef2f2;padding:12px;border-radius:10px;border:1px solid #fecaca;margin-bottom:16px;">
        <span style="font-size:0.75rem;color:#6b7280;display:block;">Exclusiones</span>
        <span style="font-size:0.85rem;">${exclusionesHTML}</span>
      </div>

      <button id="btnCerrarDatos" class="btn btn-primary" style="width:100%;border-radius:12px;">Cerrar</button>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('btnCerrarDatos').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// =============================================
// SORTEO (algoritmo que respeta exclusiones)
// =============================================

function ejecutarSorteo() {
  const partsJSON = localStorage.getItem('participantes');
  const exclJSON = localStorage.getItem('exclusiones');
  const parts = partsJSON ? JSON.parse(partsJSON) : [];
  const excls = exclJSON ? JSON.parse(exclJSON) : {};

  if (parts.length < 2) {
    mostrarAlerta('Se necesitan al menos 2 participantes.', 'danger');
    return;
  }

  let resultados = null;
  for (let i = 0; i < 5000 && !resultados; i++) {
    resultados = intentarSorteo(parts, excls);
  }

  if (!resultados) {
    mostrarAlerta('No se pudo realizar el sorteo con estas exclusiones. Revisa que sea posible.', 'danger');
    return;
  }

  localStorage.setItem('resultadosSorteo', JSON.stringify(resultados));
  mostrarResultadosSorteo(resultados);
}

function intentarSorteo(listaParticipantes, listaExclusiones) {
  const receptores = [...listaParticipantes];

  // Fisher-Yates shuffle
  for (let i = receptores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [receptores[i], receptores[j]] = [receptores[j], receptores[i]];
  }

  for (let i = 0; i < listaParticipantes.length; i++) {
    const dador = listaParticipantes[i];
    const receptor = receptores[i];
    if (dador === receptor) return null;
    if (listaExclusiones[dador] && listaExclusiones[dador].includes(receptor)) return null;
  }

  const resultado = {};
  for (let i = 0; i < listaParticipantes.length; i++) {
    resultado[listaParticipantes[i]] = receptores[i];
  }
  return resultado;
}

// =============================================
// RESULTADOS CON DISEÑO ORIGINAL
// =============================================

function mostrarResultadosSorteo(resultados) {
  irA('resultados');

  const organizador = localStorage.getItem('organizador');
  const nombreEvento = localStorage.getItem('nombreEvento');
  const fechaEvento = localStorage.getItem('fechaEvento');
  const presupuesto = localStorage.getItem('presupuesto');

  let fechaFormateada = '';
  if (fechaEvento) {
    const partes = fechaEvento.split('-');
    fechaFormateada = new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  document.getElementById('resumenEvento').innerHTML = `
    <div style="text-align:center;">
      <p style="font-size:1.1rem;font-weight:700;color:#1d4ed8;margin-bottom:4px;">${nombreEvento || 'Intercambio'}</p>
      <p style="font-size:0.85rem;color:#4b5563;">Organizado por <strong>${organizador}</strong></p>
      <p style="font-size:0.85rem;color:#6b7280;">${fechaFormateada} &nbsp;|&nbsp; Presupuesto: <strong style="color:#16a34a;">${presupuesto}</strong></p>
    </div>
  `;

  const lista = document.getElementById('listaSorteo');
  lista.innerHTML = '';

  const entries = Object.entries(resultados);
  const colores = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

  entries.forEach(([dador, receptor], index) => {
    const color = colores[index % colores.length];
    const card = document.createElement('div');
    card.className = 'resultado-card';
    card.style.cssText = 'background:white;border-radius:16px;padding:1rem 1.2rem;border:2px solid #e2e8f0;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.4s ease;opacity:0;transform:translateY(20px);';

    card.innerHTML = `
      <div style="width:44px;height:44px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.1rem;flex-shrink:0;">
        ${dador.charAt(0).toUpperCase()}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600;color:#1e293b;">${dador}</div>
        <div class="regalo-oculto" style="font-size:0.85rem;color:#9ca3af;">Toca para revelar</div>
        <div class="regalo-visible" style="font-size:0.85rem;font-weight:500;color:${color};display:none;">
          🎁 Le regala a <strong>${receptor}</strong>
        </div>
      </div>
      <div class="regalo-icono" style="font-size:1.5rem;transition:transform 0.3s;">🎁</div>
    `;

    card.addEventListener('click', () => {
      const oculto = card.querySelector('.regalo-oculto');
      const visible = card.querySelector('.regalo-visible');
      const icono = card.querySelector('.regalo-icono');
      if (visible.style.display === 'none') {
        oculto.style.display = 'none';
        visible.style.display = 'block';
        card.style.borderColor = color;
        card.style.boxShadow = '0 4px 15px ' + color + '30';
        icono.style.transform = 'scale(1.3) rotate(15deg)';
        icono.textContent = '🎉';
      } else {
        visible.style.display = 'none';
        oculto.style.display = 'block';
        card.style.borderColor = '#e2e8f0';
        card.style.boxShadow = 'none';
        icono.style.transform = 'scale(1) rotate(0deg)';
        icono.textContent = '🎁';
      }
    });

    lista.appendChild(card);
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 150 * index);
  });

  // Botón revelar todos
  const btnAll = document.createElement('button');
  btnAll.className = 'btn btn-outline-primary mt-3';
  btnAll.style.cssText = 'width:100%;border-radius:12px;';
  btnAll.textContent = '👀 Revelar todos';
  btnAll.addEventListener('click', () => {
    lista.querySelectorAll('.resultado-card').forEach(card => {
      card.querySelector('.regalo-oculto').style.display = 'none';
      card.querySelector('.regalo-visible').style.display = 'block';
      card.querySelector('.regalo-icono').textContent = '🎉';
    });
  });
  lista.appendChild(btnAll);

  // Botón nuevo sorteo
  const btnNuevo = document.createElement('button');
  btnNuevo.className = 'btn btn-outline-secondary mt-2';
  btnNuevo.style.cssText = 'width:100%;border-radius:12px;';
  btnNuevo.textContent = '🔄 Nuevo Sorteo';
  btnNuevo.addEventListener('click', ejecutarSorteo);
  lista.appendChild(btnNuevo);

  // Botón ver datos
  const btnDatos = document.createElement('button');
  btnDatos.className = 'btn btn-outline-info mt-2';
  btnDatos.style.cssText = 'width:100%;border-radius:12px;';
  btnDatos.textContent = '📋 Ver datos del evento';
  btnDatos.addEventListener('click', mostrarDatosEvento);
  lista.appendChild(btnDatos);
}

// =============================================
// ALERTAS
// =============================================

function mostrarAlerta(mensaje, tipo) {
  let alerta = document.getElementById('alertaFlotante');
  if (alerta) alerta.remove();

  alerta = document.createElement('div');
  alerta.id = 'alertaFlotante';
  alerta.className = 'alert alert-' + tipo;
  alerta.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;min-width:300px;max-width:90%;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.15);font-weight:500;text-align:center;';
  alerta.textContent = mensaje;
  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.transition = 'opacity 0.5s';
    alerta.style.opacity = '0';
    setTimeout(() => alerta.remove(), 500);
  }, 3000);
}
