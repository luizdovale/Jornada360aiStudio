
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Bell, User as UserIcon, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    
    // Extrai o nome do usuário do metadata
    const userName = user?.user_metadata?.nome || 'Usuário';

    return (
        <header className="bg-primary pt-10 pb-20 px-5 text-white">
            <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button onClick={onMenuClick} className="w-9 h-9 rounded-full bg-primary-dark/40 flex items-center justify-center text-white">
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link to="/" className="w-9 h-9 rounded-full bg-primary-dark/40 flex items-center justify-center text-white">
                            <Home className="w-5 h-5" />
                        </Link>
                        <span className="text-xs text-muted-foreground">{currentTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <button className="w-9 h-9 rounded-full bg-primary-dark/40 flex items-center justify-center text-white relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent ring-2 ring-primary"></span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary-dark">
                       <UserIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Olá,</p>
                        <p className="text-xl font-bold">{userName}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;