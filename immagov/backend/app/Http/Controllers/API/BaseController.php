<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Immatriculation;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;
class Numerotation{
    public $immatriculation_number;
}
class BaseController extends Controller
{
    public function fullAccess($user_id){
//        $userAccess = DB::select('select privilege_id  from user_privileges where user_id =?',[$user_id]);
//        //$fullAccess = DB::select("SELECT privilege_id FROM immagov_db.privileges where nom NOT IN ('Nouvelle immatriculation','Nouvelle Mutation','Nouvelle Reforme','Carte Grise')");
//        //$fullAccess = DB::select("SELECT privilege_id FROM immagov_db.privileges");
//        $fullAccess = DB::select("SELECT privilege_id FROM privileges where nom NOT IN ('Reservation','Nouvelle immatriculation','Nouvelle Mutation','Nouvelle Reforme','Carte Grise','impressions')");
//        $result = array_udiff($fullAccess,$userAccess,function ($obj_a, $obj_b) {
//            return strcmp($obj_a->privilege_id, $obj_b->privilege_id);
//        });
//        if(count($result) === 0)
//            return true;
//        else return false;
        $user = User::find($user_id);
        if(!$user) return false;
        else{
            if($user->isAdmin === 1) return true;
            else return false;
        }
    }
    public function storingFile(Request $request,$file_name,$nametostore,$path)
    {
        try {
            $ext = $request->file($file_name)->extension();
            $filename = $nametostore . "." . $ext;
            $filePath = $path . '/' . $filename;
            if($file_name != "pieceJointe"){
            if(number_format($request->file($file_name)->getSize() / 1048576,2) > 1)
               Image::make($request->file($file_name))->resize(750, 600)->save('storage/' .$filePath);
            else
                $request->file($file_name)->storeAs($path,$filename,'public');
            }else  $request->file($file_name)->storeAs($path,$filename,'public');

            return $filePath;
        }
        catch (\Exception $ex){
            return response()->json(['success'=>false,'status' => 400,'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }
    public function Majuscule($mot){
        $caracteres = explode(' ',$mot);
        $caracteresMajuscule = '';
      foreach ($caracteres as $caractere){
          $caracteresMajuscule .= ucfirst($caractere).' ';
      }
      return trim($caracteresMajuscule);
     }
    //Algorithme d'immatriculation
//    private function immatriculation($modeImmatriculation){
//        $getlastimmatriculation = Immatriculation::where('modeImmatriculation',$modeImmatriculation)->get()->last();
//        $numero = '0001';$numeroAlpha = 'A';$immaNumericAlpha = '';;
//        if( $getlastimmatriculation )
//        {
//            $initialnumber = explode('-',$getlastimmatriculation->immatriculation_number);
//            $numero = intval($initialnumber[1]) + 1;
//            if($numero > 0 && $numero < 9 )
//                $numero = '000'.$numero;
//            else if($numero > 0 && $numero < 99 )
//                $numero = '00'.$numero;
//            else if($numero >=99 && $numero < 999 )
//                $numero = '0'.$numero;
//            else if($numero >= 999 && $numero < 9999)
//                $numero = $numero;
//            if(strlen($initialnumber[2]) == 1) {
//                if (ord($initialnumber[2]) <= 90){
//                    if (intval($numero) <= 9999) {
//                        $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . chr(ord($initialnumber[2]));
//                    } else if (intval($numero) > 9999) {
//                        $immaNumericAlpha = $modeImmatriculation . '-0001-' . chr(ord($initialnumber[2]) + 1);
//                    }
//                }else{
//
//                }
//            }
//            return $immaNumericAlpha;
//        }
//        $immaNumericAlpha = $modeImmatriculation . '-'.$numero . '-'.$numeroAlpha;
//
//        return $immaNumericAlpha;
//    }

    public function immatriculation($modeImmatriculation){
        $getlastimmatriculation = Immatriculation::where('modeImmatriculation',$modeImmatriculation)->get()->last();
        if( $getlastimmatriculation ) {
            $initialImmatriculation = explode('-', $getlastimmatriculation->immatriculation_number);
            $numero = intval($initialImmatriculation[1]) + 1;
            if ($numero > 0 && $numero <= 9)
                $numero = '000' . $numero;
            else if ($numero > 9 && $numero <= 99)
                $numero = '00' . $numero;
            else if ($numero > 99 && $numero <= 999)
                $numero = '0' . $numero;
            else if ($numero > 999 && $numero <= 9999)
                $numero = $numero;

            if(strlen($initialImmatriculation[2]) === 1){
                $initialalhpa = ord($initialImmatriculation[2]);
                if($initialalhpa <= 90){
                    if($numero <= 9999){
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero.'-'.chr($initialalhpa);
                    }
                    else {
                        if(ord($initialImmatriculation[2]) + 1 <= 90){
                            $numero = '0001'; $initialalhpa = ord($initialImmatriculation[2]) + 1;
                            $immaNumericAlpha = $modeImmatriculation.'-'.$numero.'-'.chr($initialalhpa);
                        }else{
                            $immaNumericAlpha = $modeImmatriculation .'-0001-AA';
                        }
                    }
                }
            }
            else if(strlen($initialImmatriculation[2]) === 2){
                $initialalhpamultipleChar =  $initialImmatriculation[2];
                if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1 <= 90 && ord($getlastimmatriculation[strlen($initialalhpamultipleChar) - 2]) <= 90){
                    if($numero <= 9999){
                        $alphaNumber = $initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2].chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1] ));
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
                    }else {
                        $numero = '0001';
                        if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) <= 90){
                            $alphaNumber = $initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2].chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1);
                            $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
                        }
                    }
                }else {
                    if($numero > 9999){
                        if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) + 1 <= 90 or ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1 <= 90) {
                            $numero = '0001';
                           // if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) != ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1])) {
                            $alphaNumber = chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) + 1) . chr(65);
                            $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . $alphaNumber;
                            //}else{

                                 //return "Controller dans la BD si ces alpha n'existe pas";
                           // }

                        }else{
                            $numero = '0001';
                            $alphaNumber = 'AAA';
                            $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . $alphaNumber;
                        }
                    }else{
                        $alphaNumber = chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2]) ).$initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1];
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
                    }
                }

            }
        }else{
            $immaNumericAlpha = $modeImmatriculation .'-0001-A';
        }
        return $immaNumericAlpha;
    }

    public function generationNumber($modeImmatriculation){

    }

    public function immatriculation2($modeImmatriculation){
        $getlastimmatriculation = Immatriculation::where('modeImmatriculation',$modeImmatriculation)->get()->last();

        if( $getlastimmatriculation ) {
            $initialImmatriculation = explode('-', $getlastimmatriculation->immatriculation_number);
            $numero = intval($initialImmatriculation[1]) + 1;
            if ($numero > 0 && $numero < 9)
                $numero = '000' . $numero;
            else if ($numero > 0 && $numero < 99)
                $numero = '00' . $numero;
            else if ($numero >= 99 && $numero < 999)
                $numero = '0' . $numero;
            else if ($numero >= 999 && $numero <= 9999)
                $numero = $numero;

            if(strlen($initialImmatriculation[2]) === 1){
                $initialalhpa = ord($initialImmatriculation[2]);
            if($initialalhpa <= 90){
                if($numero <= 9999){
                    $immaNumericAlpha = $modeImmatriculation.'-'.$numero.'-'.chr($initialalhpa);
                }
                else {
                   if(ord($initialImmatriculation[2]) + 1 <= 90){
                        $numero = '0001'; $initialalhpa = ord($initialImmatriculation[2]) + 1;
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero.'-'.chr($initialalhpa);
                   }else{
                       $immaNumericAlpha = $modeImmatriculation .'-0001-AA';
                   }
                }
            }

        }else if(strlen($initialImmatriculation[2]) === 2){
            $initialalhpamultipleChar =  $initialImmatriculation[2];$alphaNumber = '';
            for($i = 0;$i < strlen($initialalhpamultipleChar) - 1; $i++){
                if(ord($initialalhpamultipleChar[$i + 1]) + 1 <= 90 ){
                   if($numero <= 9999)
                       $alphaNumber = chr(ord($initialalhpamultipleChar[$i])) . chr(ord($initialalhpamultipleChar[$i + 1]));
                   else{
                       $numero = '0001';
                       $alphaNumber = chr(ord($initialalhpamultipleChar[$i])) . chr(ord($initialalhpamultipleChar[$i + 1]) + 1);
                   }
                }else{
                    if(ord($initialalhpamultipleChar[$i]) + 1 <= 90){
                        if($numero > 9999) {
                            $numero = '0001';
                            $alphaNumber = chr(ord($initialalhpamultipleChar[$i]) + 1) . chr(65);
                        }else{
                            $alphaNumber = chr(ord($initialalhpamultipleChar[$i]) + 1) . chr(ord($initialalhpamultipleChar[$i+1]));
                        }
                    }else{
                        $alphaNumber =  chr(ord($initialalhpamultipleChar[$i]) + 1) . chr(ord($initialalhpamultipleChar[$i+1]));
                    }
                }
            }
           $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
//            if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1 <= 90){
//                if($numero <= 9999){
//                    $alphaNumber = $initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2].chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1] ));
//                    $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
//                }else {
//                       $numero = '0001';
//                       if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) <= 90){
//                           $alphaNumber = $initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2].chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1);
//                           $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
//                       }
//                }
//            }else {
//                    if($numero > 9999){
//                        if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) + 1 <= 90 or ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1 <= 90) {
//                            $numero = '0001';
//                            $alphaNumber = chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) + 1) . chr(65);
//                            $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . $alphaNumber;
//                        }else{
//                            $numero = '0001';
//                            $alphaNumber = 'AAA';
//                            $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . $alphaNumber;
//                        }
//                    }else{
//                        $alphaNumber = chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2]) ).$initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1];
//                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
//                    }
//                }

        }
        }else{
            $immaNumericAlpha = $modeImmatriculation .'-0001-A';
        }
        return $immaNumericAlpha;
    }
    public function DashBoardStatistic(){
        $stats = ['totaux' => 0,'attente' => 0,'valider' => 0,'rejete' => 0,'reforme' => 0,'mutation' => ''];

        if($this->fullAccess(Auth::user()->id) ) {
            $results = DB::select("select status,count(*) Total from immatriculations group by status");
            if($results) {
                foreach ($results as $result){
                    if($result->status == 0)
                        $stats['attente'] = $result->Total;
                    else if($result->status == 1)
                        $stats['valider'] = $result->Total;
                    else if($result->status == 2)
                        $stats['rejete'] = $result->Total;
                    else if($result->status == 3)
                        $stats['reforme'] = $result->Total;
                    else if($result->status === 4)
                        $stats['mutation'] = $result->Total;
                }
                $stats['totaux'] = (intval($stats['attente'])+intval($stats['valider'])+intval($stats['rejete'])+intval($stats['mutation']));

            }
            $dashboardData = ['success' => true, 'stats' => $stats];
            return response()->json($dashboardData);
        }else {
            $results = DB::select("select status,count(*) Total from immatriculations
                        where created_by=? group by status",[Auth::user()->id]);

            if($results) {
                $stats = ['totaux' => 0,'attente' => 0,'valider' => 0,'rejete' => 0,'reforme' => 0,'mutation' => 0];
                foreach ($results as $result){
                    if($result->status == 0)
                        $stats['attente'] = $result->Total;
                    else if($result->status === 1)
                        $stats['valider'] = $result->Total;
                    else if($result->status === 2)
                        $stats['rejete'] = $result->Total;
                    else if($result->status === 3)
                        $stats['reforme'] = $result->Total;
                    else if($result->status === 4)
                        $stats['mutation'] = $result->Total;
                }
                $stats['totaux'] = (intval($stats['attente'])+intval($stats['valider'])+intval($stats['rejete'] + intval($stats['mutation'])));

                $dashboardData = ['success' => true, 'stats' => $stats];
                return response()->json($dashboardData);
            }
            $dashboardData = ['success' => true, 'stats' => $stats];
            return response()->json($dashboardData);
        }
    }
    public function DashBoardOption($option){
        $dashboardData = ['success' => true, 'stats' => $option];
        return response()->json($dashboardData);
    }
    public function roleStatus(){
        $user = User::find(Auth::user()->id);
        if($user){
            $roleStatus = Role::find($user->role_id);
            if($roleStatus)
                return $roleStatus->operations;
        }
        return 0;
    }

    public function immatriculation3($modeImmatriculation,$reservation_id){
        $getlastimmatriculation = '';$immaNumericAlpha = '';
        if(strlen($reservation_id) == 0) {
            $getlastimmatriculation = Immatriculation::where('type_numerotation', 'normale')
                ->where('modeImmatriculation', $modeImmatriculation)->get()->last();

        }
        else{
//            $getlastimmatriculation = Immatriculation::where('type_numerotation', 'reservation')
//                ->where('modeImmatriculation', $modeImmatriculation)->get();
            $getlastimmatriculation = Immatriculation::where('modeImmatriculation', $modeImmatriculation)->get();

            $reservation = Reservation::where('modeImmatriculation',$modeImmatriculation)
                ->where('reservation_id',$reservation_id)->where('status',0)->get()->first();

            if($reservation) {
                for ($i = count($getlastimmatriculation) - 1 ; $i >= 0;$i--){
                  $num = explode('-', $getlastimmatriculation[$i]->immatriculation_number)[1];
                  if(intval($num) >= intval($reservation->initial) && intval($num) <= intval($reservation->final)){
                      $getlastimmatriculation = $getlastimmatriculation[$i];
                      break;
                  }
                  else if(intval($num)  == intval($reservation->initial) - 1){
                      $getlastimmatriculation = $getlastimmatriculation[$i];
                      break;
                  }
                }
            }
          if(is_array($getlastimmatriculation)){
              $getlastimmatriculation = $getlastimmatriculation[count($getlastimmatriculation) - 1];
          }
        }

       if($getlastimmatriculation){
           $initialImmatriculation = explode('-', $getlastimmatriculation->immatriculation_number);
            $numero = 0;
            if(strlen($reservation_id) == 0){
                $reservation = Reservation::where('modeImmatriculation',$modeImmatriculation)->get()->last();

                if($reservation) {
                    if (intval($reservation->final) >= intval($initialImmatriculation[1])) {
                        $numero = intval($initialImmatriculation[1]) + (intval($reservation->final) - intval($initialImmatriculation[1])) + 1;
                    }
                    else{
                        $numero = intval($reservation->final) + (intval($initialImmatriculation[1]) - intval($reservation->final)) + 1;
                    }
                }
                else
                  $numero = intval($initialImmatriculation[1]) + 1;
           }
           else {
//               $reservation = Reservation::where('modeImmatriculation',$modeImmatriculation)
//                   ->where('reservation_id',$reservation_id)->where('status',0)->get()->first();

               if(intval($reservation->initial) == intval($initialImmatriculation[1]) + 1){
                  $numero = intval($initialImmatriculation[1]) + 1;
               }
               else if(intval($reservation->initial) < intval($initialImmatriculation[1])){
                  $numero =   intval($reservation->initial) + (intval($initialImmatriculation[1]) - intval($reservation->initial)) + 1;
                  if(intval($numero) == intval($reservation->final)){
                      $reservation->status = 1;
                      $reservation->save();
                  }
               }
               else {
                   $numero =   intval($reservation->initial) + (intval($reservation->initial) - intval($initialImmatriculation[1])) + 1;
                   if(intval($numero) == intval($reservation->final)){
                       $reservation->status = 1;
                       $reservation->save();
                   }
               }
           }

            if ($numero > 0 && $numero <= 9)
                $numero = '000' . $numero;
            else if ($numero > 9 && $numero <= 99)
                $numero = '00' . $numero;
            else if ($numero > 99 && $numero <= 999)
                $numero = '0' . $numero;
            else if ($numero > 999 && $numero <= 9999)
                $numero = $numero;

            if(strlen($initialImmatriculation[2]) === 1){
                $initialalhpa = ord($initialImmatriculation[2]);
                if($initialalhpa <= 90){
                    if($numero <= 9999){
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero.'-'.chr($initialalhpa);
                    }
                    else {
                        if(ord($initialImmatriculation[2]) + 1 <= 90){
                            $numero = '0001'; $initialalhpa = ord($initialImmatriculation[2]) + 1;
                            $immaNumericAlpha = $modeImmatriculation.'-'.$numero.'-'.chr($initialalhpa);
                        }else{
                            $immaNumericAlpha = $modeImmatriculation .'-0001-AA';
                        }
                    }
                }
            }
            else if(strlen($initialImmatriculation[2]) === 2){
                $initialalhpamultipleChar =  $initialImmatriculation[2];
                if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1 <= 90 && ord($getlastimmatriculation[strlen($initialalhpamultipleChar) - 2]) <= 90){
                    if($numero <= 9999){
                        $alphaNumber = $initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2].chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1] ));
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
                    }else {
                        $numero = '0001';
                        if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) <= 90){
                            $alphaNumber = $initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2].chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1);
                            $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
                        }
                    }
                }else {
                    if($numero > 9999){
                        if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) + 1 <= 90 or ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1]) + 1 <= 90) {
                            $numero = '0001';
                            // if(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) != ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1])) {
                            $alphaNumber = chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 2]) + 1) . chr(65);
                            $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . $alphaNumber;
                            //}else{

                            //return "Controller dans la BD si ces alpha n'existe pas";
                            // }

                        }else{
                            $numero = '0001';
                            $alphaNumber = 'AAA';
                            $immaNumericAlpha = $modeImmatriculation . '-' . $numero . '-' . $alphaNumber;
                        }
                    }else{
                        $alphaNumber = chr(ord($initialalhpamultipleChar[strlen($initialalhpamultipleChar)-2]) ).$initialalhpamultipleChar[strlen($initialalhpamultipleChar) - 1];
                        $immaNumericAlpha = $modeImmatriculation.'-'.$numero. '-'.$alphaNumber;
                    }
                }

            }
       }
       else {
           $immaNumericAlpha = $modeImmatriculation . '-0001-A';
       }
       return $immaNumericAlpha;
    }

}
