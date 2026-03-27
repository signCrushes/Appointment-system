import React from 'react';
import { Card, Form, Input, Button, Tabs } from 'antd';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Login = () => {
    const { login } = useAppContext();

    const onFinish = (values, role) => {
        // Mock login - accepts any username for easy testing
        login(values.username, role);
    };

    const renderForm = (role) => (
        <Form layout="vertical" onFinish={(values) => onFinish(values, role)} requiredMark={false}>
            <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please input your username!' }]}
            >
                <Input size="large" placeholder="Enter your name" />
            </Form.Item>
            <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
            >
                <Input.Password size="large" placeholder="Enter any password" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block>
                    {role === 'patient' ? 'Book Appointments' : 'Manage Clinic'}
                </Button>
            </Form.Item>
        </Form>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', marginTop: '-80px' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ width: '100%', maxWidth: 420 }}
            >
                <Card bordered={false} style={{ padding: '1rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Activity color="#1677ff" size={48} style={{ marginBottom: 16 }} />
                        <h1 style={{ margin: 0, fontSize: 32, color: '#1677ff', fontWeight: 700 }}>MediConnect</h1>
                        <p style={{ color: '#888', marginTop: 8, fontSize: 15 }}>Premium Healthcare Scheduling</p>
                    </div>

                    <Tabs
                        centered
                        items={[
                            { key: 'patient', label: 'Patient Portal', children: renderForm('patient') },
                            { key: 'admin', label: 'Administrator', children: renderForm('admin') }
                        ]}
                    />
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
