require('dotenv').config();
const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup JSON mini database
const adapter = new FileSync('data/db.json');
const db = low(adapter);

// Sets the default values for the JSON
db.defaults({ courses: [], users: [] }).write();

if (db.get('users').value().length === 0) {
    addAdmin();
}

async function addAdmin() {
    const plainPass = "admin";
    const id = "admin";
    const fName = "Admin";
    const lName = "Adminson";
    const role = "admin";
    const mustChangePass = true;
    let hashedPass = await bcrypt.hash(plainPass, 10);
    db.get('users').push({ id, hashedPass, fName, lName, role, mustChangePass }).write();
}

// Router objects:
const courses = express.Router();
const open = express.Router();
const secure = express.Router();
const admin = express.Router();

app.use("/api/open", open); // Open req. no auth
app.use("/api/secure", requireAuth, secure); // Secure req. auth
app.use("/api/admin", requireAuth, requireRole("admin"), admin); // Admin req. auth and role

app.use('/', express.static('client')); // Serves front-end code on homepage.

// For all routes, log requests.
app.use((req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next(); // Keep going.
})

app.use((req, res, next) => {
    req.db = db;
    next();
});

// Open routes (no authentication):
open.route('/auth/login')
    .post(async (req, res) => {
        await db.read();

        const { id, plainPass } = req.body;

        const user = db.get('users').find({ id }).value();
        if (!user) {
            return res.status(401).json({ message: "Invalid username." });
        }

        const ok = await bcrypt.compare(plainPass, user.hashedPass);
        if (!ok) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            mustChangePass: user.mustChangePass
        }, process.env.JWT_SECRET, { expiresIn: "3h" });

        console.log(token);

        res.json({ token, role: user.role, mustChangePass: user.mustChangePass });
    });

open.route('/auth/register')
    .post(async (req, res) => {
        await db.read();
    });

// Secure account management routes (authentication required):
secure.route('/changePassword')
    .post(async (req, res) => {
        await db.read();

        const id = req.user.id; // from JWT
        const { oldPass, newPass } = req.body;

        const user = db.get("users").find({ id }).value();

        if (!user) return res.status(404).json({ message: "User does not exist." });

        const ok = await bcrypt.compare(oldPass, user.hashedPass);
        if (!ok) return res.status(401).json({ message: "Incorrect current password." });

        const hashedPass = await bcrypt.hash(newPass, 10);
        db.get("users").find({ id }).assign({ hashedPass, mustChangePass: false }).write();

        res.json({ message: "Password updated." });
    });

// Admin-specific routes:
admin.route('/users')
    .get(async (req, res) => {
        await db.read();
        res.json(db.get('users').value());
    })
    .post(async (req, res) => {
        await db.read();
        let { id, plainPass, fName, lName, role } = req.body;

        // Sanitization:
        id = validator.escape(String(id));
        let hashedPass = await bcrypt.hash(plainPass, 10);
        role = validator.escape(String(role));
        mustChangePass = true;

        // Check for duplicates:
        const exists = db.get('users').find({ id }).value();
        if (exists) {
            return res.status(400).send('User with this ID already exists.');
        }

        // Check for valid role:
        if (role !== 'admin' && role !== 'ta' && role !== 'student') {
            return res.status(400).send('Invalid role; must be admin, ta, or student.');
        }

        db.get('users').push({ id, hashedPass, fName, lName, role, mustChangePass }).write();
        res.status(201).send('User created successfully.');
    });

admin.route('/users/:id')
    .put(async (req, res) => {
        await db.read();

        const id = req.params.id;
        const { newPass } = req.body;

        const user = db.get('users').find({ id }).value();

        if (!user) {
            return res.status(400).send('User does not exist.');
        }
        
        const hashedPass = await bcrypt.hash(newPass, 10);
        db.get('users').find({ id }).assign({ hashedPass, mustChangePass: true }).write();
        res.status(200).send('User password reset successfully.');
    });

// Courses:
courses.route('/')
    .get(async (req, res) => {
        await db.read();
        res.json(db.get('courses').value());
    })
    .post(async (req, res) => {
        await db.read();

        let { term, name, section } = req.body

        // Sanitization:
        term = Number(term);
        name = validator.escape(String(name));
        section = Number(section) || 1; // Default section is 1.

        // Validation:
        if (!validator.isInt(String(term), { min: 1, max: 9999 })) {
            return res.status(400).send('Invalid term code, must be 1–9999.');
        }

        if (!validator.isLength(name, { min: 0, max: 100 })) {
            return res.status(400).send('Invalid course name, must be 1–100 characters.');
        }

        if (!validator.isInt(String(section), { min: 1, max: 99 })) {
            return res.status(400).send('Invalid section number, must be 1–99.');
        }

        // Check for duplicates:
        const exists = db.get('courses').find({ term, section }).value();
        if (exists) {
            return res.status(400).send('Course already exists for this term and section.');
        }

        // Creates the new course:
        const members = [];
        const signups = [];
        const newCourse = { term, name, section, members, signups };
        db.get('courses').push(newCourse).write();
        res.status(201).send('Course created successfully.');
    })

