<?php

namespace App\Http\Controllers\API\Evalidator;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoginController extends Controller
{
    public function fnauthentication(Request $request)
    {
        $messages = [
            'username.required' => 'Le nom d\'utilisateur est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.'
        ];
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password'=> 'required'
        ],$messages);
        try {
            if ($validator->fails()) {
                return response()->json(['success' => false, 'status' => Response::HTTP_NON_AUTHORITATIVE_INFORMATION, 'messages' => $validator->errors()],Response::HTTP_NON_AUTHORITATIVE_INFORMATION);
            }
            $fieldType = filter_var($request->username, FILTER_VALIDATE_EMAIL) ? 'email' : 'telephone';
            $token = JWTAuth::attempt(array($fieldType => $request->username, 'password' => $request->password));
            if (!$token) {
                return response()
                    ->json(['messages' => ['erreur' => 'Information de connexion Incorrecte.'],'status' => Response::HTTP_UNAUTHORIZED],Response::HTTP_UNAUTHORIZED);
            }

            $user = User::where($fieldType, $request->username)->where('status','1')->get()->first();

            if($user){
                return response()->json(['success' => true,'status' => Response::HTTP_OK,'token' => $token,'messages' => ['success' => 'Connexion reussie.']],Response::HTTP_OK);
            }else{
                Auth::guard()->logout();
                return response()->json(['success' => false, 'status' => Response::HTTP_NON_AUTHORITATIVE_INFORMATION, 'messages' => ['error' => 'Compte non activé.']],Response::HTTP_NON_AUTHORITATIVE_INFORMATION);
            }


        }
        catch (JWTException $e) {
            return response()->json(['success' => false,'status'=>401,'messages' => ['errors' => $e->getMessage()]]);
        }
    }
}
