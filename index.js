const TeleBot = require('telebot');
const express = require('express');
const fs = require('fs');
const path = require('path');

const bot = new TeleBot('6488000633:AAHiy6fJrVXl7CVGwjNVj6a8-riuu5p71f8');
const app = express();
const dbPath = path.join(__dirname, 'db', 'listkey.json');

// Function to read and write JSON file
const readJSON = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Function to add key
const addKey = (key, duration) => {
  const data = readJSON(dbPath);
  const now = new Date();
  const endTime = new Date(now.getTime() + duration);
  data[key] = endTime.toISOString();
  writeJSON(dbPath, data);
};

// Function to generate random key
const generateRandomKey = () => {
  return 'key_' + Math.random().toString(36).substr(2, 9);
};

// Function to parse duration
const parseDuration = (durationStr) => {
  const unit = durationStr.slice(-1);
  const value = parseInt(durationStr.slice(0, -1), 10);
  const units = {
    'd': 86400000, // days
    'w': 604800000, // weeks
    'm': 2592000000, // months (approx)
    'y': 31536000000, // years (approx)
    'h': 3600000, // hours
    'min': 60000, // minutes
    's': 1000 // seconds
  };
  return value * (units[unit] || 0);
};

// Command /menu
bot.on('/menu', (msg) => {
  return bot.sendMessage(msg.chat.id, "Commands:\n/addkey (nama key) (waktu)\n/addrand (waktu)");
});

// Command /addkey
bot.on(/^\/addkey (\w+) (\d+[dwmyhsmin]*)$/, (msg, props) => {
  const key = props.match[1];
  const durationStr = props.match[2];
  const duration = parseDuration(durationStr);
  addKey(key, duration);
  return bot.sendMessage(msg.chat.id, `Key ${key} added with duration ${durationStr}.\n\nAccess in : http://localhost:3000/status/${key}`);
});

// Command /addrand
bot.on(/^\/addrand (\d+[dwmyhsmin]*)$/, (msg, props) => {
  const key = generateRandomKey();
  const durationStr = props.match[1];
  const duration = parseDuration(durationStr);
  addKey(key, duration);
  return bot.sendMessage(msg.chat.id, `Random key ${key} added with duration ${durationStr}.\n\nAccess in : http://localhost:3000/status/${key}`);
});

// Endpoint to check key status
app.get('/status/:key', (req, res) => {
  const key = req.params.key;
  const data = readJSON(dbPath);
  if (data[key]) {
    const now = new Date();
    const endTime = new Date(data[key]);
    const timeLeft = endTime - now;

    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / 86400000);
      const hours = Math.floor((timeLeft % 86400000) / 3600000);
      const minutes = Math.floor((timeLeft % 3600000) / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);

      return res.json({
        status: true,
        time: `${days} Day(s) ${hours} Hour(s) ${minutes} Minute(s) ${seconds} Second(s) Left`
      });
    } else {
      return res.json({
        status: false,
        time: "Expired"
      });
    }
  } else {
    return res.json({
      status: false,
      time: "Key not found"
    });
  }
});

// Start the bot and server
bot.start();
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
