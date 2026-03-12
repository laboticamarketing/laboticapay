export const validateCpf = (cpf: string): boolean => {
    if (!cpf) return false;

    // Remove non-digits
    const cleanCpf = cpf.replace(/\D/g, '');

    // Check length
    if (cleanCpf.length !== 11) return false;

    // Check for repeated numbers (e.g. 111.111.111-11)
    if (/^(\d)\1+$/.test(cleanCpf)) return false;

    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
};

export const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskDate = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{4})\d+?$/, '$1');
};

export const maskRG = (value: string) => {
    let raw = value.replace(/\D/g, '');
    if (raw.length > 10) raw = raw.slice(0, 10);
    return raw
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const maskPhone = (v: string) => {
    return v
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2'); // Handles 8 or 9 digit phones accurately
};

export const unmask = (value?: string | null): string => {
    if (!value) return '';
    return value.replace(/\D/g, '');
};

/** Máscara para número do cartão (4 grupos de 4 dígitos) */
export const maskCard = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/** Máscara para validade do cartão (MM/AA) */
export const maskCardExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
};

/** Mantém apenas dígitos (ex.: número da casa). */
export const maskOnlyDigits = (value: string, maxLength?: number): string => {
    let digits = value.replace(/\D/g, '');
    if (maxLength != null && digits.length > maxLength) digits = digits.slice(0, maxLength);
    return digits;
};

/** Retorna telefone no padrão internacional (E.164 Brasil: 55 + DDD + número, só dígitos). */
export const toInternationalPhone = (phone?: string | null): string => {
    const raw = unmask(phone);
    if (!raw) return '';
    if (raw.length === 10 || raw.length === 11) return '55' + raw;
    return raw;
};

/** Formata telefone internacional (ex.: 5511999999999) para exibição (ex.: (11) 99999-9999). */
export const formatPhoneForDisplay = (phone?: string | null): string => {
    const raw = unmask(phone);
    if (!raw) return '';
    const local = raw.length >= 12 && raw.startsWith('55') ? raw.slice(2) : raw;
    return maskPhone(local);
};

export function validatePasswordStrength(password: string): { score: number; feedback: string[] } {
    let score = 0;
    const feedback: string[] = [];
    if (password.length >= 8) score++;
    else feedback.push('A senha deve ter pelo menos 8 caracteres');
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Inclua pelo menos uma letra maiúscula');
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Inclua pelo menos uma letra minúscula');
    if (/[0-9]/.test(password)) score++;
    else feedback.push('Inclua pelo menos um número');
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Inclua pelo menos um caractere especial (!@#$%^&*)');
    return { score, feedback };
}

export function maskCEP(value: string) {
    const v = value.replace(/\D/g, '');
    return v.replace(/^(\d{5})(\d)/, '$1-$2');
}

export const validatePhone = (phone?: string | null): boolean => {
    if (!phone) return false;
    const cleanPhone = unmask(phone);
    // Needs DDD (2 digits) + 8 digits (fixed line) OR 9 digits (mobile starting with 9)
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;

    // Additional check if it's 11 digits it must start with 9 after DDD
    if (cleanPhone.length === 11) {
        if (cleanPhone[2] !== '9') return false; // The 3rd digit (1st of the actual number) must be 9
    }
    return true;
};
