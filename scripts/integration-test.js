#!/usr/bin/env node

/**
 * Integration Test Script
 *
 * Runs smoke tests against the deployed API to validate core endpoints.
 * Usage: API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/stage node scripts/integration-test.js
 *
 * This can be run locally after `pnpm deploy` or as a CI step.
 */

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Optional: Bearer token for authenticated endpoints

if (!API_URL) {
    console.error('❌ API_URL environment variable is required.');
    console.error('   Usage: API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/stage node scripts/integration-test.js');
    process.exit(1);
}

const baseUrl = API_URL.replace(/\/$/, '');
let passed = 0;
let failed = 0;

const headers = {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ ${name}: ${err.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    console.log(`\n🧪 Running integration tests against: ${baseUrl}\n`);

    // ─── Health Check: GET /items ───
    await test('GET /items returns 200 or 401', async () => {
        const res = await fetch(`${baseUrl}/items`, { headers });
        // 200 if authenticated, 401 if not (authorizer blocks it)
        assert(
            res.status === 200 || res.status === 401 || res.status === 403,
            `Expected 200/401/403, got ${res.status}`
        );
    });

    // ─── If we have auth, test CRUD flow ───
    if (AUTH_TOKEN) {
        let createdItemId;

        await test('POST /items creates an item', async () => {
            const res = await fetch(`${baseUrl}/items`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: 'Integration Test Item',
                    description: 'Created by integration test',
                }),
            });
            assert(res.status === 201, `Expected 201, got ${res.status}`);
            const data = await res.json();
            assert(data.itemId, 'Response should contain itemId');
            createdItemId = data.itemId;
        });

        if (createdItemId) {
            await test(`GET /items/${createdItemId} returns the item`, async () => {
                const res = await fetch(`${baseUrl}/items/${createdItemId}`, { headers });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                const data = await res.json();
                assert(data.itemId === createdItemId, 'Item ID should match');
            });

            await test(`DELETE /items/${createdItemId} removes the item`, async () => {
                const res = await fetch(`${baseUrl}/items/${createdItemId}`, {
                    method: 'DELETE',
                    headers,
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
            });

            await test(`GET /items/${createdItemId} returns 404 after deletion`, async () => {
                const res = await fetch(`${baseUrl}/items/${createdItemId}`, { headers });
                assert(res.status === 404, `Expected 404, got ${res.status}`);
            });
        }
    } else {
        console.log('\n  ⚠️  AUTH_TOKEN not set — skipping authenticated CRUD tests');
    }

    // ─── Validation: POST /items with invalid body ───
    await test('POST /items with empty body returns 400 or 401', async () => {
        const res = await fetch(`${baseUrl}/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
        });
        assert(
            res.status === 400 || res.status === 401 || res.status === 403,
            `Expected 400/401/403, got ${res.status}`
        );
    });

    // ─── Results ───
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
