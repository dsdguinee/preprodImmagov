<?php

namespace App\Models;

use App\Models\Concerns\NotifieSipim;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Immatriculation extends Model
{
    use HasFactory, NotifieSipim;
    protected $primaryKey = 'immatriculation_id';
}
