import React, { useState } from "react";

export default function DeleteSlotMember() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [sheetID, setSheetID] = useState("");
    const [slotID, setSlotID] = useState("");
    const [memberID, setMemberID] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        const body = { id: memberID };

        try {
            const res = await fetch(`api/courses/${term}/${section}/signups/${sheetID}/slots/${slotID}/members`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
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
            <h2>Delete Member from Slot</h2>
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
                <br />
                <label>
                    Member ID: <input type="text" maxLength={8} required="" onChange={(e) => setMemberID(e.target.value)} />
                </label>
                <br />
                <button type="submit">Delete Member</button>
            </form>
        </>
    );
}