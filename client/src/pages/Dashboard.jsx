import { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Droplets,
  CalendarDays,
  RefreshCw
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Readings from "./Readings";
import { readingAPI } from "../services/api";

function Dashboard({ user, onLogout }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  const fetchReadings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await readingAPI.getAll();
      setReadings(response.data.readings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your glucose readings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const values = readings.map((reading) => reading.glucoseValue);
  const totalReadings = values.length;

  const average = totalReadings
    ? (
        values.reduce((sum, value) => sum + value, 0) /
        totalReadings
      ).toFixed(1)
    : "0.0";

  const highest = totalReadings ? Math.max(...values) : 0;
  const lowest = totalReadings ? Math.min(...values) : 0;

  const recentReadings = readings.slice(0, 5);

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.slice(0, 10).split("-");

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const slotLabels = {
    MORNING: "Morning (Fasting)",
    AFTER_BREAKFAST: "After breakfast",
    AFTER_LUNCH: "After lunch",
    AFTER_DINNER: "After dinner"
  };

  const renderDashboard = () => (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            YOUR HEALTH OVERVIEW
          </span>
          <h1>Hello, {user?.name?.split(" ")[0] || "there"}!</h1>
          <p>
            Here's an overview of your blood glucose readings.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchReadings}
          disabled={loading}
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Total readings</span>
            <div className="stat-card-icon blue">
              <Droplets size={21} />
            </div>
          </div>
          <strong>{loading ? "—" : totalReadings}</strong>
          <p>All recorded readings</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Average glucose</span>
            <div className="stat-card-icon purple">
              <Activity size={21} />
            </div>
          </div>
          <strong>{loading ? "—" : average}</strong>
          <p>mg/dl · All readings</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Highest reading</span>
            <div className="stat-card-icon orange">
              <TrendingUp size={21} />
            </div>
          </div>
          <strong>{loading ? "—" : highest}</strong>
          <p>mg/dl · Recorded maximum</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Lowest reading</span>
            <div className="stat-card-icon green">
              <TrendingDown size={21} />
            </div>
          </div>
          <strong>{loading ? "—" : lowest}</strong>
          <p>mg/dl · Recorded minimum</p>
        </article>
      </section>

      <section className="recent-readings-section">
        <div className="section-heading">
          <div>
            <h2>Recent readings</h2>
            <p>Your latest recorded glucose measurements</p>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() => setActivePage("readings")}
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="dashboard-empty">
            <RefreshCw size={22} />
            <p>Loading your readings...</p>
          </div>
        ) : recentReadings.length === 0 ? (
          <div className="dashboard-empty">
            <Droplets size={28} />
            <h3>No readings yet</h3>
            <p>
              Your glucose readings will appear here once you add them.
            </p>
          </div>
        ) : (
          <div className="readings-table-wrapper">
            <table className="readings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time slot</th>
                  <th>Glucose value</th>
                </tr>
              </thead>

              <tbody>
                {recentReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td>
                      <span className="reading-date">
                        <CalendarDays size={16} />
                        {formatDate(reading.readingDate)}
                      </span>
                    </td>
                    <td>
                      {slotLabels[reading.slot] || reading.slot}
                    </td>
                    <td>
                      <strong className="reading-value">
                        {reading.glucoseValue} mg/dl
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="dashboard-footer">
        <p>Sweety Health Tracker · Your health, in focus.</p>
      </footer>
    </>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        {activePage === "dashboard" && renderDashboard()}

        {activePage === "readings" && <Readings />}

        {activePage === "reports" && (
          <section className="readings-page">
            <span className="dashboard-eyebrow">HEALTH INSIGHTS</span>
            <h1>Reports & Analytics</h1>
            <p>We're preparing your glucose reports.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
