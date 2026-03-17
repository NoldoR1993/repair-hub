import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/request-utils";
import type { AuditEntry } from "@/lib/app-types";

type AuditLogDialogProps = {
  entries: AuditEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuditLogDialog({ entries, open, onOpenChange }: AuditLogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>История действий</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Для этой заявки еще нет событий.
              </div>
            ) : null}
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg bg-muted/50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  {entry.old_status ? <StatusBadge status={entry.old_status} /> : null}
                  {entry.old_status ? <span className="text-muted-foreground">-&gt;</span> : null}
                  <StatusBadge status={entry.new_status} />
                </div>
                {entry.note ? <p className="text-sm text-foreground">{entry.note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.changed_by_name || "Система"} • {formatDate(entry.created_at)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
