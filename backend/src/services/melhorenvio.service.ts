import { env } from '../config/env';

interface CalculateShipmentParams {
    toZipCode: string;
}

export interface ShippingQuote {
    id: number;
    name: string;
    price: number;
    deliveryTime: number;
    company: {
        id: number;
        name: string;
        picture: string;
    };
}

class MelhorEnvioService {
    private readonly apiUrl = env.MELHORENVIO_URL;
    private readonly bearerToken = env.MELHORENVIO_TOKEN;

    /**
     * Calculates shipping quotes using Melhor Envio API.
     * Uses a standard box (15x15x15 cm, 0.5kg) since specific item dimensions are not tracked.
     */
    async calculateShipment(params: CalculateShipmentParams): Promise<ShippingQuote[]> {
        const payload = {
            from: { postal_code: env.STORE_ZIP_CODE },
            to: { postal_code: params.toZipCode },
            products: [
                {
                    id: 'standard-box',
                    width: 15,
                    height: 15,
                    length: 15,
                    weight: 0.5,
                    insurance_value: 50.0,
                    quantity: 1,
                }
            ],
            options: {
                receipt: false,
                own_hand: false
            }
        };

        try {
            const response = await fetch(`${this.apiUrl}/me/shipment/calculate`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.bearerToken}`,
                    'User-Agent': 'FarmaPay (contato@labotica.com.br)'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Melhor Envio API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Filter out quotes with errors or unavailable services
            const validQuotes = data.filter((quote: any) =>
                !quote.error &&
                quote.price &&
                parseFloat(quote.price) > 0
            );

            return validQuotes.map((quote: any) => ({
                id: quote.id,
                name: quote.name,
                price: parseFloat(quote.price || quote.custom_price),
                deliveryTime: parseInt(quote.delivery_time || quote.custom_delivery_time),
                company: {
                    id: quote.company.id,
                    name: quote.company.name,
                    picture: quote.company.picture
                }
            }));

        } catch (error) {
            console.error('Error calculating shipment with Melhor Envio:', error);
            const err = error as any;
            console.error('Melhor Envio Error:', err.response?.data || err.message);
            throw new Error('Failed to calculate shipping quotes');
        }
    }
}

export const melhorEnvioService = new MelhorEnvioService();
