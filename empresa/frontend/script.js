const API      = '../backend/endpoint.php';
const selector = document.getElementById('tablaSelect');
const empSec   = document.getElementById('empleadosSection');
const pstSec   = document.getElementById('puestosSection');
const empForm  = document.getElementById('empleadosForm');
const pstForm  = document.getElementById('puestosForm');
const empTbody = document.getElementById('tablaEmpleados');
const pstTbody = document.getElementById('tablaPuestos');

// 1) Mostrar sección por defecto al cargar
document.addEventListener('DOMContentLoaded', () => {
  const active = localStorage.getItem('activeTable') || 'empleados';  
  selector.value = active;                                      
  toggleSections(active);
  fetchData(active);
});

// 2) Cambiar sección y guardar en localStorage
selector.addEventListener('change', e => {
  const t = e.target.value;
  localStorage.setItem('activeTable', t);                       
  toggleSections(t);
  fetchData(t);
});

// Helper para mostrar/ocultar secciones
function toggleSections(table) {
  if (table === 'empleados') {
    empSec.style.display = ''; pstSec.style.display = 'none';
  } else {
    empSec.style.display = 'none'; pstSec.style.display = '';
  }
}

// 3) Fetch de datos genérico - Usa el nuevo endpoint con action=read
async function fetchData(table) {
  try {
    const res  = await fetch(`${API}?action=read&table=${table}`);
    const data = await res.json();
    if (table === 'empleados') renderEmpleados(data);
    else renderPuestos(data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// 4) Renderizar Empleados
function renderEmpleados(data) {
  empTbody.innerHTML = data.map(emp => `
    <tr data-id="${emp.ID_Empleado}">
      <td class="text-center fw-bold">${emp.ID_Empleado}</td>
      <td contenteditable="true">${emp.Clave_Empleado}</td>
      <td contenteditable="true">${emp.Nombre}</td>
      <td contenteditable="true">${emp.A_paterno}</td>
      <td contenteditable="true">${emp.A_materno}</td>
      <td class="text-center" contenteditable="true">${emp.ID_Puesto}</td>
      <td class="text-center" contenteditable="true">${emp.Fecha_Ingreso}</td>
      <td class="text-center" contenteditable="true">${emp.Fecha_Baja || '-'}</td>
      <td class="text-center">
        <span class="badge ${getStatusBadgeClass(emp.Estatus)}" contenteditable="true">
          ${emp.Estatus}
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-warning btn-sm me-1" onclick="inlineSave('empleados', ${emp.ID_Empleado})" title="Guardar cambios">
          <i class="fas fa-save"></i>
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem('empleados', ${emp.ID_Empleado})" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Actualizar contador
  updateCounter('empleados', data.length);
  
  const table = document.getElementById('tablaEmpleadosTable');
  table.classList.remove('table-blur-animate');
  void table.offsetWidth;
  table.classList.add('table-blur-animate');
}

// Helper para obtener la clase del badge según el estatus
function getStatusBadgeClass(status) {
  switch(status?.toLowerCase()) {
    case 'activo': return 'bg-success';
    case 'inactivo': return 'bg-secondary';
    case 'suspendido': return 'bg-warning text-dark';
    default: return 'bg-secondary';
  }
}

// 5) Renderizar Puestos
function renderPuestos(data) {
  pstTbody.innerHTML = data.map(pst => `
    <tr data-id="${pst.ID_Puesto}">
      <td class="text-center fw-bold">${pst.ID_Puesto}</td>
      <td contenteditable="true">${pst.Puesto}</td>
      <td class="text-center">
        <button class="btn btn-warning btn-sm me-1" onclick="inlineSave('puestos', ${pst.ID_Puesto})" title="Guardar cambios">
          <i class="fas fa-save"></i>
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem('puestos', ${pst.ID_Puesto})" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Actualizar contador
  updateCounter('puestos', data.length);
  
  const table = document.getElementById('tablaPuestosTable');
  table.classList.remove('table-blur-animate');
  void table.offsetWidth;
  table.classList.add('table-blur-animate');
}

// Helper para actualizar contadores
function updateCounter(table, count) {
  const countElement = document.getElementById(`${table}Count`);
  if (countElement) {
    const text = table === 'empleados' ? 'empleados' : 'puestos';
    countElement.textContent = `${count} ${text}`;
  }
}

// 6) Crear/Actualizar vía formulario usando el endpoint con action create/update
empForm.addEventListener('submit', e =>
  handleForm(e, 'empleados', {
    ID_Empleado:    'ID_Empleado',
    Clave_Empleado: 'Clave_Empleado',
    Nombre:         'Nombre',
    A_paterno:      'A_paterno',
    A_materno:      'A_materno',
    ID_Puesto:      'ID_Puesto',
    Fecha_Ingreso:  'Fecha_Ingreso',
    Fecha_Baja:     'Fecha_Baja',
    Estatus:        'Estatus'
}));

pstForm.addEventListener('submit', e =>
  handleForm(e, 'puestos', {
    ID_Puesto_P: 'ID_Puesto_P',                                  
    Puesto:      'Puesto'
}));

async function handleForm(e, table, fields) {
  e.preventDefault();

  // Construir el payload a partir de los campos del formulario
  const payload = { table };
  for (const key in fields) {
    const input = e.target.elements[fields[key]];
    if (input) payload[key] = input.value;
  }

  // Crear nuevo registro
  const res = await fetch(`${API}?action=create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (json.success && json.data) {
    // Recargar los datos para obtener la secuencia correcta de IDs
    await fetchData(table);
    
    // Mostrar notificación de éxito
    showSuccessNotification('✅ Registro creado exitosamente');
    e.target.reset();
    e.target.classList.remove('was-validated');
  } else {
    showErrorNotification('❌ Error al crear el registro');
  }
}

// 7) Guardado inline de toda la fila para Actualizar Datos
window.inlineSave = async (table, id) => {
  const tbody = table === 'empleados' ? empTbody : pstTbody;
  const tr = tbody.querySelector(`tr[data-id="${id}"]`);
  const tds = tr.querySelectorAll('td');
  const payload = { table };

  if (table === 'empleados') {
    payload.ID_Empleado    = id;
    payload.Clave_Empleado = tds[1].textContent.trim();
    payload.Nombre         = tds[2].textContent.trim();
    payload.A_paterno      = tds[3].textContent.trim();
    payload.A_materno      = tds[4].textContent.trim();
    payload.ID_Puesto      = tds[5].textContent.trim();
    payload.Fecha_Ingreso  = tds[6].textContent.trim();
    payload.Fecha_Baja     = tds[7].textContent.trim() === '-' ? '' : tds[7].textContent.trim();
    // Para el estatus, extraer el texto del badge
    const statusBadge = tds[8].querySelector('.badge');
    payload.Estatus        = statusBadge ? statusBadge.textContent.trim() : tds[8].textContent.trim();
  } else {
    payload.ID_Puesto_P = id;
    payload.Puesto    = tds[1].textContent.trim();
  }

  const res = await fetch(`${API}?action=update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (json.success) {
    // Resaltar la fila editada con estilo Bootstrap
    tr.classList.add('table-success');
    setTimeout(() => tr.classList.remove('table-success'), 1500);
    
    showSuccessNotification('✅ Registro actualizado exitosamente');
  } else {
    showErrorNotification('❌ Error al actualizar el registro');
  }
};

// 8) Eliminar registros
window.deleteItem = async (table, id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.')) return;
  
  const payload = { table };
  if (table === 'empleados') payload.ID_Empleado = id;
  else payload.ID_Puesto = id;

  const res = await fetch(`${API}?action=delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (json.success) {
    // Recargar los datos para mantener la secuencia correcta
    await fetchData(table);
    showSuccessNotification('🗑️ Registro eliminado exitosamente');
  } else {
    showErrorNotification('❌ Error al eliminar el registro');
  }
};

// 9) Sistema de notificaciones modernas
function showSuccessNotification(message) {
  showNotification(message, 'success');
}

function showErrorNotification(message) {
  showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
  // Crear el contenedor de notificaciones si no existe
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  // Crear la notificación
  const notification = document.createElement('div');
  const bgClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
  
  notification.className = `alert ${bgClass} alert-dismissible fade show shadow-lg`;
  notification.style.cssText = `
    border-radius: 12px;
    border: none;
    margin-bottom: 10px;
    animation: slideInRight 0.3s ease-out;
    backdrop-filter: blur(10px);
    font-weight: 500;
  `;
  
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="flex-grow-1">${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(notification);

  // Auto-remover después de 4 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 4000);
}

// 10) Validación de formularios Bootstrap
function initFormValidation() {
  // Validación para formulario de empleados
  const empForm = document.getElementById('empleadosForm');
  if (empForm) {
    empForm.addEventListener('submit', function(event) {
      if (!empForm.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        showErrorNotification('❌ Por favor completa todos los campos requeridos');
      }
      empForm.classList.add('was-validated');
    });
  }

  // Validación para formulario de puestos
  const pstForm = document.getElementById('puestosForm');
  if (pstForm) {
    pstForm.addEventListener('submit', function(event) {
      if (!pstForm.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        showErrorNotification('❌ Por favor completa todos los campos requeridos');
      }
      pstForm.classList.add('was-validated');
    });
  }
}

// 11) Modo claro por defecto y modo oscuro mejorado
document.body.classList.remove('dark-mode');
const themeToggle = document.getElementById('theme-toggle');

function setThemeIcon() {
  const isDark = document.body.classList.contains('dark-mode');
  themeToggle.innerHTML = isDark ? '☀️' : '🌙';
  themeToggle.title = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  setThemeIcon();
}

// Inicializar tema desde localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  setThemeIcon();
}

themeToggle.addEventListener('click', toggleTheme);

// 12) Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFormValidation();
  
  // Añadir estilos de animación para notificaciones
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .alert {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
    }
  `;
  document.head.appendChild(style);
});

// 13) Mejorar experiencia de usuario con tooltips
function initTooltips() {
  // Inicializar tooltips de Bootstrap si están disponibles
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

// Llamar a initTooltips después de que se cargue Bootstrap
setTimeout(initTooltips, 100);
