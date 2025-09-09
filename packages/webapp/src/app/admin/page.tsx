"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import blitzLogo from "@/assets/blitzLogo.svg";

interface Contest {
  contestId: string;
  name: string;
  status: string;
  participants: Array<{
    handle: string;
    walletAddress: string;
    zoraProfile?: string;
  }>;
  createdAt: string;
}

interface CreateContestForm {
  name: string;
  participantOne: {
    handle: string;
    walletAddress: string;
    zoraProfile: string;
  };
  participantTwo: {
    handle: string;
    walletAddress: string;
    zoraProfile: string;
  };
  contractAddress: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState<CreateContestForm>({
    name: "",
    participantOne: { handle: "", walletAddress: "", zoraProfile: "" },
    participantTwo: { handle: "", walletAddress: "", zoraProfile: "" },
    contractAddress: "",
  });

  const loadData = useCallback(async (adminPassword: string) => {
    try {
      setLoading(true);

      // Load all contests
      const contestsResponse = await fetch("/api/admin/contests", {
        headers: { Authorization: `Bearer ${adminPassword}` },
      });

      if (contestsResponse.ok) {
        const contestsData = await contestsResponse.json();
        setContests(contestsData.contests || []);
      }

      // Load active contest
      const activeResponse = await fetch("/api/admin/contests/active", {
        headers: { Authorization: `Bearer ${adminPassword}` },
      });

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveContest(activeData.contest);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin-password");
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
      loadData(savedPassword);
    }
  }, [loadData]);

  const authenticate = async () => {
    try {
      setLoading(true);
      setError("");

      // Test authentication by calling admin API
      const response = await fetch("/api/admin/contests/active", {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem("admin-password", password);
        await loadData(password);
      } else {
        setError("Invalid admin password");
      }
    } catch (err) {
      console.error("Error: ", err);
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const createContest = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/contests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok) {
        await loadData(password);
        // Reset form
        setCreateForm({
          name: "",
          participantOne: { handle: "", walletAddress: "", zoraProfile: "" },
          participantTwo: { handle: "", walletAddress: "", zoraProfile: "" },
          contractAddress: "",
        });
      } else {
        setError(data.error || "Failed to create contest");
      }
    } catch (err) {
      console.error("Error creating contest:", err);
      setError("Failed to create contest");
    } finally {
      setLoading(false);
    }
  };

