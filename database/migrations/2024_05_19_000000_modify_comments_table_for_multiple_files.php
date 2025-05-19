<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'file_path', 'file_type', 'file_size']);
            $table->json('file_names')->nullable();
            $table->json('file_paths')->nullable();
            $table->json('file_types')->nullable();
            $table->json('file_sizes')->nullable();
        });
    }

    public function down()
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->string('file_name')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->dropColumn(['file_names', 'file_paths', 'file_types', 'file_sizes']);
        });
    }
};