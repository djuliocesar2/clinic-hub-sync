import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useRole } from '@/contexts/RoleContext';
import { Badge } from '@/components/ui/badge';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { role, profile } = useRole();

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
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">CH</span>
              </div>
              <span className="font-semibold text-foreground">Clinic Hub</span>
              <Badge variant="secondary" className="text-xs">{roleLabels[role ?? ''] ?? 'Staff'}</Badge>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">{profile?.full_name || ''}</div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
