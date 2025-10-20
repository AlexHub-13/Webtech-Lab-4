const express = require('express');
const app = express();
const port = 3000;

// Router objects:
const course = express.Router();
const member = express.Router();
const signup = express.Router();
const grade = express.Router();

app.use('/', express.static('client')); // Serves front-end code on homepage.

// For all routes, log requests.
app.use((req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next(); // Keep going.
})

// Installing router objects:
app.use(`/api/course`, course);
app.use(`/api/member`, member);
app.use(`/api/signup`, signup);
app.use(`/api/grade`, grade);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});