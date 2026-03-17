import { Badge } from '@/components/ui/badge';
import { statusConfig } from '@/lib/request-utils';
import type { Enums } from '@/integrations/supabase/types';

interface StatusBadgeProps {
  status: Enums<'request_status'>;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.bgClass} ${config.textClass} border-transparent font-medium`}>
      {config.label}
    </Badge>
  );
};
