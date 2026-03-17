import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, statusConfig } from '@/lib/request-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { UserPlus, XCircle, History, RefreshCw } from 'lucide-react';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Request = Tables<'requests'> & { staff: { name: string } | null };
type AuditEntry = Tables<'audit_log'> & { staff: { name: string } | null };

const statusFilters: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'assigned', label: 'Назначенные' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Выполненные' },
  { value: 'canceled', label: 'Отменённые' },
];

const DispatcherDashboard = () => {
  const { currentStaff, allStaff } = useRole();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const masters = allStaff.filter((s) => s.role === 'master');

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase.from('requests').select('*, staff:assigned_to(name)').order('created_at', { ascending: false });
    if (filter !== 'all') {
      query = query.eq('status', filter as Enums<'request_status'>);
    }
    const { data } = await query;
    if (data) setRequests(data as Request[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleAssign = async (requestId: string, masterId: string, version: number) => {
    const { data, error } = await supabase.rpc('update_request_status', {
      p_request_id: requestId,
      p_new_status: 'assigned' as Enums<'request_status'>,
      p_expected_version: version,
      p_changed_by: currentStaff?.id,
      p_assigned_to: masterId,
    });

    if (error || !data?.[0]?.success) {
      toast.error('Конфликт версий! Данные были изменены. Обновите страницу.');
      fetchRequests();
      return;
    }
    toast.success('Мастер назначен');
    fetchRequests();
  };

  const handleCancel = async (requestId: string, version: number) => {
    const { data, error } = await supabase.rpc('update_request_status', {
      p_request_id: requestId,
      p_new_status: 'canceled' as Enums<'request_status'>,
      p_expected_version: version,
      p_changed_by: currentStaff?.id,
    });

    if (error || !data?.[0]?.success) {
      toast.error('Конфликт версий! Обновите страницу.');
      fetchRequests();
      return;
    }
    toast.success('Заявка отменена');
    fetchRequests();
  };

  const showAuditLog = async (requestId: string) => {
    setSelectedRequestId(requestId);
    const { data } = await supabase
      .from('audit_log')
      .select('*, staff:changed_by(name)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    if (data) setAuditLog(data as AuditEntry[]);
    setAuditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Диспетчерская</h1>
          <p className="text-muted-foreground">Управление заявками на ремонт</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="mr-2 h-4 w-4" /> Обновить
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((sf) => (
          <Button
            key={sf.value}
            variant={filter === sf.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(sf.value)}
          >
            {sf.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Проблема</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Мастер</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.client_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.address}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.problem_text}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{r.staff?.name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === 'new' && (
                        <>
                          <Select onValueChange={(masterId) => handleAssign(r.id, masterId, r.version)}>
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                              <SelectValue placeholder="Назначить" />
                            </SelectTrigger>
                            <SelectContent>
                              {masters.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleCancel(r.id, r.version)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => showAuditLog(r.id)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Нет заявок
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>История изменений</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.old_status && <StatusBadge status={entry.old_status} />}
                      {entry.old_status && <span className="text-muted-foreground">→</span>}
                      <StatusBadge status={entry.new_status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.staff?.name || 'Система'} • {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {auditLog.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Нет записей</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatcherDashboard;
