import React, { useState } from "react";

export default function AddCourse() {
    const [id, setID] = useState("");
    const [plainPass, setPlainPass] = useState("");
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [role, setRole] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        const body = { id, plainPass, fName, lName, role };
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`/api/admin/users`, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json" ,
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('User created.');
            } else {
                alert('Error: ' + (res.status || 'Failed to create user.'));
            }
        } catch (err) {
            console.error('Error creating user:', err);
        }
    };

    return (
        <>
            <h2>Add User</h2>
            <form onSubmit={submit}>
                <label>
                    ID: <input type="text" maxLength={8} required="" onChange={(e) => setID(e.target.value)} />
                </label>
                <br />
                <label>
                    Password: <input type="password" required="" onChange={(e) => setPlainPass(e.target.value)} />
                </label>
                <br />
                <label>
                    First Name: <input type="text" maxLength={200} required="" onChange={(e) => setFName(e.target.value)} />
                </label>
                <br />
                <label>
                    Last Name: <input type="text" maxLength={200} required="" onChange={(e) => setLName(e.target.value)} />
                </label>
                <br />
                <label>
                    Role: <select required="" onChange={(e) => setRole(e.target.value)}>
                        <option value="student">Student</option>
                        <option value="ta">TA</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>
                <br />
                <button type="submit">Add User</button>
            </form>
        </>
    );
}