const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
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
        name = String(name);
        section = Number(section) || 1; // Default section is 1.

        // Validation:
        if (!term || term < 1 || term > 9999) {
            return res.status(400).send('Invalid term code, must be 1–9999.');
        }

        if (!name || name.length === 0 || name.length > 100) {
            return res.status(400).send('Invalid course name, must be 1–100 characters.');
        }

        if (section < 1 || section > 99) {
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
            let id = String(member.id);
            let fName = String(member.fName);
            let lName = String(member.lName);
            let role = String(member.role);

            // Validation:
            if (!id || id.length < 1 || id.length > 8) {
                return res.status(400).send('Invalid member ID, must be 1–8 characters.');
            }

            if (!fName || fName.length < 1 || fName.length > 200) {
                return res.status(400).send('Invalid member first name, must be 1–200 characters.');
            }

            if (!lName || lName.length < 1 || lName.length > 200) {
                return res.status(400).send('Invalid member last name, must be 1–200 characters.');
            }

            if (!role || role.length < 1 || role.length > 10) {
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

        const exists = db.get('courses').find({ term, section }).get('members');
        if (!exists) {
            return res.status(400).send('Course does not exist.');
        }

        let role;
        if (req.body !== undefined && 'role' in req.body && req.body.role) {
            role = String(req.body.role);
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

// Installing router objects:
app.use(`/api/courses`, courses);
app.use(`/api/signups`, signups);
app.use(`/api/grades`, grades);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});