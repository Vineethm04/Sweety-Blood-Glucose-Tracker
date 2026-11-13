import {
  Activity,
  LayoutDashboard,
  ClipboardList,
  ChartNoAxesCombined,
  HeartPulse,
  LogOut,
  UserRound
} from "lucide-react";

function Sidebar({ activePage, onNavigate, user, onLogout }) {
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      id: "readings",
      label: "Glucose Readings",
      icon: ClipboardList
    },
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: ChartNoAxesCombined
    }
  ];

  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Activity size={24} />
        </div>

        <div className="sidebar-brand-text">
          <h2>Sweety</h2>
          <span>HEALTH TRACKER</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="sidebar-section">
        <p className="sidebar-label">MENU</p>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${
                  activePage === item.id ? "active" : ""
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* HEALTH TIP */}
      <div className="sidebar-tip">
        <div className="sidebar-tip-icon">
          <HeartPulse size={21} />
        </div>

        <h3>Your health matters!</h3>

        <p>
          Every reading is a step towards understanding
          your health better.
        </p>
      </div>

      {/* USER PROFILE */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <UserRound size={20} />
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={19} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
