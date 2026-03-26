import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, CalendarDays, CheckCircle, XCircle, CreditCard, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    patients: 0, dentists: 0, todayAppts: 0, completedToday: 0,
    cancelledToday: 0, pendingPayments: 0, totalRevenue: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');

    Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('dentists').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today).eq('status', 'concluida'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today).eq('status', 'cancelada'),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('payments').select('amount').eq('status', 'pago'),
      supabase.from('appointments').select('*, patients(name), dentists(name)').gte('appointment_date', today).order('appointment_date').order('appointment_time').limit(5),
      supabase.from('appointments').select('appointment_date, status').gte('appointment_date', format(new Date(Date.now() - 6 * 86400000), 'yyyy-MM-dd')).lte('appointment_date', today),
    ]).then(([p, d, ta, ct, canc, pp, rev, up, weekly]) => {
      const totalRev = (rev.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      setStats({
        patients: p.count ?? 0,
        dentists: d.count ?? 0,
        todayAppts: ta.count ?? 0,
        completedToday: ct.count ?? 0,
        cancelledToday: canc.count ?? 0,
        pendingPayments: pp.count ?? 0,
        totalRevenue: totalRev,
      });
      setUpcoming(up.data ?? []);

      // Weekly chart data
      const days: Record<string, { date: string; total: number; completed: number; cancelled: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd');
        days[d] = { date: format(new Date(Date.now() - i * 86400000), 'dd/MM'), total: 0, completed: 0, cancelled: 0 };
      }
      (weekly.data ?? []).forEach((a: any) => {
        if (days[a.appointment_date]) {
          days[a.appointment_date].total++;
          if (a.status === 'concluida') days[a.appointment_date].completed++;
          if (a.status === 'cancelada') days[a.appointment_date].cancelled++;
        }
      });
      setWeeklyData(Object.values(days));

      // Status pie
      const agendada = (weekly.data ?? []).filter((a: any) => a.status === 'agendada').length;
      const concluida = (weekly.data ?? []).filter((a: any) => a.status === 'concluida').length;
      const cancelada = (weekly.data ?? []).filter((a: any) => a.status === 'cancelada').length;
      setStatusData([
        { name: 'Agendada', value: agendada, color: 'hsl(213, 94%, 45%)' },
        { name: 'Concluída', value: concluida, color: 'hsl(142, 71%, 45%)' },
        { name: 'Cancelada', value: cancelada, color: 'hsl(0, 72%, 51%)' },
      ]);
    });
  }, []);

  const cards = [
    { label: 'Pacientes', value: stats.patients, icon: Users, color: 'text-primary' },
    { label: 'Dentistas', value: stats.dentists, icon: UserCog, color: 'text-primary' },
    { label: 'Agendamentos Hoje', value: stats.todayAppts, icon: CalendarDays, color: 'text-primary' },
    { label: 'Concluídos Hoje', value: stats.completedToday, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Cancelados Hoje', value: stats.cancelledToday, icon: XCircle, color: 'text-destructive' },
    { label: 'Pagamentos Pendentes', value: stats.pendingPayments, icon: CreditCard, color: 'text-yellow-600' },
    { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Agendamentos (7 dias)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(213, 94%, 45%)" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" name="Concluídos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" fill="hsl(0, 72%, 51%)" name="Cancelados" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Status dos Agendamentos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Próximos Agendamentos</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum agendamento próximo.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{a.patients?.name}</p>
                    <p className="text-xs text-muted-foreground">Dr(a). {a.dentists?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{format(new Date(a.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{a.appointment_time?.slice(0, 5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
