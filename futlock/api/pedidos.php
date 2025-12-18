<?php
// =====================================================
// FUTLOCK - API DE PEDIDOS (CRUD)
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $estado = $_GET['estado'] ?? null;
        $fecha = $_GET['fecha'] ?? null;
        $search = $_GET['search'] ?? null;
        $limit = $_GET['limit'] ?? null;
        
        if ($id) {
            $stmt = $conn->prepare("SELECT p.*, CONCAT(c.Nombres, ' ', c.Apellidos) as Cliente_Nombre 
                                    FROM Pedido p 
                                    LEFT JOIN Clientes c ON p.ID_Cliente = c.ID_Cliente 
                                    WHERE p.ID_Pedido = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $pedido = $result->fetch_assoc();
            
            if ($pedido) {
                jsonResponse(['success' => true, 'data' => $pedido]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Pedido no encontrado'], 404);
            }
        } else {
            $sql = "SELECT p.*, CONCAT(c.Nombres, ' ', c.Apellidos) as Cliente_Nombre 
                    FROM Pedido p 
                    LEFT JOIN Clientes c ON p.ID_Cliente = c.ID_Cliente WHERE 1=1";
            
            if ($estado) {
                $sql .= " AND p.Estado_Pedido = '" . $conn->real_escape_string($estado) . "'";
            }
            
            if ($fecha) {
                $sql .= " AND DATE(p.Fecha_Pedido) = '" . $conn->real_escape_string($fecha) . "'";
            }
            
            if ($search) {
                $searchTerm = $conn->real_escape_string($search);
                $sql .= " AND (CONCAT(c.Nombres, ' ', c.Apellidos) LIKE '%$searchTerm%' 
                          OR p.Descripcion LIKE '%$searchTerm%'
                          OR p.ID_Pedido LIKE '%$searchTerm%')";
            }
            
            $sql .= " ORDER BY p.Fecha_Pedido DESC";
            
            if ($limit) {
                $sql .= " LIMIT " . intval($limit);
            }
            
            $result = $conn->query($sql);
            $pedidos = [];
            while ($row = $result->fetch_assoc()) {
                $pedidos[] = $row;
            }
            jsonResponse(['success' => true, 'data' => $pedidos]);
        }
        break;
        
    case 'POST':
        $data = getRequestData();
        
        // Validar que el empleado existe
        if (isset($data['id_empleado']) && !empty($data['id_empleado'])) {
            $checkEmp = $conn->prepare("SELECT ID_Empleado FROM Empleados WHERE ID_Empleado = ? AND Activo = 'S'");
            $checkEmp->bind_param("i", $data['id_empleado']);
            $checkEmp->execute();
            $empResult = $checkEmp->get_result();
            
            if ($empResult->num_rows === 0) {
                jsonResponse(['success' => false, 'message' => 'El empleado seleccionado no existe o no está activo'], 400);
            }
        } else {
            jsonResponse(['success' => false, 'message' => 'Debe seleccionar un empleado para crear el pedido'], 400);
        }
        
        // Validar que el cliente existe
        if (isset($data['id_cliente']) && !empty($data['id_cliente'])) {
            $checkCli = $conn->prepare("SELECT ID_Cliente FROM Clientes WHERE ID_Cliente = ? AND Activo = 'S'");
            $checkCli->bind_param("i", $data['id_cliente']);
            $checkCli->execute();
            $cliResult = $checkCli->get_result();
            
            if ($cliResult->num_rows === 0) {
                jsonResponse(['success' => false, 'message' => 'El cliente seleccionado no existe o no está activo'], 400);
            }
        } else {
            jsonResponse(['success' => false, 'message' => 'Debe seleccionar un cliente para crear el pedido'], 400);
        }
        
        $stmt = $conn->prepare("INSERT INTO Pedido (ID_Cliente, ID_Empleado, Estado_Pedido, Descripcion, Monto_Total) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iissd", 
            $data['id_cliente'],
            $data['id_empleado'],
            $data['estado'],
            $data['descripcion'],
            $data['monto']
        );
        
        if ($stmt->execute()) {
            jsonResponse([
                'success' => true, 
                'message' => 'Pedido creado exitosamente',
                'id' => $conn->insert_id
            ], 201);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al crear pedido: ' . $conn->error], 500);
        }
        break;
        
    case 'PUT':
        $data = getRequestData();
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID de pedido requerido'], 400);
        }
        
        $stmt = $conn->prepare("UPDATE Pedido SET ID_Cliente = ?, Estado_Pedido = ?, Descripcion = ?, Monto_Total = ? WHERE ID_Pedido = ?");
        $stmt->bind_param("issdi", 
            $data['id_cliente'],
            $data['estado'],
            $data['descripcion'],
            $data['monto'],
            $id
        );
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Pedido actualizado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al actualizar pedido'], 500);
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID de pedido requerido'], 400);
        }
        
        $stmt = $conn->prepare("DELETE FROM Pedido WHERE ID_Pedido = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Pedido eliminado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al eliminar pedido'], 500);
        }
        break;
        
    default:
        jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$conn->close();
?>
