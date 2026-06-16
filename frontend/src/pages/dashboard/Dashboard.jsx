import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, CalendarDays, CreditCard, UserCog, TrendingUp, Clock } from 'lucide-react'
import api from '../../services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function StatCard({ icon: Icon, label, value, change, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-100' },
    green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    orange: { bg: 'bg-orange-50',  icon: 'text-orange-600',  border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600',  border: 'border-purple-100' },
  }
  const c = colors[color]
  return (
    <div className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value ?? '—'}</p>
          {change && <p className="text-emerald-600 text-xs font-semibold mt-1.5 flex items-center gap-1"><TrendingUp size={12}/>{change}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => api.get('/dashboard/stats').then(r => r.data) })
  const { data: rdvToday } = useQuery({ queryKey: ['rdv-today'], queryFn: () => api.get('/dashboard/rdv-today').then(r => r.data) })
  const { data: chartRdv } = useQuery({ queryKey: ['chart-rdv'], queryFn: () => api.get('/dashboard/chart-rdv').then(r => r.data) })
  const { data: chartRev } = useQuery({ queryKey: ['chart-revenus'], queryFn: () => api.get('/dashboard/chart-revenus').then(r => r.data) })

  const revenusData = chartRev?.map(d => ({ mois: MOIS[d.mois - 1], total: d.total })) ?? []

  const statutBadge = (s) => ({
    planifie:  <span className="badge-blue">Planifié</span>,
    confirme:  <span className="badge-green">Confirmé</span>,
    annule:    <span className="badge-red">Annulé</span>,
    termine:   <span className="badge-gray">Terminé</span>,
  }[s] || <span className="badge-gray">{s}</span>)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard icon={Users}       label="Total patients"    value={stats?.total_patients}    change="+12 ce mois" color="blue" />
        <StatCard icon={CalendarDays} label="RDV aujourd'hui"  value={stats?.rdv_today}         color="green" />
        <StatCard icon={CreditCard}  label="Revenus du mois"  value={`${stats?.revenus_mois?.toLocaleString() ?? 0} DT`} color="orange" />
        <StatCard icon={UserCog}     label="Employés"          value={stats?.total_employes}    color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-5">Rendez-vous (30 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartRdv ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={d => `Date: ${d}`} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-5">Revenus mensuels (DT)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v} DT`]} />
              <Bar dataKey="total" fill="#2563eb" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">Rendez-vous d'aujourd'hui</h2>
          <span className="badge-blue">{rdvToday?.length ?? 0} RDV</span>
        </div>
        {!rdvToday?.length ? (
          <div className="text-center py-10 text-slate-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun rendez-vous aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rdvToday.map(rdv => (
              <div key={rdv.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{rdv.patient?.prenom} {rdv.patient?.nom}</p>
                  <p className="text-xs text-slate-500">{rdv.motif} · Dr. {rdv.dentiste?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{format(new Date(rdv.date_heure), 'HH:mm')}</p>
                  {statutBadge(rdv.statut)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
