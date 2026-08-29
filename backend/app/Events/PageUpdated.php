<?php

namespace App\Events;

use App\Models\Page;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PageUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Page $page,
        public readonly User $user
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("page.{$this->page->uuid}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'page.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'page_uuid'    => $this->page->uuid,
            'title'        => $this->page->title,
            'icon'         => $this->page->icon,
            'updated_by'   => [
                'id'     => $this->user->id,
                'name'   => $this->user->name,
                'avatar' => $this->user->avatar,
            ],
            'updated_at' => $this->page->updated_at,
        ];
    }
}
