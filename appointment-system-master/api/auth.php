<?php
require_once __DIR__ . '/../config.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: return current logged-in user (or null) ──────────────────────
if ($method === 'GET') {
    respond(['user' => $_SESSION['user'] ?? null]);
}

// ── POST: login or logout ─────────────────────────────────────────────
if ($method === 'POST') {
    $body = bodyJSON();
    $action = $body['action'] ?? '';

    if ($action === 'logout') {
        session_destroy();
        respond(['ok' => true]);
    }

    if ($action === 'login') {
        $username = trim($body['username'] ?? '');
        $role     = $body['role'] ?? 'patient';

        if ($username === '') respond(['error' => 'Username required'], 400);
        if (!in_array($role, ['patient', 'admin'])) respond(['error' => 'Invalid role'], 400);

        $db = getDB();

        // ── Admin: check exact credentials ───────────────────────────
        if ($role === 'admin') {
            $password = $body['password'] ?? '';
            $stmt = $db->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin' LIMIT 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password'])) {
                respond(['error' => 'Invalid admin credentials'], 401);
            }

            $_SESSION['user'] = ['username' => $user['username'], 'role' => 'admin'];
            respond(['user' => $_SESSION['user']]);
        }

        // ── Patient: auto-register on first visit ────────────────────
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $existing = $stmt->fetch();

        if (!$existing) {
            // First time — create account (password not enforced to match original UX)
            $hash = password_hash($body['password'] ?? 'patient', PASSWORD_DEFAULT);
            $ins  = $db->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'patient')");
            $ins->execute([$username, $hash]);
        }

        $_SESSION['user'] = ['username' => $username, 'role' => 'patient'];
        respond(['user' => $_SESSION['user']]);
    }

    respond(['error' => 'Unknown action'], 400);
}

respond(['error' => 'Method not allowed'], 405);
