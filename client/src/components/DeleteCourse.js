import React, { useState } from "react";

export default function DeleteCourse() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);

    const submit = async (e) => {
        e.preventDefault();

        if (!window.confirm(`Delete course ${term} (section ${section})?`)) return;

        try {
            const res = await fetch(`api/courses/${term}/${section}`, { method: 'DELETE' });

            if (res.ok) {
                alert('Course deleted.');
            } else {
                alert('Error: ' + (res.status || 'Failed to delete course.'));
            }
        } catch (err) {
            console.error('Error deleting course:', err);
        }
    };

    return (
        <>
            <h2>Delete Course</h2>
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
                <button type="submit">Delete Course</button>
            </form>
        </>
    );
}