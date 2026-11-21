
import { useState } from "react";
import {
  updateProfile,
  updatePassword,
  signOut
} from "firebase/auth";

import { auth } from "../firebase";

function Profile({ user, onClose }) {
  const [name, setName] = useState(user.displayName || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateName = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updateProfile(user, {
        displayName: name
      });
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updatePassword(user, password);
      setPassword("");
      setMessage("Password changed successfully!");
    } catch (error) {
      setMessage(
        error.code === "auth/requires-recent-login"
          ? "Please log out and log in again before changing your password."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>
            {(user.displayName || user.email || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>
            Welcome to SUPERB MEGA GROUP
          </p>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.label}>EMAIL ADDRESS</p>
          <p style={styles.email}>{user.email}</p>

          <p style={styles.label}>ACCOUNT NAME</p>
          <p style={styles.email}>
            {user.displayName || "Not set"}
          </p>
        </div>

        <form onSubmit={updateName} style={styles.form}>
          <h3 style={styles.heading}>Update Name</h3>

          <input
            style={styles.input}
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <button
            style={styles.primaryButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Update Profile"}
          </button>
        </form>

        <div style={styles.line}></div>

        <form onSubmit={changePassword} style={styles.form}>
          <h3 style={styles.heading}>Change Password</h3>

          <input
            style={styles.input}
            type="password"
            placeholder="New Password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <button
            style={styles.primaryButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Change Password"}
          </button>
        </form>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <button style={styles.backButton} onClick={onClose}>
          ← Back to Home
        </button>

        <button style={styles.logoutButton} onClick={deleteSession}>
          Logout
        </button>

        <p style={styles.footer}>
          © 2026 SUPERB MEGA GROUP
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #071f17, #123d2c, #071f17)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "35px 15px",
    boxSizing: "border-box"
  },
  card: {
    width: "100%",
    maxWidth: "470px",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "32px",
    boxSizing: "border-box",
    boxShadow: "0 15px 45px rgba(0,0,0,0.3)"
  },
  header: {
    textAlign: "center",
    marginBottom: "25px"
  },
  avatar: {
    width: "85px",
    height: "85px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #d4af37, #f5df91)",
    color: "#123d2c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    fontWeight: "bold",
    margin: "0 auto 15px",
    border: "4px solid #123d2c"
  },
  title: {
    color: "#123d2c",
    margin: "0",
    fontSize: "30px"
  },
  subtitle: {
    color: "#777",
    fontSize: "14px",
    marginTop: "8px"
  },
  infoBox: {
    background: "#f1f7f3",
    borderRadius: "13px",
    padding: "18px",
    marginBottom: "25px",
    borderLeft: "4px solid #d4af37"
  },
  label: {
    color: "#a17d16",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "5px"
  },
  email: {
    color: "#123d2c",
    fontWeight: "600",
    marginTop: "0",
    marginBottom: "17px",
    overflowWrap: "anywhere"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px"
  },
  heading: {
    color: "#123d2c",
    margin: "0",
    fontSize: "18px"
  },
  input: {
    padding: "13px",
    border: "1px solid #d5dfd8",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  },
  primaryButton: {
    padding: "13px",
    border: "none",
    borderRadius: "9px",
    background: "linear-gradient(135deg, #123d2c, #20734e)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px"
  },
  line: {
    height: "1px",
    background: "#e5e5e5",
    margin: "22px 0"
  },
  message: {
    background: "#f1f7f3",
    color: "#123d2c",
    padding: "12px",
    borderRadius: "9px",
    marginBottom: "15px",
    fontSize: "14px",
    overflowWrap: "anywhere"
  },
  backButton: {
    width: "100%",
    padding: "13px",
    border: "2px solid #123d2c",
    borderRadius: "9px",
    background: "white",
    color: "#123d2c",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "10px"
  },
  logoutButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "9px",
    background: "#b83232",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },
  footer: {
    textAlign: "center",
    color: "#999",
    fontSize: "11px",
    marginTop: "22px",
    marginBottom: "0"
  }
};

export default Profile;