  const completeContest = async (contestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/contests/${contestId}/complete`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${password}` },
        }
      );

      if (response.ok) {
        await loadData(password);
      } else {
        setError("Failed to complete contest");
      }
    } catch (err) {
      console.error("Error completing contest:", err);
      setError("Failed to complete contest");
    } finally {
      setLoading(false);
    }
  };

  const forfeitContest = async (contestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contests/${contestId}/forfeit`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${password}` },
      });

      if (response.ok) {
        await loadData(password);
      } else {
        setError("Failed to forfeit contest");
      }
    } catch (err) {
      console.error("Error forfeiting contest:", err);
      setError("Failed to forfeit contest");
    } finally {
      setLoading(false);
    }
  };

  const updateContestStatus = async (contestId: string, status: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/contests/${contestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadData(password);
      } else {
        setError(data.error || "Failed to update contest status");
      }
    } catch (err) {
      console.error("Error updating contest status:", err);
      setError("Failed to update contest status");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPassword("");
    localStorage.removeItem("admin-password");
    setContests([]);
    setActiveContest(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="bg-[#1A1A1A] p-8 rounded-lg border border-[#2A2A2A] w-full max-w-md">
          <div className="flex items-center gap-4 mb-6">
            <Image src={blitzLogo} alt="Blitz Logo" width={40} height={40} />
            <h1 className="text-2xl font-bold text-[#67CE67]">Admin Access</h1>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white"
              onKeyPress={(e) => e.key === "Enter" && authenticate()}
            />

            <button
              onClick={authenticate}
              disabled={loading || !password}
              className="w-full p-3 bg-[#67CE67] text-black font-medium rounded-lg hover:bg-[#5AB85A] disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Access Admin Panel"}
            </button>

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Image src={blitzLogo} alt="Blitz Logo" width={50} height={50} />
            <h1 className="text-3xl font-bold text-[#67CE67]">Admin Panel</h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white hover:bg-[#2A2A2A]"
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Active Contest */}
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Active Contest</h2>
          {activeContest ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Contest ID</p>
                  <p className="text-white font-mono">
                    {activeContest.contestId}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <span className="px-2 py-1 bg-[#67CE67] text-black text-sm rounded">
                    {activeContest.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Participants</p>
                <div className="grid grid-cols-2 gap-4">
                  {activeContest.participants.map((participant) => (
                    <div
                      key={participant.walletAddress}
                      className="bg-[#2A2A2A] p-3 rounded"
                    >
                      <p className="text-white font-medium">
                        {participant.handle}
                      </p>
                      <p className="text-gray-400 text-sm font-mono">
                        {participant.walletAddress}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Status Update Controls */}
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-2">Manual Status Update</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateContestStatus(activeContest.contestId, "AWAITING_DEPOSITS")}
                      disabled={loading || activeContest.status === "AWAITING_DEPOSITS"}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Awaiting Deposits
                    </button>
                    <button
                      onClick={() => updateContestStatus(activeContest.contestId, "AWAITING_CONTENT")}
                      disabled={loading || activeContest.status === "AWAITING_CONTENT"}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Awaiting Content
                    </button>
                    <button
                      onClick={() => updateContestStatus(activeContest.contestId, "ACTIVE_BATTLE")}
                      disabled={loading || activeContest.status === "ACTIVE_BATTLE"}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Active Battle
                    </button>
                    <button
                      onClick={() => updateContestStatus(activeContest.contestId, "COMPLETED")}
                      disabled={loading || activeContest.status === "COMPLETED"}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => updateContestStatus(activeContest.contestId, "FORFEITED")}
                      disabled={loading || activeContest.status === "FORFEITED"}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Forfeited
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => completeContest(activeContest.contestId)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Complete Contest
                  </button>
                  <button
                    onClick={() => forfeitContest(activeContest.contestId)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Forfeit Contest
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No active contest</p>
          )}
        </div>

        {/* Create Contest Form */}
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Create New Contest
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Contest Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                  placeholder="Epic Battle #1"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">
                  Contract Address
                </label>
                <input
                  type="text"
                  value={createForm.contractAddress}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      contractAddress: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white font-mono"
                  placeholder="0x..."
                />
              </div>
            </div>

            {/* Participant One */}
            <div>
              <h3 className="text-white font-medium mb-2">Participant One</h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={createForm.participantOne.handle}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantOne: {
                        ...createForm.participantOne,
                        handle: e.target.value,
                      },
                    })
                  }
                  className="p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                  placeholder="Handle"
                />
                <input
                  type="text"
                  value={createForm.participantOne.walletAddress}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantOne: {
                        ...createForm.participantOne,
                        walletAddress: e.target.value,
                      },
                    })
                  }
                  className="p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white font-mono"
                  placeholder="Wallet Address"
                />
                <input
                  type="text"
                  value={createForm.participantOne.zoraProfile}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantOne: {
                        ...createForm.participantOne,
                        zoraProfile: e.target.value,
                      },
                    })
                  }
                  className="p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                  placeholder="Zora Profile (optional)"
                />
              </div>
            </div>

            {/* Participant Two */}
            <div>
              <h3 className="text-white font-medium mb-2">Participant Two</h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={createForm.participantTwo.handle}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantTwo: {
                        ...createForm.participantTwo,
                        handle: e.target.value,
                      },
                    })
                  }
                  className="p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                  placeholder="Handle"
                />
                <input
                  type="text"
                  value={createForm.participantTwo.walletAddress}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantTwo: {
                        ...createForm.participantTwo,
                        walletAddress: e.target.value,
                      },
                    })
                  }
                  className="p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white font-mono"
                  placeholder="Wallet Address"
                />
                <input
                  type="text"
                  value={createForm.participantTwo.zoraProfile}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantTwo: {
                        ...createForm.participantTwo,
                        zoraProfile: e.target.value,
                      },
                    })
                  }
                  className="p-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                  placeholder="Zora Profile (optional)"
                />
              </div>
            </div>

            <button
              onClick={createContest}
              disabled={
                loading ||
                !createForm.name ||
                !createForm.participantOne.handle ||
                !createForm.participantTwo.handle
              }
              className="w-full p-3 bg-[#67CE67] text-black font-medium rounded hover:bg-[#5AB85A] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Contest"}
            </button>
          </div>
        </div>

        {/* All Contests */}
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6">
          <h2 className="text-xl font-bold text-white mb-4">All Contests</h2>

          {contests.length === 0 ? (
            <p className="text-gray-400">No contests found</p>
          ) : (
            <div className="space-y-4">
              {contests.map((contest) => (
                <div
                  key={contest.contestId}
                  className="bg-[#2A2A2A] p-4 rounded"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-medium">{contest.name}</h3>
                      <p className="text-gray-400 text-sm font-mono">
                        {contest.contestId}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-[#3A3A3A] text-white text-sm rounded">
                      {contest.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {contest.participants.map((participant) => (
                      <div key={participant.walletAddress}>
                        <p className="text-white">{participant.handle}</p>
                        <p className="text-gray-400 font-mono">
                          {participant.walletAddress}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
