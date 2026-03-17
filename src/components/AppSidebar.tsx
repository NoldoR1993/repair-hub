import { LayoutDashboard, Wrench, FileText, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useRole } from '@/contexts/RoleContext';
import { BrandMark } from '@/components/BrandMark';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { currentStaff, logout } = useRole();

  const navItems = [
    ...(currentStaff?.role === 'dispatcher'
      ? [
          { title: 'Диспетчерская', url: '/dispatcher', icon: LayoutDashboard },
          { title: 'Новая заявка', url: '/request', icon: FileText },
        ]
      : []),
    ...(currentStaff?.role === 'master'
      ? [{ title: 'Мои задачи', url: '/master', icon: Wrench }]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <BrandMark className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              Ремонтная служба
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {collapsed ? (
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-sidebar-accent px-3 py-2">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                {currentStaff?.displayName}
              </p>
              <p className="text-xs text-sidebar-accent-foreground/70">
                {currentStaff?.role === "dispatcher" ? "Главный диспетчер" : "Мастер"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
