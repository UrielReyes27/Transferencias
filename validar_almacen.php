<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

// Configuración de conexión
$servername = "localhost";
$username = "root";
$password = ""; // Cambia si es necesario
$dbname = "escaneo_base";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(['error' => 'Error de conexión: ' . $conn->connect_error]));
}

// Obtener datos del POST
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    die(json_encode(['error' => 'Datos JSON inválidos']));
}

if (!isset($data['almacen']) || empty($data['almacen'])) {
    die(json_encode(['error' => 'Código de almacén no proporcionado']));
}

$almacen = $conn->real_escape_string($data['almacen']);

// Consulta para verificar el almacén
$sql = "SELECT id, nombre, activo FROM almacenes WHERE codigo = '$almacen' LIMIT 1";
$result = $conn->query($sql);

if (!$result) {
    die(json_encode(['error' => 'Error en la consulta: ' . $conn->error]));
}

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Almacén no existe']);
} else {
    $row = $result->fetch_assoc();
    if ($row['activo'] == 0) {
        echo json_encode(['error' => 'Almacén inactivo']);
    } else {
        echo json_encode([
            'success' => true,
            'nombre' => $row['nombre']
        ]);
    }
}

$conn->close();
?>