import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Auth Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';

// Thread Components
import ThreadList from './components/thread/ThreadList';
import ThreadCreate from './components/thread/ThreadCreate';
import ThreadDetail from './components/thread/ThreadDetail';

// Category Components
import CategoryList from './components/category/CategoryList';

// User Components
import UserProfile from './components/user/UserProfile';

// Layout Components
import MainLayout from './components/layout/MainLayout';

const PrivateRoute = ({ children }) => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <MainLayout />
                    </PrivateRoute>
                }
            >
                <Route index element={<ThreadList />} />
                <Route path="threads">
                    <Route path="create" element={<ThreadCreate />} />
                    <Route path=":threadId" element={<ThreadDetail />} />
                </Route>
                <Route path="categories" element={<CategoryList />} />
                <Route path="users/:userId" element={<UserProfile />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes; 