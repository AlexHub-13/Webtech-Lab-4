import { useEffect, useState } from "react";

export default function GradingMode() {
    const token = localStorage.getItem("token");
    const [slots, setSlots] = useState([]);

    useEffect(() => {
        async function fetchSlots() {
            try {
                const res = await fetch("/api/secure/active-slots", {
                    method: "GET",
                    headers: { Authorization: "Bearer " + token }
                });

                if (!res.ok) {
                    alert("Failed to fetch active slots");
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

    return (
        <div>
            <h2>Grading Mode</h2>

            {slots.map((item, index) => {
                const { course, signup, slot, memberID } = item;

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

                        <hr />
                    </div>
                );
            })}
        </div>
    );
}