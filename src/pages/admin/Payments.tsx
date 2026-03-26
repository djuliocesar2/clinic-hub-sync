import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const emptyForm = { patient_id: '', appointment_id: '', amount: '', status: 'pendente', payment_method: '', payment_date: '', notes: '' };

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    const [pay, pat, appt] = await Promise.all([
      supabase.from('payments').select('*, patients(name)').order('created_at', { ascending: false }),
      supabase.from('patients').select('id, name').order('name'),
      supabase.from('appointments').select('id, appointment_date, appointment_time, patients(name)').order('appointment_date', { ascending: false }).limit(50),
    ]);
    setPayments(pay.data ?? []);
    setPatients(pat.data ?? []);
    setAppointments(appt.data ?? []);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };
  const openEdit = (p: any) => {
    setForm({
      patient_id: p.patient_id, appointment_id: p.appointment_id ?? '',
      amount: String(p.amount), status: p.status, payment_method: p.payment_method ?? '',
      payment_date: p.payment_date ?? '', notes: p.notes ?? '',
    });
    setEditId(p.id); setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      patient_id: form.patient_id,
      appointment_id: form.appointment_id || null,
      amount: parseFloat(form.amount),
      status: form.status,
      payment_method: form.payment_method || null,
      payment_date: form.payment_date || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editId
      ? await supabase.from('payments').update(payload).eq('id', editId)
      : await supabase.from('payments').insert(payload);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: editId ? 'Pagamento atualizado' : 'Pagamento registrado' }); setOpen(false); fetchAll(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este pagamento?')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Pagamento excluído' }); fetchAll(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Pagamento</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Data Pgto</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum pagamento.</TableCell></TableRow>
            ) : payments.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.patients?.name}</TableCell>
                <TableCell>R$ {Number(p.amount).toFixed(2)}</TableCell>
                <TableCell><Badge className={statusColors[p.status] ?? ''}>{p.status}</Badge></TableCell>
                <TableCell>{p.payment_method ?? '-'}</TableCell>
                <TableCell>{p.payment_date ? format(new Date(p.payment_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Paciente *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Método de Pagamento</Label><Input value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} placeholder="PIX, Cartão, etc." /></div>
              <div><Label>Data do Pagamento</Label><Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.patient_id || !form.amount}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
