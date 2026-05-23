import { useState, ReactNode } from "react";
import { 
  Home, 
  Users, 
  Layers, 
  Zap, 
  Megaphone, 
  HeartHandshake, 
  Sliders, 
  Terminal, 
  LogOut, 
  Menu, 
  X,
  Bot,
  Bell,
  Check,
  Flame,
  UserX,
  ShieldCheck,
  RotateCcw,
  History,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdminNotification } from "../types";

interface LayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
  notifications: AdminNotification[];
  onResolveNotification: (id: string) => Promise<void>;
}

export default function DashboardLayout({ 
  activePage, 
  setActivePage, 
  onLogout, 
  children,
  notifications,
  onResolveNotification
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Map of sidebar items
  const menuItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "users", label: "Users List", icon: Users },
    { id: "queue", label: "Queue Waitlist", icon: Layers },
    { id: "matches", label: "Active Swaps", icon: Zap },
    { id: "history", label: "Swap History", icon: History },
    { id: "analytics", label: "Bot Analytics", icon: BarChart3 },
    { id: "broadcast", label: "Broadcast Message", icon: Megaphone },
    { id: "referrals", label: "Referrals Tracker", icon: HeartHandshake },
    { id: "settings", label: "Bot Settings", icon: Sliders },
    { id: "logs", label: "System Logs", icon: Terminal },
  ];

  const handlePageSelect = (pageId: string) => {
    setActivePage(pageId);
    setSidebarOpen(false);
  };

  // Dedicated mobile bottom navigation items
  const bottomNavItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "queue", label: "Queue", icon: Layers },
    { id: "matches", label: "Matches", icon: Zap },
  ];

  const unreadCount = notifications.filter(n => !n.resolved).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "ghost_detected":
        return <Flame className="w-4 h-4 text-orange-500" />;
      case "proof_rejected":
        return <X className="w-4 h-4 text-red-500" />;
      case "swap_completed":
        return <Check className="w-4 h-4 text-emerald-500" />;
      case "ban":
        return <UserX className="w-4 h-4 text-rose-500" />;
      case "stuck_cleanup":
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070c] text-slate-100 antialiased max-w-md mx-auto relative border-x border-slate-900 shadow-2xl min-h-[100dvh]">
      
      {/* 📱 TOP HEADER (Dark Premium OS Style) */}
      <header className="sticky top-0 z-40 bg-[#0b0e17]/90 backdrop-blur-md border-b border-[#1b253b] px-6 py-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-100">
              CutPrice<span className="text-blue-500">Bot</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Control Hub v2.1
              </span>
            </div>
          </div>
        </div>

        {/* Header Interactions */}
        <div className="flex items-center gap-2">
          {/* 🔔 Live Notifications Bell */}
          <button
            onClick={() => setNotificationOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#131a2c] hover:bg-[#1a243d] border border-[#1f2b48] text-slate-300 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[8px] font-bold px-1.5 min-w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0b0e17]">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#131a2c] hover:bg-[#1a243d] border border-[#1f2b48] text-slate-300 transition-colors cursor-pointer"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 🚀 PAGE CONTAINER WITH FULL DYNAMIC VIEWS */}
      <main className="flex-1 overflow-y-auto pb-28 px-4 pt-4 shrink-0">
        {children}
      </main>

      {/* 📱 PREMIUM BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0b0e17]/95 backdrop-blur-md border-t border-[#1b253b] px-6 py-2 pb-5 flex items-center justify-between shadow-lg shadow-slate-950/80">
        {bottomNavItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handlePageSelect(item.id)}
              className="flex flex-col items-center justify-center shrink-0 w-14 py-1 transition-all cursor-pointer group"
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? "text-blue-400 bg-blue-950/40 border border-blue-900/40" 
                  : "text-slate-400 group-hover:text-slate-200"
              }`}>
                <Icon className="w-5.5 h-5.5 stroke-[2]" />
              </div>
              <span className={`text-[10px] font-semibold mt-1 transition-all ${
                isActive ? "text-blue-400 font-bold" : "text-slate-400"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Sliding Menu button to represent the drawer */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center shrink-0 w-14 py-1 transition-all cursor-pointer group"
        >
          <div className="p-1.5 rounded-xl text-slate-400 group-hover:text-slate-200">
            <Menu className="w-5.5 h-5.5 stroke-[2]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">
            Menu
          </span>
        </button>
      </nav>

      {/* 🚪 ADMIN NOTIFICATION CENTER OVERLAY */}
      <AnimatePresence>
        {notificationOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationOpen(false)}
              className="fixed inset-0 z-50 bg-[#020306]/85 max-w-md mx-auto"
            />

            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#0c101c] border-b border-[#222f4d] rounded-b-[28px] p-5 shadow-2xl flex flex-col max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1b253b]">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <span className="font-bold font-display text-slate-100 text-sm">
                    Admin Notification Center
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotificationOpen(false)}
                  className="p-1.5 rounded-lg bg-[#151d30] text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notifications Listing */}
              <div className="py-3 space-y-2.5 overflow-y-auto flex-1 max-h-[50vh]">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No logs or warnings registered in this session.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border text-xs relative overflow-hidden transition-all ${
                        notif.resolved 
                          ? "bg-[#111624]/60 border-[#1c2438] opacity-60" 
                          : "bg-[#141b2c] border-[#253353] shadow-md shadow-[#000000]/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-[#1d263b] shrink-0 mt-0.5">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100">{notif.title}</span>
                            <span className="font-mono text-[9px] text-slate-400">
                              {new Date(notif.timestamp).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-slate-350 leading-relaxed font-sans">{notif.message}</p>
                          
                          {!notif.resolved && (
                            <button
                              onClick={() => onResolveNotification(notif.id)}
                              className="mt-2.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Resolve Threat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🚪 DIRECT DARK SIDEBAR DRAWER OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-[#020306]/85 max-w-md mx-auto"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-xs bg-[#0b0e17] z-50 shadow-2xl flex flex-col border-l border-[#1c2844]"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#1c2844] flex items-center justify-between bg-[#0e1424]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-bold font-display tracking-tight text-slate-100 text-sm">
                    Mod Controls
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-[#1a253e] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Links */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menuItems.map((item) => {
                  const isActive = activePage === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handlePageSelect(item.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-400 hover:bg-[#111726] hover:text-slate-100"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer controls */}
              <div className="p-4 border-t border-[#1c2844] bg-[#0e1424] space-y-3">
                <div className="flex items-center gap-2.5 px-2">
                  <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800/40 flex items-center justify-center font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 leading-none">Global Monitor</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-none font-mono">Port 3000 Secured</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-950/20 rounded-2xl text-sm font-semibold transition-all cursor-pointer mt-2"
                >
                  <LogOut className="w-4.5 h-4.5 shrink-0" />
                  <span>Log Out Portal</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
