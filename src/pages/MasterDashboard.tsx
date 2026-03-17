import { useEffect, useState } from "react";
import { fetchAuditLog, fetchMyRequests, updateMasterRequest } from "@/lib/backend-api";
import { getUiErrorMessage } from "@/lib/ui-messages";
import { useRole } from "@/contexts/RoleContext";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/request-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditLogDialog } from "@/components/AuditLogDialog";
import { toast } from "sonner";
import { PlayCircle, CheckCircle2, History, RefreshCw, MapPin, Phone, User } from "lucide-react";
import type { AuditEntry, RequestRecord, RequestStatus } from "@/lib/app-types";

const MasterDashboard = () => {
  const { currentStaff, authToken, logout } = useRole();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const loadRequests = async () => {
    if (!authToken) {
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMyRequests(authToken);
      setRequests(data);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Не удалось загрузить назначенные заявки."));
      if ((error as Error & { status?: number }).status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [authToken]);

  const handleAction = async (requestId: string, newStatus: RequestStatus, version: number) => {
    if (!authToken) {
      return;
    }

    const action = newStatus === "in_progress" ? "take" : "complete";
    try {
      await updateMasterRequest(authToken, requestId, action, version);
      toast.success(newStatus === "in_progress" ? "Заявка взята в работу." : "Заявка завершена.");
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Не удалось обновить заявку."));
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
          <h1 className="text-2xl font-bold text-foreground">Мои задачи</h1>
          <p className="text-muted-foreground">
            {currentStaff?.displayName} - назначенные и текущие заявки
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadRequests()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Обновить
        </Button>
      </div>

      {!loading && requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Активных заявок сейчас нет.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((request) => (
          <Card key={request.id} className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={request.status} />
                <span className="text-xs text-muted-foreground">{formatDate(request.created_at)}</span>
              </div>
              <CardTitle className="mt-2 text-lg">{request.problem_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {request.client_name}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {request.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {request.address}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {request.status === "assigned" ? (
                  <Button size="sm" onClick={() => void handleAction(request.id, "in_progress", request.version)}>
                    <PlayCircle className="mr-1.5 h-4 w-4" /> Взять в работу
                  </Button>
                ) : null}
                {request.status === "in_progress" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-status-done text-status-done hover:bg-status-done/10"
                    onClick={() => void handleAction(request.id, "done", request.version)}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Завершить
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={() => void showAuditLog(request.id)}>
                  <History className="mr-1.5 h-4 w-4" /> История
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AuditLogDialog entries={auditLog} open={auditDialogOpen} onOpenChange={setAuditDialogOpen} />
    </div>
  );
};

export default MasterDashboard;
