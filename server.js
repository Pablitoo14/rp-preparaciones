import express from "express";
import fs from "fs";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));
app.use(express.static("public"));
// 🧩 Obtener todas las citas guardadas (para el calendario)
app.get("/api/citas", (req, res) => {
  try {
    const db = JSON.parse(fs.readFileSync("database.json", "utf8"));
    res.json({ ocupados: db.ocupados || [] });
  } catch (error) {
    console.error("Error al leer base de datos:", error);
    res.status(500).json({ error: "No se pudieron cargar las citas." });
  }
});

// 💌 Guardar nueva cita y enviar correo
app.post("/api/citas", (req, res) => {
  const nuevaCita = req.body;

  try {
    const db = JSON.parse(fs.readFileSync("database.json", "utf8"));
    db.ocupados.push(nuevaCita);
    fs.writeFileSync("database.json", JSON.stringify(db, null, 2));

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enviar correo con los datos de la cita
    const mailOptions = {
      from: `RP Preparaciones <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Nueva cita reservada",
      html: `
        <h2>¡Nueva cita recibida!</h2>
        <p><b>Fecha:</b> ${nuevaCita.fecha}</p>
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
  } catch (error) {
    console.error("Error al guardar la cita:", error);
    res.status(500).json({ error: "Error al guardar la cita." });
  }
});

// 📄 Servir página principal
app.get("/", (req, res) => {
  res.sendFile("Página.html", { root: "." });
});

// 🟢 Usar el puerto de Render (o 3000 en local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));

