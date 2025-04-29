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
            'allocated_budget' => 'nullable|numeric|min:0',
            'actual_spent' => 'nullable|numeric|min:0',
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
        ]);

        $project = Project::findOrFail($projectId);
        $totalAllocated = Task::where('project_id', $projectId)->sum('allocated_budget'); // Sum of already allocated budgets
        $newAllocation = $request->allocated_budget ?? 0; // Default to 0 if not provided

        // Check if allocated budget exceeds the project budget
        if (($totalAllocated + $newAllocation) > $project->budget) {
            return response()->json(['error' => 'Budget allocation exceeds project total budget.'], 400);
        }

        $task = new Task($request->all());
        $task->project_id = $projectId;

        // Ensure that actual_spent does not exceed allocated_budget
        if ($task->actual_spent > $task->allocated_budget) {
            return response()->json(['error' => 'Actual spent cannot exceed allocated budget.'], 400);
        }

        $task->save();

        // Update the remaining_budget after the task is saved
        $this->updateRemainingBudget($projectId);

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
            'allocated_budget' => 'nullable|numeric|min:0',
            'actual_spent' => 'nullable|numeric|min:0',
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
        ]);

        $task = Task::where('project_id', $projectId)->findOrFail($taskId);

        // Calculate total allocation excluding this task
        $totalAllocated = Task::where('project_id', $projectId)
                                ->where('id', '!=', $taskId)
                                ->sum('allocated_budget');

        $newAllocation = $request->allocated_budget ?? $task->allocated_budget;

        // Check if allocated budget exceeds the project budget
        if (($totalAllocated + $newAllocation) > $task->project->budget) {
            return response()->json(['error' => 'Budget allocation exceeds project total budget.'], 400);
        }

        $task->update($request->all());

        // Ensure that actual_spent does not exceed allocated_budget
        if ($task->actual_spent > $task->allocated_budget) {
            return response()->json(['error' => 'Actual spent cannot exceed allocated budget.'], 400);
        }

        // Update the remaining_budget after the task is updated
        $this->updateRemainingBudget($projectId);

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
