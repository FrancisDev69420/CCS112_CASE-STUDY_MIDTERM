<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'description', 'user_id', 'budget', 'start_date', 'deadline'];

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
