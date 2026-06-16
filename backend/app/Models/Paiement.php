<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id','rendezvous_id','montant','mode_paiement','statut','description','date_paiement'
    ];
    protected $casts = ['date_paiement' => 'datetime', 'montant' => 'float'];

    public function patient()    { return $this->belongsTo(Patient::class); }
    public function rendezvous() { return $this->belongsTo(Rendezvous::class); }
}
