import AddCourse from "../components/AddCourse";
import AddCourseMember from "../components/AddCourseMember";
import AddSignup from "../components/AddSignup";
import AddSlot from "../components/AddSlot";
import ModifyCourse from "../components/ModifyCourse";
import ModifySlot from "../components/ModifySlot";
import DeleteCourse from "../components/DeleteCourse";
import DeleteCourseMember from "../components/DeleteCourseMember";
import DeleteSignup from "../components/DeleteSignup";
import DeleteSlot from "../components/DeleteSlot";
import { useState } from "react";

export default function TAPage({ onLogout }) {
    const [gradingMode, setGradingMode] = useState(false);

    if (!gradingMode) {
        return (
            <div>
                <button onClick={onLogout}>Logout</button>
                <h1>TA Dashboard</h1>

                <button onClick={() => setGradingMode(gradingMode === true)}>
                    Enter Grading Mode
                </button>

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