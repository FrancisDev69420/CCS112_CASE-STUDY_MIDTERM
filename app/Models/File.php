<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'path',
        'access_level',
        'assigned_user_id',
        'uploader_id',
        'mime_type',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'file_user', 'file_id', 'user_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
