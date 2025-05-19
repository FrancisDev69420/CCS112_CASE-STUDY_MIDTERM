<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Storage;

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
            'file' => 'nullable|file|max:10240', // Max 10MB file size
        ]);

        $comment = new Comment([
            'content' => $request->content,
            'user_id' => Auth::id(),
            'task_id' => $taskId
        ]);

        // Handle file upload if present
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('comment-attachments', 'public');
            
            $comment->file_name = $fileName;
            $comment->file_path = $filePath;
            $comment->file_type = $file->getMimeType();
            $comment->file_size = $file->getSize();
        }

        $comment->save();
        
        // Create notifications for project manager and task assignee
        $notificationController = new NotificationController();
        $notificationController->createCommentNotification($comment, $task);
        
        return response()->json($comment->load('user:id,name,role'), 201);
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
            'content' => 'required|string|max:255',
            'file' => 'nullable|file|max:10240', // Max 10MB file size
        ]);

        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        
        $comment = Comment::where('task_id', $taskId)
            ->where('user_id', Auth::id()) // Only allow updating own comments
            ->findOrFail($commentId);

        $comment->content = $request->content;

        // Handle file upload if present
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($comment->file_path) {
                Storage::disk('public')->delete($comment->file_path);
            }

            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('comment-attachments', 'public');
            
            $comment->file_name = $fileName;
            $comment->file_path = $filePath;
            $comment->file_type = $file->getMimeType();
            $comment->file_size = $file->getSize();
        }

        $comment->save();

        return response()->json($comment->load('user:id,name,role'));
    }   
    
    public function destroy($projectId, $taskId, $commentId)
    {
        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        
        $comment = Comment::where('task_id', $taskId)
            ->where('user_id', Auth::id()) // Only allow deleting own comments
            ->findOrFail($commentId);
            
        // Delete associated file if exists
        if ($comment->file_path) {
            Storage::disk('public')->delete($comment->file_path);
        }

        $comment->delete();

        return response()->json(null, 204);
    }

    public function downloadFile($projectId, $taskId, $commentId)
    {
        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        $comment = Comment::where('task_id', $taskId)->findOrFail($commentId);

        if (!$comment->file_path) {
            return response()->json(['error' => 'No file attached to this comment'], 404);
        }

        return Storage::disk('public')->download($comment->file_path, $comment->file_name);
    }
}

