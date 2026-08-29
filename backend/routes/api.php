<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — PratamaLab
|--------------------------------------------------------------------------
*/

// ── Public Auth Routes ────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// ── Protected Routes ──────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout']);
        Route::get('me',       [AuthController::class, 'me']);
        Route::patch('me',     [AuthController::class, 'updateProfile']);
    });

    // Workspaces
    Route::apiResource('workspaces', WorkspaceController::class);
    Route::prefix('workspaces/{workspace}')->group(function () {
        Route::get('members',              [WorkspaceController::class, 'members']);
        Route::post('members/invite',      [WorkspaceController::class, 'invite']);
        Route::delete('members/{userId}',  [WorkspaceController::class, 'removeMember']);

        // Pages
        Route::get('pages',          [PageController::class, 'index']);
        Route::post('pages',         [PageController::class, 'store']);
        Route::get('pages/archived', [PageController::class, 'archived']);
        Route::post('pages/reorder', [PageController::class, 'reorder']);
        Route::get('pages/{page}',   [PageController::class, 'show']);
        Route::patch('pages/{page}', [PageController::class, 'update']);
        Route::delete('pages/{page}',[PageController::class, 'destroy']);
        Route::post('pages/{uuid}/restore', [PageController::class, 'restore']);

        // Blocks (nested under pages)
        Route::prefix('pages/{page}/blocks')->group(function () {
            Route::get('/',        [BlockController::class, 'index']);
            Route::post('/',       [BlockController::class, 'store']);
            Route::post('bulk',    [BlockController::class, 'bulkSave']);
            Route::patch('{block}',[BlockController::class, 'update']);
            Route::delete('{block}',[BlockController::class, 'destroy']);
        });
    });
});
