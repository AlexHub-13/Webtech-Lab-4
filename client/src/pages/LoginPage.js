import React, { useState } from "react";

import AddNewCourse from "../components/AddCourse.js";
import AddCourseMember from "../components/AddCourseMember.js";
import AddSignup from "../components/AddSignup.js";
import AddSlot from "../components/AddSlot.js";
import AddSlotMember from "../components/AddSlotMember.js";
import ModifyGrade from "../components/ModifyGrade.js";
import ModifySlot from "../components/ModifySlot.js";

export default function LoginPage() {
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

            localStorage.setItem("token", data.token);
            setMessage("Login successful!");
            // TODO: redirect or load app state
        } catch (error) {
            setMessage("Network error: " + error.message);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm flex flex-col gap-4"
            >
                <h1 className="text-2xl font-bold text-center">Login</h1>

                <input
                    type="text"
                    placeholder="Email or Username"
                    className="border p-2 rounded-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />


                <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />


                <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                    Login
                </button>


                {message && (
                    <p className="text-center text-red-600 text-sm">{message}</p>
                )}
            </form>

            <AddNewCourse />
            <AddCourseMember />
            <AddSignup />
            <AddSlot />
            <AddSlotMember />
            <ModifyGrade />
            <ModifySlot />
        </div>
    );
}