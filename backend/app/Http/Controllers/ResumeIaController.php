<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\ResumeIa;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class ResumeIaController extends Controller
{
    public function index(int $patientId): JsonResponse
    {
        return response()->json(
            ResumeIa::where('patient_id', $patientId)->latest()->get()
        );
    }

    /**
     * Génère un résumé médical structuré via l'API Claude.
     * Les données sensibles (nom, téléphone, etc.) sont anonymisées avant l'envoi.
     */
    public function generer(Request $request, int $patientId): JsonResponse
    {
        $patient = Patient::with('dossiersMedicaux')->findOrFail($patientId);

        // Anonymisation : on n'envoie que les données médicales, pas l'identité
        $notes = $patient->dossiersMedicaux->map(fn($d) => [
            'date'         => $d->created_at->format('Y-m-d'),
            'diagnostic'   => $d->diagnostic,
            'traitement'   => $d->traitement,
            'medicaments'  => $d->medicaments,
            'observations' => $d->observations,
            'dent'         => $d->dent_concernee,
        ])->toArray();

        if (empty($notes)) {
            return response()->json(['message' => 'Aucun dossier médical disponible pour ce patient.'], 422);
        }

        $apiKey = env('ANTHROPIC_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'message' => 'Clé API Anthropic non configurée (ANTHROPIC_API_KEY dans .env).'
            ], 500);
        }

        $prompt = "Voici l'historique médical anonymisé d'un patient dentaire (format JSON). "
            . "Génère un résumé structuré et concis en français, à destination du praticien, "
            . "incluant : tendances générales, traitements récurrents, points d'attention. "
            . "Ce résumé est un outil d'aide à la décision, pas un diagnostic.\n\n"
            . json_encode($notes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $response = Http::withHeaders([
            'x-api-key'         => $apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 1024,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Erreur lors de la génération du résumé IA.'], 500);
        }

        $contenu = $response->json('content.0.text', 'Résumé indisponible.');

        $resume = ResumeIa::create([
            'patient_id' => $patient->id,
            'genere_par' => auth()->id(),
            'contenu'    => $contenu,
            'modele'     => 'claude-sonnet-4-6',
        ]);

        return response()->json($resume, 201);
    }
}
