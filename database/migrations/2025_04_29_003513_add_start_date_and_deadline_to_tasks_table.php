<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddStartDateAndDeadlineToTasksTable extends Migration
{
    public function up()
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->date('start_date')->nullable();   // Adds start_date column
            $table->date('deadline')->nullable();     // Adds deadline column
        });
    }

    public function down()
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('start_date');    // Removes start_date column
            $table->dropColumn('deadline');      // Removes deadline column
        });
    }
}
