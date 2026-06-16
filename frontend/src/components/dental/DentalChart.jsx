import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { X, Loader2, Clock } from 'lucide-react'

const STATUTS = {
  saine:     { label: 'Saine',    color: '#10b981', bg: '#d1fae5' },
  a_traiter: { label: 'À traiter',color: '#f59e0b', bg: '#fef3c7' },
  soignee:   { label: 'Soignée',  color: '#3b82f6', bg: '#dbeafe' },
  couronne:  { label: 'Couronne', color: '#8b5cf6', bg: '#ede9fe' },
  extraite:  { label: 'Extraite', color: '#ef4444', bg: '#fee2e2' },
  implant:   { label: 'Implant',  color: '#06b6d4', bg: '#cffafe' },
}

// Numéros FDI organisés par quadrant pour l'affichage (vue de face, comme chez le dentiste)
const QUADRANT_HG = [18,17,16,15,14,13,12,11] // Haut Gauche -> centre
const QUADRANT_HD = [21,22,23,24,25,26,27,28] // Haut centre -> Droite
const QUADRANT_BG = [48,47,46,45,44,43,42,41] // Bas Gauche -> centre
const QUADRANT_BD = [31,32,33,34,35,36,37,38] // Bas centre -> Droite

function Tooth({ numero, statut, onClick, isSelected }) {
  const s = STATUTS[statut] || STATUTS.saine
  return (
    <button
      onClick={() => onClick(numero)}
      title={`Dent ${numero} — ${s.label}`}
      className={`relative flex flex-col items-center group transition-transform hover:scale-110 ${isSelected ? 'scale-110' : ''}`}
    >
      <svg width="32" height="40" viewBox="0 0 32 40" className="drop-shadow-sm">
        <path
          d="M16 2C9 2 4 6 4 13c0 5 1.5 9 2.5 15 .8 4.5 1.5 9 4 9s2.5-6 3-10 1-3.5 2.5-3.5S17.7 27 18.5 31c.5 4 1.5 10 4 10s3.2-4.5 4-9c1-6 2.5-10 2.5-15 0-7-5-11-12-11Z"
          fill={s.bg}
          stroke={isSelected ? s.color : '#cbd5e1'}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />
      </svg>
      <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{numero}</span>
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white" style={{ background: s.color }} />
    </button>
  )
}

export default function DentalChart({ patientId, readOnly = false }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [editStatut, setEditStatut] = useState('')
  const [editNote, setEditNote] = useState('')

  const { data: dents, isLoading } = useQuery({
    queryKey: ['schema-dentaire', patientId],
    queryFn: () => api.get(`/patients/${patientId}/schema-dentaire`).then(r => r.data),
  })

  const { data: historique } = useQuery({
    queryKey: ['schema-historique', patientId, selected],
    queryFn: () => api.get(`/patients/${patientId}/schema-dentaire/${selected}/historique`).then(r => r.data),
    enabled: !!selected,
  })

  const mutation = useMutation({
    mutationFn: ({ numero, statut, note }) => api.patch(`/patients/${patientId}/schema-dentaire/${numero}`, { statut, note }),
    onSuccess: () => {
      qc.invalidateQueries(['schema-dentaire', patientId])
      qc.invalidateQueries(['schema-historique', patientId, selected])
      toast.success('Dent mise à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const dentsByNumero = (dents ?? []).reduce((acc, d) => ({ ...acc, [d.numero_dent]: d }), {})

  const handleSelect = (numero) => {
    setSelected(numero)
    const dent = dentsByNumero[numero]
    setEditStatut(dent?.statut || 'saine')
    setEditNote(dent?.note || '')
  }

  const handleSave = () => {
    mutation.mutate({ numero: selected, statut: editStatut, note: editNote })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-600"/></div>
  )

  const renderRow = (numeros) => (
    <div className="flex gap-1.5 justify-center">
      {numeros.map(n => (
        <Tooth key={n} numero={n} statut={dentsByNumero[n]?.statut || 'saine'} onClick={handleSelect} isSelected={selected === n} />
      ))}
    </div>
  )

  return (
    <div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Schéma dentaire interactif</h2>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUTS).map(([key, s]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
          {/* Mâchoire supérieure */}
          <div className="flex justify-center gap-4">
            {renderRow(QUADRANT_HG)}
            <div className="w-px bg-slate-300" />
            {renderRow(QUADRANT_HD)}
          </div>
          <div className="h-px bg-slate-300 mx-8" />
          {/* Mâchoire inférieure */}
          <div className="flex justify-center gap-4">
            {renderRow(QUADRANT_BG.slice().reverse())}
            <div className="w-px bg-slate-300" />
            {renderRow(QUADRANT_BD)}
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 text-center">Cliquez sur une dent pour voir ou modifier son statut (notation FDI)</p>
      </div>

      {/* Panel de détail */}
      {selected && (
        <div className="card mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Dent n°{selected}</h3>
            <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16}/></button>
          </div>

          {!readOnly && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Statut</label>
                <select className="select" value={editStatut} onChange={e=>setEditStatut(e.target.value)}>
                  {Object.entries(STATUTS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="Observation..." />
              </div>
            </div>
          )}

          {!readOnly && (
            <button className="btn-primary mb-4" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin"/>}
              Enregistrer
            </button>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2"><Clock size={14}/> Historique des interventions</h4>
            {!historique?.length ? (
              <p className="text-sm text-slate-400">Aucune intervention enregistrée pour cette dent.</p>
            ) : (
              <div className="space-y-2">
                {historique.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                    <div>
                      <span className="font-medium" style={{ color: STATUTS[h.statut]?.color }}>{STATUTS[h.statut]?.label}</span>
                      {h.note && <span className="text-slate-500 ml-2">— {h.note}</span>}
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{new Date(h.created_at).toLocaleDateString('fr-FR')}</p>
                      {h.dentiste && <p>Dr. {h.dentiste.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
