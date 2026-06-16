import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarDays, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const TYPES = { conge_paye:'Congé payé', maladie:'Maladie', absence:'Absence', autre:'Autre' }
const STATUT_BADGE = { en_attente:'badge-orange', approuve:'badge-green', refuse:'badge-red' }
const STATUT_LABEL = { en_attente:'En attente', approuve:'Approuvé', refuse:'Refusé' }

function CongeModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ employe_id:'', date_debut:'', date_fin:'', type:'conge_paye', motif:'' })
  const { data: employes } = useQuery({ queryKey:['employes-list-hr'], queryFn:()=>api.get('/employes?per_page=200').then(r=>r.data.data) })
  const mutation = useMutation({
    mutationFn: d => api.post('/conges', d),
    onSuccess: () => { qc.invalidateQueries(['conges']); toast.success('Demande soumise'); onClose() },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">Nouvelle demande de congé</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Employé</label>
            <select className="select" value={form.employe_id} onChange={e=>f('employe_id',e.target.value)}>
              <option value="">Sélectionner...</option>
              {employes?.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date début</label><input type="date" className="input" value={form.date_debut} onChange={e=>f('date_debut',e.target.value)}/></div>
            <div><label className="label">Date fin</label><input type="date" className="input" value={form.date_fin} onChange={e=>f('date_fin',e.target.value)}/></div>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={form.type} onChange={e=>f('type',e.target.value)}>
              {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className="label">Motif</label><textarea className="input" rows={2} value={form.motif} onChange={e=>f('motif',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending&&<Loader2 size={16} className="animate-spin"/>} Soumettre
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CongesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const { data, isLoading } = useQuery({ queryKey:['conges'], queryFn:()=>api.get('/conges').then(r=>r.data) })
  const updateStatut = useMutation({
    mutationFn: ({id,statut}) => api.patch(`/conges/${id}/statut`,{statut}),
    onSuccess: () => { qc.invalidateQueries(['conges']); toast.success('Statut mis à jour') },
  })
  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/conges/${id}`),
    onSuccess: () => { qc.invalidateQueries(['conges']); toast.success('Supprimé') },
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Congés & Absences</h1><p className="text-slate-500 text-sm mt-1">{data?.total??0} demandes</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={18}/> Nouvelle demande</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b"><tr>{['Employé','Type','Période','Motif','Statut','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="text-center py-16"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></td></tr>
            : !data?.data?.length ? <tr><td colSpan={6} className="text-center py-16 text-slate-400"><CalendarDays size={36} className="mx-auto mb-2 opacity-30"/><p>Aucune demande</p></td></tr>
            : data.data.map(c=>(
              <tr key={c.id} className="table-row">
                <td className="table-td font-medium">{c.employe?.prenom} {c.employe?.nom}</td>
                <td className="table-td">{TYPES[c.type]}</td>
                <td className="table-td text-xs">{format(new Date(c.date_debut),'dd/MM/yy')} → {format(new Date(c.date_fin),'dd/MM/yy')}</td>
                <td className="table-td text-slate-500 max-w-xs"><p className="truncate">{c.motif||'—'}</p></td>
                <td className="table-td"><span className={STATUT_BADGE[c.statut]}>{STATUT_LABEL[c.statut]}</span></td>
                <td className="table-td">
                  <div className="flex gap-1">
                    {c.statut==='en_attente' && <>
                      <button onClick={()=>updateStatut.mutate({id:c.id,statut:'approuve'})} className="p-1.5 hover:bg-green-50 rounded-lg text-emerald-600" title="Approuver"><CheckCircle2 size={15}/></button>
                      <button onClick={()=>updateStatut.mutate({id:c.id,statut:'refuse'})} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Refuser"><XCircle size={15}/></button>
                    </>}
                    <button onClick={()=>confirm('Supprimer ?')&&deleteMutation.mutate(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 text-xs">✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <CongeModal onClose={()=>setModal(false)}/>}
    </div>
  )
}
