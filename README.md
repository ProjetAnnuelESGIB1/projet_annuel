✅ ÉTAPE 1 — Créer la base de données

CREATE DATABASE budget_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

✅ ÉTAPE 2 — Créer la table expenses (dépenses)

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

✅ ÉTAPE 3 — Créer la table revenues (revenus)

CREATE TABLE revenues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

✅ ÉTAPE 4 — Créer la table goals (objectifs d’épargne)

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target DECIMAL(10,2) NOT NULL,
  saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

