<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\NotificationController;

class CommentController extends Controller
{    
    
    public function index($projectId, $taskId)
    {
        // Validate task belongs to project and get comments for that task
        $task = Task::where('project_id', $projectId)
            ->with(['comments.user:id,name,role']) // Eager load comments with their users and roles
            ->findOrFail($taskId);

        return response()->json($task->comments);
    }

    public function store(Request $request, $projectId, $taskId)
    {
        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)
            ->findOrFail($taskId);

        $request->validate([
            'content' => 'required|string|max:255',
        ]);        $comment = new Comment([
            'content' => $request->content,
            'user_id' => Auth::id(), // Use authenticated user's ID through Auth facade
            'task_id' => $taskId
        ]);
          $comment->save();
        
        // Create notifications for project manager and task assignee
        $notificationController = new NotificationController();
        $notificationController->createCommentNotification($comment, $task);
        
        return response()->json($comment->load('user:id,name'), 201);
    }    
    
    public function show($projectId, $taskId, $commentId)
    {
        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        $comment = Comment::where('task_id', $taskId)->findOrFail($commentId);
        return response()->json($comment->load('user:id,name,role'));
    }

    public function update(Request $request, $projectId, $taskId, $commentId)
    {
        $request->validate([
            'content' => 'required|string|max:255'
        ]);

        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        
        $comment = Comment::where('task_id', $taskId)
            ->where('user_id', Auth::id()) // Only allow updating own comments
            ->findOrFail($commentId);

        $comment->update(['content' => $request->content]);

        return response()->json($comment->load('user:id,name,role'));
    }   
    
    public function destroy($projectId, $taskId, $commentId)
    {
        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        
        $comment = Comment::where('task_id', $taskId)
            ->where('user_id', Auth::id()) // Only allow deleting own comments
            ->findOrFail($commentId);
            
        $comment->delete();

        return response()->json(null, 204);
    }

}

