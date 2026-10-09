<?php

namespace Database\Seeders;

use App\Models\Agence;
use App\Models\AgenceCommune;
use App\Models\Autorisation;
use App\Models\Categorie;
use App\Models\Commune;
use App\Models\Role;
use App\Models\TypeCg;
use App\Models\TypeVg;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
         //$this->call(UserSeeder::class);

        // \App\Models\User::factory(10)->create();
//          Role::factory()->count(2)
//          ->sequence(['nom' => 'Admin','created_at' => Carbon::now(),'updated_at' => Carbon::now()],['nom' =>'Operateur','created_at' => Carbon::now(),'updated_at' => Carbon::now()])->create();

//         \App\Models\Agence::factory(10)->create();
//          Agence::factory()->count(9)
//          ->sequence(['nom_agence' => 'Ecobank','logo' => 'images/agences/ecobank.jpeg','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'Bicigui','logo' =>  'images/agences/bicigui.jpeg','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'BSIC','logo' =>  'images/agences/bsic.png','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'Fibank','logo' =>  'images/agences/fibanc.png','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'FNB','logo' =>  'images/agences/fnb.png','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'OraBank','logo' =>  'images/agences/orabank.jpeg','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'SGBG','logo' =>  'images/agences/sgbg.jpeg','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                      ['nom_agence' => 'Vista-Bank','logo' =>  'images/agences/vistabank.png','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             )->create();
              AgenceCommune::factory()->count(1)
                  ->sequence([
                      'agence_id' => Agence::all()->random()->agence_id,'commune_id' => Commune::all()->random()->commune_id,


                  ])
                  ->create();

//             Categorie::factory()->count(6)
//             ->sequence(['nomCategorie' => 'Motocyles','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomCategorie' =>'Vehicles legers','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomCategorie' =>'Minibus et Bus','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomCategorie' =>'Camions','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomCategorie' =>'Engins de chantiers','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomCategorie' =>'Engins Agricoles','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//              )->create();
        TypeVg::truncate();
       TypeVg::factory()->count(15)
           ->sequence(['nomType' => 'Motocyclette, Cyclomoteur','typecg_id' => 1,'montant' => 75000],
                      ['nomType' => "Voiture jusqu'à 12 CV",'typecg_id' => 2,'montant' => 200000],
                      ['nomType' => 'Pick-up, Fourgonnettes et 4 * 4','typecg_id' => 2,'montant' => 300000],
                      ['nomType' => 'Camion utilitaires','typecg_id' => 4,'montant' => 600000],
               ['nomType' => 'Véhicules servant au transport des marchandises jusqu\'à 5 tonnes','typecg_id' => 4,'montant' => 400000],
               ['nomType' => 'Véhicules servant au transport des marchandises de 6 jusqu\'à 10 tonnes','typecg_id' => 4,'montant' => 550000],
               ['nomType' => 'Véhicules servant au transport des marchandises de 11 jusqu\'à 20 tonnes','typecg_id' => 4,'montant' => 700000],
               ['nomType' => 'Véhicules servant au transport des personnes taxis jusqu\'à 5 places','typecg_id' => 2,'montant' => 300000],
               ['nomType' => 'Véhicules servant au transport des personnes taxis de 6 jusqu\'à 10 places','typecg_id' => 3,'montant' => 400000],
               ['nomType' => 'Véhicules servant au transport des personnes taxis de 11 jusqu\'à 20 places','typecg_id' => 3,'montant' => 500000],
               ['nomType' => 'Véhicules servant au transport des personnes bus de 21 jusqu\'à 30 places','typecg_id' => 3,'montant' => 700000],
               ['nomType' => 'Engins lourds,Camion grue','typecg_id' => 4,'montant' => 1500000],
               ['nomType' => 'Engins lourds,Hydrocurseur','typecg_id' => 4,'montant' => 2000000],
               ['nomType' => 'Engins lourds,Machine de terrassement','typecg_id' => 4,'montant' => 2000000],
           )->create();
