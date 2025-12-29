import { api } from '../lib/api';

export interface LoginResponse {
    message: string;
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export const authService = {
    async login(email: string, password: string) {
        const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
        return data;
    },

    async getProfile() {
        // Returns the user profile (id, name, email, role)
        const { data } = await api.get<{ id: string; name: string; email: string; role: string; phone?: string; avatarUrl?: string }>('/auth/me');
        return data;
    },

    async updateProfile(data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) {
        const response = await api.put('/auth/me', data);
        return response.data;
    },

    async uploadAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ avatarUrl: string }>('/auth/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async revokeSessions() {
        const { data } = await api.post<{ message: string; token: string }>('/auth/me/revoke-sessions');
        return data; // Returns { message, token }
    }
};
