import ChangePassword from "../components/ChangePassword";
import AddUser from "../components/AddUser";

export default function AdminPage({ onLogout }) {
    return (
        <div>
            <button onClick={onLogout}>Logout</button>
            <h1>Admin Dashboard</h1>

            <ChangePassword onLogout={onLogout}/>
            <AddUser />
        </div>
    );
}