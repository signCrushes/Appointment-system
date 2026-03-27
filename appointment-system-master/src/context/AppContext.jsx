import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Initial Mock Data
const initialDoctors = [
    { id: 1, name: 'Dr. John Doe', specialty: 'Cardiologist', fee: 500, available_days: ['Mon', 'Wed', 'Fri'] },
    { id: 2, name: 'Dr. Jane Smith', specialty: 'Dermatologist', fee: 450, available_days: ['Tue', 'Thu'] },
    { id: 3, name: 'Dr. Anish Gurung', specialty: 'General Physician', fee: 300, available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
];

export const AppProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });

    const [doctors, setDoctors] = useState(() => {
        const saved = localStorage.getItem('doctors');
        return saved ? JSON.parse(saved) : initialDoctors;
    });

    const [appointments, setAppointments] = useState(() => {
        const saved = localStorage.getItem('appointments');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync with localStorage
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    useEffect(() => {
        localStorage.setItem('doctors', JSON.stringify(doctors));
    }, [doctors]);

    useEffect(() => {
        localStorage.setItem('appointments', JSON.stringify(appointments));
    }, [appointments]);

    // Actions
    const login = (username, role) => {
        setCurrentUser({ username, role }); // role: 'patient' or 'admin'
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const addDoctor = (doctor) => {
        setDoctors([...doctors, { ...doctor, id: Date.now() }]);
    };

    const removeDoctor = (id) => {
        setDoctors(doctors.filter(d => d.id !== id));
    };

    const bookAppointment = (data) => {
        const newApt = {
            id: Date.now(),
            patientName: currentUser.username,
            doctorId: data.doctorId,
            date: data.date,
            time: data.time,
            status: 'Pending',
            timestamp: new Date().toISOString()
        };
        setAppointments([...appointments, newApt]);
    };

    const updateAppointmentStatus = (id, newStatus) => {
        setAppointments(appointments.map(apt =>
            apt.id === id ? { ...apt, status: newStatus } : apt
        ));
    };

    return (
        <AppContext.Provider value={{
            currentUser, login, logout,
            doctors, addDoctor, removeDoctor,
            appointments, bookAppointment, updateAppointmentStatus
        }}>
            {children}
        </AppContext.Provider>
    );
};
