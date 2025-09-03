/**
 * Complete frontend integration examples for the contest monitoring system
 * These examples show how to implement seamless UI updates for all user types
 */

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface ContestStatusData {
  contestId: string;
  name: string;
  status: 'awaiting_deposits' | 'awaiting_content' | 'active_battle' | 'completed' | 'forfeited';
  participants: {
    one: ParticipantStatus;
    two: ParticipantStatus;
  };
  progress: {
    allDepositsReceived: boolean;
    allContentSubmitted: boolean;
    readyForBattle: boolean;
  };
  userRole?: 'participant_one' | 'participant_two' | 'spectator';
  userStatus?: {
    depositCompleted: boolean;
    contentSubmitted: boolean;
    canSubmitContent: boolean;
    nextAction?: string;
  };
  deadlines: {
    deposit?: number;
    content?: number;
    battleEnd?: number;
  };
  createdAt: number;
  lastUpdated: number;
}

export interface ParticipantStatus {
  handle: string;
  walletAddress: string;
  depositStatus: {
    detected: boolean;
    timestamp?: number;
  };
  contentStatus: {
    detected: boolean;
    verified: boolean;
    timestamp?: number;
    zoraPostUrl?: string;
  };
}

// ============================================================================
// POLLING IMPLEMENTATION
// ============================================================================

export class ContestStatusPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private currentStatus: ContestStatusData | null = null;
  private retryCount = 0;
  private readonly maxRetries = 3;
  
  constructor(
    private baseUrl: string = '',
    private userWallet?: string,
    private contestId?: string,
    private onStatusUpdate?: (status: ContestStatusData) => void,
    private onError?: (error: Error) => void
  ) {}

  start(intervalMs: number = 10000) {
    this.stop();
    this.fetchStatus(); // Initial fetch
    
    this.intervalId = setInterval(() => {
      this.fetchStatus();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.retryCount = 0;
  }

  private async fetchStatus() {
    try {
      const params = new URLSearchParams();
      if (this.userWallet) params.append('userWallet', this.userWallet);
      if (this.contestId) params.append('contestId', this.contestId);

      const response = await fetch(`${this.baseUrl}/cron/contest/status?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Only trigger update if status actually changed
        const statusChanged = JSON.stringify(this.currentStatus) !== JSON.stringify(result.data);
        if (statusChanged) {
          this.currentStatus = result.data;
          this.onStatusUpdate?.(result.data);
          this.retryCount = 0; // Reset retry count on success
        }
      }
    } catch (error) {
      this.retryCount++;
      console.error(`Contest status fetch failed (attempt ${this.retryCount}):`, error);
      
      if (this.retryCount >= this.maxRetries) {
        this.onError?.(error as Error);
        this.retryCount = 0;
      }
    }
  }
}

// ============================================================================
// SERVER-SENT EVENTS IMPLEMENTATION
// ============================================================================

export class ContestStatusStream {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  constructor(
    private baseUrl: string = '',
    private userWallet?: string,
    private contestId?: string,
    private onStatusUpdate?: (status: ContestStatusData) => void,
    private onError?: (error: Error) => void,
    private onConnectionChange?: (connected: boolean) => void
  ) {}

  start() {
    this.stop();
    this.connect();
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = 0;
    this.onConnectionChange?.(false);
  }

  private connect() {
    const params = new URLSearchParams();
    if (this.userWallet) params.append('userWallet', this.userWallet);
    if (this.contestId) params.append('contestId', this.contestId);

    this.eventSource = new EventSource(`${this.baseUrl}/cron/contest/status/stream?${params}`);
    
    this.eventSource.onopen = () => {
      console.log('SSE connection established');
      this.reconnectAttempts = 0;
      this.onConnectionChange?.(true);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          this.onStatusUpdate?.(data.data);
        } else if (data.type === 'error') {
          this.onError?.(new Error(data.message));
        }
      } catch (error) {
        console.error('SSE message parsing error:', error);
        this.onError?.(error as Error);
      }
    };

    this.eventSource.onerror = () => {
      console.error('SSE connection error');
      this.onConnectionChange?.(false);
      this.handleReconnect();
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onError?.(new Error('Max SSE reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    console.log(`Attempting SSE reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// ============================================================================
// UNIFIED MANAGER WITH FALLBACK
// ============================================================================

export class ContestStatusManager {
  private poller: ContestStatusPoller;
  private stream: ContestStatusStream;
  private useSSE: boolean = true;
  private fallbackTimer: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(
    private baseUrl: string = '',
    private userWallet?: string,
    private contestId?: string,
    private onStatusUpdate?: (status: ContestStatusData) => void,
    private onError?: (error: Error) => void,
    private onConnectionChange?: (connected: boolean, method: 'sse' | 'polling') => void
  ) {
    this.poller = new ContestStatusPoller(
      baseUrl,
      userWallet,
      contestId,
      onStatusUpdate,
      this.handlePollingError.bind(this)
    );

    this.stream = new ContestStatusStream(
      baseUrl,
      userWallet,
      contestId,
      onStatusUpdate,
      this.handleSSEError.bind(this),
      this.handleSSEConnectionChange.bind(this)
    );
  }

  start() {
    if (this.useSSE && typeof EventSource !== 'undefined') {
      console.log('Starting with SSE...');
      this.stream.start();
      
      // Fallback to polling if SSE doesn't connect within 15 seconds
      this.fallbackTimer = setTimeout(() => {
        if (!this.isConnected) {
          console.log('SSE connection timeout, switching to polling...');
          this.switchToPolling();
        }
      }, 15000);
    } else {
      this.switchToPolling();
    }
  }

  stop() {
    this.stream.stop();
    this.poller.stop();
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.isConnected = false;
  }

  private switchToPolling() {
    this.stream.stop();
    this.poller.start(8000); // Poll every 8 seconds
    this.useSSE = false;
    this.isConnected = true;
    this.onConnectionChange?.(true, 'polling');
  }

  private handleSSEError(error: Error) {
    console.error('SSE error:', error);
    if (this.useSSE) {
      console.log('SSE failed, switching to polling...');
      this.switchToPolling();
    }
    this.onError?.(error);
  }

  private handlePollingError(error: Error) {
    console.error('Polling error:', error);
    this.isConnected = false;
    this.onConnectionChange?.(false, 'polling');
    this.onError?.(error);
  }

  private handleSSEConnectionChange(connected: boolean) {
    this.isConnected = connected;
    if (connected && this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.onConnectionChange?.(connected, 'sse');
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseContestStatusOptions {
  baseUrl?: string;
  userWallet?: string;
  contestId?: string;
  pollingInterval?: number;
  useSSE?: boolean;
  autoStart?: boolean;
}

export function useContestStatus({
  baseUrl = '',
  userWallet,
  contestId,
  pollingInterval = 10000,
  useSSE = true,
  autoStart = true
}: UseContestStatusOptions = {}) {
  const [status, setStatus] = useState<ContestStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'sse' | 'polling' | null>(null);
  
  const managerRef = useRef<ContestStatusManager | null>(null);

  const handleStatusUpdate = useCallback((newStatus: ContestStatusData) => {
    setStatus(newStatus);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setLoading(false);
  }, []);

  const handleConnectionChange = useCallback((isConnected: boolean, method: 'sse' | 'polling') => {
    setConnected(isConnected);
    setConnectionMethod(method);
  }, []);

  const start = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stop();
    }
  }, []);

  useEffect(() => {
    managerRef.current = new ContestStatusManager(
      baseUrl,
      userWallet,
      contestId,
      handleStatusUpdate,
      handleError,
      handleConnectionChange
    );

    if (autoStart) {
      managerRef.current.start();
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, [baseUrl, userWallet, contestId, handleStatusUpdate, handleError, handleConnectionChange, autoStart]);

  return {
    status,
    loading,
    error,
    connected,
    connectionMethod,
    start,
    stop,
    // Helper methods for UI state
    isParticipant: status?.userRole !== 'spectator',
    canAct: status?.userStatus?.canSubmitContent || status?.userStatus?.nextAction?.includes('deposit'),
    nextAction: status?.userStatus?.nextAction,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getContestPhaseDisplay(status: ContestStatusData['status']): string {
  const phases = {
    awaiting_deposits: 'Waiting for Deposits',
    awaiting_content: 'Content Submission Phase',
    active_battle: 'Battle Active',
    completed: 'Battle Completed',
    forfeited: 'Contest Forfeited'
  };
  return phases[status] || status;
}

export function getTimeRemaining(deadline?: number): string | null {
  if (!deadline) return null;
  
  const now = Date.now();
  const remaining = deadline - now;
  
  if (remaining <= 0) return 'Expired';
  
  const minutes = Math.floor(remaining / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
  return `${minutes}m remaining`;
}

export function getProgressPercentage(status: ContestStatusData): number {
  const phases = ['awaiting_deposits', 'awaiting_content', 'active_battle', 'completed'];
  const currentIndex = phases.indexOf(status.status);
  
  if (currentIndex === -1) return 0;
  if (status.status === 'completed') return 100;
  
  let progress = (currentIndex / (phases.length - 1)) * 100;
  
  // Add sub-progress within phases
  if (status.status === 'awaiting_deposits') {
    const depositsReceived = [
      status.participants.one.depositStatus.detected,
      status.participants.two.depositStatus.detected
    ].filter(Boolean).length;
    progress += (depositsReceived / 2) * (100 / (phases.length - 1)) * 0.5;
  } else if (status.status === 'awaiting_content') {
    const contentSubmitted = [
      status.participants.one.contentStatus.detected,
      status.participants.two.contentStatus.detected
    ].filter(Boolean).length;
    progress += (contentSubmitted / 2) * (100 / (phases.length - 1)) * 0.5;
  }
  
  return Math.min(progress, 100);
}
