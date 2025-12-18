<?php
header('Content-Type: application/json');
require 'db.php';

// Obtener datos de la solicitud
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Validar tabla
$data = [];
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
} 
$table = $_GET['table'] ?? $data['table'] ?? '';
$allowed = ['empleados', 'puestos'];
if (!in_array($table, $allowed, true)) {
    http_response_code(400);
    exit(json_encode(['error' => 'Tabla no permitida']));
}

// Ejecutar la acción solicitada
switch ($action) {
    case 'read':
        readData($table);
        break;
    case 'create':
        createData($table, $data);
        break;
    case 'update':
        updateData($table, $data);
        break;
    case 'delete':
        deleteData($table, $data);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Acción no válida']);
}

// Función para leer datos
function readData($table) {
    global $conn;
    $sql = "SELECT * FROM $table";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode($rows);
}

// Función para crear datos
function createData($table, $data) {
    global $conn;
    
    if ($table === 'empleados') {
        $sql = "INSERT INTO empleados
            (Clave_Empleado, Nombre, A_paterno, A_materno, ID_Puesto, Fecha_Ingreso, Fecha_Baja, Estatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssisss",
            $data['Clave_Empleado'], $data['Nombre'], $data['A_paterno'],
            $data['A_materno'], $data['ID_Puesto'], $data['Fecha_Ingreso'],
            $data['Fecha_Baja'], $data['Estatus']
        );
    } else {
        $sql = "INSERT INTO puestos (Puesto) VALUES (?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $data['Puesto']);
    }
    
    $success = $stmt->execute();
    $id = $conn->insert_id;

    // Obtener el registro recién creado
    if ($success) {
        if ($table === 'empleados') {
            $q = $conn->prepare("SELECT * FROM empleados WHERE ID_Empleado = ?");
            $q->bind_param("i", $id);
            $q->execute();
            $result = $q->get_result();
            $row = $result->fetch_assoc();
        } else {
            $q = $conn->prepare("SELECT * FROM puestos WHERE ID_Puesto = ?");
            $q->bind_param("i", $id);
            $q->execute();
            $result = $q->get_result();
            $row = $result->fetch_assoc();
        }
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false]);
    }
}

// Función para actualizar datos
function updateData($table, $data) {
    global $conn;
    
    if ($table === 'empleados') {
        $sql = "UPDATE empleados SET 
            Clave_Empleado = ?, Nombre = ?, A_paterno = ?, A_materno = ?, 
            ID_Puesto = ?, Fecha_Ingreso = ?, Fecha_Baja = ?, Estatus = ?
            WHERE ID_Empleado = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssisssi",
            $data['Clave_Empleado'], $data['Nombre'], $data['A_paterno'],
            $data['A_materno'], $data['ID_Puesto'], $data['Fecha_Ingreso'],
            $data['Fecha_Baja'], $data['Estatus'], $data['ID_Empleado']
        );
    } else {
        $sql = "UPDATE puestos SET Puesto = ? WHERE ID_Puesto = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $data['Puesto'], $data['ID_Puesto_P']);
    }
    
    $success = $stmt->execute();
    echo json_encode(['success' => $success]);
}

// Función para eliminar datos
function deleteData($table, $data) {
    global $conn;
    
    $idField = $table === 'empleados' ? 'ID_Empleado' : 'ID_Puesto';
    $sql = "DELETE FROM $table WHERE $idField = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $data[$idField]);
    
    $success = $stmt->execute();
    echo json_encode(['success' => $success]);
}
?>