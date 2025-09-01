# Next Phase: Contest Storage Migration & Real-time Integration

**Phase:** Firebase Contest Data Migration  
**Timeline:** 2-3 hours (Next Development Session)  
**Prerequisites:** ✅ Firebase REST Client Implementation Complete

## 🎯 Phase Overview

Transform the blitz-oracle backend from in-memory contest storage to Firebase-backed persistent storage with real-time capabilities. This phase will enable scalable contest management, persistent data across deployments, and real-time updates for the mini-app.

## 📊 Current State Analysis

### Current Architecture Issues:
```typescript
// Current problematic approach in src/handlers/admin/createContest.ts
const contests = new Map<string, Contest>()  // ❌ In-memory only
export { contests }  // ❌ Global state, not scalable
```

**Problems:**
- ❌ Data lost on worker restart/deployment
- ❌ Cannot scale across multiple worker instances  
- ❌ No real-time updates for mini-app
- ❌ No persistent contest history
- ❌ Memory limitations with high contest volume

### Target Architecture:
```typescript
// New Firebase-backed approach
const firebaseClient = createFirebaseClient(env)
await firebaseClient.writeData("contests/123", contestData)  // ✅ Persistent
```

**Benefits:**
- ✅ Persistent across deployments
- ✅ Real-time synchronization
- ✅ Scalable to unlimited contests  
- ✅ Query optimization for mini-app
- ✅ Built-in backup and recovery

## 🗂 Phase 1: Firebase Contest Schema Design (30-45 minutes)

### 1.1 Current Contest Type Analysis

**Existing Structure** (`src/handlers/create/types.ts`):
```typescript
export interface Contest {
    contestId: string
    name: string
    status: ContestStatus  // "created" | "awaiting_deposits" | "awaiting_content" | "active_battle" | "completed" | "forfeited"
    participantOne: ContestParticipant
    participantTwo: ContestParticipant
    contractAddress: Address
    createdAt: number
    depositDeadline?: number
    contentDeadline?: number
    battleEndTime?: number
    deposits: Record<string, DepositStatus>
    contentPosts: Record<string, ContentPost>
    battleId?: string
    metrics?: ContestMetrics
}
```

### 1.2 Optimized Firebase Schema

**Design Principles:**
- **Denormalization for Performance** - Optimize for read operations
- **Real-time Friendly** - Structure for efficient subscriptions
- **Query Optimization** - Enable filtering by status, participant, date
- **Mini-app Integration** - Support direct frontend subscriptions

**Proposed Structure:**
```
/contests/
  /{contestId}/
    /basicInfo
      - contestId: string
      - name: string  
      - status: ContestStatus
      - createdAt: number
      - contractAddress: string
      - depositDeadline: number
      - contentDeadline: number
      - battleEndTime: number
    
    /participants/
      /{walletAddress}/
        - handle: string
        - walletAddress: string
        - zoraProfile: string
        /deposits/
          - detected: boolean
          - txHash: string
          - timestamp: number
        /contentPosts/
          - detected: boolean
          - zoraPostUrl: string
          - timestamp: number
    
    /battle/
      - battleId: string
      - startTime: number
      - endTime: number
    
    /metrics/
      - participantOneVotes: number
      - participantTwoVotes: number
      - lastUpdated: number
      - coin1MarketCap: number
      - coin2MarketCap: number
      - coin1Volume: number
      - coin2Volume: number
      - winner: "participant1" | "participant2" | null

/indexes/
  /contests-by-status/
    /created/
      /{contestId}: true
    /awaiting_deposits/  
      /{contestId}: true
    /active_battle/
      /{contestId}: true
    /completed/
      /{contestId}: true
  
  /contests-by-participant/
    /{walletAddress}/
      /{contestId}: true
  
  /contests-by-date/
    /2025-09/
      /{contestId}: { createdAt: timestamp, status: string }

/contest-stats/
  /global/
    - totalContests: number
    - activeContests: number
    - completedContests: number
    - lastUpdated: number
```

### 1.3 Data Migration Types

