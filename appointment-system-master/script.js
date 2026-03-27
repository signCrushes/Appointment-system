// ── Constants ──────────────────────────────────────────────────────────
const SLOTS = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
               '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM'];

// ── App state (in-memory) ──────────────────────────────────────────────
let app = {
    currentUser:    null,
    doctors:        [],
    appointments:   [],
    selectedDoctor: null,
    selectedDate:   null,
    selectedTime:   null,
};

// ── API helper ─────────────────────────────────────────────────────────
async function api(path, method = 'GET', body = null) {
    const opts = {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
    };
    if (body !== null) opts.body = JSON.stringify(body);

    const res = await fetch('api/' + path, opts);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
}

// ── Bootstrap ──────────────────────────────────────────────────────────
async function init() {
    try {
        const { user } = await api('auth.php');
        if (user) {
            app.currentUser = user;
            await loadData();
            showDashboard(user.role);
        } else {
            showLoginPage();
        }
    } catch (e) {
        showLoginPage();
    }
}

async function loadData() {
    const [doctors, appointments] = await Promise.all([
        api('doctors.php'),
        api('appointments.php'),
    ]);
    app.doctors      = doctors;
    app.appointments = appointments;
}

// ── Auth ───────────────────────────────────────────────────────────────
async function handleLogin(e, role) {
    e.preventDefault();
    const form     = document.getElementById(role + '-form');
    const username = form.querySelector('input[type="text"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;

    try {
        const { user } = await api('auth.php', 'POST', { action: 'login', username, password, role });
        app.currentUser = user;
        await loadData();
        showDashboard(role);
    } catch (err) {
        alert(err.message || 'Login failed');
    }
}

async function logout() {
    await api('auth.php', 'POST', { action: 'logout' });
    app.currentUser = app.doctors = null;
    app.appointments = [];
    showLoginPage();
}

// ── Page routing ───────────────────────────────────────────────────────
function toggle(id, show) {
    document.getElementById(id).classList.toggle('hidden', !show);
}

function showLoginPage() {
    toggle('header',       false);
    toggle('login-page',   true);
    toggle('patient-page', false);
    toggle('admin-page',   false);
    document.getElementById('patient-form').reset();
    document.getElementById('admin-form').reset();
    switchTab('patient');
}

function showDashboard(role) {
    toggle('login-page',   false);
    toggle('header',       true);
    toggle('patient-page', role === 'patient');
    toggle('admin-page',   role === 'admin');
    document.getElementById('username-display').textContent = app.currentUser.username;
    document.getElementById('role-display').textContent     = role;
    role === 'patient' ? renderPatient() : renderAdmin();
}

// ── Login tab switch ───────────────────────────────────────────────────
function switchTab(role) {
    document.querySelectorAll('.tabs .tab-btn').forEach((b, i) =>
        b.classList.toggle('active', (i === 0) === (role === 'patient'))
    );
    document.getElementById('patient-form').classList.toggle('active', role === 'patient');
    document.getElementById('admin-form').classList.toggle('active',   role === 'admin');
}

function switchTab2(tabs, contents, index) {
    tabs.forEach((t, i)     => t.classList.toggle('active', i === index));
    contents.forEach((c, i) => c.classList.toggle('active', i === index));
}

// ── Patient dashboard ──────────────────────────────────────────────────
function renderPatient() {
    const grid = document.getElementById('doctors-grid');
    grid.innerHTML = app.doctors.map(d => `
        <div class="doctor-card">
            <h3>${d.name}</h3>
            <p>${d.specialty}</p>
            <p style="color:#999;font-size:13px;margin:4px 0 12px;">🏥 ${d.hospital}</p>
            <div class="doctor-info">
                <div class="doctor-info-row"><span>💰</span><b>Rs. ${d.fee}</b></div>
                <div class="doctor-info-row"><span>📅</span>
                    <div>${d.available_days.map(dy => `<span class="day-chip">${dy}</span>`).join('')}</div>
                </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="openBookingModal(${d.id})">Book Appointment</button>
        </div>
    `).join('');
    renderBookings();
    switchTab2(
        document.querySelectorAll('#patient-page .tabs-container .tab-btn'),
        document.querySelectorAll('#patient-page .tab-content'),
        0
    );
}

function renderBookings() {
    const list   = document.getElementById('bookings-list');
    const myApts = app.appointments.filter(a => a.patient_name === app.currentUser.username);

    if (!myApts.length) {
        list.innerHTML = '<div class="empty-message">No bookings yet</div>';
        return;
    }

    list.innerHTML = `<div class="bookings-list">${myApts.map(a => {
        const d = new Date(a.date + 'T00:00:00')
            .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        return `
            <div class="booking-item">
                <div class="booking-info">
                    <h4>${a.doctor_name || 'Unknown'}</h4>
                    <p>${d} at ${a.time}</p>
                </div>
                <div class="booking-actions">
                    <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
                    ${a.status !== 'Cancelled'
                        ? `<button class="btn btn-danger btn-small" onclick="cancelApt(${a.id})">Cancel</button>`
                        : ''}
                </div>
            </div>`;
    }).join('')}</div>`;
}

function switchPatientTab(tab) {
    switchTab2(
        document.querySelectorAll('#patient-page .tabs-container .tab-btn'),
        document.querySelectorAll('#patient-page .tab-content'),
        tab === 'doctors' ? 0 : 1
    );
    if (tab === 'bookings') renderBookings();
}

// ── Booking modal ──────────────────────────────────────────────────────
function openBookingModal(id) {
    app.selectedDoctor = app.doctors.find(d => d.id === id);
    app.selectedDate   = new Date().toISOString().split('T')[0];
    app.selectedTime   = null;
    document.getElementById('modal-title').textContent = `Book appointment with ${app.selectedDoctor.name}`;
    renderDates();
    renderTimes();
    toggle('booking-modal', true);
}

function closeBookingModal() {
    toggle('booking-modal', false);
    app.selectedDoctor = app.selectedDate = app.selectedTime = null;
}

function renderDates() {
    const c = document.getElementById('date-slots');
    c.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const d    = new Date();
        d.setDate(d.getDate() + i);
        const date = d.toISOString().split('T')[0];
        const fmt  = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const btn  = document.createElement('button');
        btn.className = `btn time-slot ${app.selectedDate === date ? 'selected' : ''}`;
        btn.textContent = fmt;
        btn.onclick = () => {
            app.selectedDate = date;
            app.selectedTime = null;
            renderDates();
            renderTimes();
        };
        c.appendChild(btn);
    }
}

