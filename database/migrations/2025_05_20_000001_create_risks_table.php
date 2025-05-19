<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRisksTable extends Migration
{
    public function up()
    {
        Schema::create('risks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('title');
            $table->text('description');
            $table->enum('probability', ['Low', 'Medium', 'High']);
            $table->enum('impact', ['Low', 'Medium', 'High']);
            $table->text('mitigation_plan')->nullable();
            $table->enum('status', ['Identified', 'Resolved']);
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('risks');
    }
}
