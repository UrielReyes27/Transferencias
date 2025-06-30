<?php
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'escaneo_base');

if ($conn->connect_error) {
  die(json_encode(['error' => 'Error de conexión a la BD']));
}

$data = json_decode(file_get_contents('php://input'), true);
$codigo = $conn->real_escape_string($data['codigo']);

$sql = "SELECT descripcion, activo FROM productos WHERE codigo = '$codigo'";
$result = $conn->query($sql);

if ($result->num_rows === 0) {
  echo json_encode(['error' => 'Artículo no existe']);
} else {
  $row = $result->fetch_assoc();
  if ($row['activo'] == 0) {
    echo json_encode(['error' => 'Artículo inactivo']);
  } else {
    echo json_encode(['descripcion' => $row['descripcion']]);
  }
}

$conn->close();
?>