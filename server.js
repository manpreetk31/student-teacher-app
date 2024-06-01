const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'school'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
    const { role, username } = req.body;
    if (role === 'teacher') {
        db.query('SELECT * FROM students', (err, results) => {
            if (err) return res.send(err);
            res.render('teacher', { students: results });
        });
    } else if (role === 'student') {
        db.query('SELECT * FROM students WHERE name = ?', [username], (err, results) => {
            if (err) return res.send(err);
            res.render('student', { student: results[0] });
        });
    }
});

app.post('/upload', upload.single('csvfile'), (req, res) => {
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            const query = 'INSERT INTO students (name, grade, subject, result) VALUES ?';
            const values = results.map(row => [row.name, row.grade, row.subject, row.result]);
            db.query(query, [values], (err, result) => {
                if (err) return res.send(err);
                res.redirect('/');
            });
        });
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));