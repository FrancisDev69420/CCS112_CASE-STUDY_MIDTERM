<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CommentController;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Http\Controllers\ExpenditureController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\RiskController;
use App\Http\Controllers\IssueController;

Route::middleware('auth:sanctum')->get('/users', [UserController::class, 'index']); // Fetch all users
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json($request->user());
}); // Fetch current user

// Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->delete('/logout', [AuthController::class, 'logout']);

// Dashboard Route
Route::middleware('auth:sanctum')->get('/dashboard', function (Request $request) {
    $user = $request->user();
    $projects = Project::where('user_id', $user->id)->get(); // Fetch user-specific projects

    return response()->json([
        'message' => 'Welcome ' . $user->name,
        'projects' => $projects
    ]);
});

// Member Dashboard Route
Route::middleware('auth:sanctum')->get('/Member-Dashboard', function (Request $request) {
    $user = $request->user();

    $projects = Project::whereHas('tasks', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['tasks' => function ($query) use ($user) {
            $query->where('user_id', $user->id);
        }])
        ->get();

    return response()->json([
        'message' => 'Welcome ' . $user->name,
        'projects' => $projects
    ]);
});

// Protected Routes (Requires Authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']); // Add delete route

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

    // Comment routes
    Route::get('/projects/{projectId}/tasks/{taskId}/comments', [CommentController::class, 'index']); // List all comments for a task
    Route::post('/projects/{projectId}/tasks/{taskId}/comments', [CommentController::class, 'store']); // Create a new comment
    Route::get('/projects/{projectId}/tasks/{taskId}/comments/{commentId}', [CommentController::class, 'show']); // Get a specific comment
    Route::put('/projects/{projectId}/tasks/{taskId}/comments/{commentId}', [CommentController::class, 'update']); // Update a comment
    Route::delete('/projects/{projectId}/tasks/{taskId}/comments/{commentId}', [CommentController::class, 'destroy']); // Delete a comment
    Route::get('/projects/{projectId}/tasks/{taskId}/comments/{commentId}/download', [CommentController::class, 'downloadFile']); // Download comment attachment

    // Activity Log Routes
    Route::get('/activities', [ActivityLogController::class, 'index']);
    Route::get('/projects/{project}/activities', [ActivityLogController::class, 'index']);
    Route::get('/tasks/{task}/activities', [ActivityLogController::class, 'index']);

    // Risk and Issue Routes
    Route::prefix('projects/{projectId}')->group(function () {
        // Risk Routes
        Route::get('risks', [RiskController::class, 'index']);
        Route::post('risks', [RiskController::class, 'store']);
        Route::put('risks/{risk}', [RiskController::class, 'update']);
        Route::delete('risks/{risk}', [RiskController::class, 'destroy']);

        // Issue Routes
        Route::get('issues', [IssueController::class, 'index']);
        Route::post('issues', [IssueController::class, 'store']);
        Route::put('issues/{issue}', [IssueController::class, 'update']);
        Route::delete('issues/{issue}', [IssueController::class, 'destroy']);
    });
});

// Public download route for comment attachments (must be outside auth:sanctum)
Route::get('/projects/{projectId}/tasks/{taskId}/comments/{commentId}/download/{fileIndex}', [CommentController::class, 'downloadFile']);

// Expenditure routes
Route::get('/projects/{projectId}/expenditures', [ExpenditureController::class, 'index']);
Route::post('/projects/{projectId}/expenditures', [ExpenditureController::class, 'store']);
Route::get('/projects/{projectId}/expenditures/{expenditureId}', [ExpenditureController::class, 'show']);
Route::put('/projects/{projectId}/expenditures/{expenditureId}', [ExpenditureController::class, 'update']);
Route::delete('/projects/{projectId}/expenditures/{expenditureId}', [ExpenditureController::class, 'destroy']);

