<?php

// Paramètres de connexion à la base de données
$host = "localhost";
$db   = "budget_app";
$user = "root";
$pass = "";

try {
    // Création de la connexion PDO avec charset UTF-8 et gestion des erreurs par exceptions
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,       // Lance une exception en cas d'erreur SQL
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC   // Retourne les résultats en tableau associatif
        ]
    );
} catch (PDOException $e) {
    // En cas d'échec de connexion, retourne une erreur 500 en JSON et stoppe l'exécution
    http_response_code(500);
    echo json_encode([
        "error" => "Database connection failed",
        "details" => $e->getMessage()
    ]);
    exit;
}
