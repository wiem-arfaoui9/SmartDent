<?php

namespace App\Http\Controllers;

use App\Models\Rendezvous;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RendezvousController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Rendezvous::with(['patient', 'dentiste'])->latest('date_heure');

        if ($request->date)        $query->whereDate('date_heure', $request->date);
        if ($request->statut)      $query->where('statut', $request->statut);
        if ($request->dentiste_id) $query->where('dentiste_id', $request->dentiste_id);

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'  => 'required|exists:patients,id',
            'dentiste_id' => 'required|exists:users,id',
            'date_heure'  => 'required|date',
            'duree'       => 'required|integer|min:15|max:180',
            'motif'       => 'required|string|max:255',
            'notes'       => 'nullable|string',
            'statut'      => 'in:planifie,confirme,annule,termine',
        ]);

        $data['statut'] = $data['statut'] ?? 'planifie';

        $overlap = Rendezvous::where('dentiste_id', $data['dentiste_id'])
            ->where('statut', '!=', 'annule')
            ->whereRaw("date_heure < DATE_ADD(?, INTERVAL ? MINUTE)", [$data['date_heure'], $data['duree']])
            ->whereRaw("DATE_ADD(date_heure, INTERVAL duree MINUTE) > ?", [$data['date_heure']])
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'Créneau déjà occupé pour ce dentiste.'], 422);
        }

        $rdv = Rendezvous::create($data);

        return response()->json($rdv->load(['patient', 'dentiste']), 201);
    }

    public function show(Rendezvous $rendezvous): JsonResponse
    {
        return response()->json($rendezvous->load(['patient', 'dentiste', 'dossierMedical']));
    }

    public function update(Request $request, Rendezvous $rendezvous): JsonResponse
    {
        $data = $request->validate([
            'date_heure' => 'sometimes|date',
            'duree'      => 'sometimes|integer|min:15|max:180',
            'motif'      => 'sometimes|string|max:255',
            'notes'      => 'nullable|string',
            'statut'     => 'sometimes|in:planifie,confirme,annule,termine',
        ]);

        $rendezvous->update($data);

        return response()->json($rendezvous->load(['patient', 'dentiste']));
    }

    public function destroy(Rendezvous $rendezvous): JsonResponse
    {
        $rendezvous->delete();
        return response()->json(['message' => 'Rendez-vous supprimé.']);
    }

    public function updateStatut(Request $request, Rendezvous $rendezvous): JsonResponse
    {
        $request->validate(['statut' => 'required|in:planifie,confirme,annule,termine']);
        $rendezvous->update(['statut' => $request->statut]);
        return response()->json($rendezvous);
    }

    public function byPatient(int $patientId): JsonResponse
    {
        $rdvs = Rendezvous::with('dentiste')
            ->where('patient_id', $patientId)
            ->orderByDesc('date_heure')
            ->get();
        return response()->json($rdvs);
    }
}
