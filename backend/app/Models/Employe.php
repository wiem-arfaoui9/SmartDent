<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employe extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','nom','prenom','email','telephone','poste',
        'specialite','date_embauche','salaire','cin','adresse'
    ];
    protected $casts = ['date_embauche' => 'date', 'salaire' => 'float'];

    public function user()       { return $this->belongsTo(User::class); }
    public function rendezvous() { return $this->hasMany(Rendezvous::class, 'dentiste_id', 'user_id'); }
}
