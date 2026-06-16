import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, CalendarDays, FileText,
  CreditCard, UserCog, LogOut, Stethoscope, MessageSquare,
  ClipboardList, Umbrella
} from 'lucide-react'
import toast from 'react-hot-toast'
import NotificationsDropdown from '../notifications/NotificationsDropdown'

const NAV_STAFF = [
  { to:'/',            icon:LayoutDashboard, label:'Tableau de bord',  end:true, roles:['admin','dentiste','secretaire'] },
  { to:'/patients',    icon:Users,           label:'Patients',          roles:['admin','dentiste','secretaire'] },
  { to:'/rendezvous',  icon:CalendarDays,    label:'Rendez-vous',       roles:['admin','dentiste','secretaire'] },
  { to:'/dossiers',    icon:FileText,        label:'Dossiers médicaux', roles:['admin','dentiste','secretaire'] },
  { to:'/paiements',   icon:CreditCard,      label:'Paiements',         roles:['admin','secretaire'] },
  { to:'/employes',    icon:UserCog,         label:'Employés',          roles:['admin'] },
  { to:'/conges',      icon:Umbrella,        label:'Congés & RH',       roles:['admin'] },
  { to:'/messages',    icon:MessageSquare,   label:'Messagerie',        roles:['admin','dentiste','secretaire','patient'] },
]

const NAV_PATIENT = [
  { to:'/espace-patient',            icon:LayoutDashboard, label:'Mon espace',       end:true },
  { to:'/espace-patient/rendezvous', icon:CalendarDays,    label:'Mes rendez-vous'  },
  { to:'/espace-patient/dossier',    icon:FileText,        label:'Mon dossier'      },
  { to:'/espace-patient/factures',   icon:CreditCard,      label:'Factures & Reçus' },
  { to:'/espace-patient/schema',     icon:ClipboardList,   label:'Schéma dentaire'  },
  { to:'/messages',                  icon:MessageSquare,   label:'Messagerie'       },
]

export default function Layout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const isPatient = hasRole('patient')
  const navItems = isPatient ? NAV_PATIENT : NAV_STAFF

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnecté')
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900 flex flex-col fixed inset-y-0 left-0 z-50">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Stethoscope size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Smart<span className="text-blue-400">Dent</span>
            </span>
          </div>
        </div>

        {/* User */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.roles?.[0]?.name}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">
            {isPatient ? 'Mon espace' : 'Menu'}
          </p>
          {navItems.map(({ to, icon: Icon, label, end, roles }) => {
            if (roles && !roles.some(r => hasRole(r))) return null
            return (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                   ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div />
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
