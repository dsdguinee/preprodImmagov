<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TestController extends BaseController
{
    public function TestNumeroImmatriculation($modeImmatriculation){
        return $this->immatriculation($modeImmatriculation);
    }
}