courses.route('/:term/:section')
    .delete(async (req, res) => {
        await db.read();

        // Sanitization / gathering parameters:
        const term = Number(req.params.term);
        const section = Number(req.params.section) || 1; // Default section is 1.

        // Checking if the requested course exists for deletion:
        const exists = db.get('courses').find({ term, section }).value();
        if (!exists) {
            return res.status(400).send('Course does not exist.');
        }

        if (db.get('courses').find({ term, section }).get('signups').value().length > 0) {
            return res.status(400).send('Course has sign-up sheets; cannot delete.');
        }

        db.get('courses').remove({ term, section }).write(); // Deletes the course.
        res.status(200).send('Course deleted successfully.');
    })
    .put(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);

        let newTerm = false;
        let newSection = false;

        const ogExists = db.get('courses').find({ term, section }).value();
        if (!ogExists) {
            return res.status(400).send('Course does not exist.');
        }

        const hasSignups = db.get('courses').find({ term, section }).get('signups').value().length > 0;

        // Validation / Sanitization:
        if ('term' in req.body && req.body.term && validator.isInt(String(req.body.term), { min: 1, max: 9999 }) && !hasSignups) {
            newTerm = Number(req.body.term);
        }

        if ('name' in req.body && req.body.name && validator.isLength(req.body.name, { min: 0, max: 100 })) {
            const newName = validator.escape(String(req.body.name));
            db.get('courses').find({ term, section }).set('name', newName).write();
        }

        if ('section' in req.body && req.body.section && validator.isInt(String(req.body.section), { min: 1, max: 99 }) && !hasSignups) {
            newSection = Number(req.body.section);
        }

        newTerm = newTerm || term;
        newSection = newSection || section;

        // Check for duplicates:
        const exists = db.get('courses').find({ newTerm, newSection }).value();
        if (exists && (newTerm !== term || newSection !== section)) {
            return res.status(400).send('Course already exists for this term and section.');
        } else {
            db.get('courses').find({ term, section }).assign({ term: newTerm, section: newSection }).write();
        }



        // Creates the new course:
        res.status(200).send('Course modified successfully.');
    })

// Members:
courses.route('/:term/:section/members')
    .post(async (req, res) => {
        await db.read();

        // Sanitization / gathering parameters:
        const term = Number(req.params.term);
        const section = Number(req.params.section);

        let reqMembers = req.body.members || []; // Just a list of members.
        let existingMembers = db.get('courses').find({ term, section }).get('members');
        let added = 0;
        const ignoredIDs = [];

        for (member of reqMembers) {

            // Sanitization: 
            let id = validator.escape(String(member.id));
            let fName = validator.escape(String(member.fName));
            let lName = validator.escape(String(member.lName));
            let role = validator.escape(String(member.role));

            // Validation:
            if (!id || !validator.isLength(id, { min: 0, max: 8 })) {
                return res.status(400).send('Invalid member ID, must be 1–8 characters.');
            }

            if (!fName || !validator.isLength(fName, { min: 1, max: 200 })) {
                return res.status(400).send('Invalid member first name, must be 1–200 characters.');
            }

            if (!lName || !validator.isLength(lName, { min: 1, max: 200 })) {
                return res.status(400).send('Invalid member last name, must be 1–200 characters.');
            }

            if (!role || !validator.isLength(role, { min: 1, max: 10 })) {
                return res.status(400).send('Invalid member role, must be 1–10 characters.');
            }

            // Checking if the member already exists:
            const exists = existingMembers.find({ id: member.id }).value();
            if (exists) {
                ignoredIDs.push(member.id);
            } else {
                existingMembers.push({ id, fName, lName, role }).write(); // Creating new member.
                added++;
            }
        }

        res.status(201).send(`${added} members added successfully; the following IDs were ignored: ${ignoredIDs}`);
    })
    .get(async (req, res) => {
        await db.read();

        // Sanitization / gathering parameters:
        const term = Number(req.params.term);
        const section = Number(req.params.section);

        const exists = db.get('courses').find({ term, section }).value();
        if (!exists) {
            return res.status(400).send('Course does not exist.');
        }

        let role;
        if (req.body !== undefined && 'role' in req.body && req.body.role) {
            role = validator.escape(String(req.body.role));
            res.json(db.get('courses').find({ term, section }).get('members').filter(member => member.role === role).value());
        } else {
            res.json(db.get('courses').find({ term, section }).get('members').value());
        }
    })
    .delete(async (req, res) => {
        await db.read();

        // Sanitization / gathering parameters:
        const term = Number(req.params.term);
        const section = Number(req.params.section);

        let reqIDs = req.body.ids || []; // Just a list of members.
        let existingMembers = db.get('courses').find({ term, section }).get('members');

        let isInSignups = [];

        // Ensures that no members being deleted are signed up in any slots:
        db.get('courses').find({ term, section }).get('signups').value().forEach(signup => {
            signup["slots"].forEach(slot => {
                isInSignups = slot["members"].filter(member => reqIDs.includes(member.id));
            });
        });

        if (isInSignups.length > 0) {
            return res.status(400).send(`Cannot delete members who are signed up in slots.`);
        }

        for (let i = 0; i < reqIDs.length; i++) {

            // Sanitization: 
            let id = String(reqIDs[i]);

            // Checking if the member already exists:
            const exists = existingMembers.find({ id: id }).value();
            if (exists) {
                existingMembers.remove({ id }).write();
            } else {
                return res.status(400).send('Member does not exist.');
            }
        }

        res.status(200).send(`Members deleted successfully.`);
    })

