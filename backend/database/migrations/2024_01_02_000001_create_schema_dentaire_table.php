<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('schema_dentaire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('numero_dent'); // FDI 11-48
            $table->enum('statut', ['saine','a_traiter','soignee','couronne','extraite','implant'])->default('saine');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['patient_id', 'numero_dent']);
        });

        Schema::create('schema_dentaire_historique', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('numero_dent');
            $table->enum('statut', ['saine','a_traiter','soignee','couronne','extraite','implant']);
            $table->text('note')->nullable();
            $table->foreignId('dentiste_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schema_dentaire_historique');
        Schema::dropIfExists('schema_dentaire');
    }
};
