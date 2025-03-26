<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Http\Request;
use App\Models\Project;

// Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->delete('/logout', [AuthController::class, 'logout']);

// Dashboard Route
Route::middleware('auth:sanctum')->get('/dashboard', function (Request $request) {
    $user = $request->user();
    $projects = Project::where('user_id', $user->id)->get(); // Fetch user-specific projects

    return response()->json([
        'message' => 'Welcome' . $user->name,
        'projects' => $projects
    ]);
});

// Protected Routes (Requires Authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Project Routes
    Route::get('/projects', [ProjectController::class, 'index']);  // List all projects
    Route::post('/projects', [ProjectController::class, 'store']); // Create a new project
    Route::get('/projects/{id}', [ProjectController::class, 'show']); // Get a single project
    Route::put('/projects/{id}', [ProjectController::class, 'update']); // Update a project
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']); // Delete a project
    
    // Tasks (Related to a Specific Project)
    Route::get('/projects/{projectId}/tasks', [TaskController::class, 'index']); // List tasks for a project
    Route::post('/projects/{projectId}/tasks', [TaskController::class, 'store']); // Add a new task to a project
    Route::get('/projects/{projectId}/tasks/{taskId}', [TaskController::class, 'show']); // Get a single task
    Route::put('/projects/{projectId}/tasks/{taskId}', [TaskController::class, 'update']); // Update a task
    Route::delete('/projects/{projectId}/tasks/{taskId}', [TaskController::class, 'destroy']); // Delete a task
});
