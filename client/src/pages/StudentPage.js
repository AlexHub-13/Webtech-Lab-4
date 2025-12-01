import AddSlotMember from "../components/AddSlotMember";
import GetAvailableSlots from "../components/GetAvailableSlots";
import GetSignedSlots from "../components/GetSignedSlots";


export default function StudentPage({ onLogout }) {
    return (
        <div>
            <button onClick={onLogout}>Logout</button>
            <h1>Student Dashboard</h1>

            <GetSignedSlots />
            <GetAvailableSlots />
        </div>
    );
}