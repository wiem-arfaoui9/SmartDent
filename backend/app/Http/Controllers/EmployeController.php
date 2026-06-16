<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class EmployeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employe::with('user')->latest();

        if ($request->poste)  $query->where('poste', $request->poste);
        if ($request->search) {
            $q = $request->search;
            $query->where(fn($qb) =>
                $qb->where('nom', 'like', "%$q%")->orWhere('prenom', 'like', "%$q%")
            );
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'           => 'required|string|max:100',
            'prenom'        => 'required|string|max:100',
            'email'         => 'required|email|unique:users',
            'telephone'     => 'required|string|max:20',
            'poste'         => 'required|in:dentiste,secretaire,assistant,hygieniste',
            'specialite'    => 'nullable|string|max:100',
            'date_embauche' => 'required|date',
            'salaire'       => 'nullable|numeric|min:0',
            'cin'           => 'nullable|string|max:20',
            'adresse'       => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $data['prenom'] . ' ' . $data['nom'],
            'email'    => $data['email'],
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($data['poste'] === 'dentiste' ? 'dentiste' : 'secretaire');

        $employe = Employe::create(array_merge($data, ['user_id' => $user->id]));

        return response()->json($employe->load('user'), 201);
    }

    public function show(Employe $employe): JsonResponse
    {
        return response()->json($employe->load(['user', 'rendezvous']));
    }

    public function update(Request $request, Employe $employe): JsonResponse
    {
        $data = $request->validate([
            'nom'        => 'sometimes|string|max:100',
            'prenom'     => 'sometimes|string|max:100',
            'telephone'  => 'sometimes|string|max:20',
            'poste'      => 'sometimes|in:dentiste,secretaire,assistant,hygieniste',
            'specialite' => 'nullable|string|max:100',
            'salaire'    => 'nullable|numeric|min:0',
            'adresse'    => 'nullable|string',
        ]);

        $employe->update($data);
        return response()->json($employe);
    }

    public function destroy(Employe $employe): JsonResponse
    {
        $employe->delete();
        return response()->json(['message' => 'Employé supprimé.']);
    }

    public function planning(Employe $employe): JsonResponse
    {
        $rdvs = $employe->rendezvous()
            ->with('patient')
            ->where('date_heure', '>=', now())
            ->orderBy('date_heure')
            ->get();
        return response()->json($rdvs);
    }
}
