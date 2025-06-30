<?php
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'escaneo_base');

if ($conn->connect_error) {
  die(json_encode(['error' => 'Error de conexión a la BD']));
}

$data = json_decode(file_get_contents('php://input'), true);

$nombre = $conn->real_escape_string($data['nombre']);
$datos = $conn->real_escape_string(json_encode($data));

$sql = "INSERT INTO reportes (nombre, datos) VALUES ('$nombre', '$datos')";

if ($conn->query($sql) === TRUE) {
  echo json_encode(['success' => true]);
} else {
  echo json_encode(['error' => $conn->error]);
}

$conn->close();
?>