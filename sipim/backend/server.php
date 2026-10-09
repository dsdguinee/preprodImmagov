<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * @package  Laravel
 * @author   Taylor Otwell <taylor@laravel.com>
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// This file allows us to emulate Apache's "mod_rewrite" functionality from the
// built-in PHP web server. This provides a convenient way to test a Laravel
// application without having installed a "real" web server software here.
if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) {
    $public = realpath(__DIR__.'/public');

    // Lancé avec « -t public » (ou php artisan serve) : le serveur PHP sert le fichier lui-même
    if (realpath($_SERVER['DOCUMENT_ROOT']) === $public) {
        return false;
    }

    // Lancé depuis la racine du projet sans « -t public » : on sert le fichier ici,
    // sinon le serveur le cherche hors de public/ et répond 404
    // public/storage est un lien vers storage/app/public (php artisan storage:link)
    $fichier = realpath($public.$uri);
    $autorise = $fichier !== false && is_file($fichier) && (
        strpos($fichier, $public.DIRECTORY_SEPARATOR) === 0 ||
        strpos($fichier, realpath(__DIR__.'/storage/app/public').DIRECTORY_SEPARATOR) === 0
    );
    if ($autorise) {
        $types = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
            'svg' => 'image/svg+xml', 'webp' => 'image/webp', 'ico' => 'image/x-icon', 'css' => 'text/css',
            'js' => 'application/javascript', 'txt' => 'text/plain', 'pdf' => 'application/pdf'];
        $extension = strtolower(pathinfo($fichier, PATHINFO_EXTENSION));
        header('Content-Type: '.($types[$extension] ?? 'application/octet-stream'));
        header('Content-Length: '.filesize($fichier));
        readfile($fichier);
        return true;
    }
}

require_once __DIR__.'/public/index.php';
