const { test, expect } = require('@playwright/test');

const exportPaths = [
    '/tester/ps5/42/leagueteams',
    '/tester/ps5/42/standings',
    '/tester/ps5/42/week/reg/1/defense',
    '/tester/ps5/42/team/7/roster',
    '/tester/ps5/42/freeagents/roster',
];

test('home page shows the exporter banner', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
    await expect(page.locator('body')).toHaveText('Madden Companion Exporter');
});

test('nested GET paths hit the Express 5 catch-all', async ({ page }) => {
    const response = await page.goto('/any/nested/path');
    expect(response.status()).toBe(200);
    await expect(page.locator('body')).toHaveText('Madden Companion Exporter');
});

test('export posts match and report that Firebase is not configured', async ({ request }) => {
    for (const path of exportPaths) {
        const response = await request.post(path, {
            data: {
                leagueTeamInfoList: [],
                teamStandingInfoList: [],
                rosterInfoList: [],
            },
        });
        expect(response.status(), path).toBe(500);
        const body = await response.text();
        expect(body, path).toMatch(/Firebase app does not exist|initializeApp/);
    }
});

test('an unknown POST is not swallowed by the GET catch-all', async ({ request, page }) => {
    const missing = await request.post('/does-not-exist');
    expect(missing.status()).toBe(404);

    const home = await page.goto('/');
    expect(home.status()).toBe(200);
    await expect(page.locator('body')).toHaveText('Madden Companion Exporter');
});
