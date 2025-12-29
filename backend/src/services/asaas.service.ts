import axios from 'axios';

const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3'; // Sandbox by default
const API_KEY = process.env.ASAAS_API_KEY;

export const asaasService = {
    async getCustomerByCpf(cpfCnpj: string) {
        if (!API_KEY) return null;
        try {
            const response = await axios.get(`${ASAAS_API_URL}/customers`, {
                params: { cpfCnpj },
                headers: { access_token: API_KEY }
            });
            if (response.data.data && response.data.data.length > 0) {
                return response.data.data[0];
            }
            return null;
        } catch (error) {
            console.error('Asaas Get Customer Error', error);
            return null;
        }
    },

    async updateCustomer(id: string, data: any) {
        if (!API_KEY) {
            return { id, ...data };
        }
        try {
            console.log(`Updating Asaas Customer ${id} with data:`, JSON.stringify(data, null, 2));
            const response = await axios.post(`${ASAAS_API_URL}/customers/${id}`, data, {
                headers: { access_token: API_KEY }
            });
            return response.data;
        } catch (error: any) {
            console.error('Asaas Update Customer Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async createCustomer(data: {
        name: string;
        cpfCnpj?: string;
        email?: string;
        mobilePhone?: string;
        address?: string;
        addressNumber?: string;
        complement?: string;
        province?: string;
        postalCode?: string;
    }) {
        if (!API_KEY) {
            console.warn('Asaas API Key missing. Returning mock customer.');
            return { id: 'cus_mock_' + Date.now(), ...data };
        }

        try {
            // 1. Check if customer exists by CPF/CNPJ
            if (data.cpfCnpj) {
                const existing = await asaasService.getCustomerByCpf(data.cpfCnpj);
                if (existing) {
                    console.log(`Customer ${data.cpfCnpj} found in Asaas (${existing.id}). Updating...`);
                    return await asaasService.updateCustomer(existing.id, data);
                }
            }

            // 2. Create if not exists
            console.log('Creating Asaas Customer with data:', JSON.stringify(data, null, 2));
            const response = await axios.post(`${ASAAS_API_URL}/customers`, data, {
                headers: { access_token: API_KEY }
            });
            return response.data;
        } catch (error: any) {
            console.error('Asaas Create Customer Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async createPaymentLink(data: {
        customer: string;
        billingType: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';
        value: number;
        dueDate: string;
        description?: string;
        externalReference: string;
        discount?: { value: number; dueDateLimitDays?: number; type: 'FIXED' | 'PERCENTAGE' };
    }) {
        if (!API_KEY) {
            console.warn('Asaas API Key missing. Returning mock payment link.');
            return {
                id: 'pay_mock_' + Date.now(),
                invoiceUrl: `https://sandbox.asaas.com/payment/mock/${Date.now()}`,
                value: data.value,
                status: 'PENDING',
                externalReference: data.externalReference
            };
        }

        try {
            const response = await axios.post(`${ASAAS_API_URL}/payments`, data, {
                headers: { access_token: API_KEY }
            });
            return response.data;
        } catch (error: any) {
            console.error('Asaas Create Payment Error:', error.response?.data || error.message);
            throw error;
        }
    }
};
