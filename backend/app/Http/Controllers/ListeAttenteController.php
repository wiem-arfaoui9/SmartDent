<?php

namespace App\Http\Controllers;

use App\Models\ListeAttente;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ListeAttenteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ListeAttente::with(['patient', 'dentiste'])->latest();

        if ($request->statut) $query->where('statut', $request->statut);

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'     => 'required|exists:patients,id',
            'dentiste_id'    => 'required|exists:users,id',
            'date_souhaitee' => 'required|date',
            'motif'          => 'required|string|max:255',
        ]);

        $data['statut'] = 'en_attente';

        $entry = ListeAttente::create($data);

        return response()->json($entry->load(['patient', 'dentiste']), 201);
    }

    public function updateStatut(Request $request, ListeAttente $listeAttente): JsonResponse
    {
        $request->validate(['statut' => 'required|in:en_attente,propose,annule']);
        $listeAttente->update(['statut' => $request->statut]);
        return response()->json($listeAttente);
    }

    public function destroy(ListeAttente $listeAttente): JsonResponse
    {
        $listeAttente->delete();
        return response()->json(['message' => 'Entrée supprimée.']);
    }
}
