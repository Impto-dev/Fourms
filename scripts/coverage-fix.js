const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
const { createTestUser } = require('./helpers');

// Configuration
const COVERAGE_THRESHOLD = 80;
const IGNORE_FILES = [
    'backend/tests',
    'backend/config',
    'backend/migrations'
];

// Code type detection patterns
const CODE_PATTERNS = {
    ROUTE: /router\.(get|post|put|delete)/,
    MODEL: /mongoose\.model|Schema\(/,
    SERVICE: /class.*Service|function.*Service/,
    MIDDLEWARE: /function.*Middleware|module\.exports\s*=\s*\(req,\s*res,\s*next\)/,
    UTILITY: /function.*Utils|module\.exports\s*=\s*{/
};

// Helper function to get coverage data
function getCoverageData() {
    try {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        if (!fs.existsSync(coveragePath)) {
            console.log('Running coverage report...');
            execSync('npm run test:coverage', { stdio: 'inherit' });
        }
        return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    } catch (error) {
        console.error('Error getting coverage data:', error);
        process.exit(1);
    }
}

// Helper function to detect code type
function detectCodeType(fileContent) {
    for (const [type, pattern] of Object.entries(CODE_PATTERNS)) {
        if (pattern.test(fileContent)) {
            return type;
        }
    }
    return 'GENERIC';
}

// Helper function to analyze file coverage
function analyzeFileCoverage(filePath, coverage) {
    const metrics = ['lines', 'statements', 'functions', 'branches'];
    const issues = [];

    metrics.forEach(metric => {
        const covered = coverage[metric].covered;
        const total = coverage[metric].total;
        const percentage = (covered / total) * 100;

        if (percentage < COVERAGE_THRESHOLD) {
            issues.push({
                metric,
                percentage: percentage.toFixed(2),
                covered,
                total
            });
        }
    });

    return issues;
}

// Helper function to suggest fixes
function suggestFixes(filePath, issues, codeType) {
    const suggestions = [];
    
    issues.forEach(issue => {
        switch (issue.metric) {
            case 'branches':
                suggestions.push(`- Add test cases for conditional branches in ${filePath}`);
                break;
            case 'functions':
                suggestions.push(`- Add test cases for untested functions in ${filePath}`);
                break;
            case 'lines':
                suggestions.push(`- Add test cases for uncovered lines in ${filePath}`);
                break;
            case 'statements':
                suggestions.push(`- Add test cases for uncovered statements in ${filePath}`);
                break;
        }
    });

    // Add type-specific suggestions
    switch (codeType) {
        case 'ROUTE':
            suggestions.push('- Test different HTTP methods and status codes');
            suggestions.push('- Test request validation and error handling');
            suggestions.push('- Test authentication and authorization');
            break;
        case 'MODEL':
            suggestions.push('- Test model validation rules');
            suggestions.push('- Test model methods and hooks');
            suggestions.push('- Test model relationships');
            break;
        case 'SERVICE':
            suggestions.push('- Test service methods with different inputs');
            suggestions.push('- Test error handling and edge cases');
            suggestions.push('- Test service dependencies and mocking');
            break;
        case 'MIDDLEWARE':
            suggestions.push('- Test middleware chain execution');
            suggestions.push('- Test error handling and next() calls');
            suggestions.push('- Test request/response modification');
            break;
        case 'UTILITY':
            suggestions.push('- Test utility functions with various inputs');
            suggestions.push('- Test edge cases and error conditions');
            suggestions.push('- Test function composition');
            break;
    }

    return suggestions;
}

// Helper function to generate route test template
function generateRouteTestTemplate(moduleName) {
    return `
    describe('${moduleName} Routes', () => {
        let token;
        let testUser;
        
        before(async () => {
            // Setup test user and get token
            testUser = await createTestUser();
            token = testUser.generateAuthToken();
        });

        describe('GET /api/${moduleName.toLowerCase()}', () => {
            it('should return list of ${moduleName.toLowerCase()}s', async () => {
                const res = await chai.request(app)
                    .get('/api/${moduleName.toLowerCase()}')
                    .set('Authorization', \`Bearer \${token}\`);

                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array');
            });

            it('should handle pagination', async () => {
                const res = await chai.request(app)
                    .get('/api/${moduleName.toLowerCase()}?page=1&limit=10')
                    .set('Authorization', \`Bearer \${token}\`);

                expect(res).to.have.status(200);
                expect(res.body).to.have.property('data').that.is.an('array');
                expect(res.body).to.have.property('pagination');
            });

            it('should handle filtering', async () => {
                const res = await chai.request(app)
                    .get('/api/${moduleName.toLowerCase()}?status=active')
                    .set('Authorization', \`Bearer \${token}\`);

                expect(res).to.have.status(200);
                expect(res.body.data).to.satisfy(items => 
                    items.every(item => item.status === 'active')
                );
            });

            it('should handle sorting', async () => {
                const res = await chai.request(app)
                    .get('/api/${moduleName.toLowerCase()}?sort=-createdAt')
                    .set('Authorization', \`Bearer \${token}\`);

                expect(res).to.have.status(200);
                expect(res.body.data).to.satisfy(items => {
                    const dates = items.map(item => new Date(item.createdAt));
                    return dates.every((date, i) => 
                        i === 0 || date <= dates[i - 1]
                    );
                });
            });
        });

        describe('POST /api/${moduleName.toLowerCase()}', () => {
            it('should create new ${moduleName.toLowerCase()}', async () => {
                const testData = {
                    // TODO: Add required fields for ${moduleName}
                };

                const res = await chai.request(app)
                    .post('/api/${moduleName.toLowerCase()}')
                    .set('Authorization', \`Bearer \${token}\`)
                    .send(testData);

                expect(res).to.have.status(201);
                expect(res.body).to.include(testData);
            });

            it('should validate required fields', async () => {
                const res = await chai.request(app)
                    .post('/api/${moduleName.toLowerCase()}')
                    .set('Authorization', \`Bearer \${token}\`)
                    .send({});

                expect(res).to.have.status(400);
                expect(res.body).to.have.property('errors');
            });

            it('should handle unique constraints', async () => {
                const testData = {
                    // TODO: Add unique field for ${moduleName}
                };

                // First request should succeed
                await chai.request(app)
                    .post('/api/${moduleName.toLowerCase()}')
                    .set('Authorization', \`Bearer \${token}\`)
                    .send(testData);

                // Second request should fail
                const res = await chai.request(app)
                    .post('/api/${moduleName.toLowerCase()}')
                    .set('Authorization', \`Bearer \${token}\`)
                    .send(testData);

                expect(res).to.have.status(409);
            });

            it('should handle authorization', async () => {
                const res = await chai.request(app)
                    .post('/api/${moduleName.toLowerCase()}')
                    .send({});

                expect(res).to.have.status(401);
            });
        });

        describe('PUT /api/${moduleName.toLowerCase()}/:id', () => {
            it('should update ${moduleName.toLowerCase()}', async () => {
                const updateData = {
                    // TODO: Add update fields for ${moduleName}
                };

                const res = await chai.request(app)
                    .put(\`/api/${moduleName.toLowerCase()}/\${testId}\`)
                    .set('Authorization', \`Bearer \${token}\`)
                    .send(updateData);

                expect(res).to.have.status(200);
                expect(res.body).to.include(updateData);
            });

            it('should handle not found', async () => {
                const res = await chai.request(app)
                    .put('/api/${moduleName.toLowerCase()}/nonexistent')
                    .set('Authorization', \`Bearer \${token}\`)
                    .send({});

                expect(res).to.have.status(404);
            });

            it('should handle ownership', async () => {
                const otherUser = await createTestUser();
                const otherToken = otherUser.generateAuthToken();

                const res = await chai.request(app)
                    .put(\`/api/${moduleName.toLowerCase()}/\${testId}\`)
                    .set('Authorization', \`Bearer \${otherToken}\`)
                    .send({});

                expect(res).to.have.status(403);
            });
        });

        describe('DELETE /api/${moduleName.toLowerCase()}/:id', () => {
            it('should delete ${moduleName.toLowerCase()}', async () => {
                const res = await chai.request(app)
                    .delete(\`/api/${moduleName.toLowerCase()}/\${testId}\`)
                    .set('Authorization', \`Bearer \${token}\`);

                expect(res).to.have.status(204);
            });

            it('should handle cascading deletes', async () => {
                // TODO: Add test for related data deletion
            });
        });
    });`;
}

// Helper function to generate model test template
function generateModelTestTemplate(moduleName) {
    return `
    describe('${moduleName} Model', () => {
        it('should validate required fields', async () => {
            const model = new ${moduleName}();
            try {
                await model.validate();
                throw new Error('Validation should have failed');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
                expect(error.errors).to.exist;
            }
        });

        it('should handle custom validators', async () => {
            const model = new ${moduleName}({
                // TODO: Add test data that triggers custom validators
            });
            try {
                await model.validate();
                throw new Error('Validation should have failed');
            } catch (error) {
                expect(error.errors).to.exist;
            }
        });

        it('should execute pre-save hooks', async () => {
            const model = new ${moduleName}({
                // TODO: Add test data
            });
            const spy = sinon.spy(model, 'preSaveHook');
            await model.save();
            expect(spy.calledOnce).to.be.true;
        });

        it('should handle virtual fields', async () => {
            const model = new ${moduleName}({
                // TODO: Add test data for virtual fields
            });
            expect(model.virtualField).to.exist;
            expect(model.virtualField).to.equal(expectedValue);
        });

        it('should handle model methods', async () => {
            const model = new ${moduleName}({
                // TODO: Add test data
            });
            const result = await model.customMethod();
            expect(result).to.exist;
        });

        it('should handle model statics', async () => {
            const result = await ${moduleName}.staticMethod();
            expect(result).to.exist;
        });

        it('should handle model queries', async () => {
            const result = await ${moduleName}.find()
                .where('field').equals('value')
                .exec();
            expect(result).to.be.an('array');
        });

        it('should handle model population', async () => {
            const result = await ${moduleName}.find()
                .populate('relatedField')
                .exec();
            expect(result[0].relatedField).to.exist;
        });
    });`;
}

// Helper function to generate service test template
function generateServiceTestTemplate(moduleName) {
    return `
    describe('${moduleName} Service', () => {
        let service;
        let mockDependency;
        let mockRepository;

        beforeEach(() => {
            mockDependency = sinon.stub();
            mockRepository = {
                find: sinon.stub(),
                findById: sinon.stub(),
                create: sinon.stub(),
                update: sinon.stub(),
                delete: sinon.stub()
            };
            service = new ${moduleName}Service(mockRepository, mockDependency);
        });

        it('should handle successful operations', async () => {
            const testData = {
                // TODO: Add test data
            };
            mockRepository.create.resolves(testData);

            const result = await service.create(testData);
            expect(result).to.deep.equal(testData);
            expect(mockRepository.create.calledWith(testData)).to.be.true;
        });

        it('should handle errors', async () => {
            mockRepository.find.rejects(new Error('Database error'));

            try {
                await service.findAll();
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
                expect(error.message).to.equal('Database error');
            }
        });

        it('should handle edge cases', async () => {
            // Test with empty input
            const result = await service.processData([]);
            expect(result).to.be.an('array').that.is.empty;

            // Test with null input
            try {
                await service.processData(null);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
            }
        });

        it('should handle service dependencies', async () => {
            const testData = {
                // TODO: Add test data
            };
            mockDependency.process.returns(testData);

            const result = await service.processWithDependency(testData);
            expect(result).to.deep.equal(testData);
            expect(mockDependency.process.calledWith(testData)).to.be.true;
        });

        it('should handle caching', async () => {
            const testData = {
                // TODO: Add test data
            };
            mockRepository.findById.onFirstCall().resolves(testData);
            mockRepository.findById.onSecondCall().resolves({ ...testData, modified: true });

            const result1 = await service.getById('test-id');
            const result2 = await service.getById('test-id');

            expect(result1).to.deep.equal(result2);
            expect(mockRepository.findById.calledOnce).to.be.true;
        });

        it('should handle transactions', async () => {
            const testData = {
                // TODO: Add test data
            };
            mockRepository.create.resolves(testData);
            mockRepository.update.resolves(testData);

            const result = await service.updateWithTransaction('test-id', testData);
            expect(result).to.deep.equal(testData);
            expect(mockRepository.create.called).to.be.true;
            expect(mockRepository.update.called).to.be.true;
        });
    });`;
}

// Helper function to generate middleware test template
function generateMiddlewareTestTemplate(moduleName) {
    return `
    describe('${moduleName} Middleware', () => {
        let req;
        let res;
        let next;
        let middleware;

        beforeEach(() => {
            req = {
                headers: {},
                body: {},
                params: {},
                query: {},
                user: null
            };
            res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub()
            };
            next = sinon.stub();
            middleware = new ${moduleName}Middleware();
        });

        it('should call next() on success', async () => {
            req.headers.authorization = 'Bearer valid-token';
            await middleware.handle(req, res, next);
            expect(next.calledOnce).to.be.true;
        });

        it('should handle missing authorization header', async () => {
            await middleware.handle(req, res, next);
            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should handle invalid token', async () => {
            req.headers.authorization = 'Bearer invalid-token';
            await middleware.handle(req, res, next);
            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should handle expired token', async () => {
            req.headers.authorization = 'Bearer expired-token';
            await middleware.handle(req, res, next);
            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should handle rate limiting', async () => {
            // Make multiple requests
            for (let i = 0; i < 11; i++) {
                await middleware.handle(req, res, next);
            }
            expect(res.status.calledWith(429)).to.be.true;
        });

        it('should handle request validation', async () => {
            req.body = { invalid: 'data' };
            await middleware.validateRequest(req, res, next);
            expect(res.status.calledWith(400)).to.be.true;
            expect(res.json.calledWithMatch({ errors: sinon.match.array })).to.be.true;
        });

        it('should handle response formatting', async () => {
            res.locals.data = { test: 'data' };
            await middleware.formatResponse(req, res, next);
            expect(res.json.calledWithMatch({
                success: true,
                data: { test: 'data' }
            })).to.be.true;
        });

        it('should handle error responses', async () => {
            const error = new Error('Test error');
            await middleware.handleError(error, req, res, next);
            expect(res.status.calledWith(500)).to.be.true;
            expect(res.json.calledWithMatch({
                success: false,
                error: 'Test error'
            })).to.be.true;
        });
    });`;
}

// Helper function to generate utility test template
function generateUtilityTestTemplate(moduleName) {
    return `
    describe('${moduleName} Utilities', () => {
        it('should handle normal input', () => {
            const input = {
                // TODO: Add normal input data
            };
            const result = ${moduleName}Utils.process(input);
            expect(result).to.exist;
            expect(result).to.have.property('expectedField');
        });

        it('should handle edge cases', () => {
            // Test with empty input
            const emptyResult = ${moduleName}Utils.process({});
            expect(emptyResult).to.be.an('object');

            // Test with null input
            const nullResult = ${moduleName}Utils.process(null);
            expect(nullResult).to.be.null;

            // Test with undefined input
            const undefinedResult = ${moduleName}Utils.process(undefined);
            expect(undefinedResult).to.be.undefined;
        });

        it('should handle invalid input', () => {
            try {
                ${moduleName}Utils.process('invalid');
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
            }
        });

        it('should maintain consistency', () => {
            const input = {
                // TODO: Add test data
            };
            const result1 = ${moduleName}Utils.process(input);
            const result2 = ${moduleName}Utils.process(input);
            expect(result1).to.deep.equal(result2);
        });

        it('should handle string operations', () => {
            const result = ${moduleName}Utils.formatString('test');
            expect(result).to.be.a('string');
            expect(result).to.match(/expected pattern/);
        });

        it('should handle number operations', () => {
            const result = ${moduleName}Utils.calculate(1, 2);
            expect(result).to.be.a('number');
            expect(result).to.equal(3);
        });

        it('should handle date operations', () => {
            const result = ${moduleName}Utils.formatDate(new Date());
            expect(result).to.be.a('string');
            expect(result).to.match(/\\d{4}-\\d{2}-\\d{2}/);
        });

        it('should handle array operations', () => {
            const input = [1, 2, 3];
            const result = ${moduleName}Utils.processArray(input);
            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(3);
        });

        it('should handle object operations', () => {
            const input = { a: 1, b: 2 };
            const result = ${moduleName}Utils.processObject(input);
            expect(result).to.be.an('object');
            expect(result).to.have.property('a', 1);
        });
    });`;
}

// Helper function to generate test template
function generateTestTemplate(filesWithLowCoverage) {
    let template = `const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
const { createTestUser } = require('./helpers');

// Coverage fix tests
describe('Coverage Fix Tests', () => {
`;

    filesWithLowCoverage.forEach(({ file, codeType }) => {
        const relativePath = file.replace('backend/', '');
        const moduleName = path.basename(file, '.js');
        const fileContent = fs.readFileSync(file, 'utf8');
        const detectedType = detectCodeType(fileContent);
        
        template += `
    // ${file}
    describe('${moduleName}', () => {`;

        switch (detectedType) {
            case 'ROUTE':
                template += generateRouteTestTemplate(moduleName);
                break;
            case 'MODEL':
                template += generateModelTestTemplate(moduleName);
                break;
            case 'SERVICE':
                template += generateServiceTestTemplate(moduleName);
                break;
            case 'MIDDLEWARE':
                template += generateMiddlewareTestTemplate(moduleName);
                break;
            case 'UTILITY':
                template += generateUtilityTestTemplate(moduleName);
                break;
            default:
                template += `
        it('should have complete test coverage', () => {
            // TODO: Add specific test cases for uncovered code
            expect(true).to.be.true;
        });`;
        }

        template += `
    });`;
    });

    template += `
});`;

    return template;
}

// Main function
function analyzeCoverage() {
    console.log('Analyzing coverage data...\n');
    
    const coverageData = getCoverageData();
    const filesWithLowCoverage = [];
    const allSuggestions = [];

    Object.entries(coverageData).forEach(([filePath, coverage]) => {
        // Skip ignored files
        if (IGNORE_FILES.some(ignore => filePath.includes(ignore))) {
            return;
        }

        const issues = analyzeFileCoverage(filePath, coverage);
        if (issues.length > 0) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const codeType = detectCodeType(fileContent);
            
            filesWithLowCoverage.push({
                file: filePath,
                issues,
                codeType
            });
            
            const suggestions = suggestFixes(filePath, issues, codeType);
            allSuggestions.push(...suggestions);
        }
    });

    // Generate report
    if (filesWithLowCoverage.length > 0) {
        console.log('Files with low coverage:');
        filesWithLowCoverage.forEach(({ file, issues, codeType }) => {
            console.log(`\n${file} (${codeType}):`);
            issues.forEach(issue => {
                console.log(`  ${issue.metric}: ${issue.percentage}% (${issue.covered}/${issue.total})`);
            });
        });

        console.log('\nSuggested fixes:');
        allSuggestions.forEach(suggestion => {
            console.log(suggestion);
        });

        // Generate test file template
        console.log('\nGenerating test file template...');
        const testTemplate = generateTestTemplate(filesWithLowCoverage);
        const testFilePath = path.join(process.cwd(), 'backend', 'tests', 'coverage-fixes.test.js');
        fs.writeFileSync(testFilePath, testTemplate);
        console.log(`Test template written to ${testFilePath}`);
    } else {
        console.log('All files meet the coverage threshold!');
    }
}

// Run the analysis
analyzeCoverage(); 