//             ->sequence(
//                 ['nomType' => 'Motocyclette, Cyclomoteur','typecg_id' => 1,'montant' => 75000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                ['nomType' =>'Motocyclette, Cyclomoteur','typecg_id' => 2,'montant' => 75000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Voiture jusqu'à 12 CV",'typecg_id' => 3,'montant' => 200000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                ['nomType' =>"Taxi jusqu'à 5 places",'typecg_id' => 3,'montant' => 300000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                ['nomType' =>'Taxi 6 à 10 places','typecg_id' => 3,'montant' => 400000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                ['nomType' =>'Minibus 11 à 20 Places','typecg_id' => 3,'montant' => 500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Voiture jusqu'à 12 CV",'typecg_id' => 4,'montant' => 200000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Pick-Up, Fourgonnette et 4x4",'typecg_id' => 4,'montant' => 300000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Taxi jusqu'à 5 places",'typecg_id' => 4,'montant' => 300000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Taxi 6 à 10 places",'typecg_id' => 4,'montant' => 400000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Minibus 11 à 20 Places','typecg_id' => 4,'montant' => 500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>'Voiture entre 13 à 19 CV','typecg_id' => 5,'montant' => 0,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Pick-Up, Fourgonnette et 4x4','typecg_id' => 5,'montant' => 300000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Taxi jusqu'à 5 places",'typecg_id' => 5,'montant' => 300000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Taxi 6 à 10 places",'typecg_id' => 5,'montant' => 400000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Minibus 11 à 20 Places','typecg_id' => 5,'montant' => 500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>'Voiture supérieure à 19 CV','typecg_id' => 6,'montant' => 0,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Pick-Up, Fourgonnette et 4x4','typecg_id' => 6,'montant' => 200000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Taxi jusqu'à 5 places",'typecg_id' => 6,'montant' => 300000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Minibus 11 à 20 Places','typecg_id' => 6,'montant' => 500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>'Minibus 11 à 20 Places','typecg_id' => 7,'montant' => 500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Pick-Up, Fourgonnette et 4x4','typecg_id' => 7,'montant' => 200000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>'Bus 21 à 30 Places','typecg_id' => 7,'montant' => 600000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'Minibus 11 à 20 Places','typecg_id' => 7,'montant' => 500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>'Bus plus de 30 Places','typecg_id' => 8,'montant' => 700000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"Jusqu'à 5 Tonnes",'typecg_id' => 9,'montant' => 400000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camions Utilitaires",'typecg_id' => 9,'montant' => 600000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"Jusqu'à 5 Tonnes ",'typecg_id' => 11,'montant' => 400000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>'De 6 à 10 Tonnes','typecg_id' => 11,'montant' => 550000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"De 11 à 20 Tonnes",'typecg_id' => 11,'montant' => 700000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Plus de 20 Tonnes",'typecg_id' => 11,'montant' => 900000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camion Grue",'typecg_id' => 11,'montant' => 1500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Hydrocursseur",'typecg_id' => 11,'montant' => 2000000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"Jusqu'à 5 Tonnes",'typecg_id' => 11,'montant' => 400000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"De 6 à 10 Tonnes",'typecg_id' => 11,'montant' => 550000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"De 11 à 20 Tonnes",'typecg_id' => 11,'montant' => 700000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camions Utilitaires",'typecg_id' => 11,'montant' => 600000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"De 11 à 20 Tonnes",'typecg_id' => 12,'montant' => 700000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Plus de 20 Tonnes",'typecg_id' => 12,'montant' => 900000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camion Grue",'typecg_id' => 12,'montant' => 1500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Hydrocursseur",'typecg_id' => 12,'montant' => 2000000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camions Utilitaires",'typecg_id' => 12,'montant' => 600000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"Camion Grue",'typecg_id' => 13,'montant' => 1500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Hydrocursseur",'typecg_id' => 13,'montant' => 2000000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camions Utilitaires",'typecg_id' => 13,'montant' => 600000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Plus de 20 Tonnes",'typecg_id' => 13,'montant' => 900000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"De 11 à 20 Tonnes",'typecg_id' => 14,'montant' => 700000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Plus de 20 Tonnes",'typecg_id' => 14,'montant' => 900000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camion Grue",'typecg_id' => 14,'montant' => 1500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Camions Utilitaires",'typecg_id' => 14,'montant' => 600000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"Machine de Terrassements",'typecg_id' => 15,'montant' => 2000000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Grue, Buldozer, Pelle mécanique, Martaux",'montant' => 0,'typecg_id' => 15,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomType' =>"Camion Grue",'typecg_id' => 16,'montant' => 1500000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Hydrocursseur",'typecg_id' => 16,'montant' => 2000000,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Grue, Buldozer, Pelle mécanique, Martaux Piqueurs",'montant' => 0,'typecg_id' => 16,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomType' =>"Engins Agricoles ",'typecg_id' => 16,'montant' => 0,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//              )->create();

