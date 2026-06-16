<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Patient;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Document::with('patient')->latest();

        if ($request->patient_id) $query->where('patient_id', $request->patient_id);
        if ($request->type)       $query->where('type', $request->type);

        return response()->json($query->paginate(15));
    }

    /**
     * Génère un reçu de paiement PDF.
     */
    public function genererRecu(Request $request, Paiement $paiement): JsonResponse
    {
        $patient = $paiement->patient;

        $pdf = Pdf::view('pdf.recu', [
            'paiement' => $paiement,
            'patient'  => $patient,
        ])->format('a4');

        $filename = 'recus/recu_' . $paiement->id . '_' . time() . '.pdf';
        Storage::disk('local')->put('public/' . $filename, $pdf->base64());

        $document = Document::create([
            'patient_id'   => $patient->id,
            'type'         => 'recu',
            'titre'        => 'Reçu de paiement #' . $paiement->id,
            'chemin'       => $filename,
            'paiement_id'  => $paiement->id,
            'genere_par'   => auth()->id(),
        ]);

        return response()->json($document, 201);
    }

    /**
     * Génère une ordonnance PDF.
     */
    public function genererOrdonnance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'  => 'required|exists:patients,id',
            'medicaments' => 'required|string',
            'instructions' => 'nullable|string',
        ]);

        $patient = Patient::find($data['patient_id']);

        $pdf = Pdf::view('pdf.ordonnance', [
            'patient'      => $patient,
            'medicaments'  => $data['medicaments'],
            'instructions' => $data['instructions'] ?? '',
            'dentiste'     => auth()->user(),
            'date'         => now(),
        ])->format('a4');

        $filename = 'ordonnances/ordonnance_' . $patient->id . '_' . time() . '.pdf';
        Storage::disk('local')->put('public/' . $filename, $pdf->base64());

        $document = Document::create([
            'patient_id' => $patient->id,
            'type'       => 'ordonnance',
            'titre'      => 'Ordonnance du ' . now()->format('d/m/Y'),
            'chemin'     => $filename,
            'genere_par' => auth()->id(),
        ]);

        return response()->json($document, 201);
    }

    /**
     * Export PDF complet du dossier médical d'un patient.
     */
    public function exporterDossier(int $patientId): JsonResponse
    {
        $patient = Patient::with(['dossiersMedicaux.dentiste', 'rendezvous', 'paiements', 'schemaDentaire'])
            ->findOrFail($patientId);

        $pdf = Pdf::view('pdf.dossier-medical', [
            'patient' => $patient,
            'date'    => now(),
        ])->format('a4');

        $filename = 'dossiers/dossier_' . $patient->id . '_' . time() . '.pdf';
        Storage::disk('local')->put('public/' . $filename, $pdf->base64());

        $document = Document::create([
            'patient_id' => $patient->id,
            'type'       => 'autre',
            'titre'      => 'Dossier médical complet - ' . $patient->prenom . ' ' . $patient->nom,
            'chemin'     => $filename,
            'genere_par' => auth()->id(),
        ]);

        return response()->json($document, 201);
    }

    public function download(Document $document)
    {
        $path = storage_path('app/public/' . $document->chemin);
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }
        return response()->download($path, $document->titre . '.pdf');
    }

    public function destroy(Document $document): JsonResponse
    {
        if ($document->chemin) {
            Storage::disk('local')->delete('public/' . $document->chemin);
        }
        $document->delete();
        return response()->json(['message' => 'Document supprimé.']);
    }
}
