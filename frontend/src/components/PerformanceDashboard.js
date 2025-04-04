import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Button
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { performanceMonitor } from '../utils/performanceMonitor';
import PerformanceService from '../services/performanceService';

/**
 * Performance dashboard component
 * @returns {React.ReactElement} Performance dashboard
 */
const PerformanceDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await PerformanceService.measurePerformance();
                setMetrics(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    const renderMetricCard = (title, value, unit = '') => (
        <Card>
            <CardContent>
                <Typography color="textSecondary" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="h5" component="h2">
                    {value} {unit}
                </Typography>
            </CardContent>
        </Card>
    );

    const renderChart = (data, dataKey, name) => (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} name={name} stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
    );

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Performance Dashboard
            </Typography>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Load Time', metrics.loadTime, 'ms')}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('DOM Ready', metrics.domReadyTime, 'ms')}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Network Latency', metrics.networkLatency, 'ms')}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Memory Usage', (metrics.memoryUsage / 1024 / 1024).toFixed(2), 'MB')}
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Render Times
                            </Typography>
                            {renderChart(metrics.renderTimes, 'duration', 'Render Time')}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Memory Usage
                            </Typography>
                            {renderChart(metrics.memoryHistory, 'usage', 'Memory Usage')}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box mt={3}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Component Metrics
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Component</TableCell>
                                        <TableCell align="right">Render Time (ms)</TableCell>
                                        <TableCell align="right">Mount Time (ms)</TableCell>
                                        <TableCell align="right">Update Count</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(metrics.componentMetrics).map(([name, data]) => (
                                        <TableRow key={name}>
                                            <TableCell component="th" scope="row">
                                                {name}
                                            </TableCell>
                                            <TableCell align="right">{data.renderTime?.toFixed(2)}</TableCell>
                                            <TableCell align="right">{data.mountTime?.toFixed(2)}</TableCell>
                                            <TableCell align="right">{data.updateCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>

            <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => performanceMonitor.clear()}
                >
                    Clear Metrics
                </Button>
            </Box>
        </Box>
    );
};

export default PerformanceDashboard; 