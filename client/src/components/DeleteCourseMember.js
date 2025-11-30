import React, { useState } from "react";

export default function DeleteCourseMember() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [id, setMemberID] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        if (!window.confirm(`Delete member ID ${id} from course ${term} (section ${section})?`)) return;

        try {
            const body = { ids: [id] };
            const res = await fetch(`api/courses/${term}/${section}/members`, {
                method: 'DELETE',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Member deleted.');
            } else {
                alert('Error: ' + (res.status || 'Failed to delete member.'));
            }
        } catch (err) {
            console.error('Error deleting member:', err);
        }
    };

    return (
        <>
            <h2>Delete Member from Course</h2>
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
                    ID: <input type="text" maxLength={8} required="" onChange={(e) => setMemberID(e.target.value)} />
                </label>
                <br />
                <button type="submit">Delete Member</button>
            </form>
        </>
    );
}