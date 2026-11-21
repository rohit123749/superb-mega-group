
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

import { auth } from "../firebase";
import "./Auth.css";

function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await createUserWithEmailAndPassword(
          auth, email, password
        );

        await updateProfile(result.user, {
          displayName: name
        });

        setMessage("Registration Successful!");
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Login Successful!");
      } else {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent. Please check your inbox.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (newMode) => {
    setMessage("");
    setMode(newMode);
    setPassword("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-brand-icon">S</div>
          <h2>SUPERB <span>MEGA GROUP</span></h2>
          <p>PREMIUM SHOPPING EXPERIENCE</p>
        </div>

        <div className="auth-heading">
          <h1>
            {mode === "register"
              ? "Create Account"
              : mode === "forgot"
              ? "Forgot Password?"
              : "Welcome Back!"}
          </h1>

          <p>
            {mode === "register"
              ? "Join us and explore our premium collection."
              : mode === "forgot"
              ? "Enter your email to reset your password."
              : "Login to continue your shopping journey."}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => changeMode("login")}
              type="button"
            >
              Login
            </button>

            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => changeMode("register")}
              type="button"
            >
              Register
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">

          {mode === "register" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="auth-field">
              <label>Password</label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="forgot-row">
              <button
                type="button"
                onClick={() => changeMode("forgot")}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please Wait..."
              : mode === "register"
              ? "CREATE ACCOUNT"
              : mode === "forgot"
              ? "SEND RESET EMAIL"
              : "LOGIN TO ACCOUNT"}
          </button>
        </form>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        <div className="auth-footer">
          {mode === "forgot" ? (
            <button onClick={() => changeMode("login")}>
              ← Back to Login
            </button>
          ) : mode === "login" ? (
            <p>
              New customer?{" "}
              <button onClick={() => changeMode("register")}>
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button onClick={() => changeMode("login")}>
                Login
              </button>
            </p>
          )}
        </div>

        <div className="auth-secure">
          🔒 Secure Authentication
        </div>

      </div>
    </div>
  );
}

export default Auth;
