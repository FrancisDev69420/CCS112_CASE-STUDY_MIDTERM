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
            'content' => 'required_without:files|nullable|string|max:255',
            'files' => 'required_without:content|array',
            'files.*' => 'file|max:10240', // Max 10MB per file
        ]);

        $comment = new Comment([
            'content' => $request->content ?? '',
            'user_id' => Auth::id(),
            'task_id' => $taskId
        ]);

        $fileNames = [];
        $filePaths = [];
        $fileTypes = [];
        $fileSizes = [];

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                if ($file->isValid()) {
                    $fileName = $file->getClientOriginalName();
                    $filePath = $file->store('comment-attachments', 'public');
                    $fileNames[] = $fileName;
                    $filePaths[] = $filePath;
                    $fileTypes[] = $file->getMimeType();
                    $fileSizes[] = $file->getSize();
                }
            }
        }

        if (count($fileNames)) {
            $comment->file_names = $fileNames;
            $comment->file_paths = $filePaths;
            $comment->file_types = $fileTypes;
            $comment->file_sizes = $fileSizes;
        }

        $comment->save();
        
        // Create notifications
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
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240', // Max 10MB per file
        ]);

        // Validate task belongs to project
        $task = Task::where('project_id', $projectId)->findOrFail($taskId);
        
        $comment = Comment::where('task_id', $taskId)
            ->where('user_id', Auth::id()) // Only allow updating own comments
            ->findOrFail($commentId);

        $comment->content = $request->content;

        // Handle file upload if present
        if ($request->hasFile('files')) {
            // Delete old files if exists
            if ($comment->file_paths) {
                foreach (json_decode($comment->file_paths) as $path) {
                    Storage::disk('public')->delete($path);
                }
            }

            $fileNames = [];
            $filePaths = [];
            $fileTypes = [];
            $fileSizes = [];

            foreach ($request->file('files') as $file) {
                if ($file->isValid()) {
                    $fileName = $file->getClientOriginalName();
                    $filePath = $file->store('comment-attachments', 'public');
                    $fileNames[] = $fileName;
                    $filePaths[] = $filePath;
                    $fileTypes[] = $file->getMimeType();
                    $fileSizes[] = $file->getSize();
                }
            }

            if (count($fileNames)) {
                $comment->file_names = $fileNames;
                $comment->file_paths = $filePaths;
                $comment->file_types = $fileTypes;
                $comment->file_sizes = $fileSizes;
            }
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
            
        // Delete associated files if exist (handle arrays)
        if ($comment->file_paths) {
            $paths = is_array($comment->file_paths) ? $comment->file_paths : json_decode($comment->file_paths, true);
            if (is_array($paths)) {
                foreach ($paths as $path) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $comment->delete();

        return response()->json(null, 204);
    }

    public function downloadFile($taskId, $commentId, $fileIndex)
    {
        $comment = Comment::where('task_id', $taskId)->findOrFail($commentId);

        $paths = is_array($comment->file_paths) ? $comment->file_paths : json_decode($comment->file_paths, true);
        $names = is_array($comment->file_names) ? $comment->file_names : json_decode($comment->file_names, true);

        if (!is_array($paths) || !isset($paths[$fileIndex]) || !is_array($names) || !isset($names[$fileIndex])) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $filePath = Storage::disk('public')->path($paths[$fileIndex]);
        return response()->download($filePath, $names[$fileIndex]);
    }
}

