<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rendezvous_id')->nullable()->constrained('rendezvous')->nullOnDelete();
            $table->decimal('montant', 10, 2);
            $table->enum('mode_paiement', ['especes','carte','virement','cheque','mutuelle']);
            $table->enum('statut', ['paye','en_attente','annule'])->default('en_attente');
            $table->text('description')->nullable();
            $table->dateTime('date_paiement')->nullable();
            $table->timestamps();
        });

        Schema::create('dossiers_medicaux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rendezvous_id')->nullable()->constrained('rendezvous')->nullOnDelete();
            $table->foreignId('dentiste_id')->constrained('users');
            $table->text('diagnostic');
            $table->text('traitement');
            $table->text('medicaments')->nullable();
            $table->text('observations')->nullable();
            $table->date('prochaine_visite')->nullable();
            $table->string('dent_concernee', 50)->nullable();
            $table->string('radiographie')->nullable();
            $table->timestamps();
        });

        Schema::create('employes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 150);
            $table->string('telephone', 20);
            $table->enum('poste', ['dentiste','secretaire','assistant','hygieniste']);
            $table->string('specialite', 100)->nullable();
            $table->date('date_embauche');
            $table->decimal('salaire', 10, 2)->nullable();
            $table->string('cin', 20)->nullable();
            $table->text('adresse')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employes');
        Schema::dropIfExists('dossiers_medicaux');
        Schema::dropIfExists('paiements');
    }
};
