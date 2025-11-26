import React, { useState } from "react";

export default function AddCourse() {
    const base = "api/courses";
    
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [sheetID, setSheetID] = useState("");
    const [slotID, setSlotID] = useState("");
    const [memberID, setMemberID] = useState("");
    const [grade, setGrade] = useState("");
    const [comment, setComment] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        const body = { grade, comment };

        try {
            const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots/${slotID}/members/${memberID}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Grade modified.');
            } else {
                alert('Error: ' + (res.status || 'Failed to modify grade.'));
            }
        } catch (err) {
            console.error('Error modifying grade:', err);
        }
    };

    return (
        <>
            <h2>Modify Grade</h2>
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
                <label>
                    Signup ID: <input type="number" required="" onChange={(e) => setSheetID(e.target.value)} />
                </label>
                <br />
                <label>
                    Slot ID: <input type="number" required="" onChange={(e) => setSlotID(e.target.value)} />
                </label>
                <br />
                <label>
                    Member ID: <input type="text" maxLength={8} required="" onChange={(e) => setMemberID(e.target.value)} />
                </label>
                <br />
                <br />
                <label>
                    Grade: <input type="number" min={0} max={999} required="" onChange={(e) => setGrade(e.target.value)} />
                </label>
                <br />
                <label>
                    Comment: <input type="text" maxLength={500} required="" onChange={(e) => setComment(e.target.value)} />
                </label>
                <br />
                <button type="submit">Modify Grade</button>
            </form>
        </>
    );
}