**New Firebase-Optimized Types** (`src/types/contest-firebase.ts`):
```typescript
export interface FirebaseContest {
  basicInfo: {
    contestId: string
    name: string
    status: ContestStatus
    createdAt: number
    contractAddress: string
    depositDeadline?: number
    contentDeadline?: number  
    battleEndTime?: number
  }
  participants: {
    [walletAddress: string]: {
      handle: string
      walletAddress: string
      zoraProfile?: string
      deposits: {
        detected: boolean
        txHash?: string
        timestamp?: number
      }
      contentPosts: {
        detected: boolean
        zoraPostUrl?: string
        timestamp?: number
      }
    }
  }
  battle?: {
    battleId: string
    startTime: number
    endTime: number
  }
  metrics?: {
    participantOneVotes: number
    participantTwoVotes: number
    lastUpdated: number
    coin1MarketCap?: number
    coin2MarketCap?: number
    coin1Volume?: number
    coin2Volume?: number
    winner?: "participant1" | "participant2"
  }
}

export interface ContestIndex {
  [contestId: string]: boolean | ContestIndexData
}

export interface ContestIndexData {
  createdAt: number
  status: string
  name?: string
}
```

## 🔄 Phase 2: Contest Storage Migration (60-75 minutes)

### 2.1 Create Firebase Contest Service

**New File:** `src/services/firebase-contests.ts`

**Core Functions:**
```typescript
export class FirebaseContestService {
  private client: FirebaseClient
  
  constructor(env: CloudflareBindings) {
    this.client = createFirebaseClient(env)
  }
  
  // CRUD Operations
  async createContest(contest: Contest): Promise<void>
  async getContest(contestId: string): Promise<Contest | null>  
  async updateContest(contestId: string, updates: Partial<Contest>): Promise<void>
  async deleteContest(contestId: string): Promise<void>
  
  // Query Operations  
  async getContestsByStatus(status: ContestStatus): Promise<Contest[]>
  async getContestsByParticipant(walletAddress: string): Promise<Contest[]>
  async getActiveContests(): Promise<Contest[]>
  async getAllContests(): Promise<Contest[]>
  
  // Real-time Operations
  async updateContestStatus(contestId: string, status: ContestStatus): Promise<void>
  async updateDeposit(contestId: string, walletAddress: string, deposit: DepositStatus): Promise<void>
  async updateContentPost(contestId: string, walletAddress: string, post: ContentPost): Promise<void>
  async updateMetrics(contestId: string, metrics: ContestMetrics): Promise<void>
  
  // Index Management
  private async updateStatusIndex(contestId: string, oldStatus?: ContestStatus, newStatus?: ContestStatus): Promise<void>
  private async updateParticipantIndex(contestId: string, participants: ContestParticipant[]): Promise<void>
  private async updateGlobalStats(): Promise<void>
}
```

### 2.2 Data Transformation Layer

**Conversion Utilities:**
```typescript
export function contestToFirebase(contest: Contest): FirebaseContest {
  return {
    basicInfo: {
      contestId: contest.contestId,
      name: contest.name,
      status: contest.status,
      createdAt: contest.createdAt,
      contractAddress: contest.contractAddress,
      depositDeadline: contest.depositDeadline,
      contentDeadline: contest.contentDeadline,
      battleEndTime: contest.battleEndTime
    },
    participants: {
      [contest.participantOne.walletAddress]: {
        handle: contest.participantOne.handle,
        walletAddress: contest.participantOne.walletAddress,
        zoraProfile: contest.participantOne.zoraProfile,
        deposits: contest.deposits[contest.participantOne.walletAddress] || { detected: false },
        contentPosts: contest.contentPosts[contest.participantOne.walletAddress] || { detected: false }
      },
      [contest.participantTwo.walletAddress]: {
        handle: contest.participantTwo.handle,
        walletAddress: contest.participantTwo.walletAddress,  
        zoraProfile: contest.participantTwo.zoraProfile,
        deposits: contest.deposits[contest.participantTwo.walletAddress] || { detected: false },
        contentPosts: contest.contentPosts[contest.participantTwo.walletAddress] || { detected: false }
      }
    },
    battle: contest.battleId ? {
      battleId: contest.battleId,
      startTime: contest.createdAt, // Or actual start time
      endTime: contest.battleEndTime || 0
    } : undefined,
    metrics: contest.metrics
  }
}

export function firebaseToContest(firebaseContest: FirebaseContest): Contest {
  const participantAddresses = Object.keys(firebaseContest.participants)
  const [addr1, addr2] = participantAddresses
  
  return {
    contestId: firebaseContest.basicInfo.contestId,
    name: firebaseContest.basicInfo.name,
    status: firebaseContest.basicInfo.status,
    createdAt: firebaseContest.basicInfo.createdAt,
    contractAddress: firebaseContest.basicInfo.contractAddress as Address,
    depositDeadline: firebaseContest.basicInfo.depositDeadline,
    contentDeadline: firebaseContest.basicInfo.contentDeadline,
    battleEndTime: firebaseContest.basicInfo.battleEndTime,
    participantOne: {
      handle: firebaseContest.participants[addr1].handle,
      walletAddress: firebaseContest.participants[addr1].walletAddress as Address,
      zoraProfile: firebaseContest.participants[addr1].zoraProfile
    },
    participantTwo: {
      handle: firebaseContest.participants[addr2].handle,
      walletAddress: firebaseContest.participants[addr2].walletAddress as Address,  
      zoraProfile: firebaseContest.participants[addr2].zoraProfile
    },
    deposits: {
      [addr1]: firebaseContest.participants[addr1].deposits,
      [addr2]: firebaseContest.participants[addr2].deposits
    },
    contentPosts: {
      [addr1]: firebaseContest.participants[addr1].contentPosts,
      [addr2]: firebaseContest.participants[addr2].contentPosts  
    },
    battleId: firebaseContest.battle?.battleId,
    metrics: firebaseContest.metrics
  }
}
```

