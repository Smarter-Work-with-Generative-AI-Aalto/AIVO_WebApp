import { test, expect } from '@playwright/test';

test.describe('AI Research API', () => {
    test('POST /api/ai-research should create a new AI research request', async ({ request }) => {
        const response = await request.post('/api/ai-research', {
            data: {
                userId: '6024ce3c-c197-4671-a721-171cf81bface',
                teamId: '8ab9445b-aaa6-43c7-b85f-15cc456f42eb',
                documentIds: ['05e18045-8273-468b-b0d8-2999fcd10d36', '0a7252a9-b882-4797-9e7d-27c0e8fd33c0'],
                userSearchQuery: 'What are the Qualitative insights in these document extracts?'
            },
            headers: {
                Authorization: `Bearer 6f6b2156561a904945984fa21d6c89f2`,
                
            }
        });

        expect(response.status()).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('status', 'in queue');
    });
});
