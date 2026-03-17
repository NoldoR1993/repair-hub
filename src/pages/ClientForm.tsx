import { useState } from "react";
import { createRequest } from "@/lib/backend-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClipboardCheck, Send } from "lucide-react";
import { z } from "zod";

const formSchema = z.object({
  clientName: z.string().trim().min(2, "Введите имя").max(100),
  phone: z.string().trim().min(6, "Введите корректный телефон").max(20),
  address: z.string().trim().min(5, "Введите адрес").max(300),
  problemText: z.string().trim().min(10, "Опишите проблему подробнее").max(1000),
});

const ClientForm = () => {
  const [form, setForm] = useState({ clientName: "", phone: "", address: "", problemText: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await createRequest(result.data);
      toast.success("Заявка успешно отправлена");
      setSubmitted(true);
    } catch {
      toast.error("Ошибка при отправке заявки");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="pt-10 pb-10">
            <ClipboardCheck className="mx-auto mb-4 h-16 w-16 text-status-done" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">Заявка принята</h2>
            <p className="mb-6 text-muted-foreground">Мы свяжемся с вами в ближайшее время.</p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setForm({ clientName: "", phone: "", address: "", problemText: "" });
              }}
            >
              Подать еще заявку
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Заявка в ремонтную службу</CardTitle>
          <CardDescription>Опишите вашу проблему - мы направим специалиста</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">ФИО</Label>
              <Input id="clientName" placeholder="Иванов Иван Иванович" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              {errors.clientName && <p className="text-sm text-destructive">{errors.clientName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" placeholder="+7 (999) 123-45-67" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Адрес</Label>
              <Input id="address" placeholder="ул. Ленина, д.10, кв.5" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="problemText">Описание проблемы</Label>
              <Textarea id="problemText" placeholder="Опишите, что именно нужно отремонтировать..." rows={4} value={form.problemText} onChange={(e) => setForm({ ...form, problemText: e.target.value })} />
              {errors.problemText && <p className="text-sm text-destructive">{errors.problemText}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Отправка..." : "Отправить заявку"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientForm;
