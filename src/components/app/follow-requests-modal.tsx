'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Loader2, UserPlus, Bell } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/use-app-store';

interface FollowRequest {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    name: string;
    username: string;
    image: string | null;
    bio: string | null;
  };
}

export function FollowRequestsModal() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/follow/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    // Refresh requests count periodically
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleResponse = async (requesterId: string, action: 'accept' | 'reject', username: string) => {
    setProcessingId(requesterId);
    try {
      await apiPost('/api/follow/requests', { requesterId, action });
      setRequests((prev) => prev.filter((r) => r.requester.id !== requesterId));
      triggerRefresh();
      toast({
        title: action === 'accept' ? 'Follow request accepted' : 'Follow request rejected',
        description:
          action === 'accept'
            ? `@${username} can now view your public wishlists.`
            : `Follow request from @${username} was removed.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to respond to request';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  function getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          {requests.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background">
              {requests.length}
            </span>
          )}
          <span className="sr-only">Follow Requests</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-rose-500" />
            Follow Requests
            {requests.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {requests.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {loading && requests.length === 0 ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">No pending follow requests</p>
              <p className="text-xs mt-1">When someone requests to follow you, it will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.requester.image || undefined} />
                      <AvatarFallback className="bg-rose-100 text-rose-700 text-xs font-semibold">
                        {getInitials(req.requester.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{req.requester.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{req.requester.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleResponse(req.requester.id, 'accept', req.requester.username)}
                      disabled={processingId === req.requester.id}
                      className="bg-rose-500 text-white hover:bg-rose-600 h-8 px-2.5"
                    >
                      {processingId === req.requester.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResponse(req.requester.id, 'reject', req.requester.username)}
                      disabled={processingId === req.requester.id}
                      className="h-8 px-2.5 text-muted-foreground hover:text-destructive"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
