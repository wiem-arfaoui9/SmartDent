<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResumeIa extends Model
{
    use HasFactory;

    protected $table = 'resumes_ia';
    protected $fillable = ['patient_id','genere_par','contenu','modele'];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function auteur()  { return $this->belongsTo(User::class, 'genere_par'); }
}
