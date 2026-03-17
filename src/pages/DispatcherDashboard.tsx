import { useEffect, useState } from "react";
import { assignRequest, cancelRequest, fetchAuditLog, fetchDispatcherRequests, fetchMasters } from "@/lib/backend-api";
import { getUiErrorMessage } from "@/lib/ui-messages";
import { useRole } from "@/contexts/RoleContext";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/request-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuditLogDialog } from "@/components/AuditLogDialog";
import { toast } from "sonner";
import { XCircle, History, RefreshCw } from "lucide-react";
import type { AuditEntry, RequestRecord } from "@/lib/app-types";

const statusFilters: Array<{ value: string; label: string }> = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "assigned", label: "Назначенные" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Выполненные" },
  { value: "canceled", label: "Отмененные" },
];

const DispatcherDashboard = () => {
  const { authToken, logout } = useRole();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [masters, setMasters] = useState<Array<{ id: string; username: string; display_name: string }>>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const loadRequests = async () => {
    if (!authToken) {
      return;
    }

    setLoading(true);
    try {
      const data = await fetchDispatcherRequests(authToken, filter);
      setRequests(data);
    } catch (error) {
      const message = getUiErrorMessage(error, "Не удалось загрузить заявки.");
      toast.error(message);
      if ((error as Error & { status?: number }).status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMasters = async () => {
    if (!authToken) {
      return;
    }

    try {
      const data = await fetchMasters(authToken);
      setMasters(data);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Не удалось загрузить список мастеров."));
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [authToken, filter]);

  useEffect(() => {
    void loadMasters();
  }, [authToken]);

  const handleAssign = async (requestId: string, masterId: string, version: number) => {
    if (!authToken) {
      return;
    }

    try {
      await assignRequest(authToken, requestId, masterId, version);
      toast.success("Мастер назначен.");
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Не удалось назначить мастера."));
    }

    void loadRequests();
  };

  const handleCancel = async (requestId: string, version: number) => {
    if (!authToken) {
      return;
    }

    try {
      await cancelRequest(authToken, requestId, version);
      toast.success("Заявка отменена.");
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Не удалось отменить заявку."));
    }

    void loadRequests();
  };

  const showAuditLog = async (requestId: string) => {
    if (!authToken) {
      return;
    }

    try {
      const data = await fetchAuditLog(authToken, requestId);
      setAuditLog(data);
      setAuditDialogOpen(true);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Не удалось загрузить историю действий."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Диспетчерская</h1>
          <p className="text-muted-foreground">Управление заявками на ремонт</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadRequests()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Обновить
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <Button key={sf.value} variant={filter === sf.value ? "default" : "outline"} size="sm" onClick={() => setFilter(sf.value)}>
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
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.client_name}</TableCell>
                  <TableCell className="text-muted-foreground">{request.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.address}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{request.problem_text}</TableCell>
                  <TableCell><StatusBadge status={request.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{request.assigned_to_name || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {request.status === "new" || request.status === "assigned" ? (
                        <>
                          <Select onValueChange={(masterId) => void handleAssign(request.id, masterId, request.version)}>
                            <SelectTrigger className="h-8 w-[160px] text-xs">
                              <SelectValue placeholder="Назначить мастера" />
                            </SelectTrigger>
                            <SelectContent>
                              {masters.map((master) => (
                                <SelectItem key={master.id} value={master.id}>
                                  {master.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => void handleCancel(request.id, request.version)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      ) : null}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void showAuditLog(request.id)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Заявок по текущему фильтру нет.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AuditLogDialog entries={auditLog} open={auditDialogOpen} onOpenChange={setAuditDialogOpen} />
    </div>
  );
};

export default DispatcherDashboard;
