import AddCourse from "../components/AddCourse";
import AddUser from "../components/AddUser";

export default function TAPage({ onLogout }) {
    return (
        <div>
            <button onClick={onLogout}>Logout</button>
            <h1>TA Dashboard</h1>

            <AddCourse />
            <AddUser />
        </div>
    );
}