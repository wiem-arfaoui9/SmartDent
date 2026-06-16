import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import DentalChart from '../../components/dental/DentalChart'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function PortalSchema() {
  const { data: profil, isLoading } = useQuery({
    queryKey: ['portail-profil'],
    queryFn: () => api.get('/portail/profil').then(r => r.data),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-600"/></div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mon schéma dentaire</h1>
        <p className="text-slate-500 text-sm mt-1">Vue en lecture seule — votre praticien peut le mettre à jour lors de vos consultations</p>
      </div>
      {profil && <DentalChart patientId={profil.id} readOnly={true} />}
    </div>
  )
}
