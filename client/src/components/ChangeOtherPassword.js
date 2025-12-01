import React, { useState } from "react";

export default function ChangeOtherPassword() {
    const [newPass, setNewPass] = useState("");
    const [userID, setUserID] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`/api/admin/user/${userID}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ newPass })
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
            <h2>Reset User Password</h2>
            <form onSubmit={submit}>
                <label>
                    User ID:
                    <input type="text" required value={userID} onChange={(e) => setUserID(e.target.value)} />
                </label>
                <br />
                <label>
                    New Password:
                    <input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                </label>
                <br />
                <button type="submit">Update Password</button>
            </form>
        </div>
    );
}