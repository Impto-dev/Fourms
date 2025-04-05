import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import ThreadList from './components/thread/ThreadList';
import ThreadDetail from './components/thread/ThreadDetail';
import UserProfile from './components/user/UserProfile';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import GitHubCallback from './components/auth/GitHubCallback';
import NotFound from './components/NotFound';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/threads" element={<ThreadList />} />
            <Route path="/threads/:threadId" element={<ThreadDetail />} />
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes; 