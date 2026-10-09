<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\SipimService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaiementController extends Controller
{
    // GET /api/paiement/sipim?reference=... : relaie la consultation du paiement vers SIPIM (clé API gardée côté serveur)
    public function getPaiementSipim(Request $request){
        $validator = Validator::make($request->all(), [
            'reference' => 'required|string|max:100',
        ], [
            'reference.required' => 'La référence de paiement est obligatoire.',
        ]);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->errors()->first('reference')]);

        return response()->json(SipimService::getPaiement($request->input('reference')));
    }
}
