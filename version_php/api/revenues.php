<?php
// API REST pour la gestion des revenus
header("Content-Type: application/json");
require __DIR__ . "/db.php";

// On détecte la méthode HTML
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {

    case "GET":
        // Récupère tous les revenus, du plus récent au plus ancien
        $stmt = $pdo->query("SELECT * FROM revenues ORDER BY date DESC");
        echo json_encode($stmt->fetchAll());
        break;

    case "POST":
        // Ajoute un nouveau revenu (amount + date obligatoires, description optionnelle)
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data["amount"], $data["date"])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO revenues (amount, date, description) VALUES (?, ?, ?)");
        $stmt->execute([
            $data["amount"],
            $data["date"],
            $data["description"] ?? "Revenu"  // Valeur par défaut si non fournie
        ]);
        echo json_encode(["success" => true]);
        break;

    case "DELETE":
        // Supprime un revenu par son id (passé en query string)
        $id = $_GET["id"] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing id"]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM revenues WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        break;

    default:
        // Méthode HTTP non supportée
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
