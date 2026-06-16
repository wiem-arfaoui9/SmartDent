import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCog, X, Loader2, Pencil, Trash2, Mail, Phone } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const POSTES = { dentiste:'Dentiste', secretaire:'Secrétaire', assistant:'Assistant', hygieniste:'Hygiéniste' }
const POSTE_BADGE = { dentiste:'badge-blue', secretaire:'badge-green', assistant:'badge-orange', hygieniste:'badge-gray' }

function EmployeModal({ employe, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!employe?.id
  const [form, setForm] = useState(employe || {
    nom:'', prenom:'', email:'', telephone:'', poste:'dentiste',
    specialite:'', date_embauche:'', salaire:'', cin:'', adresse:''
  })
  const mutation = useMutation({
    mutationFn: d => isEdit ? api.put(`/employes/${employe.id}`, d) : api.post('/employes', d),
    onSuccess: () => { qc.invalidateQueries(['employes']); toast.success(isEdit?'Modifié':'Ajouté'); onClose() },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{isEdit?'Modifier employé':'Nouvel employé'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[['nom','Nom'],['prenom','Prénom'],['cin','CIN'],['telephone','Téléphone'],['email','Email']].map(([k,l])=>(
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" value={form[k]||''} onChange={e=>f(k,e.target.value)}/>
            </div>
          ))}
          <div>
            <label className="label">Poste</label>
            <select className="select" value={form.poste} onChange={e=>f('poste',e.target.value)}>
              {Object.entries(POSTES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Spécialité</label>
            <input className="input" value={form.specialite||''} onChange={e=>f('specialite',e.target.value)}/>
          </div>
          <div>
            <label className="label">Date d'embauche</label>
            <input type="date" className="input" value={form.date_embauche||''} onChange={e=>f('date_embauche',e.target.value)}/>
          </div>
          <div>
            <label className="label">Salaire (DT)</label>
            <input type="number" className="input" value={form.salaire||''} onChange={e=>f('salaire',e.target.value)} min="0"/>
          </div>
          <div className="col-span-2">
            <label className="label">Adresse</label>
            <input className="input" value={form.adresse||''} onChange={e=>f('adresse',e.target.value)}/>
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

export default function EmployesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employes'],
    queryFn: () => api.get('/employes').then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/employes/${id}`),
    onSuccess: () => { qc.invalidateQueries(['employes']); toast.success('Supprimé') },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Employés</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? 0} membres du personnel</p>
        </div>
        <button className="btn-primary" onClick={()=>setModal('new')}><Plus size={18}/> Nouvel employé</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 text-center py-20"><Loader2 size={32} className="animate-spin mx-auto text-slate-400"/></div>
        ) : !data?.data?.length ? (
          <div className="col-span-3 text-center py-20 text-slate-400">
            <UserCog size={48} className="mx-auto mb-4 opacity-30"/><p>Aucun employé enregistré</p>
          </div>
        ) : data.data.map(emp => (
          <div key={emp.id} className="card hover:shadow-card-hover hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                  {emp.prenom[0]}{emp.nom[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{emp.prenom} {emp.nom}</p>
                  <span className={POSTE_BADGE[emp.poste]}>{POSTES[emp.poste]}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>setModal(emp)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"><Pencil size={15}/></button>
                <button onClick={()=>confirm('Supprimer ?')&&deleteMutation.mutate(emp.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15}/></button>
              </div>
            </div>
            {emp.specialite && <p className="text-xs text-slate-500 mb-3">🎓 {emp.specialite}</p>}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={13} className="text-slate-400"/>{emp.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={13} className="text-slate-400"/>{emp.telephone}
              </div>
            </div>
            {emp.salaire && (
              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <span className="text-slate-500">Salaire</span>
                <span className="font-bold text-slate-800">{parseFloat(emp.salaire).toLocaleString()} DT</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {modal && <EmployeModal employe={modal==='new'?null:modal} onClose={()=>setModal(null)}/>}
    </div>
  )
}
