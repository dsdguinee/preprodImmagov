<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Typevehicule extends Model
{
    use HasFactory;
    protected $guarded = [];
    protected $primaryKey = 'type_id';
    public $timestamps = false;
}
