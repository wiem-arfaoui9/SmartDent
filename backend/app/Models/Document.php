<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id','type','titre','chemin','rendezvous_id','paiement_id','genere_par'
    ];

    public function patient()    { return $this->belongsTo(Patient::class); }
    public function rendezvous() { return $this->belongsTo(Rendezvous::class); }
    public function paiement()   { return $this->belongsTo(Paiement::class); }
    public function auteur()     { return $this->belongsTo(User::class, 'genere_par'); }
}
