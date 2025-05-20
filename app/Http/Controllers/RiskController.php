<?php

namespace App\Http\Controllers;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\NotificationController;
use App\Models\Risk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;


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

            // Log the risk creation activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $projectId,
                'activity_type' => 'risk_created',
                'description' => "Created new risk: {$risk->title}",
                'new_values' => $risk->toArray()
            ]);

            // Create notification
            $notificationController = new NotificationController();
            $notificationController->createRiskNotification($risk, 'create', Auth::user());

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

            $oldValues = $risk->toArray();
            $oldStatus = $risk->status;
            
            $risk->update($validated);

            // Log the risk update activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $projectId,
                'activity_type' => 'risk_updated',
                'description' => "Updated risk: {$risk->title}",
                'old_values' => $oldValues,
                'new_values' => $risk->toArray()
            ]);

            // Create notification
            $notificationController = new NotificationController();
            
            // If status changed to Resolved, use 'resolve' action, otherwise 'update'
            $action = ($oldStatus !== 'Resolved' && $risk->status === 'Resolved') ? 'resolve' : 'update';
            $notificationController->createRiskNotification($risk, $action, Auth::user());

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

            $riskCopy = clone $risk; // Create a copy before deletion for notifications

            // Log the risk deletion activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $projectId,
                'activity_type' => 'risk_deleted',
                'description' => "Deleted risk: {$risk->title}",
                'old_values' => $risk->toArray()
            ]);

            // Create notification before deleting the risk
            $notificationController = new NotificationController();
            $notificationController->createRiskNotification($risk, 'delete', Auth::user());

            $risk->delete();
            return response()->noContent();
        } catch (\Exception $e) {
            Log::error('Error deleting risk: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting risk'], 500);
        }
    }
}
