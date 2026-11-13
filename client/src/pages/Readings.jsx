import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Droplets,
  RefreshCw
} from "lucide-react";

import { readingAPI } from "../services/api";

const slots = [
  { value: "MORNING", label: "Morning (Fasting)" },
  { value: "AFTER_BREAKFAST", label: "After breakfast" },
  { value: "AFTER_LUNCH", label: "After lunch" },
  { value: "AFTER_DINNER", label: "After dinner" }
];

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function Readings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    readingDate: getToday(),
    slot: "MORNING",
    glucoseValue: ""
  });

  const fetchReadings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await readingAPI.getAll();
      setReadings(response.data.readings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load glucose readings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

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

  const getSlotLabel = (slot) => {
    return slots.find((item) => item.value === slot)?.label || slot;
  };

  const resetForm = () => {
    setFormData({
      readingDate: getToday(),
      slot: "MORNING",
      glucoseValue: ""
    });

    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const openAddForm = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (reading) => {
    setFormData({
      readingDate: reading.readingDate.slice(0, 10),
      slot: reading.slot,
      glucoseValue: String(reading.glucoseValue)
    });

    setEditingId(reading.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (formData.glucoseValue.trim() === "") {
      setError("Please enter a glucose value.");
      return;
    }

    const value = Number(formData.glucoseValue);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setError("Value must be between 40 and 600 mg/dl.");
      return;
    }

    const payload = {
      readingDate: formData.readingDate,
      slot: formData.slot,
      glucoseValue: value
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await readingAPI.update(editingId, payload);
        setSuccess("Glucose reading updated successfully.");
      } else {
        await readingAPI.create(payload);
        setSuccess("Glucose reading added successfully.");
      }

      resetForm();
      await fetchReadings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save glucose reading."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this glucose reading?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await readingAPI.delete(id);

      setSuccess("Glucose reading deleted successfully.");

      await fetchReadings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete glucose reading."
      );
    }
  };

  return (
    <section className="readings-page">
      <header className="readings-page-header">
        <div>
          <span className="dashboard-eyebrow">
            HEALTH RECORDS
          </span>

          <h1>Glucose Readings</h1>

          <p>
            Manage and monitor your blood glucose measurements.
          </p>
        </div>

        <button
          type="button"
          className="add-reading-button"
          onClick={openAddForm}
        >
          <Plus size={19} />
          Add Reading
        </button>
      </header>

      {error && (
        <div className="reading-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="reading-alert success" role="status">
          {success}
        </div>
      )}

      {showForm && (
        <div className="reading-form-card">
          <div className="reading-form-heading">
            <div>
              <h2>
                {editingId ? "Edit Reading" : "Add New Reading"}
              </h2>
              <p>Enter your glucose measurement details.</p>
            </div>

            <button
              type="button"
              className="close-form-button"
              onClick={resetForm}
              aria-label="Close form"
            >
              <X size={21} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="reading-form-grid">
              <div className="reading-field">
                <label htmlFor="readingDate">Reading date</label>
                <div className="reading-input-wrapper">
                  <CalendarDays size={18} />
                  <input
                    id="readingDate"
                    name="readingDate"
                    type="date"
                    value={formData.readingDate}
                    max={getToday()}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="reading-field">
                <label htmlFor="slot">Time slot</label>
                <select
                  id="slot"
                  name="slot"
                  value={formData.slot}
                  onChange={handleChange}
                  required
                >
                  {slots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reading-field">
                <label htmlFor="glucoseValue">
                  Glucose value (mg/dl)
                </label>
                <div className="reading-input-wrapper">
                  <Droplets size={18} />
                  <input
                    id="glucoseValue"
                    name="glucoseValue"
                    type="number"
                    min="40"
                    max="600"
                    step="1"
                    placeholder="Enter value (40–600)"
                    value={formData.glucoseValue}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="reading-form-actions">
              <button
                type="button"
                className="cancel-reading-button"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-reading-button"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Update Reading"
                    : "Save Reading"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="readings-list-card">
        <div className="readings-list-heading">
          <div>
            <h2>All Readings</h2>
            <p>
              {readings.length} recorded measurement
              {readings.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={fetchReadings}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="readings-empty">
            <RefreshCw size={24} />
            <p>Loading readings...</p>
          </div>
        ) : readings.length === 0 ? (
          <div className="readings-empty">
            <Droplets size={30} />
            <h3>No readings recorded yet</h3>
            <p>Add your first glucose reading to get started.</p>
          </div>
        ) : (
          <div className="readings-table-wrapper">
            <table className="readings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time slot</th>
                  <th>Glucose value</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td>
                      <span className="reading-date">
                        <CalendarDays size={16} />
                        {formatDate(reading.readingDate)}
                      </span>
                    </td>

                    <td>{getSlotLabel(reading.slot)}</td>

                    <td>
                      <strong className="reading-value">
                        {reading.glucoseValue} mg/dl
                      </strong>
                    </td>

                    <td>
                      <div className="reading-actions">
                        <button
                          type="button"
                          className="edit-reading-button"
                          onClick={() => openEditForm(reading)}
                          aria-label="Edit reading"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="delete-reading-button"
                          onClick={() => handleDelete(reading.id)}
                          aria-label="Delete reading"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Readings;
