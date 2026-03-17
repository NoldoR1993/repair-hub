import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { AppSidebar } from "@/components/AppSidebar";
import ClientForm from "./pages/ClientForm";
import DispatcherDashboard from "./pages/DispatcherDashboard";
import LoginPage from "./pages/LoginPage";
import MasterDashboard from "./pages/MasterDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <h1 className="ml-3 text-sm font-semibold text-muted-foreground">
              Заявки в ремонтную службу
            </h1>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RootRedirect() {
  const { isAuthenticated, currentStaff } = useRole();

  if (!isAuthenticated || !currentStaff) {
    return <LoginPage />;
  }

  return <Navigate to={currentStaff.role === "dispatcher" ? "/dispatcher" : "/master"} replace />;
}

function RequireAuth({ role }: { role: "dispatcher" | "master" }) {
  const { isAuthenticated, currentStaff } = useRole();
  const location = useLocation();

  if (!isAuthenticated || !currentStaff) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (currentStaff.role !== role) {
    return <Navigate to={currentStaff.role === "dispatcher" ? "/dispatcher" : "/master"} replace />;
  }

  return <Outlet />;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/apply" element={<ClientForm />} />

    <Route element={<RequireAuth role="dispatcher" />}>
      <Route element={<AppShell />}>
        <Route path="/dispatcher" element={<DispatcherDashboard />} />
        <Route path="/request" element={<ClientForm />} />
      </Route>
    </Route>

    <Route element={<RequireAuth role="master" />}>
      <Route element={<AppShell />}>
        <Route path="/master" element={<MasterDashboard />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <RoleProvider>
          <AppRoutes />
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
