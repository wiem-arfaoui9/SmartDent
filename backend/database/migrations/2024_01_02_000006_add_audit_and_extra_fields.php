<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Audit log table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action'); // ex: 'view_dossier', 'update_patient'
            $table->string('model_type')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        // Liaison user <-> patient (pour le portail patient)
        Schema::table('patients', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('contact_urgence_nom', 150)->nullable();
            $table->string('contact_urgence_telephone', 20)->nullable();
        });

        // Congés/absences employés
        Schema::create('conges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employe_id')->constrained('employes')->cascadeOnDelete();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('type', ['conge_paye','maladie','absence','autre'])->default('conge_paye');
            $table->enum('statut', ['en_attente','approuve','refuse'])->default('en_attente');
            $table->text('motif')->nullable();
            $table->timestamps();
        });

        // Liste d'attente RDV
        Schema::create('liste_attente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dentiste_id')->constrained('users')->cascadeOnDelete();
            $table->date('date_souhaitee');
            $table->string('motif', 255);
            $table->enum('statut', ['en_attente','propose','annule'])->default('en_attente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liste_attente');
        Schema::dropIfExists('conges');
        Schema::table('patients', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['contact_urgence_nom', 'contact_urgence_telephone']);
        });
        Schema::dropIfExists('audit_logs');
    }
};
