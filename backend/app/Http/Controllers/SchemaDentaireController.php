<?php

namespace App\Http\Controllers;

use App\Models\SchemaDentaire;
use App\Models\SchemaDentaireHistorique;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SchemaDentaireController extends Controller
{
    /**
     * Récupère le schéma dentaire complet (32 dents) pour un patient.
     * Crée les entrées manquantes avec statut "saine" par défaut.
     */
    public function show(int $patientId): JsonResponse
    {
        $existing = SchemaDentaire::where('patient_id', $patientId)
            ->get()
            ->keyBy('numero_dent');

        $dents = [];
        foreach (self::numerosFDI() as $numero) {
            if ($existing->has($numero)) {
                $dents[] = $existing[$numero];
            } else {
                $dents[] = SchemaDentaire::create([
                    'patient_id'  => $patientId,
                    'numero_dent' => $numero,
                    'statut'      => 'saine',
                ]);
            }
        }

        return response()->json($dents);
    }

    /**
     * Met à jour le statut d'une dent et enregistre l'historique.
     */
    public function update(Request $request, int $patientId, int $numeroDent): JsonResponse
    {
        $data = $request->validate([
            'statut' => 'required|in:saine,a_traiter,soignee,couronne,extraite,implant',
            'note'   => 'nullable|string',
        ]);

        $dent = SchemaDentaire::updateOrCreate(
            ['patient_id' => $patientId, 'numero_dent' => $numeroDent],
            $data
        );

        SchemaDentaireHistorique::create([
            'patient_id'  => $patientId,
            'numero_dent' => $numeroDent,
            'statut'      => $data['statut'],
            'note'        => $data['note'] ?? null,
            'dentiste_id' => auth()->id(),
        ]);

        return response()->json($dent);
    }

    /**
     * Historique des interventions pour une dent donnée.
     */
    public function historique(int $patientId, int $numeroDent): JsonResponse
    {
        $historique = SchemaDentaireHistorique::with('dentiste')
            ->where('patient_id', $patientId)
            ->where('numero_dent', $numeroDent)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($historique);
    }

    /**
     * Les 32 numéros de dents selon la notation FDI (11-18, 21-28, 31-38, 41-48).
     */
    public static function numerosFDI(): array
    {
        $numeros = [];
        foreach ([1, 2, 3, 4] as $quadrant) {
            for ($i = 1; $i <= 8; $i++) {
                $numeros[] = $quadrant * 10 + $i;
            }
        }
        return $numeros;
    }
}
