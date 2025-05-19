<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Risk extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'probability',
        'impact',
        'mitigation_plan',
        'status',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
