<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Page;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo user
        $user = User::create([
            'name'     => 'Demo User',
            'email'    => 'demo@pratamalab.com',
            'password' => Hash::make('password'),
            'timezone' => 'Asia/Jakarta',
        ]);

        // Create demo workspace
        $workspace = Workspace::create([
            'owner_id'    => $user->id,
            'name'        => 'My Workspace',
            'icon'        => '🚀',
            'description' => 'PratamaLab demo workspace',
        ]);

        $workspace->members()->attach($user->id, [
            'role'      => 'owner',
            'joined_at' => now(),
        ]);

        // Create demo pages
        $pages = [
            ['title' => 'Getting Started',    'icon' => '👋', 'type' => 'document'],
            ['title' => 'Project Roadmap',    'icon' => '🗺️', 'type' => 'document'],
            ['title' => 'Meeting Notes',      'icon' => '📝', 'type' => 'document'],
            ['title' => 'Design System',      'icon' => '🎨', 'type' => 'document'],
            ['title' => 'Budget Spreadsheet', 'icon' => '📊', 'type' => 'spreadsheet'],
        ];

        foreach ($pages as $idx => $pageData) {
            Page::create([
                ...$pageData,
                'workspace_id' => $workspace->id,
                'created_by'   => $user->id,
                'position'     => $idx,
            ]);
        }

        $this->command->info('Demo data seeded! Login: demo@pratamalab.com / password');
    }
}
