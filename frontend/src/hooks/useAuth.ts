import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginResponse } from '@/services/auth.service';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    phone?: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        authService.getProfile()
            .then((profile) => {
                const u = { id: profile.id, email: profile.email, name: profile.name || '', role: profile.role, avatarUrl: profile.avatarUrl, phone: profile.phone };
                setUser(u);
                localStorage.setItem('user', JSON.stringify(u));
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res: LoginResponse = await authService.login(email, password);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
        navigate('/admin');
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    return { user, loading, login, logout, isAuthenticated: !!user };
}
