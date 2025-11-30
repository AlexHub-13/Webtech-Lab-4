import React, { useState } from "react";

export default function ModifyCourse() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);

    const [newTerm, setNewTerm] = useState("");
    const [newName, setNewName] = useState("");
    const [newSection, setNewSection] = useState(1);

    const submit = async (e) => {
        e.preventDefault();

        const body = { term: String(newTerm), name: newName, section: String(newSection) };
    
        try {
            const res = await fetch(`/api/courses/${term}/${section}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Course modified.');
            } else {
                alert('Error: ' + (res.status || 'Failed to modify course.'));
            }
        } catch (err) {
            console.error('Error modifying course:', err);
        }
    };

    return (
        <>
            <h2>Modify Course</h2>
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
                    New Term: <input type="number" min={1} max={9999} required="" onChange={(e) => setNewTerm(e.target.value)} />
                </label>
                <br />
                <label>
                    New Name: <input type="text" maxLength={100} required="" onChange={(e) => setNewName(e.target.value)} />
                </label>
                <br />
                <label>
                    New Section:{" "}
                    <input type="number" min={1} max={99} defaultValue={1} onChange={(e) => setNewSection(e.target.value)} />
                </label>
                <br />
                <button type="submit">Modify Course</button>
            </form>
        </>
    );
}