<?php
// =====================================================
// FUTLOCK - API DE FINANZAS (CRUD)
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $tipo = $_GET['tipo'] ?? null;
        $fecha_inicio = $_GET['fecha_inicio'] ?? null;
        $fecha_fin = $_GET['fecha_fin'] ?? null;
        
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM Financiamiento WHERE ID_Financiamiento = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $finanza = $result->fetch_assoc();
            
            if ($finanza) {
                jsonResponse(['success' => true, 'data' => $finanza]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Registro no encontrado'], 404);
            }
        } else {
            $sql = "SELECT f.*, 
                           CONCAT(c.Nombres, ' ', c.Apellidos) as Cliente_Nombre,
                           CONCAT(e.Nombres, ' ', e.Apellidos) as Empleado_Nombre
                    FROM Financiamiento f
                    LEFT JOIN Clientes c ON f.ID_Cliente = c.ID_Cliente
                    LEFT JOIN Empleados e ON f.ID_Empleado = e.ID_Empleado WHERE 1=1";
            
            if ($tipo) {
                $sql .= " AND f.Tipo = '" . $conn->real_escape_string($tipo) . "'";
            }
            
            if ($fecha_inicio) {
                $sql .= " AND DATE(f.Fecha_Registro) >= '" . $conn->real_escape_string($fecha_inicio) . "'";
            }
            
            if ($fecha_fin) {
                $sql .= " AND DATE(f.Fecha_Registro) <= '" . $conn->real_escape_string($fecha_fin) . "'";
            }
            
            $sql .= " ORDER BY f.Fecha_Registro DESC";
            
            $result = $conn->query($sql);
            $finanzas = [];
            while ($row = $result->fetch_assoc()) {
                $finanzas[] = $row;
            }
            jsonResponse(['success' => true, 'data' => $finanzas]);
        }
        break;
        
    case 'POST':
        $data = getRequestData();
        
        // Hacer opcionales los foreign keys
        $id_pedido = isset($data['id_pedido']) && !empty($data['id_pedido']) ? $data['id_pedido'] : null;
        $id_cliente = isset($data['id_cliente']) && !empty($data['id_cliente']) ? $data['id_cliente'] : null;
        $id_empleado = isset($data['id_empleado']) && !empty($data['id_empleado']) ? $data['id_empleado'] : null;
        
        $stmt = $conn->prepare("INSERT INTO Financiamiento (ID_Pedido, ID_Cliente, ID_Empleado, Tipo, Descripcion, Forma_Pago, Monto_Total) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiisssd", 
            $id_pedido,
            $id_cliente,
            $id_empleado,
            $data['tipo'],
            $data['descripcion'],
            $data['forma_pago'],
            $data['monto']
        );
        
        if ($stmt->execute()) {
            jsonResponse([
                'success' => true, 
                'message' => 'Registro financiero creado exitosamente',
                'id' => $conn->insert_id
            ], 201);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al crear registro: ' . $conn->error], 500);
        }
        break;
        
    case 'PUT':
        $data = getRequestData();
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID requerido'], 400);
        }
        
        $stmt = $conn->prepare("UPDATE Financiamiento SET Tipo = ?, Descripcion = ?, Forma_Pago = ?, Monto_Total = ? WHERE ID_Financiamiento = ?");
        $stmt->bind_param("sssdi", 
            $data['tipo'],
            $data['descripcion'],
            $data['forma_pago'],
            $data['monto'],
            $id
        );
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Registro actualizado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al actualizar registro'], 500);
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID requerido'], 400);
        }
        
        $stmt = $conn->prepare("DELETE FROM Financiamiento WHERE ID_Financiamiento = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Registro eliminado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al eliminar registro'], 500);
        }
        break;
        
    default:
        jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$conn->close();
?>
