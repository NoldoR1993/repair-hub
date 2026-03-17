import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import DispatcherDashboard from "./pages/DispatcherDashboard";
import MasterDashboard from "./pages/MasterDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <RoleProvider>
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
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dispatcher" element={<DispatcherDashboard />} />
                    <Route path="/master" element={<MasterDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
