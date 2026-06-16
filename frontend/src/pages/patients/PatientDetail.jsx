import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, Droplets, Calendar, CreditCard, Loader2, AlertTriangle, ClipboardList } from 'lucide-react'
import api from '../../services/api'
import { format } from 'date-fns'
import DentalChart from '../../components/dental/DentalChart'
import ResumeIA from '../../components/ResumeIA'

const STATUT_BADGE = { planifie:'badge-blue', confirme:'badge-green', annule:'badge-red', termine:'badge-gray' }
const STATUT_LABEL = { planifie:'Planifié', confirme:'Confirmé', annule:'Annulé', termine:'Terminé' }

export default function PatientDetail() {
  const { id } = useParams()

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then(r => r.data)
  })
  const { data: rdvs }     = useQuery({ queryKey:['patient-rdvs', id],      queryFn:()=>api.get(`/patients/${id}/rendezvous`).then(r=>r.data) })
  const { data: dossiers } = useQuery({ queryKey:['patient-dossiers', id],   queryFn:()=>api.get(`/patients/${id}/dossier`).then(r=>r.data) })
  const { data: paiements }= useQuery({ queryKey:['patient-paiements', id],  queryFn:()=>api.get(`/patients/${id}/paiements`).then(r=>r.data) })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-blue-600"/></div>
  if (!patient) return <div className="text-center py-20 text-slate-400">Patient introuvable</div>

  const totalPaye = paiements?.filter(p=>p.statut==='paye').reduce((s,p)=>s+parseFloat(p.montant),0) ?? 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/patients" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4 transition-colors">
          <ArrowLeft size={16}/> Retour aux patients
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
            {patient.prenom[0]}{patient.nom[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.prenom} {patient.nom}</h1>
            <p className="text-slate-500">Patient · {patient.sexe==='M'?'Homme':'Femme'} · né(e) le {patient.date_naissance}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Infos */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="text-base font-bold mb-4">Informations personnelles</h2>
            <div className="space-y-3">
              {[
                { icon:Phone,   label:'Téléphone',        val: patient.telephone },
                { icon:Mail,    label:'Email',             val: patient.email||'—' },
                { icon:MapPin,  label:'Adresse',           val: patient.adresse||'—' },
                { icon:Droplets,label:'Groupe sanguin',    val: patient.groupe_sanguin||'—' },
                { icon:Calendar,label:'Date de naissance', val: patient.date_naissance },
              ].map(({icon:Icon,label,val})=>(
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Icon size={14} className="text-blue-600"/></div>
                  <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-medium">{val}</p></div>
                </div>
              ))}
            </div>
            {patient.mutuelle && (
              <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 mb-1">🏥 Mutuelle</p>
                <p className="text-sm">{patient.mutuelle}</p>
              </div>
            )}
            {patient.allergies && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1"><AlertTriangle size={11}/>Allergies</p>
                <p className="text-sm text-red-700">{patient.allergies}</p>
              </div>
            )}
            {patient.antecedents && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-semibold text-amber-600 mb-1">📋 Antécédents</p>
                <p className="text-sm text-amber-700">{patient.antecedents}</p>
              </div>
            )}
            {patient.contact_urgence_nom && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-1">🆘 Contact urgence</p>
                <p className="text-sm font-medium">{patient.contact_urgence_nom}</p>
                <p className="text-xs text-slate-500">{patient.contact_urgence_telephone}</p>
              </div>
            )}
          </div>

          {/* Résumé IA */}
          <ResumeIA patientId={parseInt(id)} />
        </div>

        {/* Colonne centrale + droite */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Rendez-vous', val:rdvs?.length??0,   color:'blue' },
              { label:'Dossiers',    val:dossiers?.length??0, color:'green' },
              { label:'Payé',        val:`${totalPaye.toFixed(0)} DT`, color:'orange' },
            ].map(({label,val,color})=>(
              <div key={label} className={`card text-center border-l-4 border-${color}-400`}>
                <p className={`text-2xl font-bold text-${color}-600`}>{val}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Schéma dentaire */}
          <DentalChart patientId={parseInt(id)} />

          {/* Derniers RDV */}
          <div className="card">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"><Calendar size={16}/> Derniers rendez-vous</h2>
            {!rdvs?.length ? <p className="text-sm text-slate-400">Aucun rendez-vous</p> : (
              <div className="space-y-2">
                {rdvs.slice(0,5).map(r=>(
                  <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{r.motif}</p>
                      <p className="text-xs text-slate-400">Dr. {r.dentiste?.name}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={STATUT_BADGE[r.statut]}>{STATUT_LABEL[r.statut]}</span>
                      <p className="text-sm font-bold">{format(new Date(r.date_heure),'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paiements */}
          <div className="card">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"><CreditCard size={16}/> Paiements</h2>
            {!paiements?.length ? <p className="text-sm text-slate-400">Aucun paiement</p> : (
              <div className="space-y-2">
                {paiements.slice(0,5).map(p=>(
                  <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{p.description||'Acte médical'}</p>
                      <p className="text-xs text-slate-400">{p.mode_paiement}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{parseFloat(p.montant).toFixed(2)} DT</p>
                      <span className={p.statut==='paye'?'badge-green':p.statut==='annule'?'badge-red':'badge-orange'}>
                        {p.statut==='paye'?'Payé':p.statut==='annule'?'Annulé':'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
