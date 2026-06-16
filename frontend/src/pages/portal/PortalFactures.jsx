import { useQuery } from '@tanstack/react-query'
import { CreditCard, Loader2, Download } from 'lucide-react'
import api from '../../services/api'
import { format } from 'date-fns'

export default function PortalFactures() {
  const { data, isLoading } = useQuery({
    queryKey: ['portail-factures'],
    queryFn: () => api.get('/portail/factures').then(r => r.data),
  })

  const handleDownload = (id, titre) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/documents/${id}/download`, '_blank')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mes factures & reçus</h1>
        <p className="text-slate-500 text-sm mt-1">{data?.length ?? 0} document(s) disponible(s)</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20"><Loader2 size={28} className="animate-spin mx-auto text-slate-400"/></div>
      ) : !data?.length ? (
        <div className="card text-center py-16 text-slate-400">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucun document disponible</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>{['Document','Type','Date','Action'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id} className="table-row">
                  <td className="table-td font-medium">{d.titre}</td>
                  <td className="table-td"><span className="badge-blue capitalize">{d.type}</span></td>
                  <td className="table-td">{format(new Date(d.created_at),'dd/MM/yyyy')}</td>
                  <td className="table-td">
                    <button onClick={()=>handleDownload(d.id, d.titre)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                      <Download size={13}/> Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
