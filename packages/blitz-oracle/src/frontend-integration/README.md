# Frontend Integration Guide

This guide provides comprehensive examples for integrating the contest monitoring system with your frontend application.

## Overview

The contest monitoring system provides multiple ways for the frontend to stay updated with contest status:

1. **Polling** - Simple HTTP requests at regular intervals
2. **Server-Sent Events (SSE)** - Real-time push updates from server
3. **Lightweight Polling** - Minimal data for high-frequency checks

## API Endpoints

### Contest Status Endpoints

- `GET /cron/contest/status` - Full contest status with individual creator tracking
- `GET /cron/contest/status/lightweight` - Minimal status for efficient polling
- `GET /cron/contest/status/stream` - Server-Sent Events for real-time updates
- `GET /cron/admin/contests/all` - All contests (admin only)

### Query Parameters

- `contestId` - Specific contest ID (optional, defaults to active contest)
- `userWallet` - User's wallet address for personalized status

## Integration Strategies

### 1. Simple Polling (Recommended for MVP)

```typescript
interface ContestStatusResponse {
  success: boolean;
  data: {
    contestId: string;
    status: 'awaiting_deposits' | 'awaiting_content' | 'active_battle' | 'completed' | 'forfeited';
    participants: {
      one: {
        handle: string;
        walletAddress: string;
        depositStatus: { detected: boolean; timestamp?: number };
        contentStatus: { detected: boolean; verified: boolean; timestamp?: number };
      };
      two: {
        handle: string;
        walletAddress: string;
        depositStatus: { detected: boolean; timestamp?: number };
        contentStatus: { detected: boolean; verified: boolean; timestamp?: number };
      };
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
  };
}

class ContestStatusPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private currentStatus: ContestStatusResponse['data'] | null = null;
  
  constructor(
    private userWallet?: string,
    private contestId?: string,
    private onStatusUpdate?: (status: ContestStatusResponse['data']) => void,
    private onError?: (error: Error) => void
  ) {}

  start(intervalMs: number = 10000) {
    this.stop(); // Clear any existing interval
    
    // Initial fetch
    this.fetchStatus();
    
    // Set up polling
    this.intervalId = setInterval(() => {
      this.fetchStatus();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async fetchStatus() {
    try {
      const params = new URLSearchParams();
      if (this.userWallet) params.append('userWallet', this.userWallet);
      if (this.contestId) params.append('contestId', this.contestId);

      const response = await fetch(`/cron/contest/status?${params}`);
      const result: ContestStatusResponse = await response.json();

      if (result.success && result.data) {
        // Only trigger update if status actually changed
        if (JSON.stringify(this.currentStatus) !== JSON.stringify(result.data)) {
          this.currentStatus = result.data;
          this.onStatusUpdate?.(result.data);
        }
      }
    } catch (error) {
      this.onError?.(error as Error);
    }
  }
}
```

### 2. Server-Sent Events (Real-time Updates)

```typescript
class ContestStatusStream {
  private eventSource: EventSource | null = null;
  
  constructor(
    private userWallet?: string,
    private contestId?: string,
    private onStatusUpdate?: (status: any) => void,
    private onError?: (error: Error) => void
  ) {}

  start() {
    this.stop(); // Close any existing connection
    
    const params = new URLSearchParams();
    if (this.userWallet) params.append('userWallet', this.userWallet);
    if (this.contestId) params.append('contestId', this.contestId);

    this.eventSource = new EventSource(`/cron/contest/status/stream?${params}`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          this.onStatusUpdate?.(data.data);
        } else if (data.type === 'error') {
          this.onError?.(new Error(data.message));
        }
      } catch (error) {
        this.onError?.(error as Error);
      }
    };

    this.eventSource.onerror = (error) => {
      this.onError?.(new Error('SSE connection error'));
    };
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

### 3. Hybrid Approach with Fallback

```typescript
class ContestStatusManager {
  private poller: ContestStatusPoller;
  private stream: ContestStatusStream;
  private useSSE: boolean = true;
  private fallbackTimer: NodeJS.Timeout | null = null;

  constructor(
    private userWallet?: string,
    private contestId?: string,
    private onStatusUpdate?: (status: any) => void,
    private onError?: (error: Error) => void
  ) {
    this.poller = new ContestStatusPoller(userWallet, contestId, onStatusUpdate, this.handleError.bind(this));
    this.stream = new ContestStatusStream(userWallet, contestId, onStatusUpdate, this.handleError.bind(this));
  }

