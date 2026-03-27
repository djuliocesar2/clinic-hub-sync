import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PatientSidebar } from '@/components/PatientSidebar';
import { Badge } from '@/components/ui/badge';

export function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PatientSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">CH</span>
              </div>
              <span className="font-semibold text-foreground">Clinic Hub</span>
              <Badge variant="outline" className="text-xs">Portal do Paciente</Badge>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
