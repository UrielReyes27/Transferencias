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

// Consulta SQL para obtener reportes
$sql = "SELECT id, nombre, fecha_creacion, datos FROM reportes ORDER BY fecha_creacion DESC";
$result = $conn->query($sql);

if (!$result) {
    die(json_encode(['error' => 'Error en la consulta: ' . $conn->error]));
}

$reportes = array();

while ($row = $result->fetch_assoc()) {
    $reporte = array(
        'id' => $row['id'],
        'nombre' => $row['nombre'],
        'fecha_creacion' => $row['fecha_creacion'],
        'datos' => $row['datos'] // Mantenemos como string JSON
    );
    array_push($reportes, $reporte);
}

$conn->close();

echo json_encode($reportes);
?>