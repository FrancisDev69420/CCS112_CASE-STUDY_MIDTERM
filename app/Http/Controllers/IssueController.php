<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Auth;

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

            // Log the issue creation activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $projectId,
                'activity_type' => 'issue_created',
                'description' => "Created new issue: {$issue->title}",
                'new_values' => $issue->toArray()
            ]);

            // Create notification
            $notificationController = new NotificationController();
            $notificationController->createIssueNotification($issue, 'create', Auth::user());

            return response()->json($issue, 201);
        } catch (\Exception $e) {
            Log::error('Error creating issue: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating issue'], 500);
        }
    }    

    public function update(Request $request, $projectId, Issue $issue)
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

            $oldValues = $issue->toArray();
            $oldStatus = $issue->status;
            
            $issue->update($validated);

            // Log the issue update activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $projectId,
                'activity_type' => 'issue_updated',
                'description' => "Updated issue: {$issue->title}",
                'old_values' => $oldValues,
                'new_values' => $issue->toArray()
            ]);

            // Create notification
            $notificationController = new NotificationController();
            
            // If status changed to Resolved, use 'resolve' action, otherwise 'update'
            $action = ($oldStatus !== 'Resolved' && $issue->status === 'Resolved') ? 'resolve' : 'update';
            $notificationController->createIssueNotification($issue, $action, Auth::user());

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

            $issueCopy = clone $issue; // Create a copy before deletion for notifications

            // Log the issue deletion activity
            $activityLogController = new ActivityLogController();
            $activityLogController->store([
                'project_id' => $projectId,
                'activity_type' => 'issue_deleted',
                'description' => "Deleted issue: {$issue->title}",
                'old_values' => $issue->toArray()
            ]);

            // Create notification before deleting the issue
            $notificationController = new NotificationController();
            $notificationController->createIssueNotification($issue, 'delete', Auth::user());

            $issue->delete();
            return response()->noContent();
        } catch (\Exception $e) {
            Log::error('Error deleting issue: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting issue'], 500);
        }
    }
}
