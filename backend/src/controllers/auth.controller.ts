import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import * as bcrypt from 'bcryptjs';

export const login = async (request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = request.body;

    try {
        // 1. Find or Create Profile
        // In a real Supabase setup, the user is created in Supabase Auth first, 
        // and we sync the profile here via webhook or on-login. 
        // For MVP transparency, we'll upsert based on email.

        let profile = await prisma.profile.findUnique({
            where: { email }
        });

        if (!profile) {
            return reply.status(401).send({ message: 'Invalid email or password' });
        }

        if (!profile.password_hash) {
            return reply.status(401).send({ message: 'User has no password set. Please contact admin.' });
        }

        const isValid = await bcrypt.compare(password, profile.password_hash);
        if (!isValid) {
            return reply.status(401).send({ message: 'Invalid email or password' });
        }

        // 2. Generate JWT
        const token = await reply.jwtSign({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            version: profile.tokenVersion
        });

        return reply.send({
            message: 'Login successful',
            token,
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role
            }
        });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = request.user as { id: string };

        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                avatarUrl: true
            }
        });

        if (!profile) {
            return reply.status(404).send({ message: 'User not found' });
        }

        return reply.send(profile);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

export const updateMe = async (request: FastifyRequest<{ Body: { name?: string, phone?: string, currentPassword?: string, newPassword?: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { name, phone, currentPassword, newPassword } = request.body;

    try {
        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        // Password Change Logic
        if (currentPassword && newPassword) {
            const profile = await prisma.profile.findUnique({ where: { id: user.id } });
            if (!profile || !profile.password_hash) {
                return reply.status(400).send({ message: 'User not found or no password set' });
            }

            const isValid = await bcrypt.compare(currentPassword, profile.password_hash);
            if (!isValid) {
                return reply.status(400).send({ message: 'Senha atual incorreta.' });
            }

            // Strong Password Validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return reply.status(400).send({ message: 'A senha deve ter pelo menos 8 caracteres, incluir maiúscula, minúscula, número e especial.' });
            }
            if (newPassword.includes('123')) {
                return reply.status(400).send({ message: 'A senha não pode conter sequências simples como "123".' });
            }

            const hash = await bcrypt.hash(newPassword, 6);
            updateData.password_hash = hash;
        }

        const updatedProfile = await prisma.profile.update({
            where: { id: user.id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true }
        });

        reply.send(updatedProfile);

    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ message: 'Failed to update profile' });
    }
};

export const uploadAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
        const part = await request.file();
        if (!part) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        const buffer = await part.toBuffer();
        const filename = `${user.id}-${Date.now()}.png`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filename, buffer, {
                contentType: part.mimetype,
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: publicData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

        const avatarUrl = publicData.publicUrl;

        await prisma.profile.update({
            where: { id: user.id },
            data: { avatarUrl }
        });

        reply.send({ avatarUrl });

    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ message: 'Failed to upload avatar' });
    }
};

export const revokeSessions = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
        // Increment token version to invalidate all OLD tokens
        const updated = await prisma.profile.update({
            where: { id: user.id },
            data: { tokenVersion: { increment: 1 } }
        });

        // Generate a NEW token for THIS session so the user doesn't get logged out
        const newToken = await reply.jwtSign({
            id: updated.id,
            email: updated.email,
            role: updated.role,
            version: updated.tokenVersion
        });

        return reply.send({
            message: 'Todas as outras sessões foram desconectadas.',
            token: newToken
        });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Failed to revoke sessions' });
    }
};
