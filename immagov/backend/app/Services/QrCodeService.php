<?php

namespace App\Services;

use App\Models\Immatriculation;
use App\Models\Vehicule;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * QR code de la plaque : il contient le numéro de châssis du véhicule (vehicules.numChassie),
 * lisible par n'importe quel lecteur de QR code.
 */
class QrCodeService
{
    /**
     * Génère (ou régénère) public/qrcodes/<numéro d'immatriculation>.svg et renvoie son chemin relatif
     * (à enregistrer dans immatriculations.qrcode). Lève une exception si le véhicule n'a pas de numéro de châssis.
     */
    public static function generer(Immatriculation $immatriculation)
    {
        $chassis = trim((string) Vehicule::where('vehicule_id', $immatriculation->vehicule_id)->value('numChassie'));
        if ($chassis === '')
            throw new \RuntimeException("Le véhicule de l'immatriculation {$immatriculation->immatriculation_number} n'a pas de numéro de châssis.");

        $chemin = 'qrcodes/'.$immatriculation->immatriculation_number.'.svg';
        Storage::disk('local')->put('public/'.$chemin, QrCode::size(300)->generate($chassis), 'public');
        return $chemin;
    }
}
