import { useState } from 'react';
import { checkoutService, CheckoutOrder, ShippingQuote } from '@/services/checkout.service';
import { toast } from 'sonner';

interface UseShippingQuotesParams {
    order: CheckoutOrder | null;
    setOrder: React.Dispatch<React.SetStateAction<CheckoutOrder | null>>;
}

export function useShippingQuotes({ order, setOrder }: UseShippingQuotesParams) {
    const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
    const [loadingQuotes, setLoadingQuotes] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

    const fetchShippingQuotes = async (zip: string, errorMessage: string) => {
        if (!order || order.shippingType !== 'DYNAMIC') return;

        const cleanZip = zip.replace(/\D/g, '');
        if (cleanZip.length !== 8) return;

    setLoadingQuotes(true);
    try {
        const quotes = await checkoutService.getShippingQuotes(cleanZip);

        // Mantém apenas os serviços relevantes para o checkout:
        // PAC, SEDEX e Jadlog (.Com). Também renomeia ".Com" -> "JADLOG".
        const filtered = quotes
            .filter(q => {
                const name = (q.name || '').toUpperCase();
                return name === 'PAC' || name === 'SEDEX' || name === '.COM';
            })
            .map(q => (q.name === '.Com' || q.name?.toUpperCase() === '.COM'
                ? { ...q, name: 'JADLOG' }
                : q
            ));

        setShippingQuotes(filtered);
        // Não selecionar automaticamente: o atendente escolhe manualmente
        setSelectedQuoteId(null);
        // Também não mexemos em order.shippingValue aqui; só ao selecionar.
    } catch {
            toast.error(errorMessage);
        } finally {
            setLoadingQuotes(false);
        }
    };

    const selectQuote = (quote: ShippingQuote) => {
        setSelectedQuoteId(quote.id);
        setOrder(prev => prev ? { ...prev, shippingValue: quote.price } : null);
    };

    return {
        shippingQuotes,
        loadingQuotes,
        selectedQuoteId,
        setSelectedQuoteId,
        fetchShippingQuotes,
        selectQuote,
    };
}

