import React, { useState } from "react";

import AddNewCourse from "../components/AddCourse.js";
import AddCourseMember from "../components/AddCourseMember.js";
import AddSignup from "../components/AddSignup.js";
import AddUser from "../components/AddUser.js";
import AddSlot from "../components/AddSlot.js";
import AddSlotMember from "../components/AddSlotMember.js";
import ModifyGrade from "../components/ModifyGrade.js";
import ModifySlot from "../components/ModifySlot.js";

export default function LoginPage({ onLogin, onForcePassChange }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/open/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: username, plainPass: password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.message || "Login failed");
                return;
            }

            console.log(data);

            if (data.mustChangePass) {
                onForcePassChange(data.token);
                return;
            }

            onLogin(data.token, data.role);
        } catch (error) {
            setMessage("Network error: " + error.message);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h1>Alex's Course Management Application</h1>
                <p>This site allows full management of school courses for students and TAs.</p>
                <br />
                <h2>Login</h2>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

                <button type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}