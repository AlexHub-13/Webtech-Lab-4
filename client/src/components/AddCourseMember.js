import React, { useState } from "react";

export default function AddCourseMember() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [id, setMemberID] = useState("");
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [role, setRole] = useState("");

    const token = localStorage.getItem('token');

    const submit = async (e) => {
        e.preventDefault();

        const body = { "members": [{ id, fName, lName, role }] };

        try {
            const res = await fetch(`/api/secure/courses/${term}/${section}/members`, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json" ,
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Member created.');
            } else {
                alert('Error: ' + (res.status || 'Failed to create member.'));
            }
        } catch (err) {
            console.error('Error creating member:', err);
        }
    };

    return (
        <>
            <h2>Add New Member to Course</h2>
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
                <label>
                    First Name: <input type="text" maxLength={200} required="" onChange={(e) => setFName(e.target.value)} />
                </label>
                <br />
                <label>
                    Last Name: <input type="text" maxLength={200} required="" onChange={(e) => setLName(e.target.value)} />
                </label>
                <br />
                <label>
                    Role: <input type="text" maxLength={10} required="" onChange={(e) => setRole(e.target.value)} />
                </label>
                <br />
                <button type="submit">Add Member</button>
            </form>
        </>
    );
}