import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, Users, Loader2, X } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const GROUPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

function PatientModal({ patient, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!patient?.id
  const [form, setForm] = useState(patient || {
    nom:'', prenom:'', date_naissance:'', sexe:'M',
    cin:'', telephone:'', email:'', adresse:'',
    groupe_sanguin:'', allergies:'', antecedents:'', mutuelle:''
  })

  const mutation = useMutation({
    mutationFn: d => isEdit ? api.put(`/patients/${patient.id}`, d) : api.post('/patients', d),
    onSuccess: () => {
      qc.invalidateQueries(['patients'])
      toast.success(isEdit ? 'Patient modifié' : 'Patient ajouté')
      onClose()
    },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">{isEdit ? 'Modifier le patient' : 'Nouveau patient'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[['nom','Nom','text'],['prenom','Prénom','text'],['cin','CIN','text'],['telephone','Téléphone','tel'],['email','Email','email']].map(([k,l,t]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input type={t} className="input" value={form[k]||''} onChange={e=>f(k,e.target.value)} />
            </div>
          ))}
          <div>
            <label className="label">Date de naissance</label>
            <input type="date" className="input" value={form.date_naissance||''} onChange={e=>f('date_naissance',e.target.value)} />
          </div>
          <div>
            <label className="label">Sexe</label>
            <select className="select" value={form.sexe} onChange={e=>f('sexe',e.target.value)}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className="label">Groupe sanguin</label>
            <select className="select" value={form.groupe_sanguin||''} onChange={e=>f('groupe_sanguin',e.target.value)}>
              <option value="">—</option>
              {GROUPES.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mutuelle</label>
            <input className="input" value={form.mutuelle||''} onChange={e=>f('mutuelle',e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Adresse</label>
            <input className="input" value={form.adresse||''} onChange={e=>f('adresse',e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Allergies</label>
            <textarea className="input" rows={2} value={form.allergies||''} onChange={e=>f('allergies',e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Antécédents</label>
            <textarea className="input" rows={2} value={form.antecedents||''} onChange={e=>f('antecedents',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => api.get('/patients', { params: { search } }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/patients/${id}`),
    onSuccess: () => { qc.invalidateQueries(['patients']); toast.success('Patient supprimé') },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const handleDelete = (p) => {
    if (confirm(`Supprimer ${p.prenom} ${p.nom} ?`)) deleteMutation.mutate(p.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? 0} patients enregistrés</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>
          <Plus size={18} /> Nouveau patient
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Rechercher par nom, prénom, téléphone, CIN..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Patient','CIN','Téléphone','Groupe','Mutuelle','Actions'].map(h =>
                  <th key={h} className="table-th">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                  <Loader2 size={28} className="animate-spin mx-auto" />
                </td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Aucun patient trouvé</p>
                </td></tr>
              ) : data.data.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                        {p.prenom[0]}{p.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-slate-400">{p.sexe === 'M' ? 'Homme' : 'Femme'} · {p.date_naissance}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-mono text-sm">{p.cin || '—'}</td>
                  <td className="table-td">{p.telephone}</td>
                  <td className="table-td">
                    {p.groupe_sanguin ? <span className="badge-red">{p.groupe_sanguin}</span> : '—'}
                  </td>
                  <td className="table-td">{p.mutuelle || '—'}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Link to={`/patients/${p.id}`} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Eye size={15}/></Link>
                      <button onClick={() => setModal(p)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"><Pencil size={15}/></button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <PatientModal
          patient={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
