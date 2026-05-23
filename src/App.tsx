import { useState, useEffect } from "react";
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

// Component imports
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

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("cutpricebot_admin_token");
  });

  const [activePage, setActivePage] = useState<string>("home");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // States for all domains
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  // Automatic token persistence
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem("cutpricebot_admin_token", token);
    setAuthToken(token);
    setActivePage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("cutpricebot_admin_token");
    setAuthToken(null);
    setStats(null);
    setUsers([]);
    setQueues([]);
    setMatches([]);
    setLogs([]);
    setNotifications([]);
  };

  // Automated fetch coordinator hitting secure endpoints with token header
  const fetchDomainData = async (domain: string, forceSilent = false) => {
    if (!authToken) return;
    if (!forceSilent) setLoading(true);
    setError(null);

    const headers = {
      "Authorization": authToken,
      "Content-Type": "application/json"
    };

    try {
      let endpoint = `/api/admin/${domain}`;
      const response = await fetch(endpoint, { headers });
      
      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch ${domain} dataset`);
      }

      const data = await response.json();

      switch (domain) {
        case "stats":
          setStats(data);
          break;
        case "users":
          setUsers(data);
          break;
        case "queue":
          setQueues(data);
          break;
        case "matches":
          setMatches(data);
          break;
        case "referrals":
          setReferrals(data);
          break;
        case "settings":
          setSettings(data);
          break;
        case "logs":
          setLogs(data);
          break;
        case "notifications":
          setNotifications(data);
          break;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      if (!forceSilent) setLoading(false);
    }
  };

  // Refresh current domain depending on active tab
  const refreshActiveTab = (forceSilent = false) => {
    fetchDomainData("stats", forceSilent); // Always sync stats
    fetchDomainData("notifications", forceSilent); // Always sync notifications
    
    if (activePage === "home") {
      fetchDomainData("stats", forceSilent);
    } else if (activePage === "users") {
      fetchDomainData("users", forceSilent);
    } else if (activePage === "queue") {
      fetchDomainData("queue", forceSilent);
    } else if (activePage === "matches") {
      fetchDomainData("matches", forceSilent);
    } else if (activePage === "broadcast") {
      fetchDomainData("users", forceSilent); // Needed for calculations
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
  };

  // Sync state whenever active token is loaded or page changes
  useEffect(() => {
    if (authToken) {
      refreshActiveTab();
    }
  }, [authToken, activePage]);

  // Periodic poll to keep dashboard fresh silently (every 10 seconds)
  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => {
      refreshActiveTab(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [authToken, activePage]);

  // ==========================================
  // COMPONENT ACTION HANDLERS
  // ==========================================

  const handleUserAction = async (userId: string, action: string, payload?: any) => {
    if (!authToken) return;
    setError(null);
    try {
      const response = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, action, payload })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Action failed");
      }

      const res = await response.json();
      if (res.success) {
        // Sync lists and statistics
        setUsers(res.users);
        fetchDomainData("stats", true);
        fetchDomainData("logs", true);
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
      throw err;
    }
  };

  const handleResolveNotification = async (notificationId: string) => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/admin/notifications/resolve", {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });
      if (response.ok) {
        const res = await response.json();
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQueueAction = async (queueId: string | null, action: string) => {
    if (!authToken) return;
    setError(null);
    try {
      const response = await fetch("/api/admin/queue/action", {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ queueId, action })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Action failed");
      }

      const res = await response.json();
      if (res.success) {
        setQueues(res.queues);
        fetchDomainData("stats", true);
        fetchDomainData("logs", true);
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
      throw err;
    }
  };

  const handleMatchAction = async (matchId: string, action: string, verdict?: "approve" | "reject") => {
    if (!authToken) return;
    setError(null);
    try {
      const response = await fetch("/api/admin/matches/action", {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ matchId, action, verdict })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Action failed");
      }

      const res = await response.json();
      if (res.success) {
        setMatches(res.matches);
        fetchDomainData("stats", true);
        fetchDomainData("logs", true);
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
      throw err;
    }
  };

  const handleSendBroadcast = async (target: string, message: string): Promise<BroadcastStats> => {
    if (!authToken) throw new Error("Unauthenticated");
    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ target, message })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Broadcast delivery failed");
      }

      const res = await response.json();
      fetchDomainData("stats", true);
      fetchDomainData("logs", true);
      return res.stats;
    } catch (err: any) {
      alert(err.message || "Broadcast dispatch issue");
      throw err;
    }
  };

  const handleSaveSettings = async (newSettings: BotSettings) => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const res = await response.json();
      setSettings(res.settings);
      fetchDomainData("logs", true);
    } catch (err: any) {
      alert(err.message || "Saving settings failed");
      throw err;
    }
  };

  // Render correct nested dashboard screen view
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
          <BroadcastView 
            users={users} 
            onSendBroadcast={handleSendBroadcast} 
          />
        );
      case "referrals":
        return (
          <ReferralView 
            referrals={referrals} 
            loading={loading} 
          />
        );
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

  // Unauthorised wall
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
      {/* Scrollable alerts warnings */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-[11px] font-bold flex justify-between items-center shrink-0">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-slate-400 font-bold hover:text-slate-600">Close</button>
        </div>
      )}

      {/* Screen swap transitions with lazy loading checks */}
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
