const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

// Middleware to parse URL-encoded and JSON data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// // Enable CORS
// app.use(cors());


// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Handle GET requests from ESP32
app.get("/esp-post-data", (req, res) => {
  const { api_key, sensor, location, value1, value2, value3, value4, value5 } =
    req.query;

  // Validate API key
  if (api_key !== "tPmAT5Ab3j7F9") {
    return res.status(403).send("Invalid API Key");
  }

  // Log the data to a file
  const logData = `Sensor: ${sensor}, Location: ${location}, Humidity: ${value1}, Temperature: ${value2}, Distance: ${value3}, Light Intensity: ${value4}, PIR: ${value5}\n`;

  console.log(logData);
  fs.appendFile("esp-data.log", logData, (err) => {
    if (err) console.error("Error saving data:", err);
  });

  // Write the latest data to a separate file
  const latestData = {
    sensor,
    location,
    humidity: value1,
    temperature: value2,
    distance: value3,
    lightIntensity: value4,
    pir: value5,
  };

  fs.writeFile(
    "latest-esp-data.json",
    JSON.stringify(latestData, null, 2),
    (err) => {
      if (err) console.error("Error writing latest data:", err);
    }
  );

  // Send response back to ESP32
  res.send("Data received and logged");
});

// Handle GET request to retrieve current data
// app.get("/current-data", (req, res) => {
//   fs.readFile("latest-esp-data.json", "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading data:", err);
//       return res.status(500).send("Error reading data");
//     }
//     res.send(data);
//   });
// });
// Handle GET request to retrieve log data in the specified format
function parseLogFile(logFilePath) {
    const fileContent = fs.readFileSync(logFilePath, "utf-8"); // Read the file content
    console.log(fileContent);
    const logs = fileContent.split("\n"); // Assuming entries are separated by two newlines
    const result = {
        temperature: [],
        humidity: [],
        light: [],
        distance: [],
        pir: [],
        timestamps: [],
    };

    logs.forEach((log) => {
        const lines = log.split(", "); // Split the log entry into lines
        const timestamp = new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).replace(",", ""); // Format to DD/MM/YYYY HH:mm:ss

        let humidity, temperature, distance, light, pir;

        lines.forEach((line) => {
            if (line.includes("Humidity")) {
                humidity = parseFloat(line.split(":")[1].trim());
            }
            if (line.includes("Temperature")) {
                temperature = parseFloat(line.split(":")[1].trim());
            }
            if (line.includes("Distance")) {
                distance = parseFloat(line.split(":")[1].trim());
            }
            if (line.includes("Light Intensity")) {
                light = parseFloat(line.split(":")[1].trim());
            }
            if (line.includes("PIR")) {
                pir = parseInt(line.split(":")[1].trim());
            }
        });

        // Push the parsed values to the respective arrays
        result.temperature.push(temperature);
        result.humidity.push(humidity);
        result.light.push({
            timestamps: [timestamp], // For simplicity, adding one timestamp per data point
            values: [light],
        });
        result.distance.push({
            timestamps: [timestamp], // For simplicity, adding one timestamp per data point
            values: [distance],
        });
        result.pir.push(pir);
        result.timestamps.push(timestamp); // Add the timestamp
    });

    return result;
}

app.get("/current-data", (req, res) => {
    try {
        const response = parseLogFile("esp-data.log");
        res.json(response);
    } catch (err) {
        console.error("Error reading data:", err);
        res.status(500).send("Error reading data");
    }
});


// Start the server
app.listen(port, () => {
  console.log(`ESP32 server is running on http://localhost:${port}`);
});
