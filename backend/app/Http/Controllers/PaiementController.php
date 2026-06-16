<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with('patient')->latest();

        if ($request->statut) $query->where('statut', $request->statut);
        if ($request->mode)   $query->where('mode_paiement', $request->mode);
        if ($request->search) {
            $q = $request->search;
            $query->whereHas('patient', fn($qb) =>
                $qb->where('nom', 'like', "%$q%")->orWhere('prenom', 'like', "%$q%")
            );
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'    => 'required|exists:patients,id',
            'rendezvous_id' => 'nullable|exists:rendezvous,id',
            'montant'       => 'required|numeric|min:0',
            'mode_paiement' => 'required|in:especes,carte,virement,cheque,mutuelle',
            'statut'        => 'in:paye,en_attente,annule',
            'description'   => 'nullable|string',
            'date_paiement' => 'nullable|date',
        ]);

        $paiement = Paiement::create($data);

        return response()->json($paiement->load('patient'), 201);
    }

    public function show(Paiement $paiement): JsonResponse
    {
        return response()->json($paiement->load('patient'));
    }

    public function update(Request $request, Paiement $paiement): JsonResponse
    {
        $data = $request->validate([
            'montant'       => 'sometimes|numeric|min:0',
            'mode_paiement' => 'sometimes|in:especes,carte,virement,cheque,mutuelle',
            'statut'        => 'sometimes|in:paye,en_attente,annule',
            'description'   => 'nullable|string',
            'date_paiement' => 'nullable|date',
        ]);

        $paiement->update($data);
        return response()->json($paiement);
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        $paiement->delete();
        return response()->json(['message' => 'Paiement supprimé.']);
    }

    public function byPatient(int $patientId): JsonResponse
    {
        return response()->json(Paiement::where('patient_id', $patientId)->latest()->get());
    }

    public function monthlyStats(): JsonResponse
    {
        return response()->json(
            Paiement::selectRaw("MONTH(created_at) as mois, SUM(montant) as total, COUNT(*) as nb")
                ->whereYear('created_at', now()->year)
                ->groupBy('mois')->orderBy('mois')->get()
        );
    }
}
