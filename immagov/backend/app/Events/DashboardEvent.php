<?php

namespace App\Events;

use BeyondCode\LaravelWebSockets\WebSockets\Channels\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class DashboardEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public $dashboardData = [];
    public function __construct($data)
    {
        $this->dashboardData = $data;
    }
    public function broadcastOn()
    {
        return ['dashboard'];
    }
  
    public function broadcastAs()
    {
        return 'statistique';
    }
    // public function broadcastOn()
    // {
    //     return new Channel('dashboard');
    // }
    // public function broadcastWith(){
    //     return [$this->dashboardData];
    // }
    // public function broadcastAs()
    // {
    //     return 'my-event';
    // }
}
