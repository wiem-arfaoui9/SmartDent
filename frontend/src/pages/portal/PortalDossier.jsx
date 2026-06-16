import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2, Calendar, Pill } from 'lucide-react'
import api from '../../services/api'
import { format } from 'date-fns'

export default function PortalDossier() {
  const { data, isLoading } = useQuery({
    queryKey: ['portail-dossier'],
    queryFn: () => api.get('/portail/dossier').then(r => r.data),
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mon dossier médical</h1>
        <p className="text-slate-500 text-sm mt-1">{data?.length ?? 0} consultation(s) enregistrée(s)</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></div>
      ) : !data?.length ? (
        <div className="card text-center py-16 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucune consultation enregistrée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(d => (
            <div key={d.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600"/>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{format(new Date(d.created_at),'dd/MM/yyyy')}</p>
                    <p className="text-xs text-slate-500">Dr. {d.dentiste?.name}</p>
                  </div>
                </div>
                {d.dent_concernee && <span className="badge-blue">Dent {d.dent_concernee}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Diagnostic</p>
                  <p className="text-sm text-slate-800">{d.diagnostic}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Traitement</p>
                  <p className="text-sm text-slate-800">{d.traitement}</p>
                </div>
                {d.medicaments && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs font-semibold text-orange-600 uppercase mb-1 flex items-center gap-1"><Pill size={11}/>Médicaments</p>
                    <p className="text-sm text-slate-800">{d.medicaments}</p>
                  </div>
                )}
                {d.prochaine_visite && (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-600 uppercase mb-1">Prochaine visite</p>
                    <p className="text-sm font-bold text-slate-800">{format(new Date(d.prochaine_visite),'dd/MM/yyyy')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
