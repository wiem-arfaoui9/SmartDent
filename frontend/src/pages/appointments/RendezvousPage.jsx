import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarDays, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUTS = { planifie:'Planifié', confirme:'Confirmé', annule:'Annulé', termine:'Terminé' }
const STATUT_BADGE = {
  planifie: 'badge-blue', confirme: 'badge-green',
  annule: 'badge-red', termine: 'badge-gray'
}

function RdvModal({ rdv, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!rdv?.id
  const [form, setForm] = useState(rdv || {
    patient_id:'', dentiste_id:'', date_heure:'', duree:30, motif:'', notes:'', statut:'planifie'
  })

  const { data: patients } = useQuery({ queryKey:['patients-list'], queryFn:()=>api.get('/patients?per_page=200').then(r=>r.data.data) })
  const { data: employes } = useQuery({ queryKey:['employes-list'],  queryFn:()=>api.get('/employes?poste=dentiste').then(r=>r.data.data) })

  const mutation = useMutation({
    mutationFn: d => isEdit ? api.put(`/rendezvous/${rdv.id}`, d) : api.post('/rendezvous', d),
    onSuccess: () => { qc.invalidateQueries(['rendezvous']); toast.success(isEdit?'RDV modifié':'RDV créé'); onClose() },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })

  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{isEdit?'Modifier RDV':'Nouveau Rendez-vous'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Patient</label>
            <select className="select" value={form.patient_id} onChange={e=>f('patient_id',e.target.value)}>
              <option value="">Sélectionner...</option>
              {patients?.map(p=><option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Dentiste</label>
            <select className="select" value={form.dentiste_id} onChange={e=>f('dentiste_id',e.target.value)}>
              <option value="">Sélectionner...</option>
              {employes?.map(e=><option key={e.user_id} value={e.user_id}>Dr. {e.prenom} {e.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date & heure</label>
              <input type="datetime-local" className="input" value={form.date_heure||''} onChange={e=>f('date_heure',e.target.value)} />
            </div>
            <div>
              <label className="label">Durée (min)</label>
              <select className="select" value={form.duree} onChange={e=>f('duree',+e.target.value)}>
                {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Motif</label>
            <input className="input" value={form.motif||''} onChange={e=>f('motif',e.target.value)} placeholder="Ex: Détartrage, Carie..." />
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="select" value={form.statut} onChange={e=>f('statut',e.target.value)}>
              {Object.entries(STATUTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes||''} onChange={e=>f('notes',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin"/>}
            {isEdit?'Modifier':'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RendezvousPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['rendezvous', filterDate, filterStatut],
    queryFn: () => api.get('/rendezvous', { params: { date: filterDate, statut: filterStatut } }).then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/rendezvous/${id}`),
    onSuccess: () => { qc.invalidateQueries(['rendezvous']); toast.success('RDV supprimé') },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Rendez-vous</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? 0} rendez-vous</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}><Plus size={18}/> Nouveau RDV</button>
      </div>

      <div className="card mb-6 flex gap-4">
        <div className="flex-1">
          <label className="label">Date</label>
          <input type="date" className="input" value={filterDate} onChange={e=>setFilterDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">Statut</label>
          <select className="select" value={filterStatut} onChange={e=>setFilterStatut(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(STATUTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>{['Patient','Dentiste','Date & Heure','Durée','Motif','Statut','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">
                  <CalendarDays size={40} className="mx-auto mb-3 opacity-30"/><p>Aucun rendez-vous</p>
                </td></tr>
              ) : data.data.map(rdv => (
                <tr key={rdv.id} className="table-row">
                  <td className="table-td font-medium">{rdv.patient?.prenom} {rdv.patient?.nom}</td>
                  <td className="table-td text-slate-500">Dr. {rdv.dentiste?.name}</td>
                  <td className="table-td">{format(new Date(rdv.date_heure),'dd/MM/yyyy HH:mm')}</td>
                  <td className="table-td">{rdv.duree} min</td>
                  <td className="table-td">{rdv.motif}</td>
                  <td className="table-td"><span className={STATUT_BADGE[rdv.statut]}>{STATUTS[rdv.statut]}</span></td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={()=>setModal(rdv)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"><Pencil size={15}/></button>
                      <button onClick={()=>confirm('Supprimer ?')&&deleteMutation.mutate(rdv.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <RdvModal rdv={modal==='new'?null:modal} onClose={()=>setModal(null)} />}
    </div>
  )
}
