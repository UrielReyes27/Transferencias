<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'escaneo_base');
if ($conn->connect_error) die(json_encode(['error' => 'Error de conexión']));

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id']);

$sql = "DELETE FROM reportes WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Error al eliminar']);
}

$stmt->close();
$conn->close();
?>