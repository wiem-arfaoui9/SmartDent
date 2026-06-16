<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id','nom','prenom','date_naissance','sexe','cin','telephone',
        'email','adresse','groupe_sanguin','allergies','antecedents','mutuelle',
        'contact_urgence_nom','contact_urgence_telephone',
    ];

    protected $casts = ['date_naissance' => 'date'];

    public function user()             { return $this->belongsTo(User::class); }
    public function rendezvous()       { return $this->hasMany(Rendezvous::class); }
    public function dossiersMedicaux() { return $this->hasMany(DossierMedical::class); }
    public function paiements()        { return $this->hasMany(Paiement::class); }
    public function schemaDentaire()   { return $this->hasMany(SchemaDentaire::class); }
    public function documents()        { return $this->hasMany(Document::class); }
    public function conversations()    { return $this->hasMany(Conversation::class); }
    public function resumesIa()        { return $this->hasMany(ResumeIa::class); }

    public function getFullNameAttribute(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }
}