courses.route('/:term/:section/signups')
    .post(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const signups = db.get('courses').find({ term, section }).get('signups');

        // Sanitization:
        const id = Number(req.body.id);
        const name = validator.escape(String(req.body.name));
        let notBefore = Date.parse(req.body.notBefore);
        let notAfter = Date.parse(req.body.notAfter);

        // Validation:
        if (!name || !validator.isLength(name, { min: 1, max: 100 })) {
            return res.status(400).send('Invalid assignment name, must be 1–100 characters.');
        }

        // Check for duplicates:
        const exists = signups.find({ id }).value();
        if (exists) {
            return res.status(400).send('Sign-up sheet already exists for this term, section, and ID.');
        }

        // Creates the new course:
        const slots = [];
        const newSignup = { id, name, notBefore, notAfter, slots };
        signups.push(newSignup).write();
        res.status(201).send('Sign-up sheet created successfully.');
    })
    .delete(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const signups = db.get('courses').find({ term, section }).get('signups');

        const id = Number(req.body.id);
        const sheetExists = signups.find({ id }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        if (sheetExists.slots.length > 0) {
            return res.status(400).send('Sheet has slots; cannot delete.');
        }

        signups.remove({ id }).write();
        res.status(200).send(`Sheet deleted successfully.`);
    })
    .get(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);

        const exists = db.get('courses').find({ term, section }).value();
        if (!exists) {
            return res.status(400).send('Course does not exist.');
        }

        const signups = db.get('courses').find({ term, section }).get('signups');

        res.json(signups.value());
    })

courses.route('/:term/:section/signups/:id/slots')
    .post(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.id);

        const slotID = Number(req.body.id);
        let start = Date.parse(req.body.start);
        let duration = validator.escape(String(req.body.duration));
        let numSlots = validator.escape(String(req.body.numSlots));
        let maxMembers = validator.escape(String(req.body.maxMembers));

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheet = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheet) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (slotExists) {
            return res.status(400).send('Slot already exists');
        }

        if (!validator.isInt(duration, { min: 1, max: 240 }) || !validator.isInt(numSlots, { min: 1, max: 99 }) || !validator.isInt(maxMembers, { min: 1, max: 99 })) {
            return res.status(400).send('Invalid input.');
        }

        let overlap = false;
        sheet.slots.forEach(slot => {
            if ((start < slot.start + slot.duration * 60000) && (slot.start < start + duration * 60000)) {
                overlap = true;
            }
        });

        if (overlap) {
            return res.status(400).send('Slot time overlaps with existing slot.');
        } 

        duration = Number(duration);
        numSlots = Number(numSlots);
        maxMembers = Number(maxMembers);

        const members = [];
        const newSlot = { id: slotID, start, duration, numSlots, maxMembers, members };
        db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').push(newSlot).write();
        res.status(201).send('Slot created successfully.');
    })
    .get(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.id);

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        res.status(200).send(db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').value());
    })

