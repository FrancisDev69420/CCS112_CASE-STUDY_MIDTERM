<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = ActivityLog::with([
            'user:id,name,email', 
            'project:id,title',
            'task:id,title,status'
        ])->orderBy('created_at', 'desc');

        // If user is a team member, only show activities related to their tasks
        if ($user->role === 'Team Member') {
            $query->whereHas('project.tasks', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orWhereHas('task', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        // Filter by project if project_id is provided
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by task if task_id is provided
        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        $activities = $query->paginate(20);
        return response()->json($activities);
    }

    public function store($data)
    {
        $activityLog = ActivityLog::create([
            'user_id' => Auth::id(),
            'project_id' => $data['project_id'] ?? null,
            'task_id' => $data['task_id'] ?? null,
            'activity_type' => $data['activity_type'],
            'description' => $data['description'],
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null
        ]);

        return $activityLog;
    }

}
