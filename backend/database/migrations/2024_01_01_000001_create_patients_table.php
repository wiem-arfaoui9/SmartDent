<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->date('date_naissance');
            $table->enum('sexe', ['M', 'F']);
            $table->string('cin', 20)->nullable()->unique();
            $table->string('telephone', 20);
            $table->string('email', 150)->nullable();
            $table->text('adresse')->nullable();
            $table->enum('groupe_sanguin', ['A+','A-','B+','B-','AB+','AB-','O+','O-'])->nullable();
            $table->text('allergies')->nullable();
            $table->text('antecedents')->nullable();
            $table->string('mutuelle', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { Schema::dropIfExists('patients'); }
};
