<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\RendezvousController;
use App\Http\Controllers\DossierMedicalController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchemaDentaireController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ResumeIaController;
use App\Http\Controllers\CongeController;
use App\Http\Controllers\ListeAttenteController;
use App\Http\Controllers\PortailPatientController;

/*
|--------------------------------------------------------------------------
| API Routes - SmartDent v2.0
|--------------------------------------------------------------------------
*/

// ── Auth publiques ──
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ── Santé (supervision : Uptime Kuma, CI) ── publique, vérifie aussi la base de données
Route::get('/health', function () {
    $status = 'ok';
    try {
        DB::select('select 1');
        $database = 'up';
    } catch (\Throwable $e) {
        $status = 'degraded';
        $database = 'down';
    }

    return response()->json(['status' => $status, 'database' => $database], $database === 'up' ? 200 : 503);
});

// ── Routes protégées (Sanctum) ──
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/stats',         [DashboardController::class, 'stats']);
    Route::get('/dashboard/rdv-today',     [DashboardController::class, 'rdvToday']);
    Route::get('/dashboard/chart-rdv',     [DashboardController::class, 'chartRdv']);
    Route::get('/dashboard/chart-revenus', [DashboardController::class, 'chartRevenus']);
    Route::get('/dashboard/occupation',    [DashboardController::class, 'tauxOccupation']);
    Route::get('/dashboard/no-show',       [DashboardController::class, 'tauxNoShow']);
    Route::get('/dashboard/previsions',    [DashboardController::class, 'previsions']);

    // Notifications (tous rôles)
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications',             [NotificationController::class, 'store']);
    Route::patch('/notifications/{id}/read',  [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);

    // Messagerie (tous rôles, filtré par rôle dans le contrôleur)
    Route::get('/conversations',                       [ConversationController::class, 'index']);
    Route::post('/conversations',                      [ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}',        [ConversationController::class, 'show']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);
    Route::patch('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);
    Route::patch('/conversations/{conversation}/close',[ConversationController::class, 'close']);

    // ── Portail Patient (rôle patient uniquement) ──
    Route::middleware('role:patient')->prefix('portail')->group(function () {
        Route::get('/profil',            [PortailPatientController::class, 'profil']);
        Route::get('/rendezvous',         [PortailPatientController::class, 'mesRendezvous']);
        Route::post('/rendezvous',        [PortailPatientController::class, 'reserverRendezvous']);
        Route::patch('/rendezvous/{rendezvous}/annuler', [PortailPatientController::class, 'annulerRendezvous']);
        Route::get('/creneaux',           [PortailPatientController::class, 'creneauxDisponibles']);
        Route::get('/factures',           [PortailPatientController::class, 'mesFactures']);
        Route::get('/dossier',            [PortailPatientController::class, 'monDossier']);
        Route::get('/schema-dentaire',    [PortailPatientController::class, 'monSchemaDentaire']);
    });

    // ── Patients — Admin, Dentiste, Secrétaire ──
    Route::middleware('role:admin|dentiste|secretaire')->group(function () {
        Route::apiResource('patients', PatientController::class);
        Route::get('/patients/{patient}/dossier',    [DossierMedicalController::class, 'byPatient']);
        Route::get('/patients/{patient}/rendezvous', [RendezvousController::class, 'byPatient']);
        Route::get('/patients/{patient}/paiements',  [PaiementController::class, 'byPatient']);

        // Schéma dentaire interactif
        Route::get('/patients/{patient}/schema-dentaire', [SchemaDentaireController::class, 'show']);
        Route::patch('/patients/{patient}/schema-dentaire/{numeroDent}', [SchemaDentaireController::class, 'update']);
        Route::get('/patients/{patient}/schema-dentaire/{numeroDent}/historique', [SchemaDentaireController::class, 'historique']);

        // Résumés IA
        Route::get('/patients/{patient}/resumes-ia',   [ResumeIaController::class, 'index']);
        Route::post('/patients/{patient}/resumes-ia',  [ResumeIaController::class, 'generer']);

        // Documents
        Route::get('/documents', [DocumentController::class, 'index']);
        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
        Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);
        Route::post('/paiements/{paiement}/recu', [DocumentController::class, 'genererRecu']);
        Route::post('/ordonnances', [DocumentController::class, 'genererOrdonnance']);
        Route::post('/patients/{patient}/export-dossier', [DocumentController::class, 'exporterDossier']);

        // Liste d'attente
        Route::apiResource('liste-attente', ListeAttenteController::class)->only(['index','store','destroy']);
        Route::patch('/liste-attente/{listeAttente}/statut', [ListeAttenteController::class, 'updateStatut']);
    });

    // Rendez-vous
    Route::middleware('role:admin|dentiste|secretaire')->group(function () {
        Route::apiResource('rendezvous', RendezvousController::class);
        Route::patch('/rendezvous/{rendezvous}/statut', [RendezvousController::class, 'updateStatut']);
    });

    // Dossiers médicaux — Admin, Dentiste uniquement
    Route::middleware('role:admin|dentiste')->group(function () {
        Route::apiResource('dossiers-medicaux', DossierMedicalController::class);
    });

    // Paiements
    Route::middleware('role:admin|secretaire')->group(function () {
        Route::apiResource('paiements', PaiementController::class);
        Route::get('/paiements/stats/monthly', [PaiementController::class, 'monthlyStats']);
    });

    // Employés & RH — Admin uniquement
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('employes', EmployeController::class);
        Route::get('/employes/{employe}/planning', [EmployeController::class, 'planning']);

        // Congés
        Route::apiResource('conges', CongeController::class)->only(['index','store','destroy']);
        Route::patch('/conges/{conge}/statut', [CongeController::class, 'updateStatut']);
    });
});
