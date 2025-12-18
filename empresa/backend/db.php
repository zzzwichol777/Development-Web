<?php
$host = "localhost";
$user = "root";
$password = "";
$db = "empresa";

$conn = new mysqli($host, $user, $password, $db);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Conexión fallida: ' . $conn->connect_error]));
}

?>
