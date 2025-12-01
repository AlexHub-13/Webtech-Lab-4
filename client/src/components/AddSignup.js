import React, { useState } from "react";

export default function AddSignup() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [id, setID] = useState("");
    const [name, setName] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    const token = localStorage.getItem('token');

    const submit = async (e) => {
        e.preventDefault();

        const body = { id, name, notBefore: start, notAfter: end };

        try {
            const res = await fetch(`api/secure/courses/${term}/${section}/signups`, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json" ,
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Signup created.');
            } else {
                alert('Error: ' + (res.status || 'Failed to create signup.'));
            }
        } catch (err) {
            console.error('Error creating signup:', err);
        }
    };

    return (
        <>
            <h2>Add New Signup Sheet</h2>
            <form onSubmit={submit}>
                <label>
                    Term: <input type="number" min={1} max={9999} required="" onChange={(e) => setTerm(e.target.value)} />
                </label>
                <br />
                <label>
                    Section:{" "}
                    <input type="number" min={1} max={99} defaultValue={1} onChange={(e) => setSection(e.target.value)} />
                </label>
                <br />
                <br />
                <label>
                    ID: <input type="number" required="" onChange={(e) => setID(e.target.value)} />
                </label>
                <br />
                <label>
                    Name: <input type="text" maxLength={100} required="" onChange={(e) => setName(e.target.value)} />
                </label>
                <br />
                <label>
                    Start: <input type="date" required="" onChange={(e) => setStart(e.target.value)} />
                </label>
                <br />
                <label>
                    End: <input type="date" required="" onChange={(e) => setEnd(e.target.value)} />
                </label>
                <br />
                <button type="submit">Add Signup</button>
            </form>
        </>
    );
}