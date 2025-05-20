<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Http\Controllers\ActivityLogController;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(Project::all());
    }

    public function store(Request $request)
    {
        try {
            // Validate incoming request including start_date and deadline
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'user_id' => 'required|exists:users,id',
                'budget' => 'required|numeric|min:0',
                'start_date' => 'nullable|date',
                'deadline' => 'nullable|date',
            ]);

            // Create the project with all the validated data
            $project = Project::create($request->all());

            // Log the project creation activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $project->id,
                'activity_type' => 'project_created',
                'description' => "Created new project: {$project->title}",
                'new_values' => $project->toArray()
            ]);

            return response()->json($project, 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $project = Project::with('tasks')->findOrFail($id);
        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        try {
            $project = Project::findOrFail($id);
            $oldValues = $project->toArray();

            // Validate the request before updating
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'user_id' => 'required|exists:users,id',
                'budget' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date',
                'deadline' => 'nullable|date',
            ]);

            // Update the project with the new data
            $project->update($request->all());

            // Log the project update activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $project->id,
                'activity_type' => 'project_updated',
                'description' => "Updated project: {$project->title}",
                'old_values' => $oldValues,
                'new_values' => $project->toArray()
            ]);

            return response()->json($project);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $project = Project::findOrFail($id);
            $projectDetails = $project->toArray();
            
            // Store activity log before deleting
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $id,
                'activity_type' => 'project_deleted',
                'description' => "Deleted project: {$project->title}",
                'old_values' => $projectDetails
            ]);

            $project->delete();
            return response()->json(['message' => 'Project deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
