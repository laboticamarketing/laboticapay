import axios from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { config } from '../config/env';

// MaxiPago Credentials
const MERCHANT_ID = config.maxipago.merchantId;
const MERCHANT_KEY = config.maxipago.merchantKey;
const API_URL = config.maxipago.apiUrl;

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
    qrcode?: string; // Base64 Image
    qrcodeText?: string; // Copy & Paste Code
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
     * Public Methods
     */
    async createPixTransaction(params: PixTransactionParams): Promise<TransactionResponse> {
        return this.sendTransaction(params, 'PIX');
    }

    async createCreditCardTransaction(reference: string, amountInCents: number, card: CreditCardParams, customer?: MaxiPagoCustomer): Promise<TransactionResponse> {
        return this.sendTransaction({ reference, amountInCents, card, customer }, 'CREDIT_CARD');
    }

    /**
     * Health Check - Validates credentials by making a minimal API call
     */
    async healthCheck(): Promise<{ success: boolean; message: string; details?: any }> {
        // Check if credentials are configured
        if (!MERCHANT_ID || !MERCHANT_KEY) {
            return {
                success: false,
                message: 'Credenciais MaxiPago não configuradas. Defina MAXIPAGO_MERCHANT_ID e MAXIPAGO_MERCHANT_KEY.',
            };
        }

        try {
            // Use a report API call to validate credentials without creating a transaction
            const xmlPayload = `
<?xml version="1.0" encoding="UTF-8"?>
<rapi-request>
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
                timeout: 10000
            });

            const parsed = this.parser.parse(response.data);
            const root = parsed['rapi-response'];

            // If we get any response (even "not found"), credentials are valid
            if (root) {
                const errorCode = root.errorCode;
                const errorMsg = root.errorMsg;

                // errorCode 0 = success, 1 = not found (expected for fake ID)
                if (errorCode === 0 || errorCode === 1 || errorCode === '0' || errorCode === '1') {
                    return {
                        success: true,
                        message: 'Conexão com MaxiPago estabelecida com sucesso!',
                        details: {
                            merchantId: MERCHANT_ID,
                            apiUrl: API_URL,
                            environment: API_URL.includes('testapi') ? 'SANDBOX' : 'PRODUCTION'
                        }
                    };
                }

                // Invalid credentials or other error
                return {
                    success: false,
                    message: errorMsg || 'Erro de autenticação na MaxiPago',
                    details: { errorCode, errorMsg }
                };
            }

            return {
                success: false,
                message: 'Resposta inválida da API MaxiPago'
            };

        } catch (error: any) {
            return {
                success: false,
                message: `Erro de conexão: ${error.message}`,
                details: {
                    apiUrl: API_URL,
                    error: error.code || error.message
                }
            };
        }
    }

    /**
     * Core Transaction Logic
     */
    private async sendTransaction(params: any, type: 'PIX' | 'CREDIT_CARD'): Promise<TransactionResponse> {
        try {
            const amount = (params.amountInCents / 100).toFixed(2);
            const customer = params.customer as MaxiPagoCustomer | undefined;

            // Prepare XML Blocks
            let customerBlock = '';
            if (customer) {
                const billing = this.buildContactBlock('billing', customer);
                const shipping = this.buildContactBlock('shipping', customer);
                const cpfRaw = this.getDigits(customer.cpf || '');
                const customerIdExt = `<customerIdExt>${cpfRaw || '00000000000'}</customerIdExt>`;

                customerBlock = `${customerIdExt}\n${billing}\n${shipping}`;
            }

            let payTypeXml = '';
            if (type === 'PIX') {
                payTypeXml = `
                    <pix>
                        <expirationTime>86400</expirationTime>
                        <paymentInfo>Pedido Farmapay</paymentInfo>
                    </pix>`;
            } else {
                payTypeXml = `
                    <creditCard>
                        <number>${params.card.cardNumber}</number>
                        <expMonth>${params.card.expirationMonth}</expMonth>
                        <expYear>${params.card.expirationYear}</expYear>
                        <cvvNumber>${params.card.securityCode}</cvvNumber>
                    </creditCard>`;
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
            <processorID>1</processorID>
            <referenceNum>${params.reference}</referenceNum>
            <fraudCheck>N</fraudCheck>
            ${customerBlock}
            <transactionDetail>
                <payType>
                    ${payTypeXml}
                </payType>
            </transactionDetail>
            <payment>
                <chargeTotal>${amount}</chargeTotal>
                ${type === 'CREDIT_CARD' ? `
                <creditInstallment>
                    <numberOfInstallments>${params.card?.installments || 1}</numberOfInstallments>
                    <chargeInterest>N</chargeInterest>
                </creditInstallment>` : ''}
            </payment>
        </sale>
    </order>
</transaction-request>`;

            console.log('MaxiPago Request:', xmlPayload);

            const response = await axios.post(API_URL, xmlPayload, {
                headers: { 'Content-Type': 'text/xml; charset=utf-8' }
            });

            console.log('MaxiPago Response Raw:', response.data);

            return this.parseResponse(response.data, type);

        } catch (error: any) {
            console.error('MaxiPago Service Error:', error.message);
            if (error.response) {
                console.error('MaxiPago API Response:', error.response.data);
            }
            return { success: false, message: error.message };
        }
    }

    /**
     * XML Parsing Helpers
     */
    private parseResponse(xmlData: string, type: 'PIX' | 'CREDIT_CARD'): TransactionResponse {
        const parsed = this.parser.parse(xmlData);
        const root = parsed['transaction-response'];

        if (!root) {
            return { success: false, message: 'Invalid XML Response' };
        }

        if (root.responseCode && root.responseCode != 0) {
            return { success: false, message: root.responseMessage || 'Transaction Failed' };
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

    /**
     * XML Builder Helpers
     */
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

    /**
     * Formatting Helpers
     */
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
