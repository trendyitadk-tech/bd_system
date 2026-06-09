require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { isThisMonth, isWithinInterval, addDays, startOfDay } = require('date-fns');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

// Create default admin if no users exist
(async () => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          permissions: 'dashboard,employees,reports,users,settings'
        }
      });
      console.log('Default admin user created (admin / 123456)');
    } else {
      // Hash existing plain text passwords for existing users just in case
      const users = await prisma.user.findMany();
      for (const u of users) {
        if (!u.password || !u.password.startsWith('$2')) {
          const hashed = await bcrypt.hash(u.password || '123456', 10);
          await prisma.user.update({ where: { id: u.id }, data: { password: hashed } });
        }
      }
    }
  } catch (err) {
    console.error('Error with admin seed:', err);
  }
})();

app.use(cors());
app.use(express.json());

// Setup multer for excel upload
const upload = multer({ storage: multer.memoryStorage() });

// Helper to calculate next occurrence of a birthday
function getNextBirthday(dobStr) {
  const dob = new Date(dobStr);
  const today = new Date();
  const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

  if (nextBirthday < startOfDay(today)) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  return nextBirthday;
}

// Routes
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, department } = req.body;
    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        department
      }
    });
    res.json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, dateOfBirth, department } = req.body;
    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        department
      }
    });
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Auth Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    const user = await prisma.user.findFirst({ where: { username } });

    if (!user) {
      console.log(`Login failed: user ${username} not found`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log(`Login failed: invalid password for ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login successful for user ${username}`);
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, permissions: user.permissions });
  } catch (error) {
    console.error('Login Error details:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// User Management Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, role, password, permissions } = req.body;
    const rawPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const newUser = await prisma.user.create({
      data: { username, email, role, password: hashedPassword, permissions: permissions || 'dashboard' }
    });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password, permissions } = req.body;
    let data = { username, email, role };
    if (permissions) data.permissions = permissions;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/birthdays', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    const today = startOfDay(new Date());
    const next7Days = addDays(today, 7);
    const currentMonth = today.getMonth();

    const thisMonthBirthdays = [];
    const upcomingBirthdays = [];

    employees.forEach(emp => {
      const dob = new Date(emp.dateOfBirth);
      const nextBirthday = getNextBirthday(emp.dateOfBirth);

      // This Month
      if (dob.getMonth() === currentMonth) {
        thisMonthBirthdays.push({ ...emp, nextBirthday });
      }

      // Upcoming (Next 7 Days)
      if (isWithinInterval(nextBirthday, { start: today, end: next7Days })) {
        upcomingBirthdays.push({ ...emp, nextBirthday });
      }
    });

    // Sort by next birthday
    thisMonthBirthdays.sort((a, b) => a.nextBirthday - b.nextBirthday);
    upcomingBirthdays.sort((a, b) => a.nextBirthday - b.nextBirthday);

    res.json({
      thisMonth: thisMonthBirthdays,
      upcoming: upcomingBirthdays,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch birthdays' });
  }
});

// Import from Excel
app.post('/api/employees/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let count = 0;
    for (const row of data) {
      // Expecting columns: Name, Email, Phone, DateOfBirth, Department
      // Excel dates might come as numbers or strings
      let dob;
      if (typeof row.DateOfBirth === 'number') {
        dob = new Date(Date.UTC(0, 0, row.DateOfBirth - 1)); // Excel date to JS date
      } else if (typeof row.DateOfBirth === 'string') {
        dob = new Date(row.DateOfBirth);
      } else {
        continue; // Skip invalid rows
      }

      if (isNaN(dob.getTime())) continue;

      await prisma.employee.create({
        data: {
          name: row.Name || row.name,
          email: row.Email || row.email,
          phone: String(row.Phone || row.phone || ''),
          dateOfBirth: dob,
          department: row.Department || row.department || '',
        }
      });
      count++;
    }

    res.json({ message: `Successfully imported ${count} employees`, count });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Send reminders (manual trigger)
app.post('/api/notify', async (req, res) => {
  const { employeeId, type } = req.body;
  try {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Find all employees who have a birthday on the exact same month and day
    const targetMonth = new Date(employee.dateOfBirth).getMonth();
    const targetDate = new Date(employee.dateOfBirth).getDate();

    const allEmployees = await prisma.employee.findMany();
    const matchingEmployees = allEmployees.filter(emp => {
      const dob = new Date(emp.dateOfBirth);
      return dob.getMonth() === targetMonth && dob.getDate() === targetDate;
    });

    if (type === 'email') {
      let transporter;

      // If real SMTP credentials are provided in .env, use them to actually send the email
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Fallback: Create a test account dynamically to avoid authentication errors (emails won't actually deliver)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Read admin email from .env, or default to the sender's email
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@company.com';

      // Build consolidated email text
      const dateString = new Date(employee.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
      const subjectNames = matchingEmployees.map(e => e.name).join(' & ');

      let emailText = `Hello Admin,\n\nThis is a reminder for birthdays coming up on ${dateString}:\n\n`;
      matchingEmployees.forEach((emp, index) => {
        emailText += `[${index + 1}] Name: ${emp.name}\n`;
        emailText += `    Department: ${emp.department || 'N/A'}\n`;
        emailText += `    Phone: ${emp.phone || 'N/A'}\n`;
        emailText += `    Email: ${emp.email || 'N/A'}\n\n`;
      });
      emailText += `Please don't forget to organize something or wish them a Happy Birthday!\n\nBest,\nBirthday System`;

      const info = await transporter.sendMail({
        from: '"Birthday System - SE Apparel (Pvt) Ltd." <noreply@company.com>',
        to: adminEmail,
        subject: `Upcoming Birthday Reminder: ${subjectNames} 🎉`,
        text: emailText,
      });

      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Notify error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Test endpoint: manually trigger the daily birthday email right now or via Vercel Cron
app.all('/api/notify/test-daily', async (req, res) => {
  try {
    await sendBirthdayEmailsForToday();
    res.json({ message: 'Daily birthday email check triggered successfully. Check admin inbox and server console.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger daily check' });
  }
});

// ─── Shared Email Helper ───────────────────────────────────────────────────
async function createTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

// ─── Auto Daily Birthday Email ──────────────────────────────────────────────
async function sendBirthdayEmailsForToday() {
  try {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const allEmployees = await prisma.employee.findMany();
    const todayBirthdays = allEmployees.filter(emp => {
      const dob = new Date(emp.dateOfBirth);
      return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
    });

    if (todayBirthdays.length === 0) {
      console.log('[Birthday Bot] No birthdays today.');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@company.com';
    const transporter = await createTransporter();

    const dateString = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    const subjectNames = todayBirthdays.map(e => e.name).join(' & ');

    let emailText = `Hi All,\n\nHappy Birthday to the following staff member(s) today (${dateString}):\n\n`;
    todayBirthdays.forEach((emp, i) => {
      emailText += `[${i + 1}] Name       : ${emp.name}\n`;
      emailText += `    Department : ${emp.department || 'N/A'}\n`;
      emailText += `    Phone      : ${emp.phone || 'N/A'}\n`;
      emailText += `    Email      : ${emp.email || 'N/A'}\n\n`;
    });
    emailText += `Don't forget to wish them a Happy Birthday!\n\nBest,\nBirthday System - SE Apparel (Pvt) Ltd.`;

    const info = await transporter.sendMail({
      from: '"Birthday System - SE Apparel (Pvt) Ltd." <noreply@company.com>',
      to: adminEmail,
      subject: `🎉 Birthday Today: ${subjectNames}`,
      text: emailText,
    });

    console.log(`[Birthday Bot] Email sent to ${adminEmail} | Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`[Birthday Bot] Preview: ${previewUrl}`);
  } catch (err) {
    console.error('[Birthday Bot] Failed to send daily email:', err.message);
  }
}

// ─── Cron Job: Run every day at 08:00 AM server time ───────────────────────
// This node-cron will run locally, but for Vercel we use vercel.json crons instead
cron.schedule('25 09 * * *', () => {
  console.log('[Birthday Bot] Running daily birthday check...');
  sendBirthdayEmailsForToday();
}, {
  scheduled: true,
  timezone: "Asia/Colombo"
});
console.log('[Birthday Bot] Daily email scheduler started (08:00 AM every day).');

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
