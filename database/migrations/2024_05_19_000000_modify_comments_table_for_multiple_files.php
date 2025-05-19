<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->json('file_names')->nullable();
            $table->json('file_paths')->nullable();
            $table->json('file_types')->nullable();
            $table->json('file_sizes')->nullable();
        });
    }

    public function down()
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn(['file_names', 'file_paths', 'file_types', 'file_sizes']);
        });
    }
};