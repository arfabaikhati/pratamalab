<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Auto-create a personal workspace for the new user
        $workspace = Workspace::create([
            'owner_id'    => $user->id,
            'name'        => "{$user->name}'s Workspace",
            'icon'        => '🏠',
            'description' => 'Personal workspace',
        ]);

        // Add owner to workspace_members
        $workspace->members()->attach($user->id, [
            'role'      => 'owner',
            'joined_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'         => $user,
            'workspace'    => $workspace,
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($validated)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $user  = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Update last seen
        $user->update(['last_seen_at' => now()]);

        return response()->json([
            'user'         => $user,
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load([
            'workspaces' => fn($q) => $q->withPivot('role'),
            'ownedWorkspaces',
        ]);

        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'bio'         => ['sometimes', 'nullable', 'string', 'max:500'],
            'avatar'      => ['sometimes', 'nullable', 'string'],
            'timezone'    => ['sometimes', 'string', 'max:50'],
            'preferences' => ['sometimes', 'nullable', 'array'],
        ]);

        $request->user()->update($validated);

        return response()->json($request->user()->fresh());
    }
}
