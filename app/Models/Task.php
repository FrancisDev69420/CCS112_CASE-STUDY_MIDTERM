<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'description', 'status', 'priority', 'project_id', 'user_id', 'start_date', 'deadline'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // app/Models/Task.php
    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
