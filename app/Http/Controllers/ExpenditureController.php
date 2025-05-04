<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Expenditure;
use Illuminate\Http\Request;

class ExpenditureController extends Controller
{
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);
        $expenditures = $project->expenditures()->orderBy('date', 'desc')->get();
        return response()->json($expenditures);
    }

    public function store(Request $request, $projectId)
    {
        $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:50',
            'date' => 'required|date'
        ]);

        $project = Project::findOrFail($projectId);
        
        // Calculate total expenditures
        $totalExpenditures = $project->expenditures()->sum('amount');
        $newAmount = $request->amount;

        // Check if adding this expenditure would exceed the project budget
        if (($totalExpenditures + $newAmount) > $project->budget) {
            return response()->json([
                'message' => 'Adding this expenditure would exceed the project budget.'
            ], 400);
        }

        $expenditure = $project->expenditures()->create($request->all());

        return response()->json($expenditure, 201);
    }

    public function show($projectId, $expenditureId)
    {
        $expenditure = Expenditure::where('project_id', $projectId)
            ->findOrFail($expenditureId);
        return response()->json($expenditure);
    }

    public function update(Request $request, $projectId, $expenditureId)
    {
        $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:50',
            'date' => 'required|date'
        ]);

        $project = Project::findOrFail($projectId);
        $expenditure = $project->expenditures()->findOrFail($expenditureId);

        // Calculate total expenditures excluding the current one
        $totalExpenditures = $project->expenditures()
            ->where('id', '!=', $expenditureId)
            ->sum('amount');
        $newAmount = $request->amount;

        // Check if updating this expenditure would exceed the project budget
        if (($totalExpenditures + $newAmount) > $project->budget) {
            return response()->json([
                'message' => 'Updating this expenditure would exceed the project budget.'
            ], 400);
        }

        $expenditure->update($request->all());

        return response()->json($expenditure);
    }

    public function destroy($projectId, $expenditureId)
    {
        $expenditure = Expenditure::where('project_id', $projectId)
            ->findOrFail($expenditureId);
        $expenditure->delete();

        return response()->json(['message' => 'Expenditure deleted successfully']);
    }
} 