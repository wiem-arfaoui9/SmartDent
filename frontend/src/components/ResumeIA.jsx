import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Loader2, RefreshCw, Clock } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ResumeIA({ patientId }) {
  const qc = useQueryClient()
  const [generating, setGenerating] = useState(false)

  const { data: resumes } = useQuery({
    queryKey: ['resumes-ia', patientId],
    queryFn: () => api.get(`/patients/${patientId}/resumes-ia`).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: () => api.post(`/patients/${patientId}/resumes-ia`),
    onMutate: () => setGenerating(true),
    onSuccess: () => {
      qc.invalidateQueries(['resumes-ia', patientId])
      toast.success('Résumé IA généré')
      setGenerating(false)
    },
    onError: e => {
      toast.error(e.response?.data?.message || 'Erreur IA — vérifiez ANTHROPIC_API_KEY dans .env')
      setGenerating(false)
    },
  })

  const latest = resumes?.[0]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500"/>
          Résumé médical IA
        </h2>
        <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={()=>mutation.mutate()} disabled={generating}>
          {generating ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
          {generating ? 'Génération...' : 'Générer'}
        </button>
      </div>

      {generating && (
        <div className="py-8 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-purple-400 mb-3"/>
          <p className="text-sm text-slate-500">Analyse du dossier médical en cours...</p>
          <p className="text-xs text-slate-400 mt-1">L'IA traite les données de manière anonymisée</p>
        </div>
      )}

      {!generating && latest && (
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <Clock size={12}/>
            Généré le {format(new Date(latest.created_at), 'dd/MM/yyyy à HH:mm')}
            · Modèle : {latest.modele}
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-slate-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{latest.contenu}</p>
          </div>
          {resumes.length > 1 && (
            <p className="text-xs text-slate-400 mt-2">{resumes.length - 1} résumé(s) précédent(s) disponible(s)</p>
          )}
        </div>
      )}

      {!generating && !latest && (
        <div className="py-8 text-center text-slate-400">
          <Sparkles size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">Aucun résumé généré</p>
          <p className="text-xs mt-1">Cliquez sur "Générer" pour créer un résumé médical IA du dossier patient</p>
        </div>
      )}
    </div>
  )
}
