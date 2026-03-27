<?php
// ── Database config — change these to match your XAMPP/server setup ──
define('DB_HOST', 'localhost');
define('DB_NAME', 'mediconnect');
define('DB_USER', 'root');
define('DB_PASS', '');          // XAMPP default is empty

// ── Shared helpers ───────────────────────────────────────────────────

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            respond(['error' => 'DB connection failed: ' . $e->getMessage()], 500);
        }
    }
    return $pdo;
}

function respond(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function requireSession(): array {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user'])) respond(['error' => 'Not authenticated'], 401);
    return $_SESSION['user'];
}

function requireAdmin(): array {
    $user = requireSession();
    if ($user['role'] !== 'admin') respond(['error' => 'Admin only'], 403);
    return $user;
}

function bodyJSON(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
