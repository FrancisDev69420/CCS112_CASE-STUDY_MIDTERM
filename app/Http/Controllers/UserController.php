<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Fetch all users
    public function index()
    {
        $users = User::all(); // Retrieve all users
        return response()->json($users);
    }

    // Fetch team members by project
    public function getTeamMembers($projectId)
    {
        $teamMembers = User::where('role', 'Team Member')->get(); // Filter users by role
        return response()->json($teamMembers);
    }
}

