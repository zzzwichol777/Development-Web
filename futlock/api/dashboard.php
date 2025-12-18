<?php
// =====================================================
// FUTLOCK - API DE DASHBOARD (ESTADÍSTICAS)
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$conn = getConnection();

// Obtener estadísticas generales

// 1. Total de productos en stock
$totalStock = 0;
$tablas = ['Guantes_Portero', 'Casacas', 'Balon', 'Tacos_Tenis', 'Espinilleras', 'Pizarras_Magneticas', 'Carpetas_Tacticas'];
foreach ($tablas as $tabla) {
    $result = $conn->query("SELECT COALESCE(SUM(Stock), 0) as total FROM $tabla");
    $row = $result->fetch_assoc();
    $totalStock += $row['total'];
}

// 2. Pedidos del mes actual
$result = $conn->query("SELECT COUNT(*) as total FROM Pedido WHERE MONTH(Fecha_Pedido) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Pedido) = YEAR(CURRENT_DATE())");
$pedidosMes = $result->fetch_assoc()['total'];

// 3. Clientes activos
$result = $conn->query("SELECT COUNT(*) as total FROM Clientes WHERE Activo = 'S'");
$clientesActivos = $result->fetch_assoc()['total'];

// 4. Ventas del mes
$result = $conn->query("SELECT COALESCE(SUM(Monto_Total), 0) as total FROM Financiamiento WHERE Tipo = 'VENTA' AND MONTH(Fecha_Registro) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Registro) = YEAR(CURRENT_DATE())");
$ventasMes = $result->fetch_assoc()['total'];

// 5. Ingresos totales del mes
$result = $conn->query("SELECT COALESCE(SUM(Monto_Total), 0) as total FROM Financiamiento WHERE Tipo = 'VENTA' AND MONTH(Fecha_Registro) = MONTH(CURRENT_DATE())");
$ingresosMes = $result->fetch_assoc()['total'];

// 6. Egresos totales del mes (sueldos y gastos)
$result = $conn->query("SELECT COALESCE(SUM(Monto_Total), 0) as total FROM Financiamiento WHERE Tipo IN ('SUELDO', 'GASTO') AND MONTH(Fecha_Registro) = MONTH(CURRENT_DATE())");
$egresosMes = $result->fetch_assoc()['total'];

// 7. Pedidos recientes (últimos 5)
$result = $conn->query("SELECT p.ID_Pedido, CONCAT(c.Nombres, ' ', c.Apellidos) as Cliente, p.Estado_Pedido, p.Monto_Total, p.Fecha_Pedido 
                        FROM Pedido p 
                        LEFT JOIN Clientes c ON p.ID_Cliente = c.ID_Cliente 
                        ORDER BY p.Fecha_Pedido DESC 
                        LIMIT 5");
$pedidosRecientes = [];
while ($row = $result->fetch_assoc()) {
    $pedidosRecientes[] = $row;
}

// 8. Productos con bajo stock (menos de 10 unidades)
$productosAlerta = [];
foreach ($tablas as $tabla) {
    $nombreCol = '';
    switch ($tabla) {
        case 'Guantes_Portero': $nombreCol = "CONCAT(Marca, ' - Talla ', No_Talla)"; break;
        case 'Casacas': $nombreCol = "CONCAT('Casaca ', Color, ' - ', Talla)"; break;
        case 'Balon': $nombreCol = "CONCAT(Marca, ' ', Color)"; break;
        case 'Tacos_Tenis': $nombreCol = "CONCAT(Marca, ' - Talla ', No_Talla)"; break;
        case 'Espinilleras': $nombreCol = "CONCAT('Espinilleras ', Color, ' - ', No_Talla)"; break;
        case 'Pizarras_Magneticas': $nombreCol = "CONCAT('Pizarra ', Tamano)"; break;
        case 'Carpetas_Tacticas': $nombreCol = "CONCAT('Carpeta ', Tamano)"; break;
    }
    
    $result = $conn->query("SELECT $nombreCol as Nombre, Stock FROM $tabla WHERE Stock < 10 ORDER BY Stock ASC");
    while ($row = $result->fetch_assoc()) {
        $productosAlerta[] = $row;
    }
}

// Ordenar por stock ascendente y limitar a 5
usort($productosAlerta, function($a, $b) { return $a['Stock'] - $b['Stock']; });
$productosAlerta = array_slice($productosAlerta, 0, 5);

// Responder con todas las estadísticas
jsonResponse([
    'success' => true,
    'data' => [
        'stats' => [
            'total_stock' => intval($totalStock),
            'pedidos_mes' => intval($pedidosMes),
            'clientes_activos' => intval($clientesActivos),
            'ventas_mes' => floatval($ventasMes),
            'ingresos_mes' => floatval($ingresosMes),
            'egresos_mes' => floatval($egresosMes)
        ],
        'pedidos_recientes' => $pedidosRecientes,
        'productos_alerta' => $productosAlerta
    ]
]);

$conn->close();
?>
