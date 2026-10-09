<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Database\QueryException;

class MenuController extends Controller
{
   public function getallmenus(){
    try
    {
      $menus = Menu::orderBy('menu_id')->get();
      return response()->json(['success' => true,'menus' => $menus]);
    }
    catch (QueryException $ex){
        return response()->json(['success' => false,'messages' => $ex->getMessage()]);
    }
   }
}
