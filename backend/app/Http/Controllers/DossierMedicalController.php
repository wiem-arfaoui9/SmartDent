<?php

namespace App\Http\Controllers;

use App\Models\DossierMedical;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DossierMedicalController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DossierMedical::with('patient')->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'       => 'required|exists:patients,id',
            'rendezvous_id'    => 'nullable|exists:rendezvous,id',
            'diagnostic'       => 'required|string',
            'traitement'       => 'required|string',
            'medicaments'      => 'nullable|string',
            'observations'     => 'nullable|string',
            'prochaine_visite' => 'nullable|date',
            'dent_concernee'   => 'nullable|string|max:50',
            'radiographie'     => 'nullable|string',
        ]);

        $dossier = DossierMedical::create(array_merge($data, [
            'dentiste_id' => auth()->id(),
        ]));

        return response()->json($dossier->load('patient'), 201);
    }

    public function show(DossierMedical $dossierMedical): JsonResponse
    {
        return response()->json($dossierMedical->load(['patient', 'dentiste']));
    }

    public function update(Request $request, DossierMedical $dossierMedical): JsonResponse
    {
        $data = $request->validate([
            'diagnostic'       => 'sometimes|string',
            'traitement'       => 'sometimes|string',
            'medicaments'      => 'nullable|string',
            'observations'     => 'nullable|string',
            'prochaine_visite' => 'nullable|date',
            'dent_concernee'   => 'nullable|string|max:50',
        ]);

        $dossierMedical->update($data);
        return response()->json($dossierMedical);
    }

    public function destroy(DossierMedical $dossierMedical): JsonResponse
    {
        $dossierMedical->delete();
        return response()->json(['message' => 'Dossier supprimé.']);
    }

    public function byPatient(int $patientId): JsonResponse
    {
        return response()->json(
            DossierMedical::with('dentiste')
                ->where('patient_id', $patientId)
                ->orderByDesc('created_at')
                ->get()
        );
    }
}
