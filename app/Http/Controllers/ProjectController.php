<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;

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
                'user_id' => 'required|exists:users,id', // Ensure the user exists
                'budget' => 'required|numeric|min:0',
                'start_date' => 'nullable|date', // Validating start_date as a date
                'deadline' => 'nullable|date',   // Validating deadline as a date
            ]);

            // Create the project with all the validated data
            $project = Project::create($request->all());
            return response()->json($project, 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        try {
            $project = Project::findOrFail($id);

            // Validate the request before updating
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'user_id' => 'required|exists:users,id', // Ensure the user exists
                'budget' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date', // Validating start_date as a date
                'deadline' => 'nullable|date',   // Validating deadline as a date
            ]);

            // Update the project with the new data
            $project->update($request->all());
            return response()->json($project);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Project::findOrFail($id)->delete();
            return response()->json(['message' => 'Project deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
