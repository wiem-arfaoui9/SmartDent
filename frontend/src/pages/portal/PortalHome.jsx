import { useQuery } from '@tanstack/react-query'
import { CalendarDays, FileText, CreditCard, ClipboardList, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PortalHome() {
  const { data: profil } = useQuery({ queryKey:['portail-profil'], queryFn:()=>api.get('/portail/profil').then(r=>r.data) })
  const { data: rdvs }   = useQuery({ queryKey:['portail-rdvs'],   queryFn:()=>api.get('/portail/rendezvous').then(r=>r.data) })
  const { data: factures } = useQuery({ queryKey:['portail-factures'], queryFn:()=>api.get('/portail/factures').then(r=>r.data) })

  const prochains = rdvs?.filter(r => new Date(r.date_heure) > new Date() && r.statut !== 'annule').slice(0,3) ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bonjour {profil?.prenom} 👋</h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <Link to="/espace-patient/rendezvous" className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3"><CalendarDays size={22} className="text-blue-600"/></div>
          <p className="text-2xl font-bold">{rdvs?.length ?? 0}</p>
          <p className="text-sm text-slate-500">Rendez-vous</p>
        </Link>
        <Link to="/espace-patient/dossier" className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3"><FileText size={22} className="text-emerald-600"/></div>
          <p className="text-2xl font-bold">Dossier</p>
          <p className="text-sm text-slate-500">Historique médical</p>
        </Link>
        <Link to="/espace-patient/factures" className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3"><CreditCard size={22} className="text-orange-600"/></div>
          <p className="text-2xl font-bold">{factures?.length ?? 0}</p>
          <p className="text-sm text-slate-500">Factures & reçus</p>
        </Link>
        <Link to="/espace-patient/schema" className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3"><ClipboardList size={22} className="text-purple-600"/></div>
          <p className="text-2xl font-bold">Schéma</p>
          <p className="text-sm text-slate-500">Dentaire interactif</p>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-base font-bold mb-4">Prochains rendez-vous</h2>
        {!prochains.length ? (
          <div className="text-center py-10 text-slate-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-40"/>
            <p className="text-sm">Aucun rendez-vous à venir</p>
            <Link to="/espace-patient/rendezvous" className="btn-primary mt-4 inline-flex">Prendre rendez-vous</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {prochains.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-blue-600"/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{r.motif}</p>
                  <p className="text-xs text-slate-500">Dr. {r.dentiste?.name}</p>
                </div>
                <p className="text-sm font-bold">{format(new Date(r.date_heure),'dd/MM/yyyy HH:mm')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
