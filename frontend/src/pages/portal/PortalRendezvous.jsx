import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarDays, X, Loader2, Clock } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUTS = { planifie:'Planifié', confirme:'Confirmé', annule:'Annulé', termine:'Terminé' }
const STATUT_BADGE = { planifie:'badge-blue', confirme:'badge-green', annule:'badge-red', termine:'badge-gray' }

function BookingModal({ onClose }) {
  const qc = useQueryClient()
  const [dentisteId, setDentisteId] = useState('')
  const [date, setDate] = useState('')
  const [creneau, setCreneau] = useState('')
  const [motif, setMotif] = useState('')

  const { data: employes } = useQuery({
    queryKey: ['employes-dentistes'],
    queryFn: () => api.get('/employes?poste=dentiste').then(r => r.data.data),
  })

  const { data: creneaux, isLoading: loadingCreneaux } = useQuery({
    queryKey: ['creneaux', dentisteId, date],
    queryFn: () => api.get('/portail/creneaux', { params: { dentiste_id: dentisteId, date } }).then(r => r.data),
    enabled: !!dentisteId && !!date,
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/portail/rendezvous', {
      dentiste_id: dentisteId,
      date_heure: `${date} ${creneau}:00`,
      motif,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['portail-rdvs'])
      toast.success('Rendez-vous réservé !')
      onClose()
    },
    onError: e => toast.error(e.response?.data?.message || 'Erreur lors de la réservation'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">Prendre rendez-vous</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Praticien</label>
            <select className="select" value={dentisteId} onChange={e=>{setDentisteId(e.target.value); setCreneau('')}}>
              <option value="">Sélectionner...</option>
              {employes?.map(e=><option key={e.user_id} value={e.user_id}>Dr. {e.prenom} {e.nom} {e.specialite ? `(${e.specialite})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date souhaitée</label>
            <input type="date" className="input" min={new Date().toISOString().slice(0,10)} value={date} onChange={e=>{setDate(e.target.value); setCreneau('')}} />
          </div>
          {dentisteId && date && (
            <div>
              <label className="label">Créneaux disponibles</label>
              {loadingCreneaux ? (
                <div className="py-4 text-center"><Loader2 size={20} className="animate-spin mx-auto text-slate-400"/></div>
              ) : !creneaux?.length ? (
                <p className="text-sm text-slate-400">Aucun créneau disponible ce jour-là.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {creneaux.map(c => (
                    <button key={c} onClick={()=>setCreneau(c)}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all ${creneau===c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="label">Motif de la visite</label>
            <input className="input" value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Ex: Contrôle, douleur, détartrage..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>mutation.mutate()} disabled={!dentisteId || !date || !creneau || !motif || mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin"/>}
            Réserver
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PortalRendezvous() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)

  const { data: rdvs, isLoading } = useQuery({
    queryKey: ['portail-rdvs'],
    queryFn: () => api.get('/portail/rendezvous').then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/portail/rendezvous/${id}/annuler`),
    onSuccess: () => { qc.invalidateQueries(['portail-rdvs']); toast.success('Rendez-vous annulé') },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mes rendez-vous</h1>
          <p className="text-slate-500 text-sm mt-1">{rdvs?.length ?? 0} rendez-vous au total</p>
        </div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={18}/> Prendre rendez-vous</button>
      </div>

      {isLoading ? (
        <div className="text-center py-20"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></div>
      ) : !rdvs?.length ? (
        <div className="card text-center py-16 text-slate-400">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucun rendez-vous pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rdvs.map(r => (
            <div key={r.id} className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-blue-600"/>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{r.motif}</p>
                <p className="text-sm text-slate-500">Dr. {r.dentiste?.name} · {format(new Date(r.date_heure),'dd/MM/yyyy à HH:mm')}</p>
              </div>
              <span className={STATUT_BADGE[r.statut]}>{STATUTS[r.statut]}</span>
              {r.statut === 'planifie' && new Date(r.date_heure) > new Date() && (
                <button onClick={()=>confirm('Annuler ce rendez-vous ?') && cancelMutation.mutate(r.id)} className="btn-danger text-xs px-3 py-1.5">Annuler</button>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && <BookingModal onClose={()=>setModal(false)} />}
    </div>
  )
}
