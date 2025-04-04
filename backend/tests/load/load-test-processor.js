const { faker } = require('@faker-js/faker');
const axios = require('axios');

// Generate test user data
function generateTestUser(context, events, done) {
    const user = {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
    };
    context.vars.user = user;
    return done();
}

// Login user and get token
async function loginUser(context, events, done) {
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: context.vars.user.email,
            password: context.vars.user.password
        });
        context.vars.token = response.data.token;
    } catch (error) {
        console.error('Login failed:', error.message);
    }
    return done();
}

// Get authentication token
function getAuthToken(context, events, done) {
    context.vars.token = context.vars.token || 'invalid-token';
    return done();
}

// Store thread ID for subsequent requests
function storeThreadId(context, events, done) {
    if (context.vars.response && context.vars.response.body && context.vars.response.body._id) {
        context.vars.threadId = context.vars.response.body._id;
    }
    return done();
}

// Generate random test data
function generateTestData(context, events, done) {
    context.vars.randomString = faker.lorem.sentence();
    return done();
}

// Monitor response times
function monitorResponseTime(context, events, done) {
    const responseTime = context.vars.response.timings.phases.total;
    events.emit('histogram', 'response_time', responseTime);
    return done();
}

// Check for errors
function checkForErrors(context, events, done) {
    if (context.vars.response.statusCode >= 400) {
        events.emit('counter', 'errors', 1);
    }
    return done();
}

// Monitor memory usage
function monitorMemoryUsage(context, events, done) {
    const memoryUsage = process.memoryUsage();
    events.emit('gauge', 'memory_usage', memoryUsage.heapUsed);
    return done();
}

module.exports = {
    generateTestUser,
    loginUser,
    getAuthToken,
    storeThreadId,
    generateTestData,
    monitorResponseTime,
    checkForErrors,
    monitorMemoryUsage
}; 