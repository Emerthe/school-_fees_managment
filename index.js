// Node/Express app using Sequelize (MySQL) with simple JWT auth
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
// Authentication removed: no bcrypt/jwt required

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Serve static files from `public` folder
app.use(express.static(path.join(__dirname, 'public')));

const { sequelize, Student, User } = require('./models');

// Authentication removed — application is public

// Routes

// Public: get all students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.findAll();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get student by id
app.get('/student/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: add new student
app.post('/student', async (req, res) => {
  const { name, fees } = req.body;
  if (!name || !fees) return res.status(400).json({ message: 'Missing name or fees' });
  try {
    const newStudent = await Student.create({ name, fees, feePaid: 0 });
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: record payment
app.put('/student/:id/pay', async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Invalid amount' });
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.feePaid = (student.feePaid || 0) + Number(amount || 0);
    await student.save();
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login removed — application is public without auth

// Start server (but allow tests to import app without listening)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync().then(async () => {
    // No admin auto-creation: auth disabled

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('DB sync error:', err);
  });
}

module.exports = { app, sequelize, Student, User };
