import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_ICONS = {
  rappel_rdv: '⏰', confirmation_rdv: '✅', annulation_rdv: '❌',
  facture: '🧾', relance_paiement: '💳', planning: '📅', autre: '🔔',
}

export default function NotificationsDropdown() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { data: count } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data.count),
    refetchInterval: 30000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: open,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['notif-count'])
    },
  })

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['notif-count'])
    },
  })

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
        <Bell size={18} className="text-slate-600" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-sm">Notifications</h3>
            {count > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                <CheckCheck size={13}/> Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center"><Loader2 size={24} className="animate-spin mx-auto text-slate-400"/></div>
            ) : !data?.data?.length ? (
              <div className="p-8 text-center text-slate-400 text-sm">Aucune notification</div>
            ) : data.data.map(n => (
              <div key={n.id}
                onClick={() => !n.lu && markRead.mutate(n.id)}
                className={`p-3.5 border-b border-slate-50 cursor-pointer transition-colors flex gap-3 ${n.lu ? 'bg-white' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
                <span className="text-xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{n.titre}</p>
                  {n.contenu && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.contenu}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}</p>
                </div>
                {!n.lu && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
