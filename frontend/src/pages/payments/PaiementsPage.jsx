import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CreditCard, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const MODES = { especes:'Espèces', carte:'Carte', virement:'Virement', cheque:'Chèque', mutuelle:'Mutuelle' }
const MODE_BADGE = { especes:'badge-gray', carte:'badge-blue', virement:'badge-blue', cheque:'badge-gray', mutuelle:'badge-green' }

function PaiementModal({ paiement, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!paiement?.id
  const [form, setForm] = useState(paiement || {
    patient_id:'', montant:'', mode_paiement:'especes', statut:'en_attente', description:'', date_paiement:''
  })
  const { data: patients } = useQuery({ queryKey:['patients-list'], queryFn:()=>api.get('/patients?per_page=200').then(r=>r.data.data) })
  const mutation = useMutation({
    mutationFn: d => isEdit ? api.put(`/paiements/${paiement.id}`, d) : api.post('/paiements', d),
    onSuccess: () => { qc.invalidateQueries(['paiements']); toast.success(isEdit?'Modifié':'Ajouté'); onClose() },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{isEdit?'Modifier paiement':'Nouveau paiement'}</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Montant (DT)</label>
              <input type="number" className="input" value={form.montant} onChange={e=>f('montant',e.target.value)} min="0" step="0.01"/>
            </div>
            <div>
              <label className="label">Mode de paiement</label>
              <select className="select" value={form.mode_paiement} onChange={e=>f('mode_paiement',e.target.value)}>
                {Object.entries(MODES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Statut</label>
              <select className="select" value={form.statut} onChange={e=>f('statut',e.target.value)}>
                <option value="paye">Payé</option>
                <option value="en_attente">En attente</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div>
              <label className="label">Date de paiement</label>
              <input type="datetime-local" className="input" value={form.date_paiement||''} onChange={e=>f('date_paiement',e.target.value)}/>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description||''} onChange={e=>f('description',e.target.value)} placeholder="Prestation, acte..."/>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin"/>}
            {isEdit?'Modifier':'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaiementsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [filterStatut, setFilterStatut] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['paiements', filterStatut],
    queryFn: () => api.get('/paiements', { params: { statut: filterStatut } }).then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/paiements/${id}`),
    onSuccess: () => { qc.invalidateQueries(['paiements']); toast.success('Supprimé') },
  })

  const totalPaye = data?.data?.filter(p=>p.statut==='paye').reduce((s,p)=>s+p.montant,0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Paiements</h1>
          <p className="text-slate-500 text-sm mt-1">Total encaissé : <span className="font-bold text-emerald-600">{totalPaye.toFixed(2)} DT</span></p>
        </div>
        <button className="btn-primary" onClick={()=>setModal('new')}><Plus size={18}/> Nouveau paiement</button>
      </div>

      <div className="card mb-6 flex gap-4 items-end">
        <div>
          <label className="label">Statut</label>
          <select className="select" value={filterStatut} onChange={e=>setFilterStatut(e.target.value)}>
            <option value="">Tous</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>{['Patient','Montant','Mode','Statut','Description','Date','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30"/><p>Aucun paiement</p>
                </td></tr>
              ) : data.data.map(p=>(
                <tr key={p.id} className="table-row">
                  <td className="table-td font-medium">{p.patient?.prenom} {p.patient?.nom}</td>
                  <td className="table-td"><span className="font-bold text-slate-800">{parseFloat(p.montant).toFixed(2)} DT</span></td>
                  <td className="table-td"><span className={MODE_BADGE[p.mode_paiement]}>{MODES[p.mode_paiement]}</span></td>
                  <td className="table-td">
                    <span className={p.statut==='paye'?'badge-green':p.statut==='annule'?'badge-red':'badge-orange'}>
                      {p.statut==='paye'?'Payé':p.statut==='annule'?'Annulé':'En attente'}
                    </span>
                  </td>
                  <td className="table-td text-slate-500">{p.description||'—'}</td>
                  <td className="table-td text-sm">{p.date_paiement?format(new Date(p.date_paiement),'dd/MM/yyyy'):'—'}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={()=>setModal(p)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"><Pencil size={15}/></button>
                      <button onClick={()=>confirm('Supprimer ?')&&deleteMutation.mutate(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <PaiementModal paiement={modal==='new'?null:modal} onClose={()=>setModal(null)}/>}
    </div>
  )
}
