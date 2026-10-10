<?php

namespace App\Models;

use App\Models\Concerns\NotifieSipim;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reforme extends Model
{
    use HasFactory, NotifieSipim;
    protected $primaryKey = 'reforme_id';
    protected $guarded = [];
}
