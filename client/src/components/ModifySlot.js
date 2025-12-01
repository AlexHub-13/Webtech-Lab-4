import React, { useState } from "react";

export default function ModifySlot() {
    const [term, setTerm] = useState("");
    const [section, setSection] = useState(1);
    const [sheetID, setSheetID] = useState("");
    const [slotID, setSlotID] = useState("");
    const [start, setStart] = useState("");
    const [duration, setDuration] = useState("");
    const [num, setNum] = useState(1);
    const [max, setMax] = useState(1);

    const submit = async (e) => {
        e.preventDefault();

        const body = { start, duration, numSlots: num, maxMembers: max };

        try {
            const res = await fetch(`api/courses/${term}/${section}/signups/${sheetID}/slots/${slotID}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Slot modified.');
            } else {
                alert('Error: ' + (res.status || 'Failed to modify slot.'));
            }
        } catch (err) {
            console.error('Error modifying slot:', err);
        }
    };

    return (
        <>
            <h2>Modify Slot</h2>
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
                <br />
                <label>
                    ID: <input type="number" required="" onChange={(e) => setSlotID(e.target.value)} />
                </label>
                <br />
                <label>
                    Start: <input type="datetime-local" required="" onChange={(e) => setStart(e.target.value)} />
                </label>
                <br />
                <label>
                    Duration:{" "}
                    <input type="number" min={1} max={240} required="" onChange={(e) => setDuration(e.target.value)} />
                </label>
                <br />
                <label>
                    Number: <input type="number" min={1} max={99} required="" onChange={(e) => setNum(e.target.value)} />
                </label>
                <br />
                <label>
                    Max. Members:{" "}
                    <input type="number" min={1} max={99} required="" onChange={(e) => setMax(e.target.value)} />
                </label>
                <br />
                <button type="submit">Modify Slot</button>
            </form>
        </>
    );
}