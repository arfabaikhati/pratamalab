<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserPresence implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $pageUuid,
        public readonly User   $user,
        public readonly string $action,   // 'join' | 'leave'
        public readonly ?array $cursor = null
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("page.{$this->pageUuid}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.presence';
    }

    public function broadcastWith(): array
    {
        return [
            'user'   => [
                'id'     => $this->user->id,
                'name'   => $this->user->name,
                'avatar' => $this->user->avatar,
            ],
            'action' => $this->action,
            'cursor' => $this->cursor,
        ];
    }
}
