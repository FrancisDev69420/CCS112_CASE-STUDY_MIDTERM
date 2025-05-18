<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Users
        $users = [
            [
                'name' => 'asd',
                'email' => 'asd@asd',
                'email_verified_at' => now(),
                'password' => bcrypt('asdasdasd'),
                'remember_token' => Str::random(10),
                'role' => 'Project Manager',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Emma Wilson',
                'email' => 'emma.wilson@example.com',
                'email_verified_at' => now(),
                'password' => bcrypt('password123'),
                'remember_token' => Str::random(10),
                'role' => 'Team Member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'michael.brown@example.com',
                'email_verified_at' => now(),
                'password' => bcrypt('password123'),
                'remember_token' => Str::random(10),
                'role' => 'Team Member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@example.com',
                'email_verified_at' => now(),
                'password' => bcrypt('password123'),
                'remember_token' => Str::random(10),
                'role' => 'Project Manager',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'David Lee',
                'email' => 'david.lee@example.com',
                'email_verified_at' => now(),
                'password' => bcrypt('password123'),
                'remember_token' => Str::random(10),
                'role' => 'Team Member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }

        // Create Projects
        $projects = [
            [
                'title' => 'E-commerce Platform',
                'description' => 'Develop a full-featured e-commerce platform',
                'user_id' => 1,
                'budget' => 50000,
                'start_date' => '2025-06-01',
                'deadline' => '2025-12-31',
                'remaining_budget' => 45000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Mobile App Development',
                'description' => 'Create a mobile app for inventory management',
                'user_id' => 1,
                'budget' => 30000,
                'start_date' => '2025-07-01',
                'deadline' => '2025-11-30',
                'remaining_budget' => 28000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'CRM System',
                'description' => 'Develop a customer relationship management system',
                'user_id' => 1,
                'budget' => 40000,
                'start_date' => '2025-08-01',
                'deadline' => '2025-12-15',
                'remaining_budget' => 40000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Analytics Dashboard',
                'description' => 'Create a real-time analytics dashboard',
                'user_id' => 1,
                'budget' => 25000,
                'start_date' => '2025-09-01',
                'deadline' => '2025-11-15',
                'remaining_budget' => 25000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'HR Management System',
                'description' => 'Build an HR management platform',
                'user_id' => 1,
                'budget' => 35000,
                'start_date' => '2025-07-15',
                'deadline' => '2025-12-01',
                'remaining_budget' => 35000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($projects as $projectData) {
            Project::create($projectData);
        }

        // Create Tasks
        $tasks = [
            [
                'title' => 'Database Design',
                'description' => 'Create database schema for the e-commerce platform',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 3,
                'start_date' => '2025-06-01',
                'deadline' => '2025-06-15',
                'estimated_hours' => 40,
                'actual_hours' => 35,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'User Authentication',
                'description' => 'Implement user authentication system',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 2,
                'start_date' => '2025-06-16',
                'deadline' => '2025-06-30',
                'estimated_hours' => 30,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Frontend Development',
                'description' => 'Implement responsive UI design',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'medium',
                'user_id' => 2,
                'start_date' => '2025-07-01',
                'deadline' => '2025-07-30',
                'estimated_hours' => 60,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'API Integration',
                'description' => 'Integrate third-party payment APIs',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 3,
                'start_date' => '2025-07-15',
                'deadline' => '2025-08-15',
                'estimated_hours' => 45,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Database Optimization',
                'description' => 'Optimize database queries and indexes',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'medium',
                'user_id' => 5,
                'start_date' => '2025-07-01',
                'deadline' => '2025-07-15',
                'estimated_hours' => 20,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'User Interface Design',
                'description' => 'Design mobile app UI/UX',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 2,
                'start_date' => '2025-07-15',
                'deadline' => '2025-08-15',
                'estimated_hours' => 50,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Customer Dashboard',
                'description' => 'Implement customer dashboard features',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 3,
                'start_date' => '2025-08-01',
                'deadline' => '2025-09-01',
                'estimated_hours' => 40,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Report Generation',
                'description' => 'Create automated reporting system',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'medium',
                'user_id' => 5,
                'start_date' => '2025-09-15',
                'deadline' => '2025-10-15',
                'estimated_hours' => 35,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Employee Portal',
                'description' => 'Develop employee self-service portal',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 2,
                'start_date' => '2025-07-15',
                'deadline' => '2025-08-30',
                'estimated_hours' => 55,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'System Testing',
                'description' => 'Conduct comprehensive system testing',
                'project_id' => 1,
                'status' => 'pending',
                'priority' => 'high',
                'user_id' => 3,
                'start_date' => '2025-09-01',
                'deadline' => '2025-09-30',
                'estimated_hours' => 40,
                'actual_hours' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($tasks as $taskData) {
            Task::create($taskData);
        }
    }
}
