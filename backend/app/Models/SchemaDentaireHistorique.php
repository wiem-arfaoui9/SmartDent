<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchemaDentaireHistorique extends Model
{
    use HasFactory;

    protected $table = 'schema_dentaire_historique';
    protected $fillable = ['patient_id','numero_dent','statut','note','dentiste_id'];

    public function patient()  { return $this->belongsTo(Patient::class); }
    public function dentiste() { return $this->belongsTo(User::class, 'dentiste_id'); }
}
