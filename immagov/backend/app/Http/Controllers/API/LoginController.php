<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $messages = [
            'login.required' => 'Le téléphone ou l\'email est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.'
        ];
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
            'password'=> 'required'
        ],$messages);
        if ($validator->fails()) {
            return response()->json(['success' => false,'status'=> 400,'messages' => $validator->errors()]);
        }
        $login = trim($request->input('login'));
        $fieldType = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'telephone';
        $credentials = [$fieldType => $login, 'password' => $request->input('password')];
        $user = User::where($fieldType,$login)->get()->first();
        try {
            if($user) {
                $role = Role::find($user->role_id);
                $isAuthenticationAutorized = $role->status == 1 ? true:false;
                if ($isAuthenticationAutorized && $user->statusCnx == 1) {
                    if (!$token = JWTAuth::attempt($credentials)) {
                        return response()->json(['success' => false, 'status' => 401, 'messages' => ['errors' => 'Information de connexion Incorrect.']]);
                    }
                } else {
                    return response()->json(['success' => false, 'status' => 401, 'messages' => ['errors' => 'Connexion non autorisée.']]);
                }
            }else{
                return response()->json(['success' => false, 'status' => 402, 'messages' => ['errors' => 'Information de connexion Incorrect.']]);
            }
        } catch (JWTException $e) {
            return response()->json(['success' => false,'status'=>401,'messages' => ['errors' => 'Information de connexion Incorrect.']]);
        }
       // $user->nbreCnx = intval($user->nbreCnx) + 1;
        $user->save();
        return response()->json(['success' => true,'status' => 200,'nbreCnx' => $user->nbreCnx,'token' => $token,'messages' => ['success' => 'Connexion reussie.']]);
    }
    public function logout(Request $request)
    {
        try {
            $user = auth('api')->user();

            if( $user ){
                JWTAuth::invalidate(JWTAuth::getToken());
                return response()->json([
                    "success" => true,
                    "messages"=> ["erreur" => "User successfully logged out."]
                ]);
            }else{
                return response()->json([
                    "success" => false,
                    "messages"=> ["erreur" => "Not loggin"]]);
            }

        } catch (JWTException $e) {
            // something went wrong whilst attempting to encode the token
            return response()->json([
                "success" => false,
                "message" => ["erreur" => "Failed to logout, please try again."]
            ], 500);
        }
    }



}
