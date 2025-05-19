<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'content',
        'user_id',
        'task_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size'
    ];

    protected $with = ['user'];  // Always load the user relationship

    // Add file URL accessor
    protected $appends = ['file_url'];

    public function getFileUrlAttribute()
    {
        return $this->file_path ? url('storage/' . $this->file_path) : null;
    }

    /**
     * Get the user that created the comment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the task that owns the comment.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
