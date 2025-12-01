import ChangePassword from "../components/ChangePassword";
import AddUser from "../components/AddUser";
import AddCourse from "../components/AddCourse";
import AddCourseMember from "../components/AddCourseMember";
import AddSignup from "../components/AddSignup";
import AddSlot from "../components/AddSlot";
import AddSlotMember from "../components/AddSlotMember";
import ModifyCourse from "../components/ModifyCourse";
import ModifySlot from "../components/ModifySlot";
import DeleteCourse from "../components/DeleteCourse";
import DeleteCourseMember from "../components/DeleteCourseMember";
import DeleteSignup from "../components/DeleteSignup";
import DeleteSlot from "../components/DeleteSlot";
import DeleteSlotMember from "../components/DeleteSlotMember";
import { useState } from "react";
import ChangeOtherPassword from "../components/ChangeOtherPassword";

export default function AdminPage({ onLogout }) {
    const [gradingMode, setGradingMode] = useState(false);

    if (!gradingMode) {
        return (
            <div>
                <button onClick={onLogout}>Logout</button>
                <h1>Admin Dashboard</h1>

                <button onClick={() => setGradingMode(true)}>
                    Enter Grading Mode
                </button>

                <ChangePassword onLogout={onLogout} />
                <AddUser />
                <ChangeOtherPassword />

                <AddCourse />
                <ModifyCourse />
                <DeleteCourse />

                <AddCourseMember />
                <DeleteCourseMember />

                <AddSignup />
                <DeleteSignup />

                <AddSlot />
                <ModifySlot />
                <DeleteSlot />

                <AddSlotMember />
                <DeleteSlotMember />
            </div>
        );
    } else {
        return (
            <div>
                <button onClick={onLogout}>Logout</button>
                <h1>TA Grading Mode</h1>

                <button onClick={() => setGradingMode(gradingMode === false)}>
                    Exit Grading Mode
                </button>
            </div>
        );
    }
}