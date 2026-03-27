import React, { useState } from 'react';
import { Tabs, Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber, Row, Col, Popconfirm } from 'antd';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import dayjs from 'dayjs';

const AdminDashboard = () => {
    const { doctors, appointments, updateAppointmentStatus, addDoctor, removeDoctor } = useAppContext();
    const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
    const [form] = Form.useForm();

    // Stats calculation
    const totalAppointments = appointments.length;
    const pendingCount = appointments.filter(a => a.status === 'Pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
    const todayCount = appointments.filter(a => a.date === dayjs().format('YYYY-MM-DD')).length;

    const handleAddDoctor = (values) => {
        addDoctor(values);
        setIsAddDoctorModalOpen(false);
        form.resetFields();
    };

    const appointmentColumns = [
        { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
        {
            title: 'Doctor', key: 'doctorId',
            render: (_, record) => doctors.find(d => d.id === record.doctorId)?.name || 'Unknown'
        },
        { title: 'Date & Time', key: 'datetime', render: (_, record) => `${dayjs(record.date).format('MMM DD, YYYY')} at ${record.time}` },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: status => (
                <Tag color={status === 'Confirmed' ? 'green' : status === 'Cancelled' ? 'red' : 'gold'}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Actions', key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary" size="small" ghost
                        disabled={record.status === 'Confirmed' || record.status === 'Cancelled'}
                        onClick={() => updateAppointmentStatus(record.id, 'Confirmed')}
                    >
                        Confirm
                    </Button>
                    <Button
                        danger size="small" type="text"
                        disabled={record.status === 'Cancelled'}
                        onClick={() => updateAppointmentStatus(record.id, 'Cancelled')}
                    >
                        Cancel
                    </Button>
                </Space>
            )
        }
    ];

    const doctorColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Specialty', dataIndex: 'specialty', key: 'specialty' },
        { title: 'Fee (Rs)', dataIndex: 'fee', key: 'fee', render: fee => `Rs. ${fee}` },
        { title: 'Available Days', dataIndex: 'available_days', key: 'days', render: days => days.join(', ') },
        {
            title: 'Actions', key: 'actions',
            render: (_, record) => (
                <Popconfirm title="Remove this doctor?" onConfirm={() => removeDoctor(record.id)}>
                    <Button danger type="text" size="small">Remove</Button>
                </Popconfirm>
            )
        }
    ];

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                {/* STATS ROW */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} sm={6}>
                        <div className="stat-card">
                            <div className="stat-title"><FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Total Appointments</div>
                            <div className="stat-value">{totalAppointments}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div className="stat-card">
                            <div className="stat-title"><Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Pending</div>
                            <div className="stat-value" style={{ color: '#faad14' }}>{pendingCount}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div className="stat-card">
                            <div className="stat-title"><CheckCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Confirmed</div>
                            <div className="stat-value" style={{ color: '#52c41a' }}>{confirmedCount}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div className="stat-card">
                            <div className="stat-title"><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Today</div>
                            <div className="stat-value" style={{ color: '#1677ff' }}>{todayCount}</div>
                        </div>
                    </Col>
                </Row>

                <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1', label: 'Manage Appointments',
                            children: <Table dataSource={appointments} columns={appointmentColumns} rowKey="id" pagination={{ pageSize: 5 }} />
                        },
                        {
                            key: '2', label: 'Manage Doctors',
                            children: (
                                <>
                                    <Button type="primary" onClick={() => setIsAddDoctorModalOpen(true)} style={{ marginBottom: 16 }}>
                                        + Add New Doctor
                                    </Button>
                                    <Table dataSource={doctors} columns={doctorColumns} rowKey="id" pagination={{ pageSize: 5 }} />
                                </>
                            )
                        }
                    ]} />
                </div>
            </motion.div>

            <Modal
                title="Add New Doctor"
                open={isAddDoctorModalOpen}
                onCancel={() => setIsAddDoctorModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAddDoctor}>
                    <Form.Item name="name" label="Doctor Name" rules={[{ required: true }]}>
                        <Input placeholder="Dr. First Last" />
                    </Form.Item>
                    <Form.Item name="specialty" label="Specialty" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Neurologist" />
                    </Form.Item>
                    <Form.Item name="fee" label="Consultation Fee" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} prefix="Rs." min={0} />
                    </Form.Item>
                    <Form.Item name="available_days" label="Available Days" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Select days">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <Select.Option key={day} value={day}>{day}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>Add Doctor</Button>
                </Form>
            </Modal>
        </div>
    );
};
export default AdminDashboard;
