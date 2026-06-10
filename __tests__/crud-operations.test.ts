
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Load .env.local manually
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase Env Vars");
}

// Admin client to bypass RLS for setup/teardown and verification
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

describe('Supabase CRUD & RLS Integration Tests', () => {
    let testUserId: string;
    let testUserEmail: string;
    let authClient: any; // Client acting as the logged-in user

    beforeAll(async () => {
        // 1. Create a temporary test user
        testUserEmail = `test.crud.${Date.now()}@example.com`;
        const { data: user, error: createError } = await adminClient.auth.admin.createUser({
            email: testUserEmail,
            password: 'password123',
            email_confirm: true,
            user_metadata: { nome: 'Test User' }
        });

        if (createError) throw createError;
        testUserId = user.user.id;

        // 2. Sign in as this user to get a session token
        const { data: sessionData, error: loginError } = await adminClient.auth.signInWithPassword({
            email: testUserEmail,
            password: 'password123'
        });

        if (loginError) throw loginError;

        // 3. Create a client authenticated as this user
        // We use the ANON key but with the user's access token
        authClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            global: {
                headers: {
                    Authorization: `Bearer ${sessionData.session.access_token}`
                }
            }
        });
    });

    afterAll(async () => {
        // Cleanup: Delete the test user (cascades to data usually, but let's be safe)
        if (testUserId) {
            await adminClient.auth.admin.deleteUser(testUserId);
        }
    });

    it('CREATE: Should insert data successfully with RLS', async () => {
        const loteId = crypto.randomUUID();
        const { data, error } = await authClient
            .from('lotes')
            .insert({
                id: loteId,
                user_id: testUserId, // Explicitly sending ID, though RLS checks auth.uid()
                nome: 'Lote Teste CRUD',
                quantidade: 100,
                tipo: 'corte',
                finalidade: 'engorda'
            })
            .select()
            .single();

        if (error) console.error("Create Error:", error);
        expect(error).toBeNull();
        expect(data.id).toBe(loteId);
        expect(data.user_id).toBe(testUserId);
    });

    it('READ: Should read own data', async () => {
        const { data, error } = await authClient
            .from('lotes')
            .select('*')
            .eq('nome', 'Lote Teste CRUD');

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].nome).toBe('Lote Teste CRUD');
    });

    it('UPDATE: Should update own data', async () => {
        // First get the ID
        const { data: lotes } = await authClient.from('lotes').select('id').eq('nome', 'Lote Teste CRUD');
        const loteId = lotes[0].id;

        const { error } = await authClient
            .from('lotes')
            .update({ quantidade: 150 })
            .eq('id', loteId);

        expect(error).toBeNull();

        // Verify update
        const { data: updated } = await authClient.from('lotes').select('quantidade').eq('id', loteId).single();
        expect(updated.quantidade).toBe(150);
    });

    it('DELETE: Should delete own data', async () => {
         const { data: lotes } = await authClient.from('lotes').select('id').eq('nome', 'Lote Teste CRUD');
         const loteId = lotes[0].id;

         const { error } = await authClient
            .from('lotes')
            .delete()
            .eq('id', loteId);

         expect(error).toBeNull();

         // Verify deletion
         const { data } = await authClient.from('lotes').select('*').eq('id', loteId);
         expect(data).toHaveLength(0);
    });

    it('SECURITY: Should NOT access other users data', async () => {
        // Create a second user and some data for them (via Admin)
        const otherEmail = `other.${Date.now()}@example.com`;
        const { data: otherUser, error: createError } = await adminClient.auth.admin.createUser({
            email: otherEmail,
            password: 'password123',
            email_confirm: true
        });

        if (createError || !otherUser?.user) {
            throw new Error("Failed to create second user for security test");
        }

        const otherLoteId = crypto.randomUUID();
        await adminClient.from('lotes').insert({
            id: otherLoteId,
            user_id: otherUser.user.id,
            nome: 'Lote Other User',
            quantidade: 50
        });

        // Try to read with our main test user
        const { data, error } = await authClient
            .from('lotes')
            .select('*')
            .eq('id', otherLoteId);

        // RLS usually returns empty array for unauthorized selects (not error)
        expect(error).toBeNull();
        expect(data).toHaveLength(0);

        // Cleanup second user
        await adminClient.auth.admin.deleteUser(otherUser.user.id);
    });
});
