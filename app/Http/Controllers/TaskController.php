<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;

class TaskController extends Controller
{
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
        $task->update($request->all());

        return response()->json($task->load('user'));
    }


    // Delete a task
    public function destroy($projectId, $taskId)
    {
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        $task->delete();

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
