import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/request-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { PlayCircle, CheckCircle2, History, RefreshCw, MapPin, Phone, User } from 'lucide-react';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Request = Tables<'requests'>;
type AuditEntry = Tables<'audit_log'> & { staff: { name: string } | null };

const MasterDashboard = () => {
  const { currentStaff } = useRole();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const fetchRequests = async () => {
    if (!currentStaff) return;
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('assigned_to', currentStaff.id)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [currentStaff]);

  const handleAction = async (requestId: string, newStatus: Enums<'request_status'>, version: number) => {
    const { data, error } = await supabase.rpc('update_request_status', {
      p_request_id: requestId,
      p_new_status: newStatus,
      p_expected_version: version,
      p_changed_by: currentStaff?.id,
    });

    if (error || !data?.[0]?.success) {
      toast.error('⚠️ Конфликт! Заявка уже была изменена другим пользователем. Обновите список.');
      fetchRequests();
      return;
    }

    toast.success(newStatus === 'in_progress' ? 'Заявка взята в работу' : 'Заявка выполнена');
    fetchRequests();
  };

  const showAuditLog = async (requestId: string) => {
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
          <h1 className="text-2xl font-bold text-foreground">Мои задачи</h1>
          <p className="text-muted-foreground">
            {currentStaff?.name} — назначенные и текущие заявки
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="mr-2 h-4 w-4" /> Обновить
        </Button>
      </div>

      {!loading && requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет активных заявок
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((r) => (
          <Card key={r.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={r.status} />
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              <CardTitle className="text-lg mt-2">{r.problem_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {r.client_name}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {r.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {r.address}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {r.status === 'assigned' && (
                  <Button size="sm" onClick={() => handleAction(r.id, 'in_progress', r.version)}>
                    <PlayCircle className="mr-1.5 h-4 w-4" /> Взять в работу
                  </Button>
                )}
                {r.status === 'in_progress' && (
                  <Button size="sm" variant="outline" className="text-status-done border-status-done hover:bg-status-done/10" onClick={() => handleAction(r.id, 'done', r.version)}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Выполнено
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => showAuditLog(r.id)}>
                  <History className="mr-1.5 h-4 w-4" /> История
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

export default MasterDashboard;
