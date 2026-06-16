<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app'     => 'SmartDent API',
        'version' => '1.0.0',
        'status'  => 'running',
    ]);
});
