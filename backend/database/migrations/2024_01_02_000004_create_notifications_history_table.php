<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('type', ['rappel_rdv','confirmation_rdv','annulation_rdv','facture','relance_paiement','planning','autre']);
            $table->enum('canal', ['email','sms','interne'])->default('interne');
            $table->string('titre');
            $table->text('contenu')->nullable();
            $table->boolean('lu')->default(false);
            $table->timestamp('envoye_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('notifications_history'); }
};
