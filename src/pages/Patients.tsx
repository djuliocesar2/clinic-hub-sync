import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  insurance_plan_id: string | null;
  insurance_plans?: { name: string } | null;
}

interface InsurancePlan {
  id: string;
  name: string;
}

const emptyForm = { name: '', cpf: '', phone: '', email: '', birth_date: '', insurance_plan_id: '' };

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('*, insurance_plans(name)').order('name');
    setPatients((data as any) ?? []);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from('insurance_plans').select('id, name').order('name');
    setPlans(data ?? []);
  };

  useEffect(() => { fetchPatients(); fetchPlans(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf && p.cpf.includes(search))
  );

  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };
  const openEdit = (p: Patient) => {
    setForm({ name: p.name, cpf: p.cpf ?? '', phone: p.phone ?? '', email: p.email ?? '', birth_date: p.birth_date ?? '', insurance_plan_id: p.insurance_plan_id ?? '' });
    setEditId(p.id);
    setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      name: form.name,
      cpf: form.cpf || null,
      phone: form.phone || null,
      email: form.email || null,
      birth_date: form.birth_date || null,
      insurance_plan_id: form.insurance_plan_id || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editId
      ? await supabase.from('patients').update(payload).eq('id', editId)
      : await supabase.from('patients').insert(payload);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Paciente atualizado' : 'Paciente criado' });
      setOpen(false);
      fetchPatients();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este paciente?')) return;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Paciente excluído' }); fetchPatients(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Paciente</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum paciente encontrado.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.cpf ?? '-'}</TableCell>
                <TableCell>{p.phone ?? '-'}</TableCell>
                <TableCell>{p.email ?? '-'}</TableCell>
                <TableCell>{p.insurance_plans?.name ?? '-'}</TableCell>
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
          <DialogHeader><DialogTitle>{editId ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></div>
              <div>
                <Label>Convênio</Label>
                <Select value={form.insurance_plan_id} onValueChange={v => setForm({ ...form, insurance_plan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(pl => <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.name}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
