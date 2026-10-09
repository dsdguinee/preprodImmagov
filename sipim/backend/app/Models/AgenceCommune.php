<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgenceCommune extends Model
{
    use HasFactory;
    protected $primaryKey = 'agenceCommune_id';
    public $timestamps = false;
}
