<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conge extends Model
{
    use HasFactory;

    protected $table = 'conges';
    protected $fillable = ['employe_id','date_debut','date_fin','type','statut','motif'];
    protected $casts = ['date_debut' => 'date', 'date_fin' => 'date'];

    public function employe() { return $this->belongsTo(Employe::class); }
}
