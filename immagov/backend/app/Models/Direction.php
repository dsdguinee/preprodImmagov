<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Direction extends Model
{
    use HasFactory;
    protected $guarded = [];
    protected $primaryKey = 'direction_id';
    public $timestamps = false;
}
