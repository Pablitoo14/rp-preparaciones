import express from "express";
import fs from "fs";
import nodemailer from "nodemailer";
const DB = "database.json";
const app = express();
app.use(express.json());
app.use(express.static(".")); // servir archivos desde la raíz

function readDB() {
  return JSON.parse(fs.readFileSync(DB, "utf8"));
}
function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// Obtener todos los días ocupados
app.get("/api/dias", (req, res) => {
  try {
    const data = readDB();
    res.json({ ocupados: data.ocupados || [] });
    console.log("📤 Enviando datos al frontend:", data);
  } catch (err) {
    res.status(500).json({ error: "Error leyendo DB" });
  }
});

// Guardar una nueva cita
app.post("/api/dias", (req, res) => {
  const { dia, nombre, telefono, descripcion } = req.body;

  if (typeof dia !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    return res.status(400).json({ error: "Formato de fecha inválido" });
  }

  try {
    const data = readDB();
    data.ocupados = data.ocupados || [];

    // Si el día ya está reservado, error
    if (data.ocupados.some(d => d.dia === dia)) {
      return res.status(400).json({ error: "El día ya está ocupado" });
    }

    data.ocupados.push({ dia, nombre, telefono, descripcion });
    console.log("🟢 Guardando cita:", { dia, nombre, telefono, descripcion });
    writeDB(data);

    res.json({ success: true, ocupados: data.ocupados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error escribiendo DB" });
  }
});
// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  service: "gmail", // puedes usar outlook, yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER, // 👈 pon aquí tu email
    pass: process.env.EMAIL_PASS, // 👈 no tu contraseña normal, mira abajo
  },
});

// Contenido del correo
const mailOptions = {
  from: "RP Preparaciones <tu_correo@gmail.com>",
  to: "tu_correo@gmail.com", // donde recibirás el aviso
  subject: "Nueva cita reservada",
  html: `
    <h2>¡Nueva cita recibida!</h2>
    <p><b>Fecha:</b> ${nuevaCita.fecha}</p>
    <p><b>Hora:</b> ${nuevaCita.hora}</p>
    <p><b>Teléfono:</b> ${nuevaCita.telefono}</p>
    <p><b>Descripción:</b> ${nuevaCita.descripcion}</p>
  `,
};

// Enviar correo
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("Error al enviar el correo:", error);
  } else {
    console.log("Correo enviado: " + info.response);
  }
});

import path from "path";
import { fileURLToPath } from "url";

// Configurar ruta base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cuando alguien entre a la raíz "/", mostrar la página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Página.html")); // o "pagina.html" si la renombraste
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));

