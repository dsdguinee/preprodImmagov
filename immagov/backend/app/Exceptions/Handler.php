<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Requete plus grosse que post_max_size : PHP vide le formulaire, on renvoie un message lisible
        $this->renderable(function (PostTooLargeException $e, $request) {
            return response()->json([
                'success' => false,
                'status' => 413,
                'messages' => ['pieceJointe' => ['Le fichier est trop volumineux. Taille maximale autorisée : '.self::maxUploadMo().' Mo.']],
            ], 413);
        });
    }

    /**
     * Taille maximale reellement acceptee pour un fichier (en Mo) :
     * la plus petite entre la regle Laravel (10 Mo), upload_max_filesize et post_max_size de PHP.
     */
    public static function maxUploadMo()
    {
        $toMo = function ($value) {
            $value = trim((string) $value);
            $number = (float) $value;
            switch (strtoupper(substr($value, -1))) {
                case 'G': return $number * 1024;
                case 'M': return $number;
                case 'K': return $number / 1024;
                default: return $number / 1048576;
            }
        };
        $limits = array_filter([10, $toMo(ini_get('upload_max_filesize')), $toMo(ini_get('post_max_size'))], fn ($l) => $l > 0);
        return floor(min($limits) * 10) / 10;
    }
}