  start() {
    if (this.useSSE && typeof EventSource !== 'undefined') {
      console.log('Starting SSE connection...');
      this.stream.start();
      
      // Fallback to polling if SSE fails
      this.fallbackTimer = setTimeout(() => {
        console.log('SSE fallback timeout, switching to polling...');
        this.switchToPolling();
      }, 30000); // 30 second timeout
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
  }

  private switchToPolling() {
    this.stream.stop();
    this.poller.start(10000); // Poll every 10 seconds
    this.useSSE = false;
  }

  private handleError(error: Error) {
    console.error('Contest status error:', error);
    
    if (this.useSSE) {
      console.log('SSE error, switching to polling...');
      this.switchToPolling();
    }
    
    this.onError?.(error);
  }
}
```

## React Integration Examples

### React Hook for Contest Status

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseContestStatusOptions {
  userWallet?: string;
  contestId?: string;
  pollingInterval?: number;
  useSSE?: boolean;
}

export function useContestStatus({
  userWallet,
  contestId,
  pollingInterval = 10000,
  useSSE = true
}: UseContestStatusOptions = {}) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleStatusUpdate = useCallback((newStatus: any) => {
    setStatus(newStatus);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    const manager = new ContestStatusManager(
      userWallet,
      contestId,
      handleStatusUpdate,
      handleError
    );

    manager.start();

    return () => {
      manager.stop();
    };
  }, [userWallet, contestId, handleStatusUpdate, handleError]);

  return { status, loading, error };
}
```

### Contest Status Component

```tsx
import React from 'react';
import { useContestStatus } from './useContestStatus';

interface ContestStatusProps {
  userWallet?: string;
  contestId?: string;
}

export function ContestStatus({ userWallet, contestId }: ContestStatusProps) {
  const { status, loading, error } = useContestStatus({ userWallet, contestId });

  if (loading) {
    return <div className="loading">Loading contest status...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  if (!status) {
    return <div className="no-contest">No active contest found</div>;
  }

  return (
    <div className="contest-status">
      <h2>{status.name}</h2>
      <div className="status-badge">{status.status}</div>
      
      <div className="participants">
        <div className="participant">
          <h3>{status.participants.one.handle}</h3>
          <div className="status-indicators">
            <span className={status.participants.one.depositStatus.detected ? 'completed' : 'pending'}>
              Deposit: {status.participants.one.depositStatus.detected ? '✅' : '⏳'}
            </span>
            <span className={status.participants.one.contentStatus.detected ? 'completed' : 'pending'}>
              Content: {status.participants.one.contentStatus.detected ? '✅' : '⏳'}
            </span>
          </div>
        </div>
        
        <div className="vs">VS</div>
        
        <div className="participant">
          <h3>{status.participants.two.handle}</h3>
          <div className="status-indicators">
            <span className={status.participants.two.depositStatus.detected ? 'completed' : 'pending'}>
              Deposit: {status.participants.two.depositStatus.detected ? '✅' : '⏳'}
            </span>
            <span className={status.participants.two.contentStatus.detected ? 'completed' : 'pending'}>
              Content: {status.participants.two.contentStatus.detected ? '✅' : '⏳'}
            </span>
          </div>
        </div>
      </div>

      {status.userStatus && (
        <div className="user-actions">
          <p>Next action: {status.userStatus.nextAction}</p>
          {status.userStatus.canSubmitContent && (
            <button>Submit Content</button>
          )}
        </div>
      )}
    </div>
  );
}
```

## Performance Optimizations

### 1. Request Deduplication

```typescript
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}
```

### 2. Exponential Backoff

```typescript
class ExponentialBackoff {
  private attempt = 0;
  private readonly maxAttempts = 5;
  private readonly baseDelay = 1000;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      if (this.attempt >= this.maxAttempts) {
        throw error;
      }

      const delay = this.baseDelay * Math.pow(2, this.attempt);
      this.attempt++;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.execute(fn);
    }
  }

  reset() {
    this.attempt = 0;
  }
}
```

## UI State Management

### Contest Status States

```typescript
type ContestPhase = 'awaiting_deposits' | 'awaiting_content' | 'active_battle' | 'completed' | 'forfeited';

interface UIState {
  phase: ContestPhase;
  showDepositFlow: boolean;
  showContentSubmission: boolean;
  showBattleInterface: boolean;
  showResults: boolean;
  userCanAct: boolean;
  nextAction?: string;
}

function getUIState(status: any, userRole: string): UIState {
  const base: UIState = {
    phase: status.status,
    showDepositFlow: false,
    showContentSubmission: false,
    showBattleInterface: false,
    showResults: false,
    userCanAct: false
  };

  switch (status.status) {
    case 'awaiting_deposits':
      return {
        ...base,
        showDepositFlow: true,
        userCanAct: userRole !== 'spectator' && !status.userStatus?.depositCompleted,
        nextAction: status.userStatus?.nextAction
      };

    case 'awaiting_content':
      return {
        ...base,
        showContentSubmission: true,
        userCanAct: status.userStatus?.canSubmitContent || false,
        nextAction: status.userStatus?.nextAction
      };

    case 'active_battle':
      return {
        ...base,
        showBattleInterface: true,
        userCanAct: true,
        nextAction: 'Vote and engage with the battle'
      };

    case 'completed':
      return {
        ...base,
        showResults: true,
        userCanAct: false,
        nextAction: 'View results'
      };

    default:
      return base;
  }
}
```

This comprehensive integration guide provides everything needed for seamless frontend integration with consistent UI updates for all user types.