//       Autorisation::factory()->count(33)
//             ->sequence(['nomAutorisation' => 'Urbain de personnes Motos place égal à 2.','montant' => 120000,'categorie_id' => 1,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomAutorisation' =>'Urbain de personnes Motos place entre 3 et 5.','montant' => 170000,'categorie_id' => 1,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                        ['nomAutorisation' =>'Urbain de personnes Taxis 5 places  ','montant' => 170000,'categorie_id' => 2,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomAutorisation' =>'Urbain de personnes vehicules  entre 6 et 15 places','montant' => 300000,'categorie_id' => 2,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomAutorisation' =>'Interurbain de personnes Taxis interurbains de 5 places','montant' => 200000,'categorie_id' => 2,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomAutorisation' =>'Interurbain de personnes Véhicule de place entre 6 et 15','montant' => 240000,'categorie_id' => 2,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                        ['nomAutorisation' =>'Inter-Etats personnes véhicules de place entre 6 et 15.','montant' => 400000,'categorie_id' => 2,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomAutorisation' =>'Urbain de personnes vehicules  entre 6 et 15 places','montant' => 300000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Urbain de personnes vehicules  entre 16 et 25 places','montant' => 400000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Urbain de personnes vehicules  plus de  25 places','montant' => 600000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Interurbain de personnes vehicules de place entre 6 et 15','montant' => 240000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'InterUrbain de personnes vehicules de place entre 16 et 25','montant' => 760000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'InterUrbain de personnes vehicules plus de 25 places','montant' => 900000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Inter-Etats   personnes Véhicule de place entre 6 et 15','montant' => 400000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Inter-Etats personnes véhicules de place entre 16 et 25','montant' => 600000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Inter-Etats personnes véhicules de plus de 25 places','montant' => 900000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//                 ['nomAutorisation' =>'Urbain marchandises Camionnette PTAC inferieur ou egal a 3,5 t','montant' => 200000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Urbain marchandises Camion PTAC entre 4 et 19 t','montant' => 300000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Urbain marchandises Camion PTAC plus de 19 t','montant' => 440000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Interurbain marchandises Camionnette PTAC inferieur ou egal a 3,5 t','montant' => 240000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Interurbain marchandises Camion TAC entre 4 et 19 t','montant' => 400000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Interurbain marchandises Camion PTAC superieur a 19 t. ','montant' => 560000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Inter-etats marchandises Camionnette PTAC inferieur ou egal a 3,5 t. ','montant' => 480000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Inter-etats marchandises Camion PTAC entre 4 et 19 t','montant' => 700000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Inter-etats marchandises Camion PTAC superieur a 19 t','montant' => 900000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Hydrocarbures et matieres dangereuses Citerne contenance inferieur ou egal a 5000 I','montant' => 600000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Hydrocarbures et matieres dangereuses Citerne contenance entre 5000 et 20.000 litres','montant' => 900000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Hydrocarbures et matieres dangereuses Citerne contenance entre 20 000 et 40 000 litres','montant' => 1200000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Hydrocarbures et matieres dangereuses Citerne contenance superieur a 40 000 litres','montant' => 2400000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Exceptionnel Camionnette PTAC inferieur ou egal a 3,5 t','montant' => 600000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Exceptionnel Vehicule PTAC entre 4 et 19 t','montant' => 900000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//                 ['nomAutorisation' =>'Exceptionnel Vehicule PTAC superieur a 19 t','montant' => 1200000,'categorie_id' => 4,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
////                 ['nomAutorisation' =>'Inter-Etats   personnes Véhicule de place entre 6 et 15','montant' => 400000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
////                 ['nomAutorisation' =>'Inter-Etats   personnes Véhicule de place entre 6 et 15','montant' => 400000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
////                 ['nomAutorisation' =>'Inter-Etats   personnes Véhicule de place entre 6 et 15','montant' => 400000,'categorie_id' => 3,'created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//              )->create();


