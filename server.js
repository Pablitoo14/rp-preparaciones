import express from "express";
import fs from "fs";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Ruta para guardar una cita y enviar correo
app.post("/api/citas", (req, res) => {
  const nuevaCita = req.body;

  // Guardar cita en database.json
  const db = JSON.parse(fs.readFileSync("database.json", "utf8"));
  db.ocupados.push(nuevaCita);
  fs.writeFileSync("database.json", JSON.stringify(db, null, 2));

  // 💌 Enviar correo (dentro de la misma función)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `RP Preparaciones <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: "Nueva cita reservada",
    html: `
      <h2>¡Nueva cita recibida!</h2>
      <p><b>Fecha:</b> ${nuevaCita.fecha}</p>
      <p><b>Hora:</b> ${nuevaCita.hora}</p>
      <p><b>Teléfono:</b> ${nuevaCita.telefono}</p>
      <p><b>Descripción:</b> ${nuevaCita.descripcion}</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
    } else {
      console.log("Correo enviado: " + info.response);
    }
  });

  res.json({ ok: true, mensaje: "Cita registrada y correo enviado." });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile("Página.html", { root: "." });
});

// Iniciar servidor
app.listen(3000, () => console.log("Servidor en http://localhost:3000"));


