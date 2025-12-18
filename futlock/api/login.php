<?php
// =====================================================
// FUTLOCK - API DE AUTENTICACIÓN
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$data = getRequestData();

// Validar que vengan los campos
if (empty($data['username']) || empty($data['password'])) {
    jsonResponse(['success' => false, 'message' => 'Usuario y contraseña son requeridos'], 400);
}

$username = $data['username'];
$password = $data['password'];

$conn = getConnection();

// Buscar el usuario en la base de datos
$stmt = $conn->prepare("SELECT ID_Empleado, Nombres, Apellidos, Username, Password, Rol, Departamento, Puesto FROM Empleados WHERE Username = ? AND Activo = 'S'");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    jsonResponse(['success' => false, 'message' => 'Usuario no encontrado'], 401);
}

$user = $result->fetch_assoc();

// Verificar contraseña (en producción usar password_verify con hash)
if ($user['Password'] !== $password) {
    jsonResponse(['success' => false, 'message' => 'Contraseña incorrecta'], 401);
}

// Login exitoso
jsonResponse([
    'success' => true,
    'message' => 'Login exitoso',
    'user' => [
        'id' => $user['ID_Empleado'],
        'nombre' => $user['Nombres'] . ' ' . $user['Apellidos'],
        'username' => $user['Username'],
        'rol' => $user['Rol'],
        'departamento' => $user['Departamento'],
        'puesto' => $user['Puesto']
    ]
]);

$stmt->close();
$conn->close();
?>
