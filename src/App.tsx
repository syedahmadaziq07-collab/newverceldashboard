import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  QueueItem,
  Match,
  Referral,
  BotSettings,
  BotLog,
  DashboardStats,
  BroadcastStats,
  AdminNotification
} from "./types";

import LoginView from "./components/LoginView";
import DashboardLayout from "./components/DashboardLayout";
import HomeView from "./components/HomeView";
import UsersView from "./components/UsersView";
import QueueView from "./components/QueueView";
import MatchesView from "./components/MatchesView";
import BroadcastView from "./components/BroadcastView";
import ReferralView from "./components/ReferralView";
import SettingsView from "./components/SettingsView";
import LogsView from "./components/LogsView";
import HistoryView from "./components/HistoryView";
import AnalyticsView from "./components/AnalyticsView";

import { api, getStoredToken, clearToken } from "./lib/api";

const TOKEN_KEY = "cutpricebot_admin_token";

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [activePage, setActivePage] = useState<string>("home");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    setActivePage("home");
  };

  const handleLogout = useCallback(() => {
    clearToken();
    setAuthToken(null);
    setStats(null);
    setUsers([]);
    setQueues([]);
    setMatches([]);
    setLogs([]);
    setNotifications([]);
  }, []);

  const fetchDomainData = useCallback(
    async (domain: string, forceSilent = false) => {
      if (!getStoredToken()) return;
      if (!forceSilent) setLoading(true);
      if (!forceSilent) setError(null);

      try {
        const raw = await api.get<{ success: boolean; data: any }>(
          `/api/admin/${domain}`
        );
        const payload = raw.data;

        switch (domain) {
          case "stats":
            setStats(payload);
            break;
          case "users":
            setUsers(Array.isArray(payload) ? payload : []);
            break;
          case "queue":
            setQueues(Array.isArray(payload) ? payload : []);
            break;
          case "matches":
            setMatches(Array.isArray(payload) ? payload : []);
            break;
          case "referrals":
            setReferrals(Array.isArray(payload) ? payload : []);
            break;
          case "settings":
            setSettings(payload);
            break;
          case "logs":
            setLogs(Array.isArray(payload) ? payload : []);
            break;
          case "notifications":
            setNotifications(Array.isArray(payload) ? payload : []);
            break;
        }
      } catch (err: any) {
        if (err?.code === 401) {
          handleLogout();
          return;
        }
        console.error(`[fetch] ${domain}:`, err);
        if (!forceSilent) setError(err.message || `Failed to load ${domain}`);
      } finally {
        if (!forceSilent) setLoading(false);
      }
    },
    [handleLogout]
  );

  const refreshActiveTab = useCallback(
    (forceSilent = false) => {
      fetchDomainData("stats", forceSilent);
      fetchDomainData("notifications", forceSilent);

      if (activePage === "home") {
        // stats already fetched
      } else if (activePage === "users") {
        fetchDomainData("users", forceSilent);
      } else if (activePage === "queue") {
        fetchDomainData("queue", forceSilent);
      } else if (activePage === "matches") {
        fetchDomainData("matches", forceSilent);
      } else if (activePage === "broadcast") {
        fetchDomainData("users", forceSilent);
      } else if (activePage === "referrals") {
        fetchDomainData("referrals", forceSilent);
      } else if (activePage === "settings") {
        fetchDomainData("settings", forceSilent);
      } else if (activePage === "logs") {
        fetchDomainData("logs", forceSilent);
      } else if (activePage === "history") {
        fetchDomainData("matches", forceSilent);
      } else if (activePage === "analytics") {
        fetchDomainData("users", forceSilent);
        fetchDomainData("matches", forceSilent);
      }
    },
    [activePage, fetchDomainData]
  );

  useEffect(() => {
    if (authToken) refreshActiveTab();
  }, [authToken, activePage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => refreshActiveTab(true), 10_000);
    return () => clearInterval(interval);
  }, [authToken, activePage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ACTION HANDLERS ────────────────────────────────────────────────────────

  const handleUserAction = async (userId: string, action: string, payload?: any) => {
    if (!authToken) return;
    setError(null);
    try {
      const res = await api.post<{ success: boolean; message?: string }>(
        "/api/admin/users/action",
        { userId, action, payload }
      );
      if (res.success) {
        await Promise.all([
          fetchDomainData("users", true),
          fetchDomainData("stats", true),
          fetchDomainData("logs", true),
        ]);
      }
    } catch (err: any) {
      console.error("[userAction]", err);
      alert(err.message || "Action failed");
      throw err;
    }
  };

  const handleResolveNotification = async (notificationId: string) => {
    if (!authToken) return;
    try {
      await api.post("/api/admin/notifications/resolve", { notificationId });
      fetchDomainData("notifications", true);
    } catch (err) {
      console.error("[resolveNotification]", err);
    }
  };

  const handleQueueAction = async (queueId: string | null, action: string) => {
    if (!authToken) return;
    setError(null);
    try {
      await api.post("/api/admin/queue/action", {
        action,
        telegramId: queueId,
        telegramIdA: queueId,
      });
      await Promise.all([
        fetchDomainData("queue", true),
        fetchDomainData("stats", true),
        fetchDomainData("logs", true),
      ]);
    } catch (err: any) {
      console.error("[queueAction]", err);
      alert(err.message || "Action failed");
      throw err;
    }
  };

  const handleMatchAction = async (
    matchId: string,
    action: string,
    verdict?: "approve" | "reject"
  ) => {
    if (!authToken) return;
    setError(null);
    try {
      await api.post("/api/admin/matches/action", { matchId, action, verdict });
      await Promise.all([
        fetchDomainData("matches", true),
        fetchDomainData("stats", true),
        fetchDomainData("logs", true),
      ]);
    } catch (err: any) {
      console.error("[matchAction]", err);
      alert(err.message || "Action failed");
      throw err;
    }
  };

  const handleSendBroadcast = async (
    target: string,
    message: string
  ): Promise<BroadcastStats> => {
    if (!authToken) throw new Error("Unauthenticated");
    try {
      const res = await api.post<{ success: boolean; data: BroadcastStats }>(
        "/api/admin/broadcast",
        { target, message }
      );
      fetchDomainData("stats", true);
      fetchDomainData("logs", true);
      return res.data;
    } catch (err: any) {
      console.error("[broadcast]", err);
      alert(err.message || "Broadcast dispatch issue");
      throw err;
    }
  };

  const handleSaveSettings = async (newSettings: BotSettings) => {
    if (!authToken) return;
    try {
      const res = await api.post<{ success: boolean; data: BotSettings }>(
        "/api/admin/settings",
        newSettings
      );
      setSettings(res.data);
      fetchDomainData("logs", true);
    } catch (err: any) {
      console.error("[saveSettings]", err);
      alert(err.message || "Saving settings failed");
      throw err;
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  const renderPageContent = () => {
    switch (activePage) {
      case "home":
        return <HomeView stats={stats} onNavigate={setActivePage} />;
      case "users":
        return (
          <UsersView
            users={users}
            loading={loading}
            onUserAction={handleUserAction}
            onRefresh={() => fetchDomainData("users")}
          />
        );
      case "queue":
        return (
          <QueueView
            queues={queues}
            loading={loading}
            onQueueAction={handleQueueAction}
            onRefresh={() => fetchDomainData("queue")}
          />
        );
      case "matches":
        return (
          <MatchesView
            matches={matches}
            loading={loading}
            onMatchAction={handleMatchAction}
            onRefresh={() => fetchDomainData("matches")}
          />
        );
      case "broadcast":
        return (
          <BroadcastView users={users} onSendBroadcast={handleSendBroadcast} />
        );
      case "referrals":
        return <ReferralView referrals={referrals} loading={loading} />;
      case "settings":
        return (
          <SettingsView
            initialSettings={settings}
            onSave={handleSaveSettings}
            onRefresh={() => fetchDomainData("settings")}
          />
        );
      case "logs":
        return (
          <LogsView
            logs={logs}
            loading={loading}
            onRefresh={() => fetchDomainData("logs")}
          />
        );
      case "history":
        return (
          <HistoryView
            matches={matches}
            loading={loading}
            onRefresh={() => fetchDomainData("matches")}
          />
        );
      case "analytics":
        return (
          <AnalyticsView
            users={users}
            matches={matches}
            onRefresh={() => {
              fetchDomainData("users", true);
              fetchDomainData("matches", true);
            }}
          />
        );
      default:
        return <HomeView stats={stats} onNavigate={setActivePage} />;
    }
  };

  if (!authToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={handleLogout}
      notifications={notifications}
      onResolveNotification={handleResolveNotification}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-[11px] font-bold flex justify-between items-center shrink-0">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-slate-400 font-bold hover:text-slate-600"
          >
            Close
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {renderPageContent()}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}
