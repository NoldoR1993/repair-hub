import { ClipboardList, LayoutDashboard, Wrench, FileText } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useRole } from '@/contexts/RoleContext';
import { RoleSwitcher } from '@/components/RoleSwitcher';
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { currentStaff } = useRole();

  const navItems = [
    { title: 'Новая заявка', url: '/', icon: FileText },
    ...(currentStaff?.role === 'dispatcher'
      ? [{ title: 'Диспетчерская', url: '/dispatcher', icon: LayoutDashboard }]
      : []),
    ...(currentStaff?.role === 'master'
      ? [{ title: 'Мои задачи', url: '/master', icon: Wrench }]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && (
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
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

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && <RoleSwitcher />}
      </SidebarFooter>
    </Sidebar>
  );
}
