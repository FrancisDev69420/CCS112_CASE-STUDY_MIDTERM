<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'description', 'user_id', 'budget', 'start_date', 'deadline'];

    protected $appends = ['remaining_budget'];

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function expenditures()
    {
        return $this->hasMany(Expenditure::class);
    }

    public function getRemainingBudgetAttribute()
    {
        $expenditures = $this->expenditures()->sum('amount');
        return $this->budget - $expenditures;
    }
}
