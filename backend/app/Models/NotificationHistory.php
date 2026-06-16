<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationHistory extends Model
{
    use HasFactory;

    protected $table = 'notifications_history';
    protected $fillable = [
        'user_id','patient_id','type','canal','titre','contenu','lu','envoye_le'
    ];
    protected $casts = ['lu' => 'boolean', 'envoye_le' => 'datetime'];

    public function user()    { return $this->belongsTo(User::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
}
