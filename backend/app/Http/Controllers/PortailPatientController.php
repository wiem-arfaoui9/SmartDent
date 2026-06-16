<?php

namespace App\Http\Controllers;

use App\Models\Rendezvous;
use App\Models\Document;
use App\Models\DossierMedical;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PortailPatientController extends Controller
{
    /**
     * Retourne le patient lié au compte connecté.
     */
    private function currentPatient(Request $request)
    {
        $patient = $request->user()->patient;
        abort_if(!$patient, 403, 'Aucun profil patient associé à ce compte.');
        return $patient;
    }

    public function profil(Request $request): JsonResponse
    {
        return response()->json($this->currentPatient($request));
    }

    public function mesRendezvous(Request $request): JsonResponse
    {
        $patient = $this->currentPatient($request);

        return response()->json(
            Rendezvous::with('dentiste')
                ->where('patient_id', $patient->id)
                ->orderByDesc('date_heure')
                ->get()
        );
    }

    /**
     * Prise de rendez-vous en ligne par le patient.
     */
    public function reserverRendezvous(Request $request): JsonResponse
    {
        $patient = $this->currentPatient($request);

        $data = $request->validate([
            'dentiste_id' => 'required|exists:users,id',
            'date_heure'  => 'required|date|after:now',
            'motif'       => 'required|string|max:255',
        ]);

        $overlap = Rendezvous::where('dentiste_id', $data['dentiste_id'])
            ->where('statut', '!=', 'annule')
            ->whereRaw("date_heure < DATE_ADD(?, INTERVAL 30 MINUTE)", [$data['date_heure']])
            ->whereRaw("DATE_ADD(date_heure, INTERVAL duree MINUTE) > ?", [$data['date_heure']])
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'Ce créneau n\'est plus disponible.'], 422);
        }

        $rdv = Rendezvous::create([
            'patient_id'  => $patient->id,
            'dentiste_id' => $data['dentiste_id'],
            'date_heure'  => $data['date_heure'],
            'duree'       => 30,
            'motif'       => $data['motif'],
            'statut'      => 'planifie',
        ]);

        return response()->json($rdv->load('dentiste'), 201);
    }

    public function annulerRendezvous(Request $request, Rendezvous $rendezvous): JsonResponse
    {
        $patient = $this->currentPatient($request);
        abort_if($rendezvous->patient_id !== $patient->id, 403);

        $rendezvous->update(['statut' => 'annule']);

        return response()->json($rendezvous);
    }

    /**
     * Créneaux disponibles pour un dentiste sur une date donnée.
     */
    public function creneauxDisponibles(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dentiste_id' => 'required|exists:users,id',
            'date'        => 'required|date',
        ]);

        $occupes = Rendezvous::where('dentiste_id', $data['dentiste_id'])
            ->whereDate('date_heure', $data['date'])
            ->where('statut', '!=', 'annule')
            ->get(['date_heure', 'duree']);

        $creneaux = [];
        $heureDebut = 8; $heureFin = 18;

        for ($h = $heureDebut; $h < $heureFin; $h++) {
            foreach ([0, 30] as $min) {
                $slot = sprintf('%02d:%02d', $h, $min);
                $slotTime = \Carbon\Carbon::parse($data['date'] . ' ' . $slot);

                $isOccupied = $occupes->contains(function ($rdv) use ($slotTime) {
                    $start = \Carbon\Carbon::parse($rdv->date_heure);
                    $end   = $start->copy()->addMinutes($rdv->duree);
                    return $slotTime >= $start && $slotTime < $end;
                });

                if (!$isOccupied && $slotTime->isFuture()) {
                    $creneaux[] = $slot;
                }
            }
        }

        return response()->json($creneaux);
    }

    public function mesFactures(Request $request): JsonResponse
    {
        $patient = $this->currentPatient($request);

        return response()->json(
            Document::whereIn('type', ['facture','recu','devis'])
                ->where('patient_id', $patient->id)
                ->latest()
                ->get()
        );
    }

    public function monDossier(Request $request): JsonResponse
    {
        $patient = $this->currentPatient($request);

        return response()->json(
            DossierMedical::with('dentiste')
                ->where('patient_id', $patient->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function monSchemaDentaire(Request $request): JsonResponse
    {
        $patient = $this->currentPatient($request);
        return app(SchemaDentaireController::class)->show($patient->id);
    }
}
