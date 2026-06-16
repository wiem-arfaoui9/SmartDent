<?php

namespace App\Http\Controllers;

use App\Models\Conge;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CongeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Conge::with('employe')->latest();

        if ($request->employe_id) $query->where('employe_id', $request->employe_id);
        if ($request->statut)     $query->where('statut', $request->statut);

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'date_debut' => 'required|date',
            'date_fin'   => 'required|date|after_or_equal:date_debut',
            'type'       => 'required|in:conge_paye,maladie,absence,autre',
            'motif'      => 'nullable|string',
        ]);

        $data['statut'] = 'en_attente';

        $conge = Conge::create($data);

        return response()->json($conge->load('employe'), 201);
    }

    public function updateStatut(Request $request, Conge $conge): JsonResponse
    {
        $request->validate(['statut' => 'required|in:en_attente,approuve,refuse']);
        $conge->update(['statut' => $request->statut]);
        return response()->json($conge);
    }

    public function destroy(Conge $conge): JsonResponse
    {
        $conge->delete();
        return response()->json(['message' => 'Demande supprimée.']);
    }
}
