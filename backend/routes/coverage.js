const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Coverage } = require('../models/coverage');

// Get current coverage data
router.get('/', async (req, res) => {
    try {
        // Read the latest coverage summary
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

        // Get historical data from database
        const history = await Coverage.find()
            .sort({ date: -1 })
            .limit(30); // Last 30 days

        // Process coverage data
        const current = {
            lines: coverageData.total.lines.pct,
            statements: coverageData.total.statements.pct,
            branches: coverageData.total.branches.pct,
            functions: coverageData.total.functions.pct
        };

        // Process file coverage
        const byFile = Object.entries(coverageData)
            .filter(([key]) => key !== 'total')
            .map(([file, data]) => ({
                name: path.basename(file),
                coverage: data.lines.pct
            }));

        // Process historical data
        const trends = history.map(record => ({
            date: record.date,
            lines: record.lines,
            statements: record.statements,
            branches: record.branches,
            functions: record.functions
        }));

        res.json({
            current,
            byFile,
            trends
        });
    } catch (error) {
        console.error('Error fetching coverage data:', error);
        res.status(500).json({ error: 'Failed to fetch coverage data' });
    }
});

// Save current coverage data
router.post('/', async (req, res) => {
    try {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

        const coverage = new Coverage({
            date: new Date(),
            lines: coverageData.total.lines.pct,
            statements: coverageData.total.statements.pct,
            branches: coverageData.total.branches.pct,
            functions: coverageData.total.functions.pct
        });

        await coverage.save();
        res.status(201).json(coverage);
    } catch (error) {
        console.error('Error saving coverage data:', error);
        res.status(500).json({ error: 'Failed to save coverage data' });
    }
});

module.exports = router; 