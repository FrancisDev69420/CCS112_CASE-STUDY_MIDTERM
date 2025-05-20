<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\NotificationController;

class FileController extends Controller
{
    public function index($projectId)
    {
        return File::where('project_id', $projectId)->with('uploader')->get();
    }

    public function store(Request $request, $projectId)
    {
        $request->validate([
            'file' => 'required|file',
            'access_level' => 'required|in:restricted,everyone',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $uploadedFile = $request->file('file');
        $filename = time() . '_' . str_replace(' ', '_', $uploadedFile->getClientOriginalName());
        $path = $uploadedFile->storeAs('files', $filename, 'public');

        // Verify the file was actually stored
        if (!Storage::disk('public')->exists($path)) {
            Log::error("Failed to store uploaded file: {$filename}");
            return response()->json(['message' => 'Failed to store uploaded file'], 500);
        }

        $file = File::create([
            'project_id' => $projectId,
            'name' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'access_level' => $request->access_level,
            'assigned_user_id' => $request->assigned_user_id,
            'uploader_id' => Auth::id(), // Store the uploader's ID
            'mime_type' => $uploadedFile->getMimeType(),
        ]);

        // Log the file upload activity
        $activityLogController = new ActivityLogController();
        $activityLogController->store([
            'project_id' => $projectId,
            'activity_type' => 'file_uploaded',
            'description' => "Uploaded new file: {$file->name}",
            'new_values' => $file->toArray()
        ]);

        // Create notification for file upload
        $notificationController = new NotificationController();
        $notificationController->createFileNotification($file, 'upload', Auth::user());

        return response()->json($file->load('uploader'), 201);
    }

    public function update(Request $request, $projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        // Check if user is the uploader
        if ($file->uploader_id !== Auth::id()) {
            return response()->json(['message' => 'Only the file uploader can modify access settings'], 403);
        }

        $request->validate([
            'access_level' => 'required|in:restricted,everyone',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $oldValues = $file->toArray();
        $file->update($request->only('access_level', 'assigned_user_id'));

        // Log the file update activity
        $activityLogController = new ActivityLogController();
        $activityLogController->store([
            'project_id' => $projectId,
            'activity_type' => 'file_updated',
            'description' => "Updated file access settings: {$file->name}",
            'old_values' => $oldValues,
            'new_values' => $file->toArray()
        ]);

        // Create notification for file update
        $notificationController = new NotificationController();
        $notificationController->createFileNotification($file, 'update', Auth::user());

        return response()->json($file->load('uploader'));
    }

    public function destroy($projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        // Check if user is the uploader
        if ($file->uploader_id !== Auth::id()) {
            return response()->json(['message' => 'Only the file uploader can delete this file'], 403);
        }

        $fileCopy = clone $file; // Create a copy before deletion for notifications

        // Delete the file from storage
        Storage::delete($file->path);

        // Log the file deletion activity
        $activityLogController = new ActivityLogController();
        $activityLogController->store([
            'project_id' => $projectId,
            'activity_type' => 'file_deleted',
            'description' => "Deleted file: {$file->name}",
            'old_values' => $file->toArray()
        ]);

        // Create notification for file deletion
        $notificationController = new NotificationController();
        $notificationController->createFileNotification($file, 'delete', Auth::user());

        $file->delete();

        return response()->json(null, 204);
    }
    
    public function download($projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        // Check if user has access to the file
        if ($file->access_level === 'restricted' && $file->uploader_id !== Auth::id() && 
            (!$file->assigned_user_id || $file->assigned_user_id !== Auth::id())) {
            Log::warning("Access denied to file {$file->id}: {$file->name} for user " . Auth::id());
            return response()->json(['message' => 'You do not have access to this file'], 403);
        }

        try {
            // Check if the file exists in storage first
            if (!Storage::disk('public')->exists($file->path)) {
                Log::error("File not found in storage: {$file->path}");
                
                // Update the database to mark the file as unavailable if needed
                // $file->update(['status' => 'unavailable']);
                
                return response()->json([
                    'message' => 'File not found on server. It may have been deleted or moved.',
                    'error_code' => 'file_missing'
                ], 404);
            }

            $filePath = Storage::disk('public')->path($file->path);
            
            if (!file_exists($filePath)) {
                Log::error("File exists in Storage but not in filesystem: {$filePath}");
                return response()->json([
                    'message' => 'File not found on server. The storage system may be misconfigured.',
                    'error_code' => 'storage_error'
                ], 404);
            }

            // Log successful download
            Log::info("File downloaded: {$file->name} (ID: {$file->id}) by user " . Auth::id());

            return response()->file($filePath, [
                'Content-Type' => $file->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $file->name . '"'
            ]);
        } catch (\Exception $e) {
            Log::error("File download error for {$file->path}: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Error downloading file. Please try again later or contact support.',
                'error_details' => $e->getMessage(),
                'error_code' => 'download_exception'
            ], 500);
        }
    }

    public function addMembers(Request $request, $projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $file->users()->syncWithoutDetaching($request->user_ids);

        return response()->json(['message' => 'Members added successfully', 'members' => $file->users]);
    }

    public function getMembers($projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        return response()->json($file->users);
    }

    public function removeMembers(Request $request, $projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $file->users()->detach($request->user_ids);

        return response()->json(['message' => 'Members removed successfully', 'members' => $file->users]);
    }
}