function getBooked(doctorId, date) {
    return app.appointments
        .filter(a => a.doctor_id === doctorId && a.date === date && a.status !== 'Cancelled')
        .map(a => a.time);
}

function renderTimes() {
    const c      = document.getElementById('time-slots');
    c.innerHTML  = '';
    const booked = getBooked(app.selectedDoctor.id, app.selectedDate);

    SLOTS.forEach(t => {
        const disabled = booked.includes(t);
        const div      = document.createElement('div');
        div.className  = `time-slot ${app.selectedTime === t ? 'selected' : ''} ${disabled ? 'disabled' : ''}`;
        div.textContent = t;
        if (!disabled) div.onclick = () => { app.selectedTime = t; renderTimes(); };
        c.appendChild(div);
    });
}

async function confirmBooking() {
    if (!app.selectedTime) { alert('Select a time slot!'); return; }

    try {
        const newApt = await api('appointments.php', 'POST', {
            doctor_id: app.selectedDoctor.id,
            date:      app.selectedDate,
            time:      app.selectedTime,
        });
        app.appointments.push(newApt);
        alert('Appointment requested!');
        closeBookingModal();
        renderBookings();
    } catch (err) {
        alert(err.message || 'Booking failed');
    }
}

async function cancelApt(id) {
    try {
        await api('appointments.php', 'PUT', { id, status: 'Cancelled' });
        const apt = app.appointments.find(a => a.id === id);
        if (apt) apt.status = 'Cancelled';
        renderBookings();
    } catch (err) {
        alert(err.message || 'Could not cancel');
    }
}

// ── Admin dashboard ────────────────────────────────────────────────────
function renderAdmin() {
    const row       = document.getElementById('stats-row');
    const pending   = app.appointments.filter(a => a.status === 'Pending').length;
    const confirmed = app.appointments.filter(a => a.status === 'Confirmed').length;
    const today     = new Date().toISOString().split('T')[0];
    const todayCount = app.appointments.filter(a => a.date === today).length;

    row.innerHTML = `
        <div class="stat-card"><div class="stat-title">📋 Total Appointments</div>
            <div class="stat-value">${app.appointments.length}</div></div>
        <div class="stat-card"><div class="stat-title">⏳ Pending</div>
            <div class="stat-value" style="color:#faad14">${pending}</div></div>
        <div class="stat-card"><div class="stat-title">✓ Confirmed</div>
            <div class="stat-value" style="color:#52c41a">${confirmed}</div></div>
        <div class="stat-card"><div class="stat-title">📅 Today</div>
            <div class="stat-value" style="color:#1677ff">${todayCount}</div></div>
    `;

    renderAptTable();
    renderDocTable();
    switchTab2(
        document.querySelectorAll('#admin-page .tabs-container .tab-btn'),
        document.querySelectorAll('#admin-page .tab-content'),
        0
    );
}

function renderAptTable() {
    const tbody = document.getElementById('appointments-tbody');
    tbody.innerHTML = app.appointments.map(a => {
        const d = new Date(a.date + 'T00:00:00')
            .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        return `
            <tr>
                <td>${a.patient_name}</td>
                <td>${a.doctor_name || 'Unknown'}</td>
                <td>${d} at ${a.time}</td>
                <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
                <td>
                    ${a.status !== 'Confirmed' && a.status !== 'Cancelled'
                        ? `<button class="btn btn-primary btn-small" onclick="confirmApt(${a.id})">Confirm</button>`
                        : ''}
                    ${a.status !== 'Cancelled'
                        ? `<button class="btn btn-danger btn-small" onclick="cancelAptAdmin(${a.id})" style="margin-left:8px;">Cancel</button>`
                        : ''}
                </td>
            </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#999;">No appointments</td></tr>';
}

function renderDocTable() {
    document.getElementById('doctors-tbody').innerHTML = app.doctors.map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.specialty}</td>
            <td>${d.hospital}</td>
            <td>Rs. ${d.fee}</td>
            <td>${d.available_days.join(', ')}</td>
            <td><button class="btn btn-danger btn-small" onclick="removeDoc(${d.id})">Remove</button></td>
        </tr>
    `).join('');
}

async function confirmApt(id) {
    try {
        await api('appointments.php', 'PUT', { id, status: 'Confirmed' });
        const apt = app.appointments.find(a => a.id === id);
        if (apt) apt.status = 'Confirmed';
        renderAdmin();
    } catch (err) {
        alert(err.message || 'Error');
    }
}

async function cancelAptAdmin(id) {
    try {
        await api('appointments.php', 'PUT', { id, status: 'Cancelled' });
        const apt = app.appointments.find(a => a.id === id);
        if (apt) apt.status = 'Cancelled';
        renderAdmin();
    } catch (err) {
        alert(err.message || 'Error');
    }
}

function switchAdminTab(tab) {
    switchTab2(
        document.querySelectorAll('#admin-page .tabs-container .tab-btn'),
        document.querySelectorAll('#admin-page .tab-content'),
        tab === 'appointments' ? 0 : 1
    );
}

// ── Add/Remove Doctor ──────────────────────────────────────────────────
function openAddDoctorModal() {
    toggle('add-doctor-modal', true);
    document.getElementById('add-doctor-form').reset();
    document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
}

function closeAddDoctorModal() {
    toggle('add-doctor-modal', false);
}

async function handleAddDoctor(e) {
    e.preventDefault();
    const days = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => cb.value);
    if (!days.length) { alert('Select at least one day!'); return; }

    try {
        const newDoc = await api('doctors.php', 'POST', {
            name:           document.getElementById('doctor-name').value,
            specialty:      document.getElementById('doctor-specialty').value,
            fee:            parseInt(document.getElementById('doctor-fee').value),
            hospital:       document.getElementById('doctor-hospital').value,
            available_days: days,
        });
        app.doctors.push(newDoc);
        closeAddDoctorModal();
        renderDocTable();
        renderPatient();
    } catch (err) {
        alert(err.message || 'Failed to add doctor');
    }
}

async function removeDoc(id) {
    if (!confirm('Remove this doctor?')) return;
    try {
        await api('doctors.php?id=' + id, 'DELETE');
        app.doctors = app.doctors.filter(d => d.id !== id);
        renderDocTable();
        renderPatient();
    } catch (err) {
        alert(err.message || 'Failed to remove doctor');
    }
}

// ── Init & global modal close ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', e => {
    if (e.target.id === 'booking-modal')    closeBookingModal();
    if (e.target.id === 'add-doctor-modal') closeAddDoctorModal();
});