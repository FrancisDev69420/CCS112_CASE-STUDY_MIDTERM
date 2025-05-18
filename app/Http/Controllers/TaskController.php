<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ActivityLogController;

class TaskController extends Controller
{
    protected $activityLogController;

    public function __construct(ActivityLogController $activityLogController)
    {
        $this->activityLogController = $activityLogController;
    }

    // Fetch all tasks for a specific project with user details
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);
        $tasks = $project->tasks()->with('user')->get(); // Eager load user
        return response()->json($tasks);
    }

    // Store a new task in the project
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,in progress,completed',
            'priority' => 'nullable|in:low,medium,high',
            'user_id' => [
                'nullable',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($user && $user->role !== 'Team Member') {
                        $fail('Only Team Members can be assigned to tasks.');
                    }
                }
            ],
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
        ]);

        $project = Project::findOrFail($projectId);
        $task = new Task($request->all());
        $task->project_id = $projectId;
        $task->save();

        // Log activity
        $this->activityLogController->store([
            'project_id' => $projectId,
            'task_id' => $task->id,
            'activity_type' => 'task_created',
            'description' => "Created new task: {$task->title}",
            'new_values' => $task->toArray()
        ]);

        // Create notification if a team member is assigned
        if ($task->user_id) {
            $notificationController = new NotificationController();
            $notificationController->createTaskAssignmentNotification($task, Auth::user());
        }

        return response()->json($task->load('user'), 201);
    }


    // Show a single task with user info
    public function show($projectId, $taskId)
    {
        $task = Task::where('project_id', $projectId)
                    ->where('id', $taskId)
                    ->with('user')
                    ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        return response()->json($task);
    }

    // Update an existing task and return with user
    public function update(Request $request, $projectId, $taskId)
    {
        $request->validate([
            'user_id' => [
                'nullable',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($user && $user->role !== 'Team Member') {
                        $fail('Only Team Members can be assigned to tasks.');
                    }
                }
            ],
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
        ]);

        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        $oldUserId = $task->user_id;
        
        $oldValues = $task->toArray();
        
        $task->fill($request->all());
        $task->save();

        // Log activity
        $this->activityLogController->store([
            'project_id' => $projectId,
            'task_id' => $taskId,
            'activity_type' => 'task_updated',
            'description' => "Updated task: {$task->title}",
            'old_values' => $oldValues,
            'new_values' => $task->toArray()
        ]);

        // Create notification for task update
        $notificationController = new NotificationController();
        $notificationController->createTaskUpdateNotification($task, Auth::user());

        // Create notification if a team member is assigned or changed
        if ($task->user_id && $task->user_id !== $oldUserId) {
            $notificationController = new NotificationController();
            $notificationController->createTaskAssignmentNotification($task, Auth::user());
        }

        return response()->json($task->load('user'));
    }


    // Delete a task
    public function destroy($projectId, $taskId)
    {
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        
        $taskDetails = $task->toArray();
        $task->delete();

        // Log activity
        $this->activityLogController->store([
            'project_id' => $projectId,
            'activity_type' => 'task_deleted',
            'description' => "Deleted task: {$task->title}",
            'old_values' => $taskDetails
        ]);

        return response()->json(['message' => 'Task deleted successfully']);
    }

    protected function updateRemainingBudget($projectId)
    {
        $project = Project::findOrFail($projectId);

        // Calculate total allocated budget for the project
        $totalAllocated = Task::where('project_id', $projectId)->sum('allocated_budget');

        // Calculate remaining budget
        $remainingBudget = $project->budget - $totalAllocated;

        // Update the remaining_budget field
        $project->remaining_budget = $remainingBudget;
        $project->save();
    }

}
