import { useRole } from '@/contexts/RoleContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog } from 'lucide-react';

export const RoleSwitcher = () => {
  const { currentStaff, allStaff, setCurrentStaff } = useRole();

  if (!currentStaff) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <UserCog className="h-4 w-4 text-sidebar-foreground/60" />
      <Select
        value={currentStaff.id}
        onValueChange={(id) => {
          const staff = allStaff.find((s) => s.id === id);
          if (staff) setCurrentStaff(staff);
        }}
      >
        <SelectTrigger className="h-8 border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allStaff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name} ({s.role === 'dispatcher' ? 'Диспетчер' : 'Мастер'})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
