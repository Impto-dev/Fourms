import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Route } from 'react-router-dom';
import { store } from './store';
import AppRoutes from './AppRoutes';
import theme from './theme';
import { fetchUser } from './store/slices/authSlice';
import Dashboard from './components/Dashboard';
import DashboardAccessManager from './components/DashboardAccessManager';
import DashboardLogin from './components/DashboardLogin';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App = () => {
    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            store.dispatch(fetchUser());
        }
    }, []);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route path="/dashboard/login" element={<DashboardLogin />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard/access" element={
                            <ProtectedRoute>
                                <DashboardAccessManager />
                            </ProtectedRoute>
                        } />
                        <Route path="/*" element={<AppRoutes />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    );
};

export default App; 