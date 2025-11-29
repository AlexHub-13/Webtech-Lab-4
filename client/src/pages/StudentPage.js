import AddSlotMember from "../components/AddSlotMember";

export default function StudentPage({ onLogout }) {
    return (
        <div>
            <button onClick={onLogout}>Logout</button>
            <h1>Student Dashboard</h1>

            <AddSlotMember />
        </div>
    );
}