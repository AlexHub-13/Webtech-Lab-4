const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const validator = require('validator');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup JSON mini database
const adapter = new FileSync('server/data/db.json');
const db = low(adapter);
 
// Sets the default values for the JSON
db.defaults({ courses: [] }).write();

// Router objects:
const courses = express.Router();
const signups = express.Router();
const grades = express.Router();

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

        db.get('courses').remove({ term, section }).write(); // Deletes the course.
        res.status(200).send('Course deleted successfully.');
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
                existingMembers.push( { id, fName, lName, role }).write(); // Creating new member.
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

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (slotExists) {
            return res.status(400).send('Slot already exists');
        }

        if (!validator.isInt(duration, { min: 1, max: 240 }) || !validator.isInt(numSlots, { min: 1, max: 99 }) || !validator.isInt(maxMembers, { min: 1, max: 99 })) {
            return res.status(400).send('Invalid input.');
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

        const sheetExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).value();
        if (!sheetExists) {
            return res.status(400).send('Sheet does not exist.');
        }

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
        }

        if (req.body === undefined) {
            return res.status(400).send('Request body empty; cannot modify.');
        }

        if ('start' in req.body && req.body.start && validator.isDate(req.body.start)) {
            const start = req.body.start;
            slot.set('start', start).write();
        }

        if ('duration' in req.body && req.body.duration && validator.isInt(req.body.duration, { min: 1, max: 240 })) {
            const duration = Number(req.body.duration);
            slot.set('duration', duration).write();
        }

        if ('numSlots' in req.body && req.body.numSlots && !validator.isInt(req.body.numSlots, { min: 1, max: 99 })) {
            const numSlots = Number(req.body.numSlots);
            slot.set('numSlots', numSlots).write();
        }

        if ('maxMembers' in req.body && req.body.maxMembers && validator.isInt(req.body.maxMembers, { min: 1, max: 99 })) {
            const maxMembers = Number(req.body.maxMembers);
            slot.set('maxMembers', maxMembers).write();
        }

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

        const slotExists = db.get('courses').find({ term, section }).get('signups').find({ id: sheetID }).get('slots').find({ id: slotID }).value();
        if (!slotExists) {
            return res.status(400).send('Slot does not exist.');
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
            const comment = member.get('comment').value() + String(req.body.comment) + " " ;
            member.set('comment', comment).write();
        }

        res.status(200).send(`Member modified successfully. The original grade was ${ogGrade}`);
    })



// Installing router objects:
app.use(`/api/courses`, courses);
app.use(`/api/signups`, signups);
app.use(`/api/grades`, grades);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});