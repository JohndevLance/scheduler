import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { ToastService } from '@/shared/services/ToastService';

/** Strip /api/v1 (or similar) suffix to get the raw server origin */
const resolveSocketUrl = (): string => {
  const base =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
  return base.replace(/\/api\/v\d+\/?$/, '');
};

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
}

/**
 * Module-level singleton so React StrictMode's double-invoke doesn't
 * disconnect a socket that is still mid-handshake.
 */
let _socket: Socket | null = null;
let _socketToken: string | null = null;

const getOrCreateSocket = (token: string): Socket => {
  // Reuse if the same token — even if the socket is still mid-handshake.
  // Do NOT check _socket.connected; a connecting socket is not yet connected.
  if (_socket && _socketToken === token) {
    return _socket;
  }
  // Tear down only if the token changed (e.g. user switched accounts)
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
  _socketToken = token;
  _socket = io(`${resolveSocketUrl()}/events`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });
  return _socket;
};

const teardownSocket = () => {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
    _socketToken = null;
  }
};

export const useSocket = () => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      teardownSocket();
      return;
    }

    const socket = getOrCreateSocket(accessToken);

    // Re-register listeners (removeAllListeners was called above if new socket)
    socket.off('notification:new');
    socket.on('notification:new', (notif: NotificationPayload) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      ToastService.info({ title: notif.title, message: notif.body });
    });

    socket.off('shift:assigned');
    socket.on('shift:assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      ToastService.info({ title: 'Shift Assigned', message: 'You have been assigned a new shift.' });
    });

    socket.off('shift:unassigned');
    socket.on('shift:unassigned', () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      ToastService.info({ title: 'Shift Removed', message: 'A shift has been removed from your schedule.' });
    });

    socket.off('shift:published');
    socket.on('shift:published', () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      ToastService.info({ title: 'Schedule Published', message: 'New shifts have been published for your location.' });
    });

    socket.off('swap:approved');
    socket.on('swap:approved', () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      ToastService.success({ title: 'Swap Approved', message: 'Your shift swap request was approved.' });
    });

    socket.off('swap:denied');
    socket.on('swap:denied', () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      ToastService.error({ title: 'Swap Denied', message: 'Your shift swap request was denied.' });
    });

    socket.off('swap:requested');
    socket.on('swap:requested', () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      ToastService.info({ title: 'New Swap Request', message: 'A new shift swap request requires your attention.' });
    });

    // In StrictMode the cleanup fires immediately on the first mount pass.
    // Do NOT disconnect here — just remove listeners so they don't double-fire.
    // The singleton is only torn down when the token changes or user logs out.
    return () => {
      socket.removeAllListeners();
    };
  }, [isAuthenticated, accessToken, queryClient]);
};
