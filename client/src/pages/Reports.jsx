import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Droplets,
  CalendarDays,
  RefreshCw,
  ClipboardList
} from "lucide-react";

import { readingAPI } from "../services/api";

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const slotLabels = {
  MORNING: "Morning (Fasting)",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner"
};

function Reports() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [reportType, setReportType] = useState("daily");

  const fetchReadings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await readingAPI.getAll();
      setReadings(response.data.readings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your glucose reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const reportDetails = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);

    const selected = new Date(year, month - 1, day);

    let startDate;
    let endDate;
    let title;
    let description;

    if (reportType === "daily") {
      startDate = selectedDate;
      endDate = selectedDate;
      title = "Daily Report";
      description = `Glucose readings for ${selected.toLocaleDateString(
        "en-IN",
        { day: "numeric", month: "long", year: "numeric" }
      )}`;
    } else if (reportType === "monthToDate") {
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = selectedDate;
      title = "Month-to-date Report";
      description = `From ${selected.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
      })} 1 to ${selected.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })}`;
    } else {
      const previousMonth = new Date(year, month - 2, 1);
      const previousMonthYear = previousMonth.getFullYear();
      const previousMonthNumber = previousMonth.getMonth() + 1;

      const lastDay = new Date(
        previousMonthYear,
        previousMonthNumber,
        0
      ).getDate();

      startDate = `${previousMonthYear}-${String(
        previousMonthNumber
      ).padStart(2, "0")}-01`;

      endDate = `${previousMonthYear}-${String(
        previousMonthNumber
      ).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      title = "Previous Month Report";
      description = previousMonth.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
      });
    }

    const filteredReadings = readings
      .filter((reading) => {
        const date = reading.readingDate.slice(0, 10);
        return date >= startDate && date <= endDate;
      })
      .sort((a, b) => {
        const dateComparison = b.readingDate.localeCompare(
          a.readingDate
        );

        if (dateComparison !== 0) return dateComparison;

        return a.slot.localeCompare(b.slot);
      });

    const values = filteredReadings.map(
      (reading) => reading.glucoseValue
    );

    const count = values.length;

    const average = count
      ? (
          values.reduce((sum, value) => sum + value, 0) /
          count
        ).toFixed(1)
      : "0.0";

    return {
      title,
      description,
      startDate,
      endDate,
      readings: filteredReadings,
      count,
      average,
      highest: count ? Math.max(...values) : 0,
      lowest: count ? Math.min(...values) : 0
    };
  }, [readings, selectedDate, reportType]);

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

  return (
    <section className="reports-page">
      <header className="reports-page-header">
        <div>
          <span className="dashboard-eyebrow">
            HEALTH INSIGHTS
          </span>
          <h1>Reports & Analytics</h1>
          <p>
            Understand your glucose readings through detailed reports.
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

      <section className="report-filter-card">
        <div className="report-tabs">
          <button
            type="button"
            className={reportType === "daily" ? "active" : ""}
            onClick={() => setReportType("daily")}
          >
            Daily
          </button>

          <button
            type="button"
            className={reportType === "monthToDate" ? "active" : ""}
            onClick={() => setReportType("monthToDate")}
          >
            Month to date
          </button>

          <button
            type="button"
            className={reportType === "previousMonth" ? "active" : ""}
            onClick={() => setReportType("previousMonth")}
          >
            Previous month
          </button>
        </div>

        <div className="report-date-filter">
          <label htmlFor="reportDate">
            <CalendarDays size={17} />
            Select date
          </label>

          <input
            id="reportDate"
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section className="report-results-heading">
        <div>
          <h2>{reportDetails.title}</h2>
          <p>{reportDetails.description}</p>
        </div>
      </section>

      <section className="dashboard-stats report-stats">
        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Total readings</span>
            <div className="stat-card-icon blue">
              <Droplets size={21} />
            </div>
          </div>
          <strong>
            {loading ? "—" : reportDetails.count}
          </strong>
          <p>Recorded measurements</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Average glucose</span>
            <div className="stat-card-icon purple">
              <Activity size={21} />
            </div>
          </div>
          <strong>
            {loading ? "—" : reportDetails.average}
          </strong>
          <p>mg/dl · Average value</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Highest reading</span>
            <div className="stat-card-icon orange">
              <TrendingUp size={21} />
            </div>
          </div>
          <strong>
            {loading ? "—" : reportDetails.highest}
          </strong>
          <p>mg/dl · Maximum value</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-card-top">
            <span>Lowest reading</span>
            <div className="stat-card-icon green">
              <TrendingDown size={21} />
            </div>
          </div>
          <strong>
            {loading ? "—" : reportDetails.lowest}
          </strong>
          <p>mg/dl · Minimum value</p>
        </article>
      </section>

      <section className="report-readings-card">
        <div className="report-readings-heading">
          <div>
            <h2>Reading Details</h2>
            <p>
              {reportDetails.count} measurement
              {reportDetails.count === 1 ? "" : "s"} in this report
            </p>
          </div>
        </div>

        {loading ? (
          <div className="readings-empty">
            <RefreshCw size={24} />
            <p>Generating your report...</p>
          </div>
        ) : reportDetails.count === 0 ? (
          <div className="readings-empty">
            <ClipboardList size={32} />
            <h3>No readings found</h3>
            <p>
              There are no glucose readings for this reporting period.
              Try selecting another date or report.
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
                {reportDetails.readings.map((reading) => (
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
    </section>
  );
}

export default Reports;
