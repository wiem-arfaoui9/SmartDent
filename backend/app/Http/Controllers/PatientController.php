<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Patient::with('user')->latest();

        if ($request->search) {
            $q = $request->search;
            $query->where(function ($qb) use ($q) {
                $qb->where('nom', 'like', "%$q%")
                   ->orWhere('prenom', 'like', "%$q%")
                   ->orWhere('telephone', 'like', "%$q%")
                   ->orWhere('cin', 'like', "%$q%");
            });
        }

        if ($request->groupe_sanguin) {
            $query->where('groupe_sanguin', $request->groupe_sanguin);
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'            => 'required|string|max:100',
            'prenom'         => 'required|string|max:100',
            'date_naissance' => 'required|date',
            'sexe'           => 'required|in:M,F',
            'cin'            => 'nullable|string|max:20|unique:patients',
            'telephone'      => 'required|string|max:20',
            'email'          => 'nullable|email|max:150',
            'adresse'        => 'nullable|string',
            'groupe_sanguin' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'allergies'      => 'nullable|string',
            'antecedents'    => 'nullable|string',
            'mutuelle'       => 'nullable|string|max:100',
        ]);

        $patient = Patient::create($data);

        return response()->json($patient, 201);
    }

    public function show(Patient $patient): JsonResponse
    {
        return response()->json($patient->load(['rendezvous', 'dossiersMedicaux', 'paiements']));
    }

    public function update(Request $request, Patient $patient): JsonResponse
    {
        $data = $request->validate([
            'nom'            => 'sometimes|string|max:100',
            'prenom'         => 'sometimes|string|max:100',
            'date_naissance' => 'sometimes|date',
            'sexe'           => 'sometimes|in:M,F',
            'cin'            => 'nullable|string|max:20|unique:patients,cin,' . $patient->id,
            'telephone'      => 'sometimes|string|max:20',
            'email'          => 'nullable|email|max:150',
            'adresse'        => 'nullable|string',
            'groupe_sanguin' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'allergies'      => 'nullable|string',
            'antecedents'    => 'nullable|string',
            'mutuelle'       => 'nullable|string|max:100',
        ]);

        $patient->update($data);

        return response()->json($patient);
    }

    public function destroy(Patient $patient): JsonResponse
    {
        $patient->delete();
        return response()->json(['message' => 'Patient supprimé.']);
    }
}
