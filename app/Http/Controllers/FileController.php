<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FileController extends Controller
{
    public function index($projectId)
    {
        return File::where('project_id', $projectId)->get();
    }

    public function store(Request $request, $projectId)
    {
        $request->validate([
            'file' => 'required|file',
            'access_level' => 'required|in:restricted,everyone',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $path = $request->file('file')->store('files');

        $file = File::create([
            'project_id' => $projectId,
            'name' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'access_level' => $request->access_level,
            'assigned_user_id' => $request->assigned_user_id,
        ]);

        return response()->json($file, 201);
    }

    public function update(Request $request, $projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        $request->validate([
            'access_level' => 'required|in:restricted,everyone',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $file->update($request->only('access_level', 'assigned_user_id'));

        return response()->json($file);
    }

    public function destroy($projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        Storage::delete($file->path);
        $file->delete();

        return response()->noContent();
    }

    public function download($projectId, File $file)
    {
        if ($file->project_id != $projectId) {
            return response()->json(['message' => 'File does not belong to the specified project'], 403);
        }

        return Storage::download($file->path, $file->name);
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
