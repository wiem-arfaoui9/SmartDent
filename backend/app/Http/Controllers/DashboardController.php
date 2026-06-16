<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Rendezvous;
use App\Models\Paiement;
use App\Models\Employe;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_patients'       => Patient::count(),
            'rdv_today'            => Rendezvous::whereDate('date_heure', today())->count(),
            'revenus_mois'         => Paiement::whereMonth('created_at', now()->month)->sum('montant'),
            'total_employes'       => Employe::count(),
            'patients_new_month'   => Patient::whereMonth('created_at', now()->month)->count(),
            'rdv_confirmes'        => Rendezvous::where('statut', 'confirme')->whereDate('date_heure', today())->count(),
            'paiements_en_attente' => Paiement::where('statut', 'en_attente')->count(),
        ]);
    }

    public function rdvToday(): JsonResponse
    {
        $rdvs = Rendezvous::with(['patient', 'dentiste'])
            ->whereDate('date_heure', today())
            ->orderBy('date_heure')
            ->get();

        return response()->json($rdvs);
    }

    public function chartRdv(): JsonResponse
    {
        $data = Rendezvous::selectRaw('DATE(date_heure) as date, COUNT(*) as total')
            ->where('date_heure', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    public function chartRevenus(): JsonResponse
    {
        $data = Paiement::selectRaw("MONTH(created_at) as mois, SUM(montant) as total")
            ->whereYear('created_at', now()->year)
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return response()->json($data);
    }

    /**
     * Taux d'occupation par dentiste (sur les 30 derniers jours).
     * Hypothèse : 8h/jour ouvrables (08:00-18:00, créneaux de 30 min = 20 créneaux/jour).
     */
    public function tauxOccupation(): JsonResponse
    {
        $creneauxParJour = 20;
        $jours = 30;
        $totalCreneaux = $creneauxParJour * $jours;

        $data = Rendezvous::with('dentiste')
            ->where('date_heure', '>=', now()->subDays($jours))
            ->where('statut', '!=', 'annule')
            ->get()
            ->groupBy('dentiste_id')
            ->map(function ($rdvs, $dentisteId) use ($totalCreneaux) {
                $occupes = $rdvs->sum(fn($r) => max(1, intdiv($r->duree, 30)));
                return [
                    'dentiste_id' => $dentisteId,
                    'dentiste'    => $rdvs->first()->dentiste?->name,
                    'taux'        => round(min(100, ($occupes / $totalCreneaux) * 100), 1),
                ];
            })
            ->values();

        return response()->json($data);
    }

    /**
     * Taux de rendez-vous manqués (no-show) global et par tranche horaire.
     */
    public function tauxNoShow(): JsonResponse
    {
        $rdvs = Rendezvous::where('date_heure', '<', now())
            ->where('date_heure', '>=', now()->subDays(60))
            ->get();

        $total = $rdvs->count();
        $manques = $rdvs->where('statut', 'annule')->count();

        $parTrancheHoraire = $rdvs->groupBy(fn($r) => \Carbon\Carbon::parse($r->date_heure)->format('H') . 'h')
            ->map(function ($groupe, $heure) {
                $totalTranche = $groupe->count();
                $manquesTranche = $groupe->where('statut', 'annule')->count();
                return [
                    'heure' => $heure,
                    'taux'  => $totalTranche > 0 ? round(($manquesTranche / $totalTranche) * 100, 1) : 0,
                    'total' => $totalTranche,
                ];
            })
            ->sortBy('heure')
            ->values();

        return response()->json([
            'global'             => $total > 0 ? round(($manques / $total) * 100, 1) : 0,
            'total_rdv'          => $total,
            'total_manques'      => $manques,
            'par_tranche_horaire'=> $parTrancheHoraire,
        ]);
    }

    /**
     * Prévisions simples : créneaux à forte demande basés sur l'historique
     * (moyenne de RDV par jour de la semaine et par tranche horaire).
     */
    public function previsions(): JsonResponse
    {
        $rdvs = Rendezvous::where('date_heure', '>=', now()->subDays(90))
            ->where('statut', '!=', 'annule')
            ->get();

        $joursSemaine = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

        $parJour = $rdvs->groupBy(fn($r) => \Carbon\Carbon::parse($r->date_heure)->dayOfWeekIso - 1)
            ->map(fn($groupe, $jour) => [
                'jour'  => $joursSemaine[$jour] ?? $jour,
                'total' => $groupe->count(),
            ])
            ->sortKeys()
            ->values();

        $parHeure = $rdvs->groupBy(fn($r) => \Carbon\Carbon::parse($r->date_heure)->format('H') . 'h')
            ->map(fn($groupe, $heure) => ['heure' => $heure, 'total' => $groupe->count()])
            ->sortByDesc('total')
            ->values()
            ->take(5);

        return response()->json([
            'par_jour_semaine'      => $parJour,
            'tranches_forte_demande'=> $parHeure,
        ]);
    }
}
