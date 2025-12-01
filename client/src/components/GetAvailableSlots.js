import React, { use, useEffect, useState } from "react";

export default function GetAvailableSlots() {
    const [slots, setSlots] = useState([]);

    const token = localStorage.getItem("token");
    let loaded = false;

    useEffect(() => {
        async function fetchSlots() {
            try {
                const res = await fetch("/api/secure/available-slots", {
                    method: "GET",
                    headers: { Authorization: "Bearer " + token }
                });

                if (!res.ok) {
                    alert("Failed to fetch available slots");
                    return;
                }

                const data = await res.json();
                setSlots(data);
            } catch (err) {
                alert("Network error: " + err.message);
            }
        }

        fetchSlots();
    });

    if (slots.length === 0) {
        return <p>There are no available slots.</p>;
    }

    return (
        <div>
            <h2>Available Slots</h2>

            {slots.map((item, index) => {
                const { course, signup, slot, memberID } = item;
                const joinSlot = async () => {
                    try {
                        const res = await fetch(`api/secure/courses/${course.term}/${course.section}/signups/${signup.id}/slots/${slot.id}/members`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json",
                                        Authorization: "Bearer " + token },
                            body: JSON.stringify({ id: memberID })
                        }); 
                        if (res.ok) {
                            alert("Successfully joined slot.");
                        }
                        else {
                            alert("Failed to join slot: " + (res.status || 'Unknown error'));
                        }
                    } catch (err) {
                        alert("Network error: " + err.message);
                    }
                };
                
                return (
                    <div
                        key={index}
                        style={{
                            margin: "15px 0",
                            padding: "12px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                        }}
                    >
                        <h3>
                            {course.term}, {course.name} (Section {course.section})
                        </h3>

                        <p><strong>Signup:</strong> {signup.name}</p>
                        <p><strong>Slot ID:</strong> {slot.id}</p>
                        <p><strong>Start:</strong> {slot.start}</p>
                        <p><strong>Duration:</strong> {slot.duration} min</p>
                        <button onClick={joinSlot}>Join Slot</button>

                        <hr />
                    </div>
                );
            })}
        </div>
    );
}