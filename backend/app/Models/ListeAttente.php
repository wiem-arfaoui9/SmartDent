<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListeAttente extends Model
{
    use HasFactory;

    protected $table = 'liste_attente';
    protected $fillable = ['patient_id','dentiste_id','date_souhaitee','motif','statut'];
    protected $casts = ['date_souhaitee' => 'date'];

    public function patient()  { return $this->belongsTo(Patient::class); }
    public function dentiste() { return $this->belongsTo(User::class, 'dentiste_id'); }
}
