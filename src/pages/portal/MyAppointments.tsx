import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, X, RefreshCw } from 'lucide-react';

const statusColors: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

export default function MyAppointments() {
  const { patientId } = useRole();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!patientId) return;
    const { data } = await supabase.from('appointments')
      .select('*, dentists(name)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });
    setAppointments(data ?? []);
  };

  useEffect(() => { fetchAppointments(); }, [patientId]);

  const handleCancel = async (appt: any) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    const { error } = await supabase.from('appointments')
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', appt.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      await supabase.from('appointment_status_history').insert({
        appointment_id: appt.id, old_status: appt.status, new_status: 'cancelada', reason: 'Cancelado pelo paciente',
      });
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
      await supabase.from('appointment_status_history').insert({
        appointment_id: selectedAppt.id, old_status: selectedAppt.status, new_status: 'agendada',
        reason: reason || 'Reagendado pelo paciente',
      });
      toast({ title: 'Agendamento reagendado' });
      setRescheduleOpen(false);
      fetchAppointments();
    }
    setLoading(false);
  };

  if (!patientId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Sua conta ainda não está vinculada a um cadastro de paciente. Entre em contato com a clínica.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus Agendamentos</h1>

      {appointments.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Nenhum agendamento encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map(a => (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(new Date(a.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')} às {a.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Dr(a). {a.dentists?.name}</p>
                    {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[a.status] ?? ''}>{a.status}</Badge>
                    {a.status === 'agendada' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openReschedule(a)}>
                          <RefreshCw className="mr-1 h-3 w-3" /> Reagendar
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleCancel(a)}>
                          <X className="mr-1 h-3 w-3" /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancelar</Button>
            <Button onClick={handleReschedule} disabled={loading || !newDate || !newTime}>{loading ? 'Salvando...' : 'Confirmar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
