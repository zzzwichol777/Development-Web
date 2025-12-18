<?php
// =====================================================
// FUTLOCK - API DE CLIENTES (CRUD)
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM Clientes WHERE ID_Cliente = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $cliente = $result->fetch_assoc();
            
            if ($cliente) {
                jsonResponse(['success' => true, 'data' => $cliente]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Cliente no encontrado'], 404);
            }
        } else {
            // Obtener clientes con conteo de pedidos
            $sql = "SELECT c.*, COUNT(p.ID_Pedido) as Total_Pedidos 
                    FROM Clientes c 
                    LEFT JOIN Pedido p ON c.ID_Cliente = p.ID_Cliente 
                    WHERE c.Activo = 'S'";
            
            if ($search) {
                $searchTerm = $conn->real_escape_string($search);
                $sql .= " AND (CONCAT(c.Nombres, ' ', c.Apellidos) LIKE '%$searchTerm%' 
                          OR c.Telefono LIKE '%$searchTerm%'
                          OR c.Email LIKE '%$searchTerm%')";
            }
            
            $sql .= " GROUP BY c.ID_Cliente ORDER BY c.ID_Cliente DESC";
            
            $result = $conn->query($sql);
            $clientes = [];
            while ($row = $result->fetch_assoc()) {
                $clientes[] = $row;
            }
            jsonResponse(['success' => true, 'data' => $clientes]);
        }
        break;
        
    case 'POST':
        $data = getRequestData();
        
        $stmt = $conn->prepare("INSERT INTO Clientes (Nombres, Apellidos, Telefono, Direccion, Email) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", 
            $data['nombres'],
            $data['apellidos'],
            $data['telefono'],
            $data['direccion'],
            $data['email']
        );
        
        if ($stmt->execute()) {
            jsonResponse([
                'success' => true, 
                'message' => 'Cliente creado exitosamente',
                'id' => $conn->insert_id
            ], 201);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al crear cliente: ' . $conn->error], 500);
        }
        break;
        
    case 'PUT':
        $data = getRequestData();
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID de cliente requerido'], 400);
        }
        
        $stmt = $conn->prepare("UPDATE Clientes SET Nombres = ?, Apellidos = ?, Telefono = ?, Direccion = ?, Email = ? WHERE ID_Cliente = ?");
        $stmt->bind_param("sssssi", 
            $data['nombres'],
            $data['apellidos'],
            $data['telefono'],
            $data['direccion'],
            $data['email'],
            $id
        );
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Cliente actualizado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al actualizar cliente'], 500);
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID de cliente requerido'], 400);
        }
        
        $stmt = $conn->prepare("UPDATE Clientes SET Activo = 'N' WHERE ID_Cliente = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Cliente eliminado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al eliminar cliente'], 500);
        }
        break;
        
    default:
        jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$conn->close();
?>
