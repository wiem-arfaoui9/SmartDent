<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rendezvous extends Model
{
    use HasFactory;

    protected $table = 'rendezvous';
    protected $fillable = ['patient_id','dentiste_id','date_heure','duree','motif','notes','statut'];
    protected $casts = ['date_heure' => 'datetime'];

    public function patient()        { return $this->belongsTo(Patient::class); }
    public function dentiste()       { return $this->belongsTo(User::class, 'dentiste_id'); }
    public function dossierMedical() { return $this->hasOne(DossierMedical::class); }
    public function paiement()       { return $this->hasOne(Paiement::class); }
}
