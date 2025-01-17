const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport'); // Updated import
const { ReadlineParser } = require('@serialport/parser-readline'); // Correct parser import

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up the serial port connection (replace 'COM3' with your actual port)
const port = new SerialPort({ path: 'COM3', baudRate: 115200 }); // Updated constructor
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Store current servo positions
const servoPositions = {
  servo1: 90,
  servo2: 90,
  servo3: 90,
  servo4: 90,
};

// Serve static files (e.g., the HTML, CSS, and script.js)
app.use(express.static('public'));

// Handle client connection
io.on('connection', (socket) => {
  console.log('Client connected');

  // Send initial servo positions to the connected client
  socket.emit('init', servoPositions);

  // Handle servo updates from the client
  socket.on('updateServo', (data) => {
    const servo = Object.keys(data)[0]; // Get the servo name (e.g., 'servo1')
    const value = data[servo]; // Get the value for the servo

    if (servoPositions[servo] !== undefined) {
      // Update the current servo positions
      servoPositions[servo] = value;

      // Broadcast the updated servo positions to all connected clients
      io.emit('servoUpdate', servoPositions);

      // Send the updated servo positions to the ESP32 via serial
      const command = JSON.stringify(servoPositions);
      port.write(command + '\n', (err) => {
        if (err) {
          console.error('Error sending data to ESP32:', err.message);
        } else {
          console.log('Sent to ESP32:', command);
        }
      });
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Handle incoming data from the ESP32 (optional feedback)
parser.on('data', (line) => {
  console.log('Data from ESP32:', line.trim());
});

// Handle serial port errors
port.on('error', (err) => {
  console.error('Serial port error:', err.message);
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
