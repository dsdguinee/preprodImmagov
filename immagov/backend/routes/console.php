<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Propositions « autre ministère » en attente dont le nom existe déjà : le code de l'organisme existant est affecté au dossier
Artisan::command('organismes:rattacher {--simuler : Affiche les rattachements sans les enregistrer}', function () {
    $propositions = \App\Models\Immatriculation::where('minister_id', \App\Services\OrganismeService::AUTRE_MINISTERE)->get();
    $n = 0;
    foreach ($propositions as $immatriculation) {
        $proposition = $immatriculation->autreministere;
        $ministere = \App\Services\OrganismeService::trouverParNom($proposition);
        if (!$ministere) {
            $this->line("{$immatriculation->immatriculation_number} : « {$proposition} » est un nouvel organisme, à valider par le Directeur.");
            continue;
        }
        $this->info("{$immatriculation->immatriculation_number} : « {$proposition} » → organisme existant n° {$ministere->ministere_id} « {$ministere->nom} »");
        if (!$this->option('simuler')) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($immatriculation) {
                \App\Services\OrganismeService::rattacherSiExistant($immatriculation);
                $immatriculation->save();
            });
        }
        $n++;
    }
    $this->comment($this->option('simuler') ? "$n dossier(s) seraient rattachés." : "$n dossier(s) rattachés.");
})->purpose("Affecte aux propositions d'organisme en attente le code de l'organisme existant du même nom");

// QR codes des immatriculations validées régénérés avec le numéro de châssis du véhicule (en clair)
Artisan::command('qrcodes:regenerer', function () {
    $n = 0; $erreurs = 0;
    foreach (\App\Models\Immatriculation::whereNotNull('qrcode')->orWhere('status', 1)->get() as $immatriculation) {
        try {
            $chemin = \App\Services\QrCodeService::generer($immatriculation);
            if ($immatriculation->qrcode !== $chemin) {
                $immatriculation->qrcode = $chemin;
                $immatriculation->timestamps = false; // ne pas déplacer updated_at
                $immatriculation->save();
            }
            $n++;
        } catch (\Throwable $ex) {
            $erreurs++;
            $this->error($ex->getMessage());
        }
    }
    $this->info("$n QR code(s) régénéré(s)".($erreurs ? ", $erreurs erreur(s)" : "").".");
})->purpose('Régénère les QR codes des plaques avec le numéro de châssis du véhicule');