//      TypeCg::factory()->count(37)
//         ->sequence(['categorie_id'=>1,'type'=>1,'capacite'=>'125','montant'=>'500000','signe' => '<=','unite' => 'CC','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>1,'type'=>1,'capacite'=>'125','montant'=>'600000','signe' => '>','unite' => 'CC','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['categorie_id'=>2,'type'=>1,'capacite'=>'7','montant'=>'800000','signe' => '<=','unite' => 'CV','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>2,'type'=>1,'capacite'=>'7,12','montant'=>'1000000','signe' => '>,<=','unite' => 'CV','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>2,'type'=>1,'capacite'=>'7,19','montant'=>'1600000','signe' => '>,<=','unite' => 'CV','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>2,'type'=>1,'capacite'=>'19','montant'=>'2400000','signe' => '>','unite' => 'CC','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['categorie_id'=>3,'type'=>1,'capacite'=>'15','montant'=>'1100000','signe' => '<','unite' => 'P','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>3,'type'=>1,'capacite'=>'16,25','montant'=>'1200000','signe' => '!','unite' => 'P','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>3,'type'=>1,'capacite'=>'25','montant'=>'1700000','signe' => '>','unite' => 'P','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['categorie_id'=>4,'type'=>1,'capacite'=>'3.5','montant'=>'1100000','signe' => '>=','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>4,'type'=>1,'capacite'=>'3.5,19','montant'=>'1300000','signe' => '>,<=','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>4,'type'=>1,'capacite'=>'19','montant'=>'1800000','signe' => '>','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['nomType' => 'VEHICULES ARTICULE','categorie_id'=>4,'type'=>1,'capacite'=>'12.5','montant'=>'1000000','signe' => '<=','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'VEHICULES ARTICULE','categorie_id'=>4,'type'=>1,'capacite'=>'12.5','montant'=>'1200000','signe' => '>','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'TRACTEUR ROUTIER','categorie_id'=>4,'type'=>1,'capacite'=>'0','montant'=>'2500000','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'REMORQUE OU SEMI-REMORQUE','categorie_id'=>4,'type'=>1,'capacite'=>'0','montant'=>'2400000','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'ENGINS DE CHANTIER','categorie_id'=>4,'type'=>1,'capacite'=>'0','montant'=>'7000000','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'ENGINS AGRICOLES','categorie_id'=>4,'type'=>1,'capacite'=>'0','montant'=>'0','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             //ReImmitraculation
//
//             ['categorie_id'=>1,'type'=>2,'capacite'=>'125','montant'=>'400000','signe' => '<=','unite' => 'CC','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>1,'type'=>2,'capacite'=>'125','montant'=>'440000','signe' => '>','unite' => 'CC','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['categorie_id'=>2,'type'=>2,'capacite'=>'7','montant'=>'640000','signe' => '<=','unite' => 'CV','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>2,'type'=>2,'capacite'=>'7,12','montant'=>'800000','signe' => '>,<=','unite' => 'CV','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>2,'type'=>2,'capacite'=>'7,19','montant'=>'1200000','signe' => '>,<=','unite' => 'CV','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>2,'type'=>2,'capacite'=>'19','montant'=>'2000000','signe' => '>','unite' => 'CC','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['categorie_id'=>3,'type'=>2,'capacite'=>'15','montant'=>'800000','signe' => '<','unite' => 'P','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>3,'type'=>2,'capacite'=>'16,25','montant'=>'900000','signe' => '!','unite' => 'P','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>3,'type'=>2,'capacite'=>'25','montant'=>'1300000','signe' => '>','unite' => 'P','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['categorie_id'=>4,'type'=>2,'capacite'=>'3.5','montant'=>'800000','signe' => '>=','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>4,'type'=>2,'capacite'=>'3.5,19','montant'=>'1200000','signe' => '>,<=','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['categorie_id'=>4,'type'=>2,'capacite'=>'19','montant'=>'1500000','signe' => '>','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//             ['nomType' => 'VEHICULES ARTICULE','categorie_id'=>4,'type'=>2,'capacite'=>'12.5','montant'=>'900000','signe' => '<=','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'VEHICULES ARTICULE','categorie_id'=>4,'type'=>2,'capacite'=>'12.5','montant'=>'1100000','signe' => '>','unite' => 'T','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'TRACTEUR ROUTIER','categorie_id'=>4,'type'=> 2,'capacite'=>'0','montant'=>'2000000','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'REMORQUE OU SEMI-REMORQUE','categorie_id'=>4,'type'=>2,'capacite'=>'0','montant'=>'1700000','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'ENGINS DE CHANTIER','categorie_id'=>4,'type'=>2,'capacite'=>'0','montant'=>'3150000','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//             ['nomType' => 'ENGINS AGRICOLES','categorie_id'=>4,'type'=>2,'capacite'=>'0','montant'=>'0','signe' => '','unite' => '','created_at' => Carbon::now(),'updated_at' => Carbon::now()],
//
//         )->create();

    }
}
