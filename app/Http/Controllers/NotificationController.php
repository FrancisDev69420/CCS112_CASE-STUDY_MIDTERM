<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->with(['project', 'task'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);
        
        $notification->update(['read' => true]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->update(['read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function createCommentNotification($comment, $task)
    {
        $project = Project::findOrFail($task->project_id);
        $commentUser = Auth::user();

        // Create notification for project manager
        if ($project->user_id !== $commentUser->id) {
            Notification::create([
                'user_id' => $project->user_id,
                'type' => 'comment',
                'project_id' => $project->id,
                'task_id' => $task->id,
                'message' => "{$commentUser->name} commented on task '{$task->title}'",
                'data' => ['comment_id' => $comment->id]
            ]);
        }

        // Create notification for task assignee if different from commenter
        if ($task->user_id !== $commentUser->id && $task->user_id !== $project->user_id) {
            Notification::create([
                'user_id' => $task->user_id,
                'type' => 'comment',
                'project_id' => $project->id,
                'task_id' => $task->id,
                'message' => "{$commentUser->name} commented on your assigned task '{$task->title}'",
                'data' => ['comment_id' => $comment->id]
            ]);
        }
    }

    public function getUnreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function createTaskAssignmentNotification($task, $assigner)
    {
        // Only create notification if assigner is different from assignee
        if ($task->user_id !== $assigner->id) {
            Notification::create([
                'user_id' => $task->user_id,
                'type' => 'task_assignment',
                'project_id' => $task->project_id,
                'task_id' => $task->id,
                'message' => "You have been assigned to task '{$task->title}' by {$assigner->name}",
                'data' => [
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]
            ]);
        }
    }

    public function createTaskUpdateNotification($task, $updater)
    {
        $project = Project::findOrFail($task->project_id);

        // Create notification for project manager if the updater is not the manager
        if ($project->user_id !== $updater->id) {
            Notification::create([
                'user_id' => $project->user_id,
                'type' => 'task_update',
                'project_id' => $project->id,
                'task_id' => $task->id,
                'message' => "{$updater->name} updated task '{$task->title}'",
                'data' => [
                    'project_id' => $project->id,
                    'task_id' => $task->id,
                    'updater_id' => $updater->id
                ]
            ]);
        }
    }

    public function createRiskNotification($risk, $action, $user)
    {
        // Create notification for project manager if the action was taken by someone else
        if ($risk->project->user_id !== $user->id) {
            Notification::create([
                'user_id' => $risk->project->user_id,
                'type' => 'risk_' . $action,
                'project_id' => $risk->project_id,
                'message' => "{$user->name} " . ($action === 'create' ? 'identified' : ($action === 'update' ? 'updated' : 'resolved')) . " risk: {$risk->title}",
                'data' => [
                    'project_id' => $risk->project_id,
                    'risk_id' => $risk->id,
                    'actor_id' => $user->id
                ]
            ]);
        }
    }

    public function createIssueNotification($issue, $action, $user)
    {
        // Create notification for project manager if the action was taken by someone else
        if ($issue->project->user_id !== $user->id) {
            Notification::create([
                'user_id' => $issue->project->user_id,
                'type' => 'issue_' . $action,
                'project_id' => $issue->project_id,
                'message' => "{$user->name} " . ($action === 'create' ? 'reported' : ($action === 'update' ? 'updated' : 'resolved')) . " issue: {$issue->title}",
                'data' => [
                    'project_id' => $issue->project_id,
                    'issue_id' => $issue->id,
                    'actor_id' => $user->id
                ]
            ]);
        }

        // If issue is assigned to someone and they're not the one taking the action
        if ($issue->assigned_to && $issue->assigned_to !== $user->id) {
            Notification::create([
                'user_id' => $issue->assigned_to,
                'type' => 'issue_' . $action,
                'project_id' => $issue->project_id,
                'message' => "{$user->name} " . ($action === 'create' ? 'assigned you to' : ($action === 'update' ? 'updated' : 'resolved')) . " issue: {$issue->title}",
                'data' => [
                    'project_id' => $issue->project_id,
                    'issue_id' => $issue->id,
                    'actor_id' => $user->id
                ]
            ]);
        }
    }

    public function createFileNotification($file, $action, $user)
    {
        // Create notification for project manager if the action was taken by someone else
        if ($file->project->user_id !== $user->id) {
            Notification::create([
                'user_id' => $file->project->user_id,
                'type' => 'file_' . $action,
                'project_id' => $file->project_id,
                'message' => "{$user->name} " . ($action === 'upload' ? 'uploaded' : ($action === 'update' ? 'updated access for' : 'deleted')) . " file: {$file->name}",
                'data' => [
                    'project_id' => $file->project_id,
                    'file_id' => $file->id,
                    'actor_id' => $user->id
                ]
            ]);
        }

        // For file access updates, notify users who were given access
        if ($action === 'update' && $file->users) {
            foreach ($file->users as $fileUser) {
                if ($fileUser->id !== $user->id) {
                    Notification::create([
                        'user_id' => $fileUser->id,
                        'type' => 'file_access',
                        'project_id' => $file->project_id,
                        'message' => "{$user->name} granted you access to file: {$file->name}",
                        'data' => [
                            'project_id' => $file->project_id,
                            'file_id' => $file->id,
                            'actor_id' => $user->id
                        ]
                    ]);
                }
            }
        }
    }

    public function destroy($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);
        
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
