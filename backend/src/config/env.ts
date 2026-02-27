import { z } from 'zod';

/**
 * Schema de validação para variáveis de ambiente
 * Valida todas as variáveis necessárias no startup da aplicação
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3333),
    HOST: z.string().default('0.0.0.0'),

    // Database
    DATABASE_URL: z.string().url(),

    // Auth
    JWT_SECRET: z.string(),

    // CORS
    CORS_ORIGIN: z.string().default('*'),

    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),

    // AbacatePay
    ABACATEPAY_API_KEY: z.string().min(1),
    ABACATEPAY_API_URL: z.string().url().default('https://api.abacatepay.com'),
    ABACATEPAY_WEBHOOK_SECRET: z.string().optional(),

    // Melhor Envio
    MELHORENVIO_TOKEN: z.string().min(1),
    MELHORENVIO_URL: z.string().url().default('https://sandbox.melhorenvio.com.br/api/v2'),
    STORE_ZIP_CODE: z.string().min(8),
});

type Env = z.infer<typeof envSchema>;

/**
 * Valida e retorna as variáveis de ambiente
 * Lança erro se alguma variável obrigatória estiver faltando ou inválida
 */
function validateEnv(): Env {
    try {
        const validated = envSchema.parse(process.env);

        if (validated.JWT_SECRET.length < 32 && validated.JWT_SECRET !== 'supersecret_change_me_in_prod') {
            console.warn('⚠️  AVISO: JWT_SECRET deve ter pelo menos 32 caracteres para produção!');
        }

        return validated;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n');
            throw new Error(
                `❌ Erro de validação de variáveis de ambiente:\n${missingVars}\n\n` +
                `Por favor, verifique seu arquivo .env e certifique-se de que todas as variáveis obrigatórias estão definidas.`
            );
        }
        throw error;
    }
}

export const env = validateEnv();

/**
 * Configurações derivadas/computadas
 */
export const config = {
    server: {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        isDevelopment: env.NODE_ENV === 'development',
        isProduction: env.NODE_ENV === 'production',
    },
    database: {
        url: env.DATABASE_URL,
    },
    auth: {
        jwtSecret: env.JWT_SECRET,
    },
    cors: {
        origin: env.CORS_ORIGIN === '*' ? true : (env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : true),
    },
    supabase: {
        url: env.SUPABASE_URL || '',
        key: env.SUPABASE_SERVICE_ROLE_KEY || '',
        anonKey: env.SUPABASE_ANON_KEY || ''
    },
    abacatepay: {
        apiKey: env.ABACATEPAY_API_KEY,
        apiUrl: env.ABACATEPAY_API_URL,
        webhookSecret: env.ABACATEPAY_WEBHOOK_SECRET || '',
    }
} as const;
