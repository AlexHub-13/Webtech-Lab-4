import React, { useState } from "react";

export default function AddCourse() {
    const [term, setTerm] = useState("");
    const [name, setName] = useState("");
    const [section, setSection] = useState(1);
    const token = localStorage.getItem('token');

    const submit = async (e) => {
        e.preventDefault();

        const body = { term: String(term), name, section: String(section) };
    
        try {
            const res = await fetch('/api/secure/courses', {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json" ,
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Course created.');
            } else {
                alert('Error: ' + (res.status || 'Failed to create course.'));
            }
        } catch (err) {
            console.error('Error creating course:', err);
        }
    };

    return (
        <>
            <h2>Add New Course</h2>
            <form onSubmit={submit}>
                <label>
                    Term: <input type="number" min={1} max={9999} required="" onChange={(e) => setTerm(e.target.value)} />
                </label>
                <br />
                <label>
                    Name: <input type="text" maxLength={100} required="" onChange={(e) => setName(e.target.value)} />
                </label>
                <br />
                <label>
                    Section:{" "}
                    <input type="number" min={1} max={99} defaultValue={1} onChange={(e) => setSection(e.target.value)} />
                </label>
                <br />
                <button type="submit">Add Course</button>
            </form>
        </>
    );
}