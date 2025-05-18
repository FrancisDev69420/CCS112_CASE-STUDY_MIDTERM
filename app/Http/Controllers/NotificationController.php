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

    public function destroy($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);
        
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
