import axios from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { config } from '../config/env';

// MaxiPago Credentials
const MERCHANT_ID = config.maxipago.merchantId;
const MERCHANT_KEY = config.maxipago.merchantKey;
const API_URL = config.maxipago.apiUrl;
const PROCESSOR_ID = config.maxipago.processorId;

// MaxiPago API endpoint for consumer/card operations (postAPI, not postXML)
const API_URL_CONSUMER = API_URL.replace('/UniversalAPI/postXML', '/UniversalAPI/postAPI');

/**
 * Interfaces
 */
export interface PixTransactionParams {
    reference: string;
    amountInCents: number;
    customer?: MaxiPagoCustomer;
}

export interface CreditCardParams {
    cardNumber: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    installments?: number;
}

export interface MaxiPagoCustomer {
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    address?: string;
    number?: string;
    city?: string;
    state?: string;
    postalcode?: string;
}

export interface TransactionResponse {
    success: boolean;
    txId?: string;
    qrcode?: string;
    qrcodeText?: string;
    qrCodeUrl?: string;
    message?: string;
    kind?: 'pix' | 'credit_card';
    returnCode?: string;
}

export class MaxiPagoService {
    private parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({ ignoreAttributes: false });
    }

    /**
     * Public: PIX transaction (direct, no tokenization needed)
     */
    async createPixTransaction(params: PixTransactionParams): Promise<TransactionResponse> {
        return this.sendTransaction(params, 'PIX');
    }

    /**
     * Public: Credit Card transaction (with tokenization flow)
     * Flow: add-consumer → add-card-onfile → sale with token
     */
    async createCreditCardTransaction(reference: string, amountInCents: number, card: CreditCardParams, customer?: MaxiPagoCustomer): Promise<TransactionResponse> {
        // Step 1: Create consumer on MaxiPago
        const cpf = customer?.cpf ? this.getDigits(customer.cpf) : '00000000000';
        const customerId = await this.addConsumer(customer?.name || card.holderName, cpf);
        if (!customerId) {
            return { success: false, message: 'Falha ao criar consumidor na MaxiPago. Tente novamente.' };
        }
        console.log(`[MaxiPago] Consumer created: ${customerId}`);

        // Step 2: Tokenize card (add-card-onfile)
        const token = await this.addCardOnFile(customerId, card);
        if (!token) {
            return { success: false, message: 'Falha ao tokenizar cartão na MaxiPago. Verifique os dados do cartão.' };
        }
        console.log(`[MaxiPago] Card tokenized: ${token}`);

        // Step 3: Use token in sale transaction
        return this.sendTokenTransaction({ reference, amountInCents, card, customer, customerId, token });
    }

    /**
     * Health Check - Validates credentials
     */
    async healthCheck(): Promise<{ success: boolean; message: string; details?: any }> {
        if (!MERCHANT_ID || !MERCHANT_KEY) {
            return { success: false, message: 'Credenciais MaxiPago não configuradas.' };
        }

        try {
            const xmlPayload = `<rapi-request>
    <verification>
        <merchantId>${MERCHANT_ID}</merchantId>
        <merchantKey>${MERCHANT_KEY}</merchantKey>
    </verification>
    <command>transactionDetailReport</command>
    <request>
        <filterOptions>
            <transactionId>HEALTH_CHECK_TEST</transactionId>
        </filterOptions>
    </request>
</rapi-request>`;

            const reportUrl = API_URL.replace('/UniversalAPI/postXML', '/ReportsAPI/servlet/ReportsAPI');
            const response = await axios.post(reportUrl, xmlPayload, {
                headers: { 'Content-Type': 'text/xml; charset=utf-8' },
                timeout: 10000,
                validateStatus: () => true
            });

            const parsed = this.parser.parse(response.data);
            const root = parsed['rapi-response'];

            if (root) {
                const header = root.header || root;
                const errorCode = header.errorCode;
                const errorMsg = header.errorMsg;
                const env = API_URL.includes('test') ? 'SANDBOX' : 'PRODUCTION';

                if (errorCode === 0 || errorCode === '0') {
                    return { success: true, message: 'Conexão com MaxiPago estabelecida com sucesso!', details: { merchantId: MERCHANT_ID, apiUrl: API_URL, environment: env } };
                } else if (errorCode === 1 || errorCode === '1') {
                    const msg = String(errorMsg || '');
                    if (msg.toLowerCase().includes('not open') || msg.toLowerCase().includes('not active')) {
                        return { success: false, message: `Conta MaxiPago não está ativa: ${errorMsg}`, details: { merchantId: MERCHANT_ID, errorCode, errorMsg } };
                    }
                    return { success: true, message: 'Conexão com MaxiPago estabelecida com sucesso!', details: { merchantId: MERCHANT_ID, environment: env } };
                }
                return { success: false, message: `Erro MaxiPago: ${errorMsg || 'Código ' + errorCode}`, details: { errorCode, errorMsg } };
            }

            return { success: false, message: 'Resposta inválida da API MaxiPago' };
        } catch (error: any) {
            return { success: false, message: `Erro de conexão: ${error.message}`, details: { apiUrl: API_URL, error: error.code || error.message } };
        }
    }

    // ─── Tokenization Steps ────────────────────────────────────────

    /**
     * Step 1: Create consumer on MaxiPago to get customerId
     */
    private async addConsumer(name: string, cpf: string): Promise<string | null> {
        const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<api-request>
    <verification>
        <merchantId>${MERCHANT_ID}</merchantId>
        <merchantKey>${MERCHANT_KEY}</merchantKey>
    </verification>
    <command>add-consumer</command>
    <request>
        <customerIdExt>${cpf}</customerIdExt>
        <firstName>${name.split(' ')[0] || 'Cliente'}</firstName>
        <lastName>${name.split(' ').slice(1).join(' ') || 'Farmapay'}</lastName>
    </request>
</api-request>`;

        try {
            console.log('[MaxiPago] Adding consumer...');
            const response = await axios.post(API_URL_CONSUMER, xmlPayload, {
                headers: { 'Content-Type': 'text/xml; charset=utf-8' },
                timeout: 15000,
                validateStatus: () => true
            });

            console.log('[MaxiPago] add-consumer response:', JSON.stringify(response.data));
            const parsed = this.parser.parse(response.data);
            const root = parsed['api-response'];

            if (root && root.errorCode == 0) {
                const id = root.result?.customerId;
                return id ? String(id) : null;
            }

            console.error('[MaxiPago] add-consumer failed:', root?.errorMessage || 'Unknown error');
            return null;
        } catch (error: any) {
            console.error('[MaxiPago] add-consumer error:', error.message);
            return null;
        }
    }

    /**
     * Step 2: Save card on file to get token
     */
    private async addCardOnFile(customerId: string, card: CreditCardParams): Promise<string | null> {
        const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<api-request>
    <verification>
        <merchantId>${MERCHANT_ID}</merchantId>
        <merchantKey>${MERCHANT_KEY}</merchantKey>
    </verification>
    <command>add-card-onfile</command>
    <request>
        <customerId>${customerId}</customerId>
        <creditCardNumber>${card.cardNumber}</creditCardNumber>
        <expirationMonth>${card.expirationMonth}</expirationMonth>
        <expirationYear>${card.expirationYear}</expirationYear>
        <billingName>${card.holderName}</billingName>
    </request>
</api-request>`;

        try {
            console.log('[MaxiPago] Adding card on file...');
            const response = await axios.post(API_URL_CONSUMER, xmlPayload, {
                headers: { 'Content-Type': 'text/xml; charset=utf-8' },
                timeout: 15000,
                validateStatus: () => true
            });

            console.log('[MaxiPago] add-card-onfile response:', JSON.stringify(response.data));
            const parsed = this.parser.parse(response.data);
            const root = parsed['api-response'];

            if (root && root.errorCode == 0) {
                const tk = root.result?.token;
                return tk ? String(tk) : null;
            }

            console.error('[MaxiPago] add-card-onfile failed:', root?.errorMessage || 'Unknown error');
            return null;
        } catch (error: any) {
            console.error('[MaxiPago] add-card-onfile error:', error.message);
            return null;
        }
    }

    /**
     * Step 3: Token-based sale (uses customerId + token instead of raw card number)
     */
    private async sendTokenTransaction(params: any): Promise<TransactionResponse> {
        try {
            const amount = (params.amountInCents / 100).toFixed(2);
            const customer = params.customer as MaxiPagoCustomer | undefined;

            let customerBlock = '';
            if (customer) {
                const billing = this.buildContactBlock('billing', customer);
                const shipping = this.buildContactBlock('shipping', customer);
                const cpfRaw = this.getDigits(customer.cpf || '');
                customerBlock = `<customerIdExt>${cpfRaw || '00000000000'}</customerIdExt>\n${billing}\n${shipping}`;
            }

            const xmlPayload = `
<transaction-request>
    <version>3.1.1.15</version>
    <verification>
        <merchantId>${MERCHANT_ID}</merchantId>
        <merchantKey>${MERCHANT_KEY}</merchantKey>
    </verification>
    <order>
        <sale>
            <processorID>${PROCESSOR_ID}</processorID>
            <referenceNum>${params.reference}</referenceNum>
            <fraudCheck>N</fraudCheck>
            ${customerBlock}
            <transactionDetail>
                <payType>
                    <onFile>
                        <customerId>${params.customerId}</customerId>
                        <token>${params.token}</token>
                        <cvvNumber>${params.card.securityCode}</cvvNumber>
                    </onFile>
                </payType>
            </transactionDetail>
            <payment>
                <chargeTotal>${amount}</chargeTotal>
                <creditInstallment>
                    <numberOfInstallments>${params.card?.installments || 1}</numberOfInstallments>
                    <chargeInterest>N</chargeInterest>
                </creditInstallment>
            </payment>
        </sale>
    </order>
</transaction-request>`;

            console.log('[MaxiPago] Token Sale Payload:', xmlPayload);

            const response = await axios.post(API_URL, xmlPayload, {
                headers: { 'Content-Type': 'text/xml; charset=utf-8' }
            });

            console.log('[MaxiPago] Response Status:', response.status);
            console.log('[MaxiPago] Response Data:', JSON.stringify(response.data));

            return this.parseResponse(response.data, 'CREDIT_CARD');
        } catch (error: any) {
            console.error('[MaxiPago] Token Sale Error:', error.message);
            if (error.response) console.error('[MaxiPago] API Error:', error.response.data);
            return { success: false, message: error.message };
        }
    }

    // ─── PIX Transaction (direct, no token) ────────────────────────

    private async sendTransaction(params: any, type: 'PIX' | 'CREDIT_CARD'): Promise<TransactionResponse> {
        try {
            const amount = (params.amountInCents / 100).toFixed(2);
            const customer = params.customer as MaxiPagoCustomer | undefined;

            let customerBlock = '';
            if (customer) {
                const billing = this.buildContactBlock('billing', customer);
                const shipping = this.buildContactBlock('shipping', customer);
                const cpfRaw = this.getDigits(customer.cpf || '');
                customerBlock = `<customerIdExt>${cpfRaw || '00000000000'}</customerIdExt>\n${billing}\n${shipping}`;
            }

            const payTypeXml = type === 'PIX'
                ? `<pix><expirationTime>86400</expirationTime><paymentInfo>Pedido Farmapay</paymentInfo></pix>`
                : `<creditCard><number>${params.card.cardNumber}</number><expMonth>${params.card.expirationMonth}</expMonth><expYear>${params.card.expirationYear}</expYear><cvvNumber>${params.card.securityCode}</cvvNumber></creditCard>`;

            const xmlPayload = `
<transaction-request>
    <version>3.1.1.15</version>
    <verification>
        <merchantId>${MERCHANT_ID}</merchantId>
        <merchantKey>${MERCHANT_KEY}</merchantKey>
    </verification>
    <order>
        <sale>
            <processorID>${PROCESSOR_ID}</processorID>
            <referenceNum>${params.reference}</referenceNum>
            <fraudCheck>N</fraudCheck>
            ${customerBlock}
            <transactionDetail>
                <payType>${payTypeXml}</payType>
            </transactionDetail>
            <payment>
                <chargeTotal>${amount}</chargeTotal>
                ${type === 'CREDIT_CARD' ? `<creditInstallment><numberOfInstallments>${params.card?.installments || 1}</numberOfInstallments><chargeInterest>N</chargeInterest></creditInstallment>` : ''}
            </payment>
        </sale>
    </order>
</transaction-request>`;

            console.log('[MaxiPago] Request Payload:', xmlPayload);

            const response = await axios.post(API_URL, xmlPayload, {
                headers: { 'Content-Type': 'text/xml; charset=utf-8' }
            });

            console.log('[MaxiPago] Response Status:', response.status);
            console.log('[MaxiPago] Response Data:', JSON.stringify(response.data));

            return this.parseResponse(response.data, type);
        } catch (error: any) {
            console.error('[MaxiPago] Fatal Error:', error.message);
            if (error.response) console.error('[MaxiPago] API Error:', error.response.data);
            return { success: false, message: error.message };
        }
    }

    // ─── XML Parsing ───────────────────────────────────────────────

    private parseResponse(xmlData: string, type: 'PIX' | 'CREDIT_CARD'): TransactionResponse {
        const parsed = this.parser.parse(xmlData);
        const root = parsed['transaction-response'];

        if (!root) {
            console.error('[MaxiPago] Invalid XML received');
            return { success: false, message: 'Invalid XML Response from Gateway' };
        }

        if (root.responseCode && root.responseCode != 0) {
            console.error(`[MaxiPago] Transaction Failed. Code: ${root.responseCode}, Message: ${root.responseMessage}`);
            return {
                success: false,
                message: `Pagamento Recusado: ${root.responseMessage} (Code: ${root.responseCode})`,
                returnCode: String(root.responseCode)
            };
        }

        const result: TransactionResponse = {
            success: true,
            txId: root.orderID,
            returnCode: '00',
            message: 'Transaction Approved',
            kind: type === 'PIX' ? 'pix' : undefined
        };

        if (type === 'PIX') {
            result.qrcodeText = root.emv;
            result.qrcode = root.imagem_base64;
            result.qrCodeUrl = root.onlineDebitUrl || root.onlinePaymentUrl;
        }

        return result;
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private buildContactBlock(tagName: string, c: MaxiPagoCustomer): string {
        const cpfDisplay = this.formatCPF(c.cpf || '');
        const phoneDisplay = this.formatPhone(c.phone || '');
        const zipDisplay = this.formatZip(c.postalcode || '');
        const phoneRaw = this.getDigits(c.phone || '');

        return `
            <${tagName}>
                <name>${c.name || 'Cliente Teste'}</name>
                <address>${c.address || 'Rua Teste'}</address>
                <address2>${c.number || '123'}</address2>
                <city>${c.city || 'Cidade'}</city>
                <state>${c.state || 'SP'}</state>
                <postalcode>${zipDisplay}</postalcode>
                <country>BR</country>
                <phone>${phoneDisplay}</phone>
                <email>${c.email || 'teste@teste.com'}</email>
                <type>Individual</type>
                <gender>M</gender>
                <birthDate>1980-01-01</birthDate>
                <phones>
                    <phone>
                        <phoneType>Mobile</phoneType>
                        <phoneCountryCode>55</phoneCountryCode>
                        <phoneAreaCode>${phoneRaw.substring(0, 2) || '11'}</phoneAreaCode>
                        <phoneNumber>${phoneRaw.substring(2) || '999999999'}</phoneNumber>
                    </phone>
                </phones>
                <documents>
                    <document>
                        <documentType>CPF</documentType>
                        <documentValue>${cpfDisplay}</documentValue>
                    </document>
                </documents>
            </${tagName}>`;
    }

    private getDigits(val: string): string {
        return val ? val.replace(/\D/g, '') : '';
    }

    private formatCPF(val: string): string {
        const d = this.getDigits(val);
        if (d.length !== 11) return val;
        return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    private formatPhone(val: string): string {
        const d = this.getDigits(val);
        if (d.length < 10) return val;
        if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    private formatZip(val: string): string {
        const d = this.getDigits(val);
        if (d.length !== 8) return val;
        return d.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
}

export const maxiPagoService = new MaxiPagoService();
