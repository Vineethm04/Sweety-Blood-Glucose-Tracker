import { useEffect, useState } from "react";
import {
  Activity,
  HeartPulse,
  Mail,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

import { authAPI } from "./services/api";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const token =
        localStorage.getItem("sweety_token") ||
        sessionStorage.getItem("sweety_token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
      } catch {
        localStorage.removeItem("sweety_token");
        sessionStorage.removeItem("sweety_token");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (isSignup) {
        response = await authAPI.register({
          name: name.trim(),
          email: email.trim(),
          password
        });
      } else {
        response = await authAPI.login({
          email: email.trim(),
          password
        });
      }

      const { token, user: authenticatedUser } = response.data;

      localStorage.removeItem("sweety_token");
      sessionStorage.removeItem("sweety_token");

      if (rememberMe) {
        localStorage.setItem("sweety_token", token);
      } else {
        sessionStorage.setItem("sweety_token", token);
      }

      setUser(authenticatedUser);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sweety_token");
    sessionStorage.removeItem("sweety_token");

    setUser(null);
    setPassword("");
    setError("");
    setIsSignup(false);
  };

  const switchAuthMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  if (checkingSession) {
    return (
      <div className="auth-loading">
        <Activity size={32} />
        <p>Loading Sweety...</p>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={25} />
          </div>
          <span>Sweety</span>
        </div>

        <div className="visual-content">
          <div className="visual-tag">
            <HeartPulse size={16} />
            Your health, in focus
          </div>

          <h1>
            Take control of
            <br />
            your <span>health journey.</span>
          </h1>

          <p>
            Track your blood glucose levels, understand your
            patterns, and make informed decisions about your
            health — all in one place.
          </p>

          <div className="visual-stats">
            <div className="stat-icon">
              <Activity size={23} />
            </div>
            <div>
              <strong>Every reading matters.</strong>
              <span>Small steps towards better health.</span>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          <ShieldCheck size={17} />
          Your health data deserves to stay private.
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <div className="brand-icon">
              <Activity size={23} />
            </div>
            <span>Sweety</span>
          </div>

          <div className="form-heading">
            <span className="eyebrow">
              {isSignup ? "GET STARTED" : "WELCOME BACK"}
            </span>

            <h2>
              {isSignup ? "Create your account" : "Welcome back!"}
            </h2>

            <p>
              {isSignup
                ? "Create an account to start tracking your health."
                : "Sign in to continue your health journey."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <div className="input-wrapper">
                  <UserRound size={19} />
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <Mail size={19} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <LockKeyhole size={19} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {!isSignup && (
              <div className="form-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                  />
                  Remember me
                </label>

                <span className="forgot-password">
                  Forgot password?
                </span>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}

              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="auth-switch">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}

            <button type="button" onClick={switchAuthMode}>
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </div>

          <div className="form-footer">
            <ShieldCheck size={16} />
            Secure access to your personal health dashboard
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
