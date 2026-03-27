<?php
require_once __DIR__ . '/../config.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list appointments ────────────────────────────────────────────
// Admin sees all; patient sees only their own
if ($method === 'GET') {
    $user = requireSession();
    $db   = getDB();

    if ($user['role'] === 'admin') {
        $stmt = $db->query("
            SELECT a.*, d.name AS doctor_name
            FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
            ORDER BY a.date DESC, a.time DESC
        ");
    } else {
        $stmt = $db->prepare("
            SELECT a.*, d.name AS doctor_name
            FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
            WHERE a.patient_name = ?
            ORDER BY a.date DESC, a.time DESC
        ");
        $stmt->execute([$user['username']]);
    }

    $rows = $stmt->fetchAll();
    $rows = array_map(function ($r) {
        $r['id']        = (int)$r['id'];
        $r['doctor_id'] = (int)$r['doctor_id'];
        return $r;
    }, $rows);

    respond($rows);
}

// ── POST: book a new appointment (patient) ────────────────────────────
if ($method === 'POST') {
    $user  = requireSession();
    $body  = bodyJSON();
    $db    = getDB();

    $doctorId = (int)($body['doctor_id'] ?? 0);
    $date     = $body['date'] ?? '';
    $time     = $body['time'] ?? '';

    if (!$doctorId || !$date || !$time) {
        respond(['error' => 'doctor_id, date, and time are required'], 400);
    }

    // Validate date is not in the past
    if ($date < date('Y-m-d')) {
        respond(['error' => 'Cannot book for a past date'], 400);
    }

    // Check slot is not already taken
    $clash = $db->prepare("
        SELECT id FROM appointments
        WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'Cancelled'
        LIMIT 1
    ");
    $clash->execute([$doctorId, $date, $time]);
    if ($clash->fetch()) {
        respond(['error' => 'This slot is already booked'], 409);
    }

    $stmt = $db->prepare("
        INSERT INTO appointments (patient_name, doctor_id, date, time, status)
        VALUES (?, ?, ?, ?, 'Pending')
    ");
    $stmt->execute([$user['username'], $doctorId, $date, $time]);
    $newId = (int)$db->lastInsertId();

    // Return the newly created appointment with doctor name
    $fetch = $db->prepare("
        SELECT a.*, d.name AS doctor_name
        FROM appointments a JOIN doctors d ON d.id = a.doctor_id
        WHERE a.id = ?
    ");
    $fetch->execute([$newId]);
    $apt = $fetch->fetch();
    $apt['id']        = (int)$apt['id'];
    $apt['doctor_id'] = (int)$apt['doctor_id'];

    respond($apt, 201);
}

// ── PUT: update appointment status (Confirm or Cancel) ───────────────
// Admin can confirm OR cancel; patient can only cancel their own
if ($method === 'PUT') {
    $user  = requireSession();
    $body  = bodyJSON();
    $db    = getDB();

    $id     = (int)($body['id'] ?? 0);
    $status = $body['status'] ?? '';

    if (!$id || !in_array($status, ['Confirmed', 'Cancelled'])) {
        respond(['error' => 'id and valid status (Confirmed|Cancelled) required'], 400);
    }

    // Fetch existing appointment
    $stmt = $db->prepare("SELECT * FROM appointments WHERE id = ?");
    $stmt->execute([$id]);
    $apt = $stmt->fetch();
    if (!$apt) respond(['error' => 'Appointment not found'], 404);

    // Patients can only cancel their own appointments
    if ($user['role'] === 'patient') {
        if ($apt['patient_name'] !== $user['username']) respond(['error' => 'Forbidden'], 403);
        if ($status !== 'Cancelled') respond(['error' => 'Patients can only cancel'], 403);
    }

    $upd = $db->prepare("UPDATE appointments SET status = ? WHERE id = ?");
    $upd->execute([$status, $id]);

    respond(['ok' => true, 'id' => $id, 'status' => $status]);
}

respond(['error' => 'Method not allowed'], 405);
