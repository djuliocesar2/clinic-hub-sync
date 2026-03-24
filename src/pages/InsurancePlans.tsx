import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function InsurancePlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from('insurance_plans').select('*').order('name');
    setPlans(data ?? []);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setName(''); setEditId(null); setOpen(true); };
  const openEdit = (p: any) => { setName(p.name); setEditId(p.id); setOpen(true); };

  const handleSave = async () => {
    setLoading(true);
    const payload = { name, updated_at: new Date().toISOString() };
    const { error } = editId ? await supabase.from('insurance_plans').update(payload).eq('id', editId) : await supabase.from('insurance_plans').insert(payload);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: editId ? 'Convênio atualizado' : 'Convênio criado' }); setOpen(false); fetch(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este convênio?')) return;
    const { error } = await supabase.from('insurance_plans').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Convênio excluído' }); fetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Convênios</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Convênio</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum convênio.</TableCell></TableRow>
            ) : plans.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
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
          <DialogHeader><DialogTitle>{editId ? 'Editar Convênio' : 'Novo Convênio'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !name}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
