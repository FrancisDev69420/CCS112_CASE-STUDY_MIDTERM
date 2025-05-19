<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'content',
        'user_id',
        'task_id',
        'file_names',
        'file_paths',
        'file_types',
        'file_sizes'
    ];

    protected $with = ['user'];  // Always load the user relationship

    // Add file URL accessor
    protected $appends = ['file_urls'];

    // Max file size in bytes (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Allowed file types
    const ALLOWED_FILE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    protected $casts = [
        'file_names' => 'array',
        'file_paths' => 'array',
        'file_types' => 'array',
        'file_sizes' => 'array',
    ];

    public function getFileUrlsAttribute()
    {
        if (!$this->file_paths) return [];
        return array_map(function($path) {
            return url('storage/' . $path);
        }, $this->file_paths);
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
