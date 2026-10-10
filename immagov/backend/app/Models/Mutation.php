<?php

namespace App\Models;

use App\Models\Concerns\NotifieSipim;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mutation extends Model
{
    use HasFactory, NotifieSipim;
    protected $guarded = [];
    protected $primaryKey = 'mutation_id';
    public $timestamps = false;
}
