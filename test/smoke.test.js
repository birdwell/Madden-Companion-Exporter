const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const appDir = path.join(__dirname, '..');

function freePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(port);
            });
        });
    });
}

function request(port, method, requestPath) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path: requestPath,
                method,
            },
            (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        body: Buffer.concat(chunks).toString('utf8'),
                    });
                });
            }
        );
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy(new Error(`${method} ${requestPath} timed out`));
        });
        req.end();
    });
}

function waitForReady(child, getLogs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`server did not start\n${getLogs()}`));
        }, 20000);

        const onExit = (code, signal) => {
            cleanup();
            reject(
                new Error(
                    `server exited ${code} signal=${signal} before ready\n${getLogs()}`
                )
            );
        };

        const onData = () => {
            if (getLogs().includes('Madden Data is running')) {
                cleanup();
                resolve();
            }
        };

        function cleanup() {
            clearTimeout(timer);
            child.off('exit', onExit);
            child.stdout.off('data', onData);
            child.stderr.off('data', onData);
        }

        child.on('exit', onExit);
        child.stdout.on('data', onData);
        child.stderr.on('data', onData);
        onData();
    });
}

describe('server smoke', () => {
    let child;
    let port;
    let logs = '';

    before(async () => {
        port = await freePort();
        logs = '';
        child = spawn(process.execPath, ['app.js'], {
            cwd: appDir,
            env: { ...process.env, PORT: String(port) },
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.stdout.on('data', (buf) => {
            logs += buf.toString();
        });
        child.stderr.on('data', (buf) => {
            logs += buf.toString();
        });
        await waitForReady(child, () => logs);
    });

    after(async () => {
        if (!child || child.exitCode !== null) {
            return;
        }
        await new Promise((resolve) => {
            const timer = setTimeout(() => {
                child.kill('SIGKILL');
            }, 2000);
            child.once('exit', () => {
                clearTimeout(timer);
                resolve();
            });
            child.kill('SIGTERM');
        });
    });

    it('GET / returns the exporter banner', async () => {
        const res = await request(port, 'GET', '/');
        assert.equal(res.status, 200);
        assert.equal(res.body, 'Madden Companion Exporter');
    });

    it('GET catch-all matches nested paths', async () => {
        const res = await request(port, 'GET', '/any/nested/path');
        assert.equal(res.status, 200);
        assert.equal(res.body, 'Madden Companion Exporter');
    });

    it('POST export routes match and report that Firebase is not configured', async () => {
        const paths = [
            '/tester/ps5/42/leagueteams',
            '/tester/ps5/42/standings',
            '/tester/ps5/42/week/reg/1/defense',
            '/tester/ps5/42/team/7/roster',
            '/tester/ps5/42/freeagents/roster',
        ];

        for (const requestPath of paths) {
            const res = await request(port, 'POST', requestPath);
            assert.equal(res.status, 500, `${requestPath} => ${res.status} ${res.body}`);
            assert.match(res.body, /Firebase app does not exist|initializeApp/);
        }
    });

    it('POST to an unknown path is 404', async () => {
        const res = await request(port, 'POST', '/does-not-exist');
        assert.equal(res.status, 404, res.body);
    });

    it('keeps serving after a failed export', async () => {
        const res = await request(port, 'GET', '/');
        assert.equal(res.status, 200);
        assert.equal(res.body, 'Madden Companion Exporter');
        assert.equal(child.exitCode, null);
    });
});
