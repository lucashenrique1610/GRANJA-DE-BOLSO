
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Load .env.local manually for tests
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !match[1].startsWith('#')) {
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[match[1].trim()] = value;
        }
    });
}

describe('Supabase Integration & Connection Tests', () => {
    let adminClient;
    let anonClient;
    const testId = `test_${Date.now()}`;

    beforeAll(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !serviceKey || !anonKey) {
            throw new Error("Missing Supabase Environment Variables for Testing");
        }

        adminClient = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        anonClient = createClient(url, anonKey, {
            auth: { persistSession: false }
        });
    });

    it('should connect to Supabase using Service Role Key', async () => {
        // Try to read from a public table or check health
        // Using a known table 'pix_transactions' or 'profiles'
        const { error } = await adminClient.from('pix_transactions').select('count').limit(1);
        expect(error).toBeNull();
    });

    it('should allow Service Role to write data (Bypass RLS)', async () => {
        const { data, error } = await adminClient
            .from('pix_transactions')
            .insert({
                mercadopago_id: testId,
                user_id: 'integration_test_user',
                amount: 10.50,
                status: 'pending',
                plan_id: 'test_plan'
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.mercadopago_id).toBe(testId);
    });

    it('should NOT allow Anon Client to read private data (RLS Check)', async () => {
        // Anon client (without login) should not see the data we just inserted
        const { data, error } = await anonClient
            .from('pix_transactions')
            .select('*')
            .eq('mercadopago_id', testId);

        // Depending on RLS policy configuration:
        // 1. Returns error 401/403
        // 2. Returns empty array (if select policy exists but filters out rows)
        
        // In our case, policy is "TO authenticated USING (user_id = auth.uid())"
        // So anon user (uid null) matches nothing. Should return empty array.
        
        expect(error).toBeNull(); // Connection is fine
        expect(data).toHaveLength(0); // RLS filtered the row
    });

    afterAll(async () => {
        // Cleanup
        if (adminClient) {
            await adminClient
                .from('pix_transactions')
                .delete()
                .eq('mercadopago_id', testId);
        }
    });
});
