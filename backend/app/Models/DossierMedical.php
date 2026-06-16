<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DossierMedical extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id','rendezvous_id','dentiste_id','diagnostic','traitement',
        'medicaments','observations','prochaine_visite','dent_concernee','radiographie'
    ];
    protected $casts = ['prochaine_visite' => 'date'];

    public function patient()    { return $this->belongsTo(Patient::class); }
    public function dentiste()   { return $this->belongsTo(User::class, 'dentiste_id'); }
    public function rendezvous() { return $this->belongsTo(Rendezvous::class); }
}
