<?php
// =====================================================
// FUTLOCK - API DE EMPLEADOS (CRUD)
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        // Obtener todos los empleados o uno específico
        $id = $_GET['id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM Empleados WHERE ID_Empleado = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $empleado = $result->fetch_assoc();
            
            if ($empleado) {
                jsonResponse(['success' => true, 'data' => $empleado]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Empleado no encontrado'], 404);
            }
        } else {
            $sql = "SELECT * FROM Empleados WHERE Activo = 'S'";
            
            if ($search) {
                $searchTerm = $conn->real_escape_string($search);
                $sql .= " AND (CONCAT(Nombres, ' ', Apellidos) LIKE '%$searchTerm%' 
                          OR Departamento LIKE '%$searchTerm%'
                          OR Puesto LIKE '%$searchTerm%'
                          OR Username LIKE '%$searchTerm%')";
            }
            
            $sql .= " ORDER BY ID_Empleado DESC";
            
            $result = $conn->query($sql);
            $empleados = [];
            while ($row = $result->fetch_assoc()) {
                $empleados[] = $row;
            }
            jsonResponse(['success' => true, 'data' => $empleados]);
        }
        break;
        
    case 'POST':
        // Crear nuevo empleado
        $data = getRequestData();
        
        $stmt = $conn->prepare("INSERT INTO Empleados (Nombres, Apellidos, Telefono, Direccion, Email, Departamento, Puesto, Username, Password, Rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssssssss", 
            $data['nombres'],
            $data['apellidos'],
            $data['telefono'],
            $data['direccion'],
            $data['email'],
            $data['departamento'],
            $data['puesto'],
            $data['username'],
            $data['password'],
            $data['rol']
        );
        
        if ($stmt->execute()) {
            jsonResponse([
                'success' => true, 
                'message' => 'Empleado creado exitosamente',
                'id' => $conn->insert_id
            ], 201);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al crear empleado: ' . $conn->error], 500);
        }
        break;
        
    case 'PUT':
        // Actualizar empleado
        $data = getRequestData();
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID de empleado requerido'], 400);
        }
        
        // Si se proporciona password, actualizar también la contraseña
        if (isset($data['password']) && !empty($data['password'])) {
            $stmt = $conn->prepare("UPDATE Empleados SET Nombres = ?, Apellidos = ?, Telefono = ?, Direccion = ?, Email = ?, Departamento = ?, Puesto = ?, Username = ?, Password = ?, Rol = ? WHERE ID_Empleado = ?");
            $stmt->bind_param("ssssssssssi", 
                $data['nombres'],
                $data['apellidos'],
                $data['telefono'],
                $data['direccion'],
                $data['email'],
                $data['departamento'],
                $data['puesto'],
                $data['username'],
                $data['password'],
                $data['rol'],
                $id
            );
        } else {
            // No actualizar password
            $stmt = $conn->prepare("UPDATE Empleados SET Nombres = ?, Apellidos = ?, Telefono = ?, Direccion = ?, Email = ?, Departamento = ?, Puesto = ?, Username = ?, Rol = ? WHERE ID_Empleado = ?");
            $stmt->bind_param("sssssssssi", 
                $data['nombres'],
                $data['apellidos'],
                $data['telefono'],
                $data['direccion'],
                $data['email'],
                $data['departamento'],
                $data['puesto'],
                $data['username'],
                $data['rol'],
                $id
            );
        }
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Empleado actualizado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al actualizar empleado'], 500);
        }
        break;
        
    case 'DELETE':
        // Eliminar empleado (soft delete)
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID de empleado requerido'], 400);
        }
        
        $stmt = $conn->prepare("UPDATE Empleados SET Activo = 'N' WHERE ID_Empleado = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Empleado eliminado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al eliminar empleado'], 500);
        }
        break;
        
    default:
        jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$conn->close();
?>
