<?php
header('Content-Type: application/json');

$filename = 'cards.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Read the JSON file and return its contents
    if (file_exists($filename)) {
        $data = file_get_contents($filename);
        echo $data;
    } else {
        echo json_encode([]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw POST data
    $data = file_get_contents('php://input');
    // Decode the JSON data
    $cards = json_decode($data, true);
    // Write the JSON data to the file
    file_put_contents($filename, json_encode($cards, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>