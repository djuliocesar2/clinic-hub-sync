import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, X, RefreshCw, CalendarPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export default function MyAppointments() {
  const { patientId, loading: roleLoading } = useRole();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    if (!patientId) { setFetching(false); return; }
    setFetching(true);
    const { data } = await supabase.from('appointments')
      .select('*, dentists(name)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });
    setAppointments(data ?? []);
    setFetching(false);
  };

  useEffect(() => { if (!roleLoading) fetchAppointments(); }, [patientId, roleLoading]);

  const handleCancel = async (appt: any) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    const { error } = await supabase.from('appointments')
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', appt.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Agendamento cancelado' });
      fetchAppointments();
    }
  };

  const openReschedule = (appt: any) => {
    setSelectedAppt(appt);
    setNewDate(appt.appointment_date);
    setNewTime(appt.appointment_time);
    setReason('');
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedAppt) return;
    setLoading(true);
    const { error } = await supabase.from('appointments')
      .update({ appointment_date: newDate, appointment_time: newTime, updated_at: new Date().toISOString() })
      .eq('id', selectedAppt.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Agendamento reagendado com sucesso!' });
      setRescheduleOpen(false);
      fetchAppointments();
    }
    setLoading(false);
  };

  if (roleLoading || fetching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const upcoming = appointments.filter(a => a.status === 'agendada');
  const past = appointments.filter(a => a.status !== 'agendada');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
        <Button onClick={() => navigate('/portal/new-appointment')}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">Próximas Consultas</h2>
          {upcoming.map(a => (
            <Card key={a.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(new Date(a.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')} às {a.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Dr(a). {a.dentists?.name}</p>
                    {a.notes && <p className="text-sm text-muted-foreground italic">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openReschedule(a)}>
                      <RefreshCw className="mr-1 h-3 w-3" /> Reagendar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleCancel(a)}>
                      <X className="mr-1 h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Histórico</h2>
          {past.map(a => (
            <Card key={a.id} className="opacity-80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {format(new Date(a.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')} às {a.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Dr(a). {a.dentists?.name}</p>
                  </div>
                  <Badge className={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
            <Button onClick={() => navigate('/portal/new-appointment')}>Agendar Consulta</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reagendar Consulta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nova Data *</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <div><Label>Novo Horário *</Label><Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
            <div><Label>Motivo</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo do reagendamento..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Voltar</Button>
            <Button onClick={handleReschedule} disabled={loading || !newDate || !newTime}>{loading ? 'Salvando...' : 'Confirmar Reagendamento'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
