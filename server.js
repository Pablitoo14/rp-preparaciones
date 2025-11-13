import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));
app.use(express.static("public"));

// 🔹 Obtener todas las citas guardadas (para el calendario)
app.get("/api/citas", (req, res) => {
  try {
    const db = JSON.parse(fs.readFileSync("database.json", "utf8"));
    res.json({ ocupados: db.ocupados || [] });
  } catch (error) {
    console.error("❌ Error al leer base de datos:", error);
    res.status(500).json({ error: "No se pudieron cargar las citas." });
  }
});

// 🔹 Guardar nueva cita localmente (sin correos, sin DB externa)
app.post("/api/citas", (req, res) => {
  const nuevaCita = req.body;

  try {
    const db = JSON.parse(fs.readFileSync("database.json", "utf8"));

    // Evita duplicados
    const yaExiste = db.ocupados.find(cita => cita.fecha === nuevaCita.fecha);
    if (yaExiste) {
      return res.status(400).json({ error: "Ese día ya está ocupado." });
    }

    db.ocupados.push(nuevaCita);
    fs.writeFileSync("database.json", JSON.stringify(db, null, 2));

    console.log(`✅ Cita guardada en local: ${nuevaCita.fecha} (${nuevaCita.nombre})`);
    res.json({ ok: true, mensaje: "Cita registrada correctamente." });
  } catch (error) {
    console.error("❌ Error al guardar la cita:", error);
    res.status(500).json({ error: "Error al guardar la cita." });
  }
});

// 🔹 Servir página principal
app.get("/", (req, res) => {
  res.sendFile("Página.html", { root: "." });
});

// 🔹 Puerto de Render o 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