### 2.3 Update Contest Admin Handlers

**Target File:** `src/handlers/admin/createContest.ts`

**Migration Strategy:**
1. **Phase 2a:** Add Firebase alongside existing Map (dual-write)
2. **Phase 2b:** Switch reads to Firebase  
3. **Phase 2c:** Remove Map entirely

**New Implementation:**
```typescript
import { FirebaseContestService } from '../../services/firebase-contests'
import type { CloudflareBindings } from '../../types/env'

// Replace global Map
// const contests = new Map<string, Contest>()  // ❌ Remove this

export async function createContest(input: CreateContestInput, env: CloudflareBindings): Promise<Contest> {
  const contestService = new FirebaseContestService(env)
  const contestId = `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

  const contest: Contest = {
    contestId,
    name: input.name,
    status: "created",
    participantOne: input.participantOne,
    participantTwo: input.participantTwo,
    contractAddress: input.contractAddress,
    createdAt: Date.now(),
    deposits: {
      [input.participantOne.walletAddress]: { detected: false },
      [input.participantTwo.walletAddress]: { detected: false },
    },
    contentPosts: {
      [input.participantOne.walletAddress]: { detected: false },
      [input.participantTwo.walletAddress]: { detected: false },
    },
  }

  // Write to Firebase with indexes
  await contestService.createContest(contest)
  return contest
}

export async function getContest(contestId: string, env: CloudflareBindings): Promise<Contest | null> {
  const contestService = new FirebaseContestService(env)
  return await contestService.getContest(contestId)
}

export async function getAllContests(env: CloudflareBindings): Promise<Contest[]> {
  const contestService = new FirebaseContestService(env)
  return await contestService.getAllContests()
}

