import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function DossierModal({ dossier, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!dossier?.id
  const [form, setForm] = useState(dossier || {
    patient_id:'', diagnostic:'', traitement:'', medicaments:'',
    observations:'', prochaine_visite:'', dent_concernee:''
  })
  const { data: patients } = useQuery({ queryKey:['patients-list'], queryFn:()=>api.get('/patients?per_page=200').then(r=>r.data.data) })
  const mutation = useMutation({
    mutationFn: d => isEdit ? api.put(`/dossiers-medicaux/${dossier.id}`, d) : api.post('/dossiers-medicaux', d),
    onSuccess: () => { qc.invalidateQueries(['dossiers']); toast.success(isEdit?'Modifié':'Créé'); onClose() },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{isEdit?'Modifier dossier':'Nouveau dossier médical'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Patient</label>
              <select className="select" value={form.patient_id} onChange={e=>f('patient_id',e.target.value)}>
                <option value="">Sélectionner...</option>
                {patients?.map(p=><option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dent concernée</label>
              <input className="input" value={form.dent_concernee||''} onChange={e=>f('dent_concernee',e.target.value)} placeholder="Ex: 11, 21, 36..."/>
            </div>
          </div>
          {[['diagnostic','Diagnostic'],['traitement','Traitement'],['medicaments','Médicaments'],['observations','Observations']].map(([k,l])=>(
            <div key={k}>
              <label className="label">{l}</label>
              <textarea className="input" rows={3} value={form[k]||''} onChange={e=>f(k,e.target.value)}/>
            </div>
          ))}
          <div>
            <label className="label">Prochaine visite</label>
            <input type="date" className="input" value={form.prochaine_visite||''} onChange={e=>f('prochaine_visite',e.target.value)}/>
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

export default function DossiersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => api.get('/dossiers-medicaux').then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/dossiers-medicaux/${id}`),
    onSuccess: () => { qc.invalidateQueries(['dossiers']); toast.success('Supprimé') },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dossiers Médicaux</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? 0} dossiers</p>
        </div>
        <button className="btn-primary" onClick={()=>setModal('new')}><Plus size={18}/> Nouveau dossier</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>{['Patient','Diagnostic','Traitement','Dent','Prochaine visite','Date','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-30"/><p>Aucun dossier</p>
                </td></tr>
              ) : data.data.map(d=>(
                <tr key={d.id} className="table-row">
                  <td className="table-td font-semibold">{d.patient?.prenom} {d.patient?.nom}</td>
                  <td className="table-td max-w-xs">
                    <p className="truncate text-sm">{d.diagnostic}</p>
                  </td>
                  <td className="table-td max-w-xs">
                    <p className="truncate text-sm text-slate-500">{d.traitement}</p>
                  </td>
                  <td className="table-td">{d.dent_concernee ? <span className="badge-blue">{d.dent_concernee}</span> : '—'}</td>
                  <td className="table-td">{d.prochaine_visite ? format(new Date(d.prochaine_visite),'dd/MM/yyyy') : '—'}</td>
                  <td className="table-td text-xs text-slate-400">{format(new Date(d.created_at),'dd/MM/yyyy')}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={()=>setModal(d)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"><Pencil size={15}/></button>
                      <button onClick={()=>confirm('Supprimer ?')&&deleteMutation.mutate(d.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <DossierModal dossier={modal==='new'?null:modal} onClose={()=>setModal(null)}/>}
    </div>
  )
}
