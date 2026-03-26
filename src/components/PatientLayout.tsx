import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PatientSidebar } from '@/components/PatientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PatientLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PatientSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Smile Clinic</span>
              <Badge variant="outline" className="text-xs">Portal do Paciente</Badge>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">{user?.email}</div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