courses.route('/:term/:section/signups/:sheetID/slots/:slotID/')
    .put(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.sheetID);
        const slotID = Number(req.params.slotID);

        const slot = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID });

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheet = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheet) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
        }

        if (req.body === undefined) {
            return res.status(400).send('Request body empty; cannot modify.');
        }

        let start = slot.get('start').value();
        let duration = slot.get('duration').value();

        if ('start' in req.body && req.body.start && validator.isDate(req.body.start)) {
            start = req.body.start;
        }

        if ('duration' in req.body && req.body.duration && validator.isInt(req.body.duration, { min: 1, max: 240 })) {
            duration = Number(req.body.duration);
        }

        let overlap = false;
        sheet.slots.forEach(slot => {
            if ((start < slot.start + slot.duration * 60000) && (slot.start < start + duration * 60000) && slot.id !== slotID) {
                overlap = true;
            }
        });

        if (overlap) {
            return res.status(400).send('Slot time overlaps with existing slot.');
        }

        slot.set('start', start).write();
        slot.set('duration', duration).write();

        if ('numSlots' in req.body && req.body.numSlots && !validator.isInt(req.body.numSlots, { min: 1, max: 99 })) {
            const numSlots = Number(req.body.numSlots);
            slot.set('numSlots', numSlots).write();
        }

        let maxMembers;

        if ('maxMembers' in req.body && req.body.maxMembers && validator.isInt(req.body.maxMembers, { min: 1, max: 99 })) {
            maxMembers = Number(req.body.maxMembers);
        }

        if (maxMembers < slot.get('members').value().length) {
            return res.status(400).send('Cannot set max members less than current number of members.');
        }

        slot.set('maxMembers', maxMembers).write();

        res.status(200).send(`Slot modified successfully. Members of this slot are the following: ${slot.get('members').value()}`);
    })
    .delete(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.sheetID);
        const slotID = Number(req.params.slotID);

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slot = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slot) {
            return res.status(400).send('Slot does not exist.');
        }

        if (slot.members.length > 0) {
            return res.status(400).send('Slot has members; cannot delete.');
        }

        db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').remove({ id: slotID }).write();
        res.status(200).send(`Slot deleted successfully.`);
    })

courses.route('/:term/:section/signups/:sheetID/slots/:slotID/members')
    .post(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.sheetID);
        const slotID = Number(req.params.slotID);

        const memberID = validator.escape(String(req.body.id));

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
        }

        const slot = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID });

        if (slot.get('members').value().length >= slot.get('maxMembers')) {
            return res.status(400).send('Slot is full.');
        }

        if (!validator.isLength(memberID, { min: 0, max: 8 })) {
            return res.status(400).send('Invalid member ID.');
        }

        if (slot.get('members').find({ id: memberID }).value()) {
            return res.status(400).send('Member already in slot.');
        }

        const member = { id: memberID, grade: "", comment: "" };
        slot.get('members').push(member).write();
        res.status(201).send('Member added successfully.');

    })
    .get(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.sheetID);
        const slotID = Number(req.params.slotID);

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
        }

        const members = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).get('members');

        res.json(members.value());
    })

courses.route('/:term/:section/signups/:sheetID/slots/:slotID/members/:memberID')
    .delete(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.sheetID);
        const slotID = Number(req.params.slotID);
        const memberID = String(req.params.memberID);

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
        }

        const memberExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).get('members').find({ id: memberID }).value();
        if (!memberExists) {
            return res.status(400).send('Member does not exist.');
        }

        db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).get('members').remove({ id: memberID }).write();
        res.status(200).send(`Member deleted successfully.`);
    })
    .put(async (req, res) => {
        await db.read();

        const term = Number(req.params.term);
        const section = Number(req.params.section);
        const sheetID = Number(req.params.sheetID);
        const slotID = Number(req.params.slotID);
        const memberID = validator.escape(String(req.params.memberID));

        let ogGrade;

        const courseExists = db.get('courses').find({ term, section }).value();
        if (!courseExists) {
            return res.status(400).send('Course does not exist.');
        }

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
        }

        const memberExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).get('members').find({ id: memberID }).value();
        if (!memberExists) {
            return res.status(400).send('Member does not exist.');
        }

        const member = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).get('members').find({ id: memberID });
        ogGrade = member.get('grade').value();

        if (req.body === undefined) {
            return res.status(400).send('Request body empty; cannot modify.');
        }

        if ('grade' in req.body && req.body.grade && validator.isInt(req.body.grade, { min: 0, max: 999 })) {
            const grade = Number(req.body.grade);
            member.set('grade', grade).write();
        }

        if ('comment' in req.body && req.body.comment && validator.isLength(req.body.comment, { min: 0, max: 500 })) {
            const comment = member.get('comment').value() + String(req.body.comment) + " ";
            member.set('comment', comment).write();
        }

        res.status(200).send(`Member modified successfully. The original grade was ${ogGrade}`);
    })



// Installing router objects:
app.use(`/api/courses`, courses);
app.use(`/api/open`, open);
app.use(`/api/secure`, secure);
app.use(`/api/admin`, admin);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});