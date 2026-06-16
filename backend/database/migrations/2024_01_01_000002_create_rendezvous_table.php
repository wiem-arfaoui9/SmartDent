<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rendezvous', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dentiste_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('date_heure');
            $table->unsignedSmallInteger('duree')->default(30);
            $table->string('motif', 255);
            $table->text('notes')->nullable();
            $table->enum('statut', ['planifie','confirme','annule','termine'])->default('planifie');
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('rendezvous'); }
};
