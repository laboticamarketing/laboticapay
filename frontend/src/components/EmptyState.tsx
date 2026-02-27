import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-300 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-foreground font-semibold text-base mb-1">{title}</h3>
            {description && <p className="text-muted-foreground text-sm max-w-xs">{description}</p>}
            {action && (
                <Button className="mt-4 bg-primary-500 hover:bg-primary-600 text-white" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
