import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role } = useRole();

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    receptionist: 'Recepcionista',
    dentist: 'Dentista',
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Smile Clinic</span>
              <Badge variant="secondary" className="text-xs">{roleLabels[role ?? ''] ?? 'Staff'}</Badge>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">{user?.email}</div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
