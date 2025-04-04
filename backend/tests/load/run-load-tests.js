const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createTestUser } = require('../helpers');

async function runLoadTests() {
    try {
        console.log('Starting load tests...');

        // Create test users for load testing
        console.log('Creating test users...');
        const testUsers = await Promise.all(
            Array(10).fill().map(() => createTestUser())
        );

        // Run Artillery tests
        console.log('Running load tests...');
        execSync('artillery run forum-load-test.yml', {
            stdio: 'inherit',
            cwd: path.join(__dirname)
        });

        // Generate report
        console.log('Generating report...');
        execSync('artillery report artillery-report.json', {
            stdio: 'inherit',
            cwd: path.join(__dirname)
        });

        // Analyze results
        const reportPath = path.join(__dirname, 'artillery-report.html');
        if (fs.existsSync(reportPath)) {
            console.log(`Load test report generated: ${reportPath}`);
            
            // Read and analyze the report
            const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'artillery-report.json'), 'utf8'));
            
            // Check for performance issues
            const metrics = report.aggregate;
            const issues = [];
            
            if (metrics.latency.p95 > 1000) {
                issues.push('95th percentile latency exceeds 1 second');
            }
            
            if (metrics.rps.mean < 10) {
                issues.push('Requests per second below target');
            }
            
            if (metrics.codes['200'] / metrics.requests.completed < 0.95) {
                issues.push('Success rate below 95%');
            }
            
            // Generate summary
            console.log('\nLoad Test Summary:');
            console.log('-----------------');
            console.log(`Total Requests: ${metrics.requests.completed}`);
            console.log(`Success Rate: ${(metrics.codes['200'] / metrics.requests.completed * 100).toFixed(2)}%`);
            console.log(`Average RPS: ${metrics.rps.mean.toFixed(2)}`);
            console.log(`95th Percentile Latency: ${metrics.latency.p95}ms`);
            
            if (issues.length > 0) {
                console.log('\nPerformance Issues Detected:');
                issues.forEach(issue => console.log(`- ${issue}`));
            }
        }

    } catch (error) {
        console.error('Error running load tests:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runLoadTests();
}

module.exports = runLoadTests; 