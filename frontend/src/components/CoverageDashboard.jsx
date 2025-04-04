import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, Typography, Grid, Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'scale(1.02)',
    },
}));

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CoverageDashboard = () => {
    const [coverageData, setCoverageData] = useState({
        current: {
            lines: 0,
            statements: 0,
            branches: 0,
            functions: 0
        },
        history: [],
        byFile: [],
        trends: []
    });

    useEffect(() => {
        // Fetch coverage data from the backend
        const fetchCoverageData = async () => {
            try {
                const response = await fetch('/api/coverage');
                const data = await response.json();
                setCoverageData(data);
            } catch (error) {
                console.error('Error fetching coverage data:', error);
            }
        };

        fetchCoverageData();
        const interval = setInterval(fetchCoverageData, 300000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const renderMetricCard = (title, value, target = 80) => {
        const percentage = Math.round(value);
        const color = percentage >= target ? '#4CAF50' : '#F44336';
        
        return (
            <StyledCard>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" style={{ color }}>
                        {percentage}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Target: {target}%
                    </Typography>
                </CardContent>
            </StyledCard>
        );
    };

    const renderTrendChart = () => (
        <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
                Coverage Trends
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coverageData.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="lines" stroke="#0088FE" />
                    <Line type="monotone" dataKey="statements" stroke="#00C49F" />
                    <Line type="monotone" dataKey="branches" stroke="#FFBB28" />
                    <Line type="monotone" dataKey="functions" stroke="#FF8042" />
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    );

    const renderFileCoverageChart = () => (
        <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
                Coverage by File
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData.byFile}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="coverage" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    );

    const renderCoverageDistribution = () => {
        const data = [
            { name: 'Lines', value: coverageData.current.lines },
            { name: 'Statements', value: coverageData.current.statements },
            { name: 'Branches', value: coverageData.current.branches },
            { name: 'Functions', value: coverageData.current.functions }
        ];

        return (
            <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                    Coverage Distribution
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Test Coverage Dashboard
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Lines', coverageData.current.lines)}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Statements', coverageData.current.statements)}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Branches', coverageData.current.branches)}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderMetricCard('Functions', coverageData.current.functions)}
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {renderTrendChart()}
                </Grid>
                <Grid item xs={12} md={4}>
                    {renderCoverageDistribution()}
                </Grid>
                <Grid item xs={12}>
                    {renderFileCoverageChart()}
                </Grid>
            </Grid>
        </Box>
    );
};

export default CoverageDashboard; 