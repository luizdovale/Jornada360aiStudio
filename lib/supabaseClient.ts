import { createClient } from '@supabase/supabase-js';

// NOTA: Em um projeto real, estas variáveis de ambiente devem ser configuradas
// no seu ambiente de build (ex: .env.local e nas configurações do Vercel/Netlify).
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjQ0NTg4MDAsImV4cCI6MTk3OTkzNTYwMH0.placeholder_signature';

let supabase;

const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co';

if (isPlaceholder) {
    console.warn("Supabase client is mocked. The app will not connect to a database, but the UI will be interactive.");

    // Este cliente mockado previne erros de "Failed to fetch" e permite que a UI funcione
    // para fins de demonstração, sem uma conexão real com o backend.
    const createMockSupabaseClient = () => {
        let session = null;
        const listeners = new Set();

        const triggerAuthStateChange = (event, newSession) => {
            session = newSession;
            // @ts-ignore
            listeners.forEach(listener => listener(event, session));
        };

        const mockQueryBuilder = (tableName) => ({
            select: () => mockQueryBuilder(tableName),
            insert: (data) => ({
                select: () => ({ single: async () => ({ data: { id: Date.now().toString(), ...data }, error: null })})
            }),
            update: (data) => ({
                eq: () => ({ select: () => ({ single: async () => ({ data, error: null })})})
            }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
            upsert: (data) => ({
                select: () => ({ single: async () => ({ data, error: null })})
            }),
            eq: (column, value) => mockQueryBuilder(tableName),
            order: (column, options) => mockQueryBuilder(tableName),
            single: async () => ({
                data: null,
                error: { message: "No rows found", code: "PGRST116" }
            }),
            then: (resolve) => resolve({ data: [], error: null }),
        });

        return {
            auth: {
                getSession: async () => ({ data: { session }, error: null }),
                signInWithPassword: async ({ email, password }) => {
                    // Lógica atualizada: Qualquer e-mail/senha funciona no modo mock
                    if (email && password) {
                        const nameFromEmail = email.split('@')[0];
                        const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
                        
                        const user = { id: 'mock-user-id', email, user_metadata: { nome: capitalizedName || 'Usuário de Teste' } };
                        // @ts-ignore
                        const newSession = { user, access_token: 'mock-token', expires_in: 3600, expires_at: Date.now() + 3600 * 1000 };
                        triggerAuthStateChange('SIGNED_IN', newSession);
                        return { data: { session: newSession, user }, error: null };
                    }
                    return { data: { session: null, user: null }, error: { message: 'Credenciais inválidas no modo mock' } };
                },
                signUp: async ({ email, options }) => {
                     const user = { id: 'mock-user-id', email, user_metadata: options.data };
                     return { data: { session: null, user }, error: null };
                },
                signOut: async () => {
                    triggerAuthStateChange('SIGNED_OUT', null);
                    return { error: null };
                },
                onAuthStateChange: (callback) => {
                    // @ts-ignore
                    listeners.add(callback);
                    // Dispara o estado inicial
                    setTimeout(() => callback('INITIAL_SESSION', session), 0);
                    return {
                        data: {
                            subscription: {
                                // @ts-ignore
                                unsubscribe: () => listeners.delete(callback),
                            },
                        },
                    };
                },
                resetPasswordForEmail: async (email) => {
                    console.log(`[MOCK] Solicitação de redefinição de senha para ${email}`);
                    return { data: {}, error: null };
                },
                 updateUser: async ({ data, password }) => {
                    if (session && session.user) {
                        const updatedUser = {
                            ...session.user,
                            user_metadata: { ...session.user.user_metadata, ...data }
                        };
                        const newSession = { ...session, user: updatedUser };
                        triggerAuthStateChange('USER_UPDATED', newSession);
                        return { data: { user: updatedUser }, error: null };
                    }
                    return { data: { user: null }, error: { message: "User not authenticated" } };
                },
            },
            from: mockQueryBuilder,
        };
    };

    supabase = createMockSupabaseClient();
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };