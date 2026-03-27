import React, { useState } from 'react';
import { Tabs, Card, Button, Modal, message, Tag, Empty, Row, Col, Space } from 'antd';
import { Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import dayjs from 'dayjs';

const AVAILABLE_SLOTS = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM'];

const PatientDashboard = () => {
    const { currentUser, doctors, appointments, bookAppointment, updateAppointmentStatus } = useAppContext();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState(null);

    const myAppointments = appointments.filter(a => a.patientName === currentUser.username);

    const handleBookClick = (doctor) => {
        setSelectedDoctor(doctor);
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
        setSelectedTime(null);
        setIsModalVisible(true);
    };

    const handleConfirmBooking = () => {
        if (!selectedTime) return message.warning('Please select a time slot!');
        bookAppointment({ doctorId: selectedDoctor.id, date: selectedDate, time: selectedTime });
        message.success('Appointment requested successfully!');
        setIsModalVisible(false);
    };

    const getBookedSlots = (doctorId, date) => {
        return appointments
            .filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'Cancelled')
            .map(a => a.time);
    };

    const upcomingDates = Array.from({ length: 5 }).map((_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD'));

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1', label: 'Find a Doctor',
                        children: (
                            <Row gutter={[24, 24]}>
                                {doctors.map(doc => (
                                    <Col xs={24} sm={12} lg={8} key={doc.id}>
                                        <Card hoverable className="ant-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{doc.name}</h3>
                                            <p style={{ color: '#666', marginBottom: 16 }}>{doc.specialty}</p>

                                            <Space direction="vertical" size="small" style={{ width: '100%', flex: 1, marginBottom: 'auto' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <DollarSign size={16} color="#888" /> <b>Rs. {doc.fee}</b>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                    <Calendar size={16} color="#888" style={{ marginTop: 4 }} />
                                                    <div>
                                                        {doc.available_days.map(day => <span key={day} className="day-chip">{day}</span>)}
                                                    </div>
                                                </div>
                                            </Space>

                                            <Button type="primary" block style={{ marginTop: 24 }} onClick={() => handleBookClick(doc)}>
                                                Book Appointment
                                            </Button>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )
                    },
                    {
                        key: '2', label: 'My Bookings',
                        children: (
                            <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
                                {myAppointments.length === 0 ? <Empty description="No bookings yet" /> : (
                                    myAppointments.map(apt => {
                                        const doc = doctors.find(d => d.id === apt.doctorId);
                                        return (
                                            <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: 16 }}>{doc?.name || 'Doctor Unknown'}</h4>
                                                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
                                                        {dayjs(apt.date).format('MMMM DD, YYYY')} at {apt.time}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <Tag color={apt.status === 'Confirmed' ? 'green' : apt.status === 'Cancelled' ? 'red' : 'gold'}>
                                                        {apt.status.toUpperCase()}
                                                    </Tag>
                                                    {apt.status !== 'Cancelled' && (
                                                        <Button danger type="text" onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}>
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )
                    }
                ]} />
            </motion.div>

            <Modal
                title={`Book appointment with ${selectedDoctor?.name}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleConfirmBooking}
                okText="Confirm Request"
                width={500}
            >
                <div style={{ padding: '12px 0' }}>
                    <p style={{ fontWeight: 500, marginBottom: 8 }}>Select Date:</p>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
                        {upcomingDates.map(date => (
                            <Button
                                key={date}
                                type={selectedDate === date ? 'primary' : 'default'}
                                onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                            >
                                {dayjs(date).format('MMM DD')}
                            </Button>
                        ))}
                    </div>

                    <p style={{ fontWeight: 500, marginBottom: 12, marginTop: 16 }}>Select Time Slot:</p>
                    <div>
                        {AVAILABLE_SLOTS.map(time => {
                            const bookedSlots = selectedDoctor ? getBookedSlots(selectedDoctor.id, selectedDate) : [];
                            const isDisabled = bookedSlots.includes(time);
                            return (
                                <div
                                    key={time}
                                    className={`time-slot ${selectedTime === time ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => { if (!isDisabled) setSelectedTime(time); }}
                                >
                                    {time}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PatientDashboard;
