import type { RequestStatus } from '@/lib/app-types';

export const statusConfig: Record<RequestStatus, { label: string; color: string; bgClass: string; textClass: string }> = {
  new: { label: 'Новая', color: 'status-new', bgClass: 'bg-status-new/15', textClass: 'text-status-new' },
  assigned: { label: 'Назначена', color: 'status-assigned', bgClass: 'bg-status-assigned/15', textClass: 'text-status-assigned' },
  in_progress: { label: 'В работе', color: 'status-in-progress', bgClass: 'bg-status-in-progress/15', textClass: 'text-status-in-progress' },
  done: { label: 'Выполнена', color: 'status-done', bgClass: 'bg-status-done/15', textClass: 'text-status-done' },
  canceled: { label: 'Отменена', color: 'status-canceled', bgClass: 'bg-status-canceled/15', textClass: 'text-status-canceled' },
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
