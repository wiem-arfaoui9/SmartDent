<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchemaDentaire extends Model
{
    use HasFactory;

    protected $table = 'schema_dentaire';
    protected $fillable = ['patient_id','numero_dent','statut','note'];

    public function patient() { return $this->belongsTo(Patient::class); }
}
