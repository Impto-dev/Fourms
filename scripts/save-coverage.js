const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function saveCoverageData() {
    try {
        // Read coverage summary
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

        // Prepare data for API
        const data = {
            lines: coverageData.total.lines.pct,
            statements: coverageData.total.statements.pct,
            branches: coverageData.total.branches.pct,
            functions: coverageData.total.functions.pct
        };

        // Send to API
        await axios.post('http://localhost:3000/api/coverage', data);
        console.log('Coverage data saved successfully');
    } catch (error) {
        console.error('Error saving coverage data:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    saveCoverageData();
}

module.exports = saveCoverageData; 