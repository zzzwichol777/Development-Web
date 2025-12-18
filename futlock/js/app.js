// =====================================================
// FUTLOCK - APLICACIÓN PRINCIPAL CON API ASÍNCRONA
// =====================================================

// Configuración de la API
const API_URL = 'api';

// Variable global para el usuario actual
let currentUser = null;

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const usuarioData = sessionStorage.getItem('usuario');
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(usuarioData);

    // Mostrar información del usuario
    document.getElementById('user-name').textContent = currentUser.nombre;
    document.getElementById('user-role').textContent = currentUser.rol;

    // Configurar navegación
    setupNavigation();

    // Configurar logout
    setupLogout();

    // Cargar datos del dashboard
    await loadDashboard();
});

// =====================================================
// NAVEGACIÓN
// =====================================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();

            // Remover active de todos
            navItems.forEach(nav => nav.classList.remove('active'));

            // Agregar active al seleccionado
            item.classList.add('active');

            // Obtener sección
            const section = item.dataset.section;

            // Ocultar todas las secciones
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

            // Mostrar sección seleccionada
            document.getElementById(`${section}-section`).classList.add('active');

            // Actualizar título
            document.getElementById('page-title').textContent = item.querySelector('span:last-child').textContent;

            // Cargar datos de la sección
            await loadSectionData(section);
        });
    });
}

// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            sessionStorage.removeItem('usuario');
            window.location.href = 'index.html';
        }
    });
}

// =====================================================
// CARGA DE DATOS POR SECCIÓN
// =====================================================

async function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'inventario':
            await loadInventario();
            break;
        case 'clientes':
            await loadClientes();
            break;
        case 'pedidos':
            await loadPedidos();
            break;
        case 'empleados':
            await loadEmpleados();
            break;
        case 'finanzas':
            await loadFinanzas();
            break;
    }
}

// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/dashboard.php`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data.stats;

            // Actualizar estadísticas
            const statCards = document.querySelectorAll('.stat-card .stat-info h3');
            statCards[0].textContent = stats.total_stock;
            statCards[1].textContent = stats.pedidos_mes;
            statCards[2].textContent = stats.clientes_activos;
            statCards[3].textContent = '$' + stats.ventas_mes.toLocaleString('es-MX');

            // Actualizar pedidos recientes
            const pedidosBody = document.getElementById('pedidos-recientes');
            pedidosBody.innerHTML = '';

            data.data.pedidos_recientes.forEach(pedido => {
                const badgeClass = getBadgeClass(pedido.Estado_Pedido);
                pedidosBody.innerHTML += `
                    <tr>
                        <td>#${String(pedido.ID_Pedido).padStart(3, '0')}</td>
                        <td>${pedido.Cliente}</td>
                        <td><span class="badge ${badgeClass}">${pedido.Estado_Pedido}</span></td>
                        <td>$${parseFloat(pedido.Monto_Total).toLocaleString('es-MX')}</td>
                    </tr>
                `;
            });

            // Actualizar alertas de stock
            const stockAlerts = document.querySelector('.stock-alerts');
            stockAlerts.innerHTML = '';

            data.data.productos_alerta.forEach(producto => {
                const stockClass = producto.Stock < 5 ? 'low' : 'medium';
                stockAlerts.innerHTML += `
                    <div class="stock-item">
                        <span>${producto.Nombre}</span>
                        <span class="stock-count ${stockClass}">${producto.Stock} unidades</span>
                    </div>
                `;
            });

            if (data.data.productos_alerta.length === 0) {
                stockAlerts.innerHTML = '<p style="color: var(--success-color);">✓ Todos los productos tienen stock suficiente</p>';
            }
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// =====================================================
// INVENTARIO
// =====================================================

async function loadInventario() {
    try {
        const response = await fetch(`${API_URL}/productos.php`);
        const data = await response.json();

        if (data.success) {
            renderInventarioTable(data.data);
        }
    } catch (error) {
        console.error('Error cargando inventario:', error);
    }
}

function renderInventarioTable(productos) {
    const tbody = document.getElementById('inventario-table');
    tbody.innerHTML = '';

    productos.forEach(producto => {
        tbody.innerHTML += `
            <tr>
                <td>${producto.ID}</td>
                <td>${producto.Nombre}</td>
                <td>${producto.Categoria}</td>
                <td>$${parseFloat(producto.Precio).toLocaleString('es-MX')}</td>
                <td>${producto.Stock}</td>
                <td>
                    <button class="btn-icon edit" onclick="editProducto(${producto.ID}, '${producto.Categoria.toLowerCase()}')">✏️</button>
                    <button class="btn-icon delete" onclick="deleteProducto(${producto.ID}, '${producto.Categoria.toLowerCase()}')">🗑️</button>
                </td>
            </tr>
        `;
    });
}

async function deleteProducto(id, categoria) {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;

    try {
        const response = await fetch(`${API_URL}/productos.php?id=${id}&categoria=${categoria}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Producto eliminado exitosamente');
            await loadInventario();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// =====================================================
// CLIENTES
// =====================================================

async function loadClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes.php`);
        const data = await response.json();

        if (data.success) {
            renderClientesTable(data.data);
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function renderClientesTable(clientes) {
    const tbody = document.getElementById('clientes-table');
    tbody.innerHTML = '';

    clientes.forEach(cliente => {
        tbody.innerHTML += `
            <tr>
                <td>${cliente.ID_Cliente}</td>
                <td>${cliente.Nombres} ${cliente.Apellidos}</td>
                <td>${cliente.Telefono || '-'}</td>
                <td>${cliente.Email || '-'}</td>
                <td>${cliente.Total_Pedidos || 0}</td>
                <td>
                    <button class="btn-icon edit" onclick="editCliente(${cliente.ID_Cliente})">✏️</button>
                    <button class="btn-icon delete" onclick="deleteCliente(${cliente.ID_Cliente})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

async function deleteCliente(id) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
        const response = await fetch(`${API_URL}/clientes.php?id=${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Cliente eliminado exitosamente');
            await loadClientes();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// =====================================================
// PEDIDOS
// =====================================================

async function loadPedidos() {
    try {
        const response = await fetch(`${API_URL}/pedidos.php`);
        const data = await response.json();

        if (data.success) {
            renderPedidosTable(data.data);
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
    }
}

function renderPedidosTable(pedidos) {
    const tbody = document.getElementById('pedidos-table');
    tbody.innerHTML = '';

    pedidos.forEach(pedido => {
        const badgeClass = getBadgeClass(pedido.Estado_Pedido);
        const fecha = new Date(pedido.Fecha_Pedido).toLocaleDateString('es-MX');

        tbody.innerHTML += `
            <tr>
                <td>#${String(pedido.ID_Pedido).padStart(3, '0')}</td>
                <td>${pedido.Cliente_Nombre}</td>
                <td>${fecha}</td>
                <td>${pedido.Descripcion || '-'}</td>
                <td>$${parseFloat(pedido.Monto_Total).toLocaleString('es-MX')}</td>
                <td><span class="badge ${badgeClass}">${pedido.Estado_Pedido}</span></td>
                <td>
                    <button class="btn-icon view" onclick="viewPedido(${pedido.ID_Pedido})">👁️</button>
                    <button class="btn-icon edit" onclick="editPedido(${pedido.ID_Pedido})">✏️</button>
                    <button class="btn-icon delete" onclick="deletePedido(${pedido.ID_Pedido})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

async function deletePedido(id) {
    if (!confirm('¿Está seguro de eliminar este pedido?')) return;

    try {
        const response = await fetch(`${API_URL}/pedidos.php?id=${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Pedido eliminado exitosamente');
            await loadPedidos();
            await loadDashboard();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// =====================================================
// EMPLEADOS
// =====================================================

async function loadEmpleados() {
    try {
        const response = await fetch(`${API_URL}/empleados.php`);
        const data = await response.json();

        if (data.success) {
            renderEmpleadosTable(data.data);
        }
    } catch (error) {
        console.error('Error cargando empleados:', error);
    }
}

function renderEmpleadosTable(empleados) {
    const tbody = document.getElementById('empleados-table');
    tbody.innerHTML = '';

    empleados.forEach(emp => {
        const rolBadge = getRolBadgeClass(emp.Rol);

        tbody.innerHTML += `
            <tr>
                <td>${emp.ID_Empleado}</td>
                <td>${emp.Nombres} ${emp.Apellidos}</td>
                <td>${emp.Departamento || '-'}</td>
                <td>${emp.Puesto || '-'}</td>
                <td>${emp.Username}</td>
                <td><span class="badge ${rolBadge}">${emp.Rol}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editEmpleado(${emp.ID_Empleado})">✏️</button>
                    <button class="btn-icon delete" onclick="deleteEmpleado(${emp.ID_Empleado})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

async function deleteEmpleado(id) {
    if (!confirm('¿Está seguro de eliminar este empleado?')) return;

    try {
        const response = await fetch(`${API_URL}/empleados.php?id=${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Empleado eliminado exitosamente');
            await loadEmpleados();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// =====================================================
// FINANZAS
// =====================================================

async function loadFinanzas() {
    try {
        // Cargar estadísticas
        const dashResponse = await fetch(`${API_URL}/dashboard.php`);
        const dashData = await dashResponse.json();

        if (dashData.success) {
            const statCards = document.querySelectorAll('#finanzas-section .stat-card .stat-info h3');
            statCards[0].textContent = '$' + dashData.data.stats.ingresos_mes.toLocaleString('es-MX');
            statCards[1].textContent = '$' + dashData.data.stats.egresos_mes.toLocaleString('es-MX');
        }

        // Cargar movimientos
        const response = await fetch(`${API_URL}/finanzas.php`);
        const data = await response.json();

        if (data.success) {
            renderFinanzasTable(data.data);
        }
    } catch (error) {
        console.error('Error cargando finanzas:', error);
    }
}

function renderFinanzasTable(finanzas) {
    const tbody = document.getElementById('finanzas-table');
    tbody.innerHTML = '';

    finanzas.forEach(f => {
        const tipoBadge = getTipoBadgeClass(f.Tipo);
        const montoClass = f.Tipo === 'VENTA' ? 'text-success' : 'text-danger';
        const montoPrefix = f.Tipo === 'VENTA' ? '+' : '-';
        const fecha = new Date(f.Fecha_Registro).toLocaleDateString('es-MX');

        tbody.innerHTML += `
            <tr>
                <td>${f.ID_Financiamiento}</td>
                <td><span class="badge ${tipoBadge}">${f.Tipo}</span></td>
                <td>${f.Descripcion || '-'}</td>
                <td>${f.Forma_Pago || '-'}</td>
                <td class="${montoClass}">${montoPrefix}$${parseFloat(f.Monto_Total).toLocaleString('es-MX')}</td>
                <td>${fecha}</td>
            </tr>
        `;
    });
}

// =====================================================
// MODALES
// =====================================================

function openModal(type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    let formHTML = '';

    switch (type) {
        case 'producto':
            modalTitle.textContent = 'Agregar Producto';
            formHTML = `
                <form id="productoForm">
                    <div class="form-group">
                        <label>Categoría</label>
                        <select name="categoria" required onchange="updateProductoFields(this.value)">
                            <option value="">Seleccione...</option>
                            <option value="guantes">Guantes de Portero</option>
                            <option value="casacas">Casacas</option>
                            <option value="balones">Balones</option>
                            <option value="tacos">Tacos</option>
                            <option value="espinilleras">Espinilleras</option>
                            <option value="pizarras">Pizarras Magnéticas</option>
                            <option value="carpetas">Carpetas Tácticas</option>
                        </select>
                    </div>
                    <div id="producto-fields"></div>
                    <div class="form-group">
                        <label>Precio</label>
                        <input type="number" name="precio" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" name="stock" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Guardar</button>
                </form>
            `;
            break;

        case 'cliente':
            modalTitle.textContent = 'Agregar Cliente';
            formHTML = `
                <form id="clienteForm">
                    <div class="form-group">
                        <label>Nombres</label>
                        <input type="text" name="nombres" required>
                    </div>
                    <div class="form-group">
                        <label>Apellidos</label>
                        <input type="text" name="apellidos" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email">
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <textarea name="direccion"></textarea>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Guardar</button>
                </form>
            `;
            break;

        case 'pedido':
            modalTitle.textContent = 'Nuevo Pedido';
            formHTML = `
                <form id="pedidoForm">
                    <div class="form-group">
                        <label>Cliente</label>
                        <select name="id_cliente" id="select-cliente" required>
                            <option value="">Cargando clientes...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Empleado</label>
                        <select name="id_empleado" id="select-empleado" required>
                            <option value="">Cargando empleados...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select name="estado" required>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_PROCESO">En Proceso</option>
                            <option value="COMPLETADO">Completado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea name="descripcion" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Monto Total</label>
                        <input type="number" name="monto" step="0.01" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Guardar</button>
                </form>
            `;
            break;

        case 'empleado':
            modalTitle.textContent = 'Agregar Empleado';
            formHTML = `
                <form id="empleadoForm">
                    <div class="form-group">
                        <label>Nombres</label>
                        <input type="text" name="nombres" required>
                    </div>
                    <div class="form-group">
                        <label>Apellidos</label>
                        <input type="text" name="apellidos" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email">
                    </div>
                    <div class="form-group">
                        <label>Departamento</label>
                        <select name="departamento" required>
                            <option value="Administración">Administración</option>
                            <option value="Ventas">Ventas</option>
                            <option value="Personalización">Personalización</option>
                            <option value="Servicio Técnico">Servicio Técnico</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Puesto</label>
                        <input type="text" name="puesto" required>
                    </div>
                    <div class="form-group">
                        <label>Usuario</label>
                        <input type="text" name="username" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label>Rol</label>
                        <select name="rol" required>
                            <option value="VENDEDOR">Vendedor</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="DISEÑADOR">Diseñador</option>
                            <option value="TECNICO">Técnico</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Guardar</button>
                </form>
            `;
            break;

        case 'finanza':
            modalTitle.textContent = 'Nuevo Registro Financiero';
            formHTML = `
                <form id="finanzaForm">
                    <div class="form-group">
                        <label>Tipo</label>
                        <select name="tipo" required>
                            <option value="VENTA">Venta (Ingreso)</option>
                            <option value="SUELDO">Sueldo (Egreso)</option>
                            <option value="GASTO">Gasto (Egreso)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea name="descripcion" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Forma de Pago</label>
                        <select name="forma_pago" required>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Monto</label>
                        <input type="number" name="monto" step="0.01" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Guardar</button>
                </form>
            `;
            break;
    }

    modalBody.innerHTML = formHTML;
    modal.classList.add('active');

    // Configurar formulario
    setupFormSubmit(type);

    // Cargar datos adicionales si es necesario
    if (type === 'pedido') {
        loadClientesForSelect();
        loadEmpleadosForSelect();
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});

// =====================================================
// FORMULARIOS
// =====================================================

function setupFormSubmit(type) {
    const formId = `${type}Form`;
    const form = document.getElementById(formId);

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const endpoint = getEndpoint(type);
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message || 'Guardado exitosamente');
                closeModal();

                // Recargar sección correspondiente
                switch (type) {
                    case 'producto': await loadInventario(); break;
                    case 'cliente': await loadClientes(); break;
                    case 'pedido': await loadPedidos(); await loadDashboard(); break;
                    case 'empleado': await loadEmpleados(); break;
                    case 'finanza': await loadFinanzas(); break;
                }
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    });
}

function getEndpoint(type) {
    const endpoints = {
        'producto': 'productos.php',
        'cliente': 'clientes.php',
        'pedido': 'pedidos.php',
        'empleado': 'empleados.php',
        'finanza': 'finanzas.php'
    };
    return endpoints[type];
}

async function loadClientesForSelect() {
    try {
        const response = await fetch(`${API_URL}/clientes.php`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('select-cliente');
            select.innerHTML = '<option value="">Seleccione un cliente...</option>';

            data.data.forEach(cliente => {
                select.innerHTML += `<option value="${cliente.ID_Cliente}">${cliente.Nombres} ${cliente.Apellidos}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

async function loadEmpleadosForSelect() {
    try {
        const response = await fetch(`${API_URL}/empleados.php`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('select-empleado');
            if (select) {
                select.innerHTML = '<option value="">Seleccione un empleado...</option>';

                data.data.forEach(empleado => {
                    const selected = currentUser && currentUser.id == empleado.ID_Empleado ? 'selected' : '';
                    select.innerHTML += `<option value="${empleado.ID_Empleado}" ${selected}>${empleado.Nombres} ${empleado.Apellidos} (${empleado.Rol})</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error cargando empleados:', error);
    }
}

function updateProductoFields(categoria) {
    const container = document.getElementById('producto-fields');
    let fieldsHTML = '';

    switch (categoria) {
        case 'guantes':
            fieldsHTML = `
                <div class="form-group"><label>Marca</label><input type="text" name="marca" required></div>
                <div class="form-group"><label>Talla</label><input type="text" name="talla" required></div>
                <div class="form-group"><label>Color</label><input type="text" name="color" required></div>
                <div class="form-group"><label>Material</label><input type="text" name="material"></div>
            `;
            break;
        case 'casacas':
            fieldsHTML = `
                <div class="form-group"><label>Talla</label><select name="talla" required><option value="CH">CH</option><option value="M">M</option><option value="G">G</option><option value="XL">XL</option></select></div>
                <div class="form-group"><label>Color</label><input type="text" name="color" required></div>
            `;
            break;
        case 'balones':
            fieldsHTML = `
                <div class="form-group"><label>Marca</label><input type="text" name="marca" required></div>
                <div class="form-group"><label>Color</label><input type="text" name="color" required></div>
                <div class="form-group"><label>Tipo de Superficie</label><input type="text" name="tipo_superficie"></div>
            `;
            break;
        case 'tacos':
            fieldsHTML = `
                <div class="form-group"><label>Marca</label><input type="text" name="marca" required></div>
                <div class="form-group"><label>Talla</label><input type="text" name="talla" required></div>
                <div class="form-group"><label>Color</label><input type="text" name="color" required></div>
                <div class="form-group"><label>Tipo de Superficie</label><input type="text" name="tipo_superficie"></div>
            `;
            break;
        case 'espinilleras':
            fieldsHTML = `
                <div class="form-group"><label>Talla</label><input type="text" name="talla" required></div>
                <div class="form-group"><label>Color</label><input type="text" name="color" required></div>
                <div class="form-group"><label>Material</label><input type="text" name="material"></div>
            `;
            break;
        case 'pizarras':
        case 'carpetas':
            fieldsHTML = `
                <div class="form-group"><label>Tamaño</label><input type="text" name="tamano" required></div>
                <div class="form-group"><label>Material</label><input type="text" name="material"></div>
                <div class="form-group"><label>Color</label><input type="text" name="color"></div>
                <div class="form-group"><label>Descripción</label><textarea name="descripcion"></textarea></div>
            `;
            break;
    }

    container.innerHTML = fieldsHTML;
}

// =====================================================
// UTILIDADES
// =====================================================

function getBadgeClass(estado) {
    switch (estado) {
        case 'COMPLETADO': return 'success';
        case 'EN_PROCESO': return 'warning';
        case 'PENDIENTE': return 'danger';
        default: return 'info';
    }
}

function getRolBadgeClass(rol) {
    switch (rol) {
        case 'ADMIN': return 'info';
        case 'VENDEDOR': return 'success';
        case 'DISEÑADOR': return 'warning';
        case 'TECNICO': return 'danger';
        default: return 'info';
    }
}

function getTipoBadgeClass(tipo) {
    switch (tipo) {
        case 'VENTA': return 'success';
        case 'SUELDO': return 'warning';
        case 'GASTO': return 'danger';
        default: return 'info';
    }
}

// =====================================================
// FILTROS
// =====================================================

// Variables globales para almacenar datos sin filtrar
let inventarioDataCache = [];
let clientesDataCache = [];
let pedidosDataCache = [];
let empleadosDataCache = [];
let finanzasDataCache = [];

// Filtros de Inventario
document.addEventListener('DOMContentLoaded', () => {
    // Asegurar que los event listeners se agreguen después de que existan los elementos
    setTimeout(() => {
        const categoriaFilter = document.getElementById('categoria-filter');
        const searchProducto = document.getElementById('search-producto');

        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', filterInventario);
        }

        if (searchProducto) {
            searchProducto.addEventListener('input', filterInventario);
        }

        // Filtros de Pedidos
        const estadoFilter = document.getElementById('estado-filter');
        const fechaFilter = document.getElementById('fecha-filter');
        const searchPedido = document.getElementById('search-pedido');

        if (estadoFilter) {
            estadoFilter.addEventListener('change', filterPedidos);
        }

        if (fechaFilter) {
            fechaFilter.addEventListener('change', filterPedidos);
        }

        if (searchPedido) {
            searchPedido.addEventListener('input', filterPedidos);
        }

        // Filtros de Clientes
        const searchCliente = document.getElementById('search-cliente');
        if (searchCliente) {
            searchCliente.addEventListener('input', filterClientes);
        }

        // Filtros de Empleados
        const searchEmpleado = document.getElementById('search-empleado');
        if (searchEmpleado) {
            searchEmpleado.addEventListener('input', filterEmpleados);
        }
    }, 500);
});

async function filterInventario() {
    const categoria = document.getElementById('categoria-filter')?.value || '';
    const search = document.getElementById('search-producto')?.value || '';

    let url = `${API_URL}/productos.php?`;
    if (categoria) url += `categoria=${categoria}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderInventarioTable(data.data);
        }
    } catch (error) {
        console.error('Error filtrando inventario:', error);
    }
}

async function filterPedidos() {
    const estado = document.getElementById('estado-filter')?.value || '';
    const fecha = document.getElementById('fecha-filter')?.value || '';
    const search = document.getElementById('search-pedido')?.value || '';

    let url = `${API_URL}/pedidos.php?`;
    if (estado) url += `estado=${estado}&`;
    if (fecha) url += `fecha=${fecha}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderPedidosTable(data.data);
        }
    } catch (error) {
        console.error('Error filtrando pedidos:', error);
    }
}

async function filterClientes() {
    const search = document.getElementById('search-cliente')?.value || '';

    let url = `${API_URL}/clientes.php?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderClientesTable(data.data);
        }
    } catch (error) {
        console.error('Error filtrando clientes:', error);
    }
}

async function filterEmpleados() {
    const search = document.getElementById('search-empleado')?.value || '';

    let url = `${API_URL}/empleados.php?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderEmpleadosTable(data.data);
        }
    } catch (error) {
        console.error('Error filtrando empleados:', error);
    }
}

// =====================================================
// FUNCIONES DE EDICIÓN
// =====================================================

async function editProducto(id, categoria) {
    try {
        const response = await fetch(`${API_URL}/productos.php?categoria=${categoria}&id=${id}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const producto = data.data[0];

            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            modalTitle.textContent = 'Editar Producto';

            let formHTML = `
                <form id="productoEditForm">
                    <input type="hidden" name="id" value="${id}">
                    <input type="hidden" name="categoria" value="${categoria}">
                    <div class="form-group">
                        <label>Categoría</label>
                        <input type="text" value="${producto.Categoria}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Precio</label>
                        <input type="number" name="precio" step="0.01" value="${producto.Precio}" required>
                    </div>
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" name="stock" value="${producto.Stock}" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Actualizar</button>
                </form>
            `;

            modalBody.innerHTML = formHTML;
            modal.classList.add('active');

            document.getElementById('productoEditForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updateData = {
                    id: formData.get('id'),
                    categoria: formData.get('categoria'),
                    precio: formData.get('precio'),
                    stock: formData.get('stock')
                };

                const updateResponse = await fetch(`${API_URL}/productos.php?id=${updateData.id}&categoria=${updateData.categoria}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                const result = await updateResponse.json();

                if (result.success) {
                    alert('Producto actualizado exitosamente');
                    closeModal();
                    await loadInventario();
                } else {
                    alert('Error: ' + result.message);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el producto');
    }
}

async function editCliente(id) {
    try {
        const response = await fetch(`${API_URL}/clientes.php?id=${id}`);
        const data = await response.json();

        if (data.success) {
            const cliente = data.data;

            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            modalTitle.textContent = 'Editar Cliente';

            let formHTML = `
                <form id="clienteEditForm">
                    <input type="hidden" name="id" value="${id}">
                    <div class="form-group">
                        <label>Nombres</label>
                        <input type="text" name="nombres" value="${cliente.Nombres}" required>
                    </div>
                    <div class="form-group">
                        <label>Apellidos</label>
                        <input type="text" name="apellidos" value="${cliente.Apellidos}" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono" value="${cliente.Telefono || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="${cliente.Email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <textarea name="direccion">${cliente.Direccion || ''}</textarea>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Actualizar</button>
                </form>
            `;

            modalBody.innerHTML = formHTML;
            modal.classList.add('active');

            document.getElementById('clienteEditForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updateData = Object.fromEntries(formData.entries());

                const updateResponse = await fetch(`${API_URL}/clientes.php?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                const result = await updateResponse.json();

                if (result.success) {
                    alert('Cliente actualizado exitosamente');
                    closeModal();
                    await loadClientes();
                } else {
                    alert('Error: ' + result.message);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el cliente');
    }
}

async function editPedido(id) {
    try {
        const response = await fetch(`${API_URL}/pedidos.php?id=${id}`);
        const data = await response.json();

        if (data.success) {
            const pedido = data.data;

            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            modalTitle.textContent = 'Editar Pedido';

            // Cargar clientes
            const clientesResponse = await fetch(`${API_URL}/clientes.php`);
            const clientesData = await clientesResponse.json();

            let clientesOptions = '';
            if (clientesData.success) {
                clientesData.data.forEach(cliente => {
                    const selected = cliente.ID_Cliente == pedido.ID_Cliente ? 'selected' : '';
                    clientesOptions += `<option value="${cliente.ID_Cliente}" ${selected}>${cliente.Nombres} ${cliente.Apellidos}</option>`;
                });
            }

            let formHTML = `
                <form id="pedidoEditForm">
                    <input type="hidden" name="id" value="${id}">
                    <div class="form-group">
                        <label>Cliente</label>
                        <select name="id_cliente" required>
                            ${clientesOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select name="estado" required>
                            <option value="PENDIENTE" ${pedido.Estado_Pedido === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                            <option value="EN_PROCESO" ${pedido.Estado_Pedido === 'EN_PROCESO' ? 'selected' : ''}>En Proceso</option>
                            <option value="COMPLETADO" ${pedido.Estado_Pedido === 'COMPLETADO' ? 'selected' : ''}>Completado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea name="descripcion" required>${pedido.Descripcion}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Monto Total</label>
                        <input type="number" name="monto" step="0.01" value="${pedido.Monto_Total}" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Actualizar</button>
                </form>
            `;

            modalBody.innerHTML = formHTML;
            modal.classList.add('active');

            document.getElementById('pedidoEditForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updateData = Object.fromEntries(formData.entries());

                const updateResponse = await fetch(`${API_URL}/pedidos.php?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                const result = await updateResponse.json();

                if (result.success) {
                    alert('Pedido actualizado exitosamente');
                    closeModal();
                    await loadPedidos();
                    await loadDashboard();
                } else {
                    alert('Error: ' + result.message);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el pedido');
    }
}

async function viewPedido(id) {
    try {
        const response = await fetch(`${API_URL}/pedidos.php?id=${id}`);
        const data = await response.json();

        if (data.success) {
            const pedido = data.data;

            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            modalTitle.textContent = 'Detalles del Pedido #' + String(pedido.ID_Pedido).padStart(3, '0');

            const fecha = new Date(pedido.Fecha_Pedido).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const badgeClass = getBadgeClass(pedido.Estado_Pedido);

            let detailsHTML = `
                <div style="padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 10px;">Información General</h4>
                        <p><strong>ID Pedido:</strong> #${String(pedido.ID_Pedido).padStart(3, '0')}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Estado:</strong> <span class="badge ${badgeClass}">${pedido.Estado_Pedido}</span></p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 10px;">Cliente</h4>
                        <p><strong>Nombre:</strong> ${pedido.Cliente_Nombre}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 10px;">Detalles del Pedido</h4>
                        <p><strong>Descripción:</strong></p>
                        <p style="background: var(--bg-secondary); padding: 10px; border-radius: 5px;">${pedido.Descripcion}</p>
                        <p style="font-size: 20px; color: var(--success-color); margin-top: 15px;">
                            <strong>Total: $${parseFloat(pedido.Monto_Total).toLocaleString('es-MX')}</strong>
                        </p>
                    </div>
                    <button onclick="closeModal()" class="btn-primary" style="width: 100%;">Cerrar</button>
                </div>
            `;

            modalBody.innerHTML = detailsHTML;
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles del pedido');
    }
}

async function editEmpleado(id) {
    try {
        const response = await fetch(`${API_URL}/empleados.php?id=${id}`);
        const data = await response.json();

        if (data.success) {
            const empleado = data.data;

            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            modalTitle.textContent = 'Editar Empleado';

            let formHTML = `
                <form id="empleadoEditForm">
                    <input type="hidden" name="id" value="${id}">
                    <div class="form-group">
                        <label>Nombres</label>
                        <input type="text" name="nombres" value="${empleado.Nombres}" required>
                    </div>
                    <div class="form-group">
                        <label>Apellidos</label>
                        <input type="text" name="apellidos" value="${empleado.Apellidos}" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono" value="${empleado.Telefono || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="${empleado.Email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <textarea name="direccion">${empleado.Direccion || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Departamento</label>
                        <select name="departamento" required>
                            <option value="Administración" ${empleado.Departamento === 'Administración' ? 'selected' : ''}>Administración</option>
                            <option value="Ventas" ${empleado.Departamento === 'Ventas' ? 'selected' : ''}>Ventas</option>
                            <option value="Personalización" ${empleado.Departamento === 'Personalización' ? 'selected' : ''}>Personalización</option>
                            <option value="Servicio Técnico" ${empleado.Departamento === 'Servicio Técnico' ? 'selected' : ''}>Servicio Técnico</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Puesto</label>
                        <input type="text" name="puesto" value="${empleado.Puesto}" required>
                    </div>
                    <div class="form-group">
                        <label>Usuario</label>
                        <input type="text" name="username" value="${empleado.Username}" required>
                    </div>
                    <div class="form-group">
                        <label>Nueva Contraseña (dejar en blanco para no cambiar)</label>
                        <input type="password" name="password" placeholder="Nueva contraseña (opcional)">
                    </div>
                    <div class="form-group">
                        <label>Rol</label>
                        <select name="rol" required>
                            <option value="VENDEDOR" ${empleado.Rol === 'VENDEDOR' ? 'selected' : ''}>Vendedor</option>
                            <option value="ADMIN" ${empleado.Rol === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                            <option value="DISEÑADOR" ${empleado.Rol === 'DISEÑADOR' ? 'selected' : ''}>Diseñador</option>
                            <option value="TECNICO" ${empleado.Rol === 'TECNICO' ? 'selected' : ''}>Técnico</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Actualizar</button>
                </form>
            `;

            modalBody.innerHTML = formHTML;
            modal.classList.add('active');

            document.getElementById('empleadoEditForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updateData = Object.fromEntries(formData.entries());

                // Si la contraseña está vacía, no la enviamos
                if (!updateData.password) {
                    delete updateData.password;
                }

                const updateResponse = await fetch(`${API_URL}/empleados.php?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                const result = await updateResponse.json();

                if (result.success) {
                    alert('Empleado actualizado exitosamente');
                    closeModal();
                    await loadEmpleados();
                } else {
                    alert('Error: ' + result.message);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el empleado');
    }
}
