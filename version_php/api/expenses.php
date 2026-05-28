<?php
// api/expenses.php
header("Content-Type: application/json");
require __DIR__ . "/db.php";

// On détecte la méthode HTML
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {

    // =====================
    // GET : récupérer toutes les dépenses
    // =====================
    case "GET":
        $stmt = $pdo->query(
            "SELECT * FROM expenses ORDER BY date DESC"
        );
        echo json_encode($stmt->fetchAll());
        break;

    // =====================
    // POST : ajouter une dépense
    // =====================
    case "POST":
        $data = json_decode(file_get_contents("php://input"), true);

        if (
            !isset($data["amount"], $data["date"], $data["description"], $data["category"])
        ) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO expenses (amount, date, description, category)
             VALUES (?, ?, ?, ?)"
        );

        $stmt->execute([
            $data["amount"],
            $data["date"],
            $data["description"],
            $data["category"]
        ]);

        echo json_encode(["success" => true]);
        break;

    // =====================
    // PUT : modifier une dépense
    // =====================
    case "PUT":
        $data = json_decode(file_get_contents("php://input"), true);

        if (
            !isset($data["id"], $data["amount"], $data["date"], $data["description"], $data["category"])
        ) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            exit;
        }

        $stmt = $pdo->prepare(
            "UPDATE expenses
             SET amount = ?, date = ?, description = ?, category = ?
             WHERE id = ?"
        );

        $stmt->execute([
            $data["amount"],
            $data["date"],
            $data["description"],
            $data["category"],
            $data["id"]
        ]);

        echo json_encode(["success" => true]);
        break;

    // =====================
    // DELETE : supprimer une dépense
    // =====================
    case "DELETE":
        $id = $_GET["id"] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing id"]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(["success" => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
