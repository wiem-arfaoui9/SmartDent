import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, Loader2, Plus, X } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function NewConversationModal({ onClose }) {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const [form, setForm] = useState({ patient_id: '', sujet: '', message: '' })

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => api.get('/patients?per_page=200').then(r => r.data.data),
    enabled: !hasRole('patient'),
  })

  const mutation = useMutation({
    mutationFn: d => api.post('/conversations', d),
    onSuccess: (res) => {
      qc.invalidateQueries(['conversations'])
      toast.success('Conversation créée')
      onClose(res.data.id)
    },
    onError: e => toast.error(e.response?.data?.message || 'Erreur'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">Nouvelle conversation</h2>
          <button onClick={() => onClose()} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {!hasRole('patient') && (
            <div>
              <label className="label">Patient</label>
              <select className="select" value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                <option value="">Sélectionner...</option>
                {patients?.map(p=><option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Sujet</label>
            <input className="input" value={form.sujet} onChange={e=>setForm(f=>({...f,sujet:e.target.value}))} placeholder="Ex: Question sur mon rendez-vous"/>
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}/>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button className="btn-secondary" onClick={() => onClose()}>Annuler</button>
          <button className="btn-primary" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin"/>}
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [activeId, setActiveId] = useState(null)
  const [text, setText] = useState('')
  const [modal, setModal] = useState(false)
  const scrollRef = useRef(null)

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then(r => r.data),
    refetchInterval: 15000,
  })

  const { data: conversation } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => api.get(`/conversations/${activeId}`).then(r => r.data),
    enabled: !!activeId,
    refetchInterval: 8000,
  })

  const sendMutation = useMutation({
    mutationFn: (contenu) => api.post(`/conversations/${activeId}/messages`, { contenu }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries(['conversation', activeId])
      qc.invalidateQueries(['conversations'])
    },
  })

  useEffect(() => {
    if (activeId) api.patch(`/conversations/${activeId}/read`).then(() => qc.invalidateQueries(['conversations']))
  }, [activeId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversation])

  const handleSend = () => {
    if (!text.trim()) return
    sendMutation.mutate(text.trim())
  }

  const handleModalClose = (newId) => {
    setModal(false)
    if (newId) setActiveId(newId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Messagerie</h1>
          <p className="text-slate-500 text-sm mt-1">Échanges sécurisés avec le cabinet</p>
        </div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={18}/> Nouvelle conversation</button>
      </div>

      <div className="card p-0 overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Liste conversations */}
        <div className="border-r border-slate-100 overflow-y-auto">
          {!conversations?.data?.length ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : conversations.data.map(c => (
            <div key={c.id} onClick={()=>setActiveId(c.id)}
              className={`p-4 border-b border-slate-50 cursor-pointer transition-colors ${activeId===c.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm text-slate-800 truncate">{c.sujet || `${c.patient?.prenom} ${c.patient?.nom}`}</p>
                {c.statut === 'fermee' && <span className="badge-gray text-xs">Fermée</span>}
              </div>
              <p className="text-xs text-slate-500 truncate">{c.patient?.prenom} {c.patient?.nom}</p>
              {c.last_message && <p className="text-xs text-slate-400 truncate mt-1">{c.last_message.contenu}</p>}
            </div>
          ))}
        </div>

        {/* Fil de discussion */}
        <div className="md:col-span-2 flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-20"/>
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          ) : !conversation ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-slate-400"/></div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100">
                <p className="font-bold text-sm">{conversation.sujet}</p>
                <p className="text-xs text-slate-500">{conversation.patient?.prenom} {conversation.patient?.nom}</p>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.messages?.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id===user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.sender_id===user.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                      <p className="text-sm">{m.contenu}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_id===user.id ? 'text-blue-100' : 'text-slate-400'}`}>
                        {m.sender?.name} · {format(new Date(m.created_at),'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {conversation.statut !== 'fermee' && (
                <div className="p-4 border-t border-slate-100 flex gap-2">
                  <input className="input flex-1" placeholder="Écrire un message..." value={text}
                    onChange={e=>setText(e.target.value)}
                    onKeyDown={e=>e.key==='Enter' && handleSend()} />
                  <button className="btn-primary" onClick={handleSend} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal && <NewConversationModal onClose={handleModalClose} />}
    </div>
  )
}
