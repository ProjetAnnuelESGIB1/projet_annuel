<?php
// API REST pour la gestion des objectifs d'épargne
header("Content-Type: application/json");
require __DIR__ . "/db.php";

// On détecte la méthode HTML
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {

    case "GET":
        // Récupère tous les objectifs, du plus récent au plus ancien
        $stmt = $pdo->query("SELECT * FROM goals ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
        break;

    case "POST":
        // Crée un nouvel objectif (name + target obligatoires, saved initialisé à 0)
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data["name"], $data["target"])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO goals (name, target, saved) VALUES (?, ?, 0)");
        $stmt->execute([$data["name"], $data["target"]]);
        echo json_encode(["success" => true]);
        break;

    case "PUT":
        // Met à jour le montant épargné d'un objectif existant
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data["id"], $data["saved"])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE goals SET saved = ? WHERE id = ?");
        $stmt->execute([$data["saved"], $data["id"]]);
        echo json_encode(["success" => true]);
        break;

    case "DELETE":
        // Supprime un objectif par son id (passé en query string)
        $id = $_GET["id"] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing id"]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM goals WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        break;

    default:
        // Méthode HTTP non supportée
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
