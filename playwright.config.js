const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 20000,
    use: {
        baseURL: 'http://127.0.0.1:3001',
        channel: 'chrome',
    },
    webServer: {
        command: 'node app.js',
        url: 'http://127.0.0.1:3001',
        reuseExistingServer: false,
        timeout: 20000,
        env: {
            ...process.env,
            PORT: '3001',
        },
    },
});
