<?php

namespace App\Console\Commands;

use App\Http\Controllers\API\PaiementController;
use App\Models\Paiement;
use Illuminate\Console\Command;

/**
 * Regenere le QR code des recus existants : la reference du paiement en clair
 * (au lieu du numero de chassis chiffre), dans un fichier propre a chaque paiement.
 */
class RegenererQrCodes extends Command
{
    protected $signature = 'paiements:regenerer-qrcodes';

    protected $description = 'Regenere le QR code de chaque paiement avec sa reference en clair';

    public function handle()
    {
        $total = 0;
        Paiement::whereNotNull('reference')->where('reference', '!=', '')
            ->orderBy('paiement_id')
            ->chunkById(200, function ($paiements) use (&$total) {
                foreach ($paiements as $paiement) {
                    $paiement->qrcode = PaiementController::genererQrCode($paiement->reference);
                    $paiement->timestamps = false;
                    $paiement->save();
                    $total++;
                }
            }, 'paiement_id');
        $this->info("$total QR codes régénérés.");
        return 0;
    }
}
