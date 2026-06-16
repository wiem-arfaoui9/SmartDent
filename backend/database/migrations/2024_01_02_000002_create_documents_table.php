<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['facture','devis','recu','ordonnance','certificat','radiographie','autre']);
            $table->string('titre');
            $table->string('chemin')->nullable(); // storage path
            $table->foreignId('rendezvous_id')->nullable()->constrained('rendezvous')->nullOnDelete();
            $table->foreignId('paiement_id')->nullable()->constrained('paiements')->nullOnDelete();
            $table->foreignId('genere_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('documents'); }
};
