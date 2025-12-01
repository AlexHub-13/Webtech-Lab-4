import React, { useState } from "react";

export default function AddCourse() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [sheetID, setSheetID] = useState("");
    const [slotID, setSlotID] = useState("");

    const token = localStorage.getItem('token');

    const submit = async (e) => {
        e.preventDefault();

        if (!window.confirm(`Delete slot ID ${slotID} from course ${term} (section ${section}) and signup sheet ID ${sheetID}?`)) return;

        try {
            const res = await fetch(`api/secure/courses/${term}/${section}/signups/${sheetID}/slots/${slotID}`, {
                method: 'DELETE',
                headers: { 
                    "Content-Type": "application/json" ,
                    "Authorization": "Bearer " + token
                }
            });

            if (res.ok) {
                alert('Slot deleted.');
            } else {
                alert('Error: ' + (res.status || 'Failed to delete slot.'));
            }
        } catch (err) {
            console.error('Error deleting slot:', err);
        }
    };

    return (
        <>
            <h2>Delete Slot</h2>
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
                    ID: <input type="number" required="" onChange={(e) => setSlotID(e.target.value)} />
                </label>
                <br />
                <button type="submit">Delete Slot</button>
            </form>
        </>
    );
}