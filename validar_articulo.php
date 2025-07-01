<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'escaneo_base');

if ($conn->connect_error) {
  die(json_encode(['error' => 'Error de conexión: ' . $conn->connect_error]));
}

$data = json_decode(file_get_contents('php://input'), true);
$codigo = isset($data['codigo']) ? trim($conn->real_escape_string($data['codigo'])) : '';

if (empty($codigo)) {
  die(json_encode(['error' => 'Código no proporcionado']));
}

// Consulta mejorada con LIMIT 1
$sql = "SELECT descripcion, activo FROM productos WHERE codigo = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $codigo);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
  echo json_encode(['error' => 'Artículo no existe']);
} else {
  $row = $result->fetch_assoc();
  if ($row['activo'] == 0) {
    echo json_encode(['error' => 'Artículo inactivo']);
  } else {
    echo json_encode([
      'descripcion' => $row['descripcion'] ?? ''
    ]);
  }
}

$stmt->close();
$conn->close();
?>