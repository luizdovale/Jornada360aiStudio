
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import { Sun } from 'lucide-react';

const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome: nome,
                },
            },
        });

        setLoading(false);

        if (error) {
            toast({ title: "Erro ao cadastrar", description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "Cadastro realizado!", description: "Sua conta foi criada. Por favor, faça o login." });
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-primary flex flex-col justify-center py-12">
            <div className="max-w-sm mx-auto px-6 w-full">
                <div className="mb-8 text-center flex flex-col items-center">
                     <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-4">
                        <Sun className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
                </div>

                <div className="bg-card rounded-3xl shadow-card p-6 space-y-5">
                    <h2 className="text-xl font-bold text-primary-dark">Preencha seus dados</h2>
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                className="w-full mt-1 p-3 bg-white border border-gray-300 rounded-lg text-primary-dark focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark transition"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full mt-1 p-3 bg-white border border-gray-300 rounded-lg text-primary-dark focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark transition"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full mt-1 p-3 bg-white border border-gray-300 rounded-lg text-primary-dark focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark transition"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent text-primary-dark font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-opacity-50 flex items-center justify-center"
                        >
                             {loading ? <div className="w-5 h-5 border-2 border-t-transparent border-primary-dark rounded-full animate-spin"></div> : 'Criar conta'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-accent font-semibold hover:underline">
                        Faça login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;