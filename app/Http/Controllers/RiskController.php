<?php

namespace App\Http\Controllers;

use App\Models\Risk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RiskController extends Controller
{
    public function index($projectId)
    {
        return Risk::where('project_id', $projectId)->get();
    }

    public function store(Request $request, $projectId)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'probability' => 'required|in:Low,Medium,High',
                'impact' => 'required|in:Low,Medium,High',
                'mitigation_plan' => 'nullable|string',
                'status' => 'required|in:Identified,Resolved',
            ]);

            $validated['project_id'] = $projectId;

            $risk = Risk::create($validated);
            return response()->json($risk, 201);
        } catch (\Exception $e) {
            Log::error('Error creating risk: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating risk'], 500);
        }
    }

    public function update(Request $request, $projectId, Risk $risk)
    {
        try {
            // Verify that the risk belongs to the project
            if ($risk->project_id != $projectId) {
                return response()->json(['message' => 'Risk not found in this project'], 404);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'probability' => 'required|in:Low,Medium,High',
                'impact' => 'required|in:Low,Medium,High',
                'mitigation_plan' => 'nullable|string',
                'status' => 'required|in:Identified,Resolved',
            ]);

            $risk->update($validated);
            return response()->json($risk);
        } catch (\Exception $e) {
            Log::error('Error updating risk: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating risk'], 500);
        }
    }

    public function destroy($projectId, Risk $risk)
    {
        try {
            if ($risk->project_id != $projectId) {
                return response()->json(['message' => 'Risk does not belong to the specified project'], 403);
            }

            $risk->delete();
            return response()->noContent();
        } catch (\Exception $e) {
            Log::error('Error deleting risk: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting risk'], 500);
        }
    }
}
