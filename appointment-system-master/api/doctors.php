<?php
require_once __DIR__ . '/../config.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: return all doctors (public — any logged-in user) ─────────────
if ($method === 'GET') {
    requireSession();
    $rows = getDB()->query("SELECT * FROM doctors ORDER BY id")->fetchAll();

    // Decode available_days JSON string → PHP array
    $rows = array_map(function ($d) {
        $d['available_days'] = json_decode($d['available_days'], true) ?? [];
        $d['id']  = (int)$d['id'];
        $d['fee'] = (int)$d['fee'];
        return $d;
    }, $rows);

    respond($rows);
}

// ── POST: add a new doctor (admin only) ───────────────────────────────
if ($method === 'POST') {
    requireAdmin();
    $body = bodyJSON();

    $name      = trim($body['name'] ?? '');
    $specialty = trim($body['specialty'] ?? '');
    $fee       = (int)($body['fee'] ?? 0);
    $hospital  = trim($body['hospital'] ?? '');
    $days      = $body['available_days'] ?? [];

    if (!$name || !$specialty || !$hospital || $fee <= 0 || empty($days)) {
        respond(['error' => 'All fields required, fee > 0, at least one day'], 400);
    }

    $daysJSON = json_encode(array_values($days));
    $stmt = getDB()->prepare(
        "INSERT INTO doctors (name, specialty, fee, hospital, available_days) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$name, $specialty, $fee, $hospital, $daysJSON]);
    $id = (int)getDB()->lastInsertId();

    respond([
        'id'             => $id,
        'name'           => $name,
        'specialty'      => $specialty,
        'fee'            => $fee,
        'hospital'       => $hospital,
        'available_days' => $days,
    ], 201);
}

// ── DELETE: remove a doctor (admin only) ─────────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respond(['error' => 'Doctor ID required'], 400);

    $stmt = getDB()->prepare("DELETE FROM doctors WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) respond(['error' => 'Doctor not found'], 404);
    respond(['ok' => true]);
}

respond(['error' => 'Method not allowed'], 405);
