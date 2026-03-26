import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type ReportType = 'appointments' | 'payments' | 'patients';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('appointments');
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (reportType === 'appointments') {
        const { data: appts } = await supabase.from('appointments')
          .select('*, patients(name), dentists(name)')
          .order('appointment_date', { ascending: false }).limit(100);
        setData(appts ?? []);

        // Monthly chart
        const months: Record<string, number> = {};
        (appts ?? []).forEach((a: any) => {
          const m = a.appointment_date?.slice(0, 7);
          if (m) months[m] = (months[m] ?? 0) + 1;
        });
        setChartData(Object.entries(months).sort().slice(-6).map(([m, v]) => ({ month: m, total: v })));
      } else if (reportType === 'payments') {
        const { data: pays } = await supabase.from('payments')
          .select('*, patients(name)')
          .order('created_at', { ascending: false }).limit(100);
        setData(pays ?? []);

        const months: Record<string, number> = {};
        (pays ?? []).filter((p: any) => p.status === 'pago').forEach((p: any) => {
          const m = p.payment_date?.slice(0, 7) ?? p.created_at?.slice(0, 7);
          if (m) months[m] = (months[m] ?? 0) + Number(p.amount);
        });
        setChartData(Object.entries(months).sort().slice(-6).map(([m, v]) => ({ month: m, total: v })));
      } else {
        const { data: pts } = await supabase.from('patients')
          .select('*, insurance_plans(name)')
          .order('created_at', { ascending: false }).limit(100);
        setData(pts ?? []);

        const months: Record<string, number> = {};
        (pts ?? []).forEach((p: any) => {
          const m = p.created_at?.slice(0, 7);
          if (m) months[m] = (months[m] ?? 0) + 1;
        });
        setChartData(Object.entries(months).sort().slice(-6).map(([m, v]) => ({ month: m, total: v })));
      }
    };
    load();
  }, [reportType]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${reportType}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-3">
          <Select value={reportType} onValueChange={v => setReportType(v as ReportType)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="appointments">Agendamentos</SelectItem>
              <SelectItem value="payments">Pagamentos</SelectItem>
              <SelectItem value="patients">Pacientes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{reportType === 'payments' ? 'Receita por Mês' : 'Total por Mês'}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            {reportType === 'payments' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(213, 94%, 45%)" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(213, 94%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dados ({data.length} registros)</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {reportType === 'appointments' && <><TableHead>Paciente</TableHead><TableHead>Dentista</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></>}
                  {reportType === 'payments' && <><TableHead>Paciente</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Data Pgto</TableHead></>}
                  {reportType === 'patients' && <><TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>Telefone</TableHead><TableHead>Convênio</TableHead></>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row: any) => (
                  <TableRow key={row.id}>
                    {reportType === 'appointments' && <>
                      <TableCell>{row.patients?.name}</TableCell>
                      <TableCell>{row.dentists?.name}</TableCell>
                      <TableCell>{row.appointment_date ? format(new Date(row.appointment_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </>}
                    {reportType === 'payments' && <>
                      <TableCell>{row.patients?.name}</TableCell>
                      <TableCell>R$ {Number(row.amount).toFixed(2)}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.payment_date ? format(new Date(row.payment_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                    </>}
                    {reportType === 'patients' && <>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.cpf ?? '-'}</TableCell>
                      <TableCell>{row.phone ?? '-'}</TableCell>
                      <TableCell>{row.insurance_plans?.name ?? '-'}</TableCell>
                    </>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
