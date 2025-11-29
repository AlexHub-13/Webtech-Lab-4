import React, { useState } from "react";

export default function ChangePassword({ pendingToken, onLogout }) {
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        if (newPass !== confirm) {
            setMessage("New passwords do not match.");
            return;
        }

        const token = pendingToken || localStorage.getItem("token");

        try {
            const res = await fetch("/api/secure/changePassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ oldPass, newPass })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Error updating password");
            } else {
                setMessage("Password updated successfully!");
                setOldPass("");
                setNewPass("");
                setConfirm("");

                onLogout();
            }
        } catch {
            setMessage("Network error");
        }
    };

    return (
        <div>
            <h2>Change Password</h2>
            <form onSubmit={submit}>
                <label>
                    Current Password:
                    <input
                        type="password"
                        required
                        value={oldPass}
                        onChange={(e) => setOldPass(e.target.value)}
                    />
                </label>
                <br />

                <label>
                    New Password:
                    <input
                        type="password"
                        required
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                    />
                </label>
                <br />

                <label>
                    Confirm New Password:
                    <input
                        type="password"
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </label>
                <br />

                <button type="submit">Update Password</button>

                {message && <p>{message}</p>}
            </form>
        </div>
    );
}