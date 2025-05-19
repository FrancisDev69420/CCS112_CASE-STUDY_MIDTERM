<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IssueController extends Controller
{
    public function index($projectId)
    {
        return Issue::where('project_id', $projectId)->get();
    }

    public function store(Request $request, $projectId)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'severity' => 'required|in:Minor,Major,Critical',
                'assigned_user_id' => 'required|exists:users,id',
                'status' => 'required|in:Open,In Progress,Resolved',
                'resolution_notes' => 'nullable|string',
            ]);

            $validated['project_id'] = $projectId;

            $issue = Issue::create($validated);
            return response()->json($issue, 201);
        } catch (\Exception $e) {
            Log::error('Error creating issue: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating issue'], 500);
        }
    }    public function update(Request $request, $projectId, Issue $issue)
    {
        try {
            // Verify that the issue belongs to the project
            if ($issue->project_id != $projectId) {
                return response()->json(['message' => 'Issue not found in this project'], 404);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'severity' => 'required|in:Minor,Major,Critical',
                'assigned_user_id' => 'required|exists:users,id',
                'status' => 'required|in:Open,In Progress,Resolved',
                'resolution_notes' => 'nullable|string',
            ]);

            $issue->update($validated);
            return response()->json($issue);
        } catch (\Exception $e) {
            Log::error('Error updating issue: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating issue'], 500);
        }
    }

    public function destroy($projectId, Issue $issue)
    {
        try {
            if ($issue->project_id != $projectId) {
                return response()->json(['message' => 'Issue does not belong to the specified project'], 403);
            }

            $issue->delete();
            return response()->noContent();
        } catch (\Exception $e) {
            Log::error('Error deleting issue: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting issue'], 500);
        }
    }
}