// Remove the contests Map export entirely
// export { contests }  // ❌ Remove this
```

### 2.4 Update Route Handlers

**Target File:** `src/server/battleRoute.ts`

**Changes Required:**
```typescript
// Update all contest-related endpoints to pass env
app.post("/admin/contests", createContestBodyValidation, async (c) => {
    try {
        const input = c.req.valid("json")
        const contest = await createContest(input, c.env) // ✅ Pass env
        return c.json({ success: true, contest })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.get("/admin/contests", async (c) => {
    try {
        const contests = await getAllContests(c.env) // ✅ Pass env
        return c.json({ success: true, contests })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.get("/admin/contests/:contestId", async (c) => {
    try {
        const contestId = c.req.param("contestId")
        const contest = await getContest(contestId, c.env) // ✅ Pass env

        if (!contest) {
            return c.json({ success: false, error: "Contest not found" }, 404)
        }

        return c.json({ success: true, contest })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})
```

## 🔄 Phase 3: Deposit Monitor Migration (45-60 minutes)

### 3.1 Update Deposit Monitor Service

**Target File:** `src/services/depositMonitor.ts`

**Current Issues:**
```typescript
// Current problematic approach
const activeContests = Array.from(contests.values()).filter(...)  // ❌ In-memory
contest.deposits[...] = { detected: true, timestamp: Date.now() } // ❌ Direct mutation
contests.set(contest.contestId, contest) // ❌ Map storage
```

**New Firebase-based Implementation:**
```typescript
import { FirebaseContestService } from './firebase-contests'
import type { CloudflareBindings } from '../types/env'

export async function checkContestDeposits(env: CloudflareBindings) {
    console.log("Checking contest deposits...")
    
    const contestService = new FirebaseContestService(env)
    
    // Get active contests from Firebase
    const activeContests = await contestService.getContestsByStatus("created")
    const awaitingContests = await contestService.getContestsByStatus("awaiting_deposits")
    const allActiveContests = [...activeContests, ...awaitingContests]

    if (allActiveContests.length === 0) {
        console.log("No active contests to monitor")
        return
    }

    console.log(`Monitoring ${allActiveContests.length} active contests`)

    // Process each contest
    for (const contest of allActiveContests) {
        await checkSingleContestDeposits(contest, contestService)
    }
}

async function checkSingleContestDeposits(contest: Contest, contestService: FirebaseContestService) {
    try {
        // Check deposits for both participants (existing logic)
        const participantOneDeposited = await checkParticipantDeposit(
            contest.participantOne.walletAddress,
            contest.contractAddress,
            contest.createdAt,
        )

        const participantTwoDeposited = await checkParticipantDeposit(
            contest.participantTwo.walletAddress,
            contest.contractAddress,
            contest.createdAt,
        )

        // Update Firebase instead of in-memory Map
        let statusChanged = false

        if (participantOneDeposited && !contest.deposits[contest.participantOne.walletAddress].detected) {
            await contestService.updateDeposit(contest.contestId, contest.participantOne.walletAddress, {
                detected: true,
                timestamp: Date.now(),
            })
            statusChanged = true
            console.log(`✅ Deposit detected for ${contest.participantOne.handle} in contest ${contest.contestId}`)
        }

        if (participantTwoDeposited && !contest.deposits[contest.participantTwo.walletAddress].detected) {
            await contestService.updateDeposit(contest.contestId, contest.participantTwo.walletAddress, {
                detected: true,
                timestamp: Date.now(),
            })
            statusChanged = true
            console.log(`✅ Deposit detected for ${contest.participantTwo.handle} in contest ${contest.contestId}`)
        }

        // Check if both participants have deposited and update status
        if (participantOneDeposited && participantTwoDeposited && contest.status === "created") {
            await contestService.updateContestStatus(contest.contestId, "awaiting_content")
            console.log(`🚀 Contest ${contest.contestId} moved to awaiting_content phase`)
        }

    } catch (error) {
        console.error(`Error checking deposits for contest ${contest.contestId}:`, error)
    }
}
```

### 3.2 Update Scheduled Event Handler

**Target File:** `src/index.ts`

**Update cron handler:**
```typescript
async scheduled(event: ScheduledEvent, env: CloudflareBindings, ctx: ExecutionContext) {
    switch (event.cron) {
        case "* * * * *": // Every minute
            console.log("Running deposit monitoring cron...")
            await checkContestDeposits(env) // ✅ Pass env
            break
        default:
            console.log("Unknown cron schedule:", event.cron)
    }
},
```

## 🧪 Phase 4: Testing & Validation (30-45 minutes)

### 4.1 Create Contest Migration Tests

**New Test Endpoint:** `/battle/test/contest-migration`

```typescript
app.get("/battle/test/contest-migration", async (c) => {
    try {
        const contestService = new FirebaseContestService(c.env)
        
        // Test 1: Create contest
        const testContest: CreateContestInput = {
            name: "Test Migration Contest",
            participantOne: { handle: "alice", walletAddress: "0x123..." as Address },
            participantTwo: { handle: "bob", walletAddress: "0x456..." as Address },
            contractAddress: "0x789..." as Address
        }
        
        const contest = await createContest(testContest, c.env)
        console.log("✅ Contest created:", contest.contestId)
        
        // Test 2: Retrieve contest
        const retrieved = await getContest(contest.contestId, c.env)
        console.log("✅ Contest retrieved:", retrieved?.contestId)
        
        // Test 3: Update deposit status
        await contestService.updateDeposit(contest.contestId, contest.participantOne.walletAddress, {
            detected: true,
            txHash: "0xdeadbeef...",
            timestamp: Date.now()
        })
        console.log("✅ Deposit updated")
        
        // Test 4: Query by status
        const activeContests = await contestService.getContestsByStatus("created")
        console.log("✅ Query by status:", activeContests.length, "contests")
        
        // Test 5: Cleanup
        await contestService.deleteContest(contest.contestId)
        console.log("✅ Test cleanup completed")
        
        return c.json({
            success: true,
            message: "Contest migration test completed successfully",
            results: {
                contestCreated: !!contest,
                contestRetrieved: !!retrieved,
                statusQuery: activeContests.length,
                testsCompleted: 5
            }
        })
        
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, 500)
    }
})
```

### 4.2 Performance Testing

**Load Testing Endpoints:**
```typescript
// Test concurrent contest creation
app.post("/battle/test/load-contests", async (c) => {
    const count = parseInt(c.req.query("count") || "10")
    const results = []
    
    for (let i = 0; i < count; i++) {
        const contest = await createContest({
            name: `Load Test Contest ${i}`,
            participantOne: { handle: `user${i}a`, walletAddress: `0x${i}aa...` as Address },
            participantTwo: { handle: `user${i}b`, walletAddress: `0x${i}bb...` as Address },
            contractAddress: "0x789..." as Address
        }, c.env)
        results.push(contest.contestId)
    }
    
    return c.json({ success: true, contestsCreated: results.length, contestIds: results })
})
```

## 📈 Success Metrics & Acceptance Criteria

### Functional Requirements ✅
- [ ] All existing contest operations work with Firebase backend
- [ ] Contest data persists across worker restarts  
- [ ] Real-time updates are possible (structure supports it)
- [ ] Multiple contests can be managed concurrently
- [ ] Query operations are efficient (proper indexing)

### Performance Requirements ✅
- [ ] Contest creation: < 500ms response time
- [ ] Contest retrieval: < 200ms response time  
- [ ] Status queries: < 300ms response time
- [ ] Deposit updates: < 400ms response time
- [ ] Concurrent operations: No data corruption

### Data Integrity ✅
- [ ] No contest data lost during migration
- [ ] All contest fields preserved correctly
- [ ] Deposit status tracking maintains accuracy
- [ ] Contest status transitions work properly
- [ ] Index consistency maintained

## 🚨 Risk Analysis & Mitigation

### High-Risk Areas:
1. **Data Loss During Migration** 
   - **Mitigation:** Implement dual-write period, comprehensive testing
2. **Firebase Quota Limits**
   - **Mitigation:** Monitor usage, implement rate limiting  
3. **Authentication Token Expiry**
   - **Mitigation:** Robust token refresh, proper error handling
4. **Concurrent Write Conflicts**
   - **Mitigation:** Firebase transactions, proper locking

### Rollback Plan:
```typescript
// Emergency rollback: Switch back to Map storage
const EMERGENCY_FALLBACK = process.env.USE_MEMORY_FALLBACK === "true"

if (EMERGENCY_FALLBACK) {
    // Fall back to original Map-based storage
    console.warn("🚨 Using memory fallback mode")
    return originalMapImplementation()
}
```

## 🎯 Mini-App Integration Preview (Future Phase)

### Real-time Subscriptions
```typescript
// Future: Real-time contest updates for mini-app
export function subscribeToContest(contestId: string): EventSource {
    // Firebase REST API supports Server-Sent Events
    return new EventSource(`${FIREBASE_URL}/contests/${contestId}.json?auth=${token}`)
}
```

### Direct Frontend Queries
```typescript
// Future: Mini-app can query Firebase directly
const activeContests = await fetch(`${FIREBASE_URL}/indexes/contests-by-status/active_battle.json?auth=${token}`)
```

## ⏱ Detailed Timeline

**Session Breakdown (2.5-3 hours total):**

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Firebase schema design | 30-45 min | None |
| 1 | Create contest types | 15-20 min | Schema complete |
| 2 | Build contest service | 45-60 min | Types ready |
| 2 | Migrate admin handlers | 30-40 min | Service ready |
| 2 | Update route handlers | 15-20 min | Handlers migrated |
| 3 | Update deposit monitor | 45-60 min | Contest service ready |
| 3 | Update scheduled events | 10-15 min | Monitor updated |
| 4 | Create test endpoints | 20-30 min | Migration complete |
| 4 | Run validation tests | 15-20 min | Tests ready |

**Total Estimated Time:** 2 hours 45 minutes - 3 hours 30 minutes

## 🎉 Expected Outcomes

**Immediate Benefits:**
- ✅ Persistent contest data across deployments
- ✅ Scalable contest management (unlimited contests)
- ✅ Real-time update capability for mini-app
- ✅ Proper data indexing and query optimization
- ✅ Production-ready data storage solution

**Long-term Benefits:**
- 🚀 Foundation for real-time mini-app integration
- 🚀 Historical contest analytics capability  
- 🚀 Multi-region deployment support
- 🚀 Advanced contest features (tournaments, leagues)
- 🚀 Automated contest lifecycle management

---

**This phase will complete the core backend transformation, making the blitz-oracle service production-ready with persistent, scalable contest management.**