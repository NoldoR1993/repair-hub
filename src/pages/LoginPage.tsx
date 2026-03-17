import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, UserRound, Wrench, ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

const quickAccounts = [
  { title: "Главный диспетчер", username: "admin", password: "admin", icon: ShieldCheck },
  { title: "Мастер 1", username: "worker1", password: "password", icon: Wrench },
  { title: "Мастер 2", username: "worker2", password: "password", icon: UserRound },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentStaff } = useRole();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !currentStaff) {
      return;
    }

    navigate(currentStaff.role === "dispatcher" ? "/dispatcher" : "/master", { replace: true });
  }, [currentStaff, isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      toast.success("Вход выполнен");
    } catch {
      toast.error("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (nextUsername: string, nextPassword: string) => {
    setUsername(nextUsername);
    setPassword(nextPassword);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_40%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="flex flex-col justify-between rounded-[28px] bg-sidebar px-8 py-10 text-sidebar-foreground shadow-2xl shadow-sidebar/10">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-sidebar-border bg-sidebar-accent/40 px-4 py-2 text-sm">
              <BrandMark className="h-5 w-5" />
              Панель сотрудников Repair Hub
            </div>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Вход для мастеров и главного диспетчера
            </h1>
            <p className="mt-5 max-w-xl text-base text-sidebar-foreground/75 sm:text-lg">
              Рабочая зона для управления заявками, назначения мастеров и контроля статусов без ручного переключения ролей.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {quickAccounts.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => fillCredentials(account.username, account.password)}
                className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4 text-left transition hover:border-sidebar-primary/40 hover:bg-sidebar-accent"
              >
                <account.icon className="mb-4 h-5 w-5 text-sidebar-primary" />
                <p className="text-sm font-semibold">{account.title}</p>
                <p className="mt-2 text-xs text-sidebar-foreground/65">{account.username}</p>
                <p className="mt-1 text-xs text-sidebar-foreground/65">{account.password}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-xl border-border/70 bg-card/95 shadow-2xl shadow-primary/5 backdrop-blur">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl">Вход в систему</CardTitle>
              <CardDescription className="text-base">
                Введите учетные данные сотрудника. Клиентская форма подачи заявки доступна отдельно.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Логин</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin или worker1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Введите пароль"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? "Вход..." : "Войти"}
                </Button>
              </form>

              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-foreground">Нужно создать заявку без входа?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Используй публичную форму обращения, она открывается отдельно от служебной панели.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/apply">
                    Открыть форму заявки
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
