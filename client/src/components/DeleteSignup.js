import React, { useState } from "react";

export default function DeleteSignup() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [id, setID] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        if (!window.confirm(`Delete signup ID ${id} from course ${term} (section ${section})?`)) return;

        try {
            const body = { id };
            const res = await fetch(`api/courses/${term}/${section}/signups`, {
                method: 'DELETE',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Signup deleted.');
            } else {
                alert('Error: ' + (res.status || 'Failed to delete signup.'));
            }
        } catch (err) {
            console.error('Error deleting signup:', err);
        }
    };

    return (
        <>
            <h2>Delete Signup Sheet</h2>
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
                <button type="submit">Delete Signup</button>
            </form>
        </>
    );
}