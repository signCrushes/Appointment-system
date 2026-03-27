<?php
/**
 * MediConnect — DB Setup
 * Run this ONCE: open http://localhost/mediconnect/setup.php
 * Delete or rename it after running for security.
 */

// define('DB_HOST', 'localhost');
// define('DB_USER', 'root');
// define('DB_PASS', '');

define('DB_USER', 'root');
define('DB_PASS', '');   
try {
    // Connect without selecting a DB so we can CREATE it
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // 1. Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS mediconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE mediconnect");

    // 2. Create tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            username   VARCHAR(100) NOT NULL UNIQUE,
            password   VARCHAR(255) NOT NULL,
            role       ENUM('patient','admin') NOT NULL DEFAULT 'patient',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS doctors (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            name           VARCHAR(100)  NOT NULL,
            specialty      VARCHAR(100)  NOT NULL,
            fee            INT           NOT NULL,
            hospital       VARCHAR(150)  NOT NULL,
            available_days VARCHAR(100)  NOT NULL,   -- JSON array, e.g. [\"Mon\",\"Wed\"]
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS appointments (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            patient_name VARCHAR(100) NOT NULL,
            doctor_id    INT         NOT NULL,
            date         DATE        NOT NULL,
            time         VARCHAR(20) NOT NULL,
            status       ENUM('Pending','Confirmed','Cancelled') NOT NULL DEFAULT 'Pending',
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ");

    // 3. Seed admin user (username: admin | password: admin123)
    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, 'admin')");
    $stmt->execute(['admin', $adminHash]);

    // 4. Seed doctors (only if table is empty)
    $count = $pdo->query("SELECT COUNT(*) FROM doctors")->fetchColumn();
    if ((int)$count === 0) {
        $doctors = [
            ['Dr. Prakash Thapa',   'Cardiologist',        1500, 'Metro Heart Hospital',          '["Mon","Wed","Fri"]'],
            ['Dr. Sanskriti Magar', 'Dermatologist',       2450, 'Skin Care Clinic',              '["Tue","Thu"]'],
            ['Dr. Anish Gurung',    'General Physician',   1300, 'City Medical Center',           '["Mon","Tue","Wed","Thu","Fri"]'],
            ['Dr. Emon Shrestha',   'Neurologist',         5600, 'Brain & Spine Institute',       '["Mon","Thu"]'],
            ['Dr. Raj Kumar Upreti','Orthopedic Surgeon',  6700, 'Bone & Joint Clinic',           '["Tue","Wed","Fri"]'],
            ['Dr. Sumana Dangol',   'Pediatrician',        3350, 'Kids Health Hospital',          '["Mon","Tue","Wed","Thu"]'],
            ['Dr. Isha Manali',     'Ophthalmologist',     2400, 'Vision Care Center',            '["Wed","Thu","Fri"]'],
            ['Dr. Nirayu Shrestha', 'Dentist',             2150, 'Smile Dental Clinic',           '["Mon","Tue","Wed","Thu","Fri"]'],
            ['Dr. Tishan Gupta',    'Urologist',           1550, 'Urology Specialist Center',     '["Mon","Thu"]'],
            ['Dr. Numa Rai',        'Gynecologist',        2480, 'Womens Health Hospital',        '["Tue","Thu","Fri"]'],
            ['Dr. Nirvit Khanal',   'ENT Specialist',      3280, 'Ear, Nose & Throat Clinic',     '["Mon","Tue","Wed"]'],
            ['Dr. Sulav Vaidya',    'Psychiatrist',        1420, 'Mental Health Institute',       '["Wed","Thu"]'],
            ['Dr. Upasana Lama',    'Gastroenterologist',  5500, 'Digestive Health Center',       '["Tue","Fri"]'],
        ];

        $stmt = $pdo->prepare(
            "INSERT INTO doctors (name, specialty, fee, hospital, available_days) VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($doctors as $d) {
            $stmt->execute($d);
        }
    }

    echo "
    <style>body{font-family:sans-serif;max-width:600px;margin:60px auto;padding:24px;background:#f5f5f5;}
    .card{background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);}
    h2{color:#52c41a;} code{background:#f0f0f0;padding:2px 8px;border-radius:4px;} .warn{color:#ff4d4f;margin-top:16px;}</style>
    <div class='card'>
        <h2>✓ Setup complete!</h2>
        <p>Database <code>mediconnect</code> created with all tables and seed data.</p>
        <p><b>Admin login:</b> username <code>admin</code> · password <code>admin123</code></p>
        <p>Patients can log in with any username — they are auto-registered.</p>
        <p class='warn'>⚠ Delete or rename <code>setup.php</code> before going live.</p>
        <p><a href='index.html'>→ Go to MediConnect</a></p>
    </div>";

} catch (PDOException $e) {
    echo "<pre style='color:red'>Setup failed: " . htmlspecialchars($e->getMessage()) . "</pre>";
}
