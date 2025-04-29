<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->date('start_date')->nullable();  // Adding start_date as nullable date
            $table->date('deadline')->nullable();    // Adding deadline as nullable date
        });
    }

    /**
     * Reverse the migrations.
     */
   public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'deadline']);
        });
    }
};
