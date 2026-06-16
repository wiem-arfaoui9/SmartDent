<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('resumes_ia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('genere_par')->nullable()->constrained('users')->nullOnDelete();
            $table->longText('contenu');
            $table->string('modele')->default('claude');
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('resumes_ia'); }
};
