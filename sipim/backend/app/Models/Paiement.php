<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;
    protected $primaryKey = 'paiement_id';

    // utilise : la référence a-t-elle déjà servi à une immatriculation (true / false)
    protected $casts = [
        'utilise' => 'boolean',
        'date_utilisation' => 'datetime',
    ];
}
