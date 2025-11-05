// app.js
document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");
  const modal = document.getElementById("modal");
  const dateInput = document.getElementById("dateInput");
  const form = document.getElementById("reserveForm");
  const closeModal = document.getElementById("closeModal");
  const occupiedNotice = document.getElementById("occupiedNotice");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    selectable: true,
    eventDisplay: "background",
    eventColor: "#ff5e5e",

    // Cuando se hace clic en una fecha
    dateClick: async function (info) {
      const fecha = info.dateStr.slice(0, 10);
      const diasOcupados = await getDiasOcupados();
      const fechasOcupadas = diasOcupados.map(d => d.dia);

      // Reiniciamos estado del modal
      occupiedNotice.classList.add("hidden");
      form.classList.remove("hidden");
      dateInput.value = fecha;
      modal.classList.remove("hidden");

      // Si el día ya está ocupado, mostramos aviso
      if (fechasOcupadas.includes(fecha)) {
        occupiedNotice.classList.remove("hidden");
        form.classList.add("hidden");
      }
    },

    // Cargar los eventos (días ocupados)
    events: async function (fetchInfo, successCallback, failureCallback) {
      try {
        const diasOcupados = await getDiasOcupados();
        const eventos = diasOcupados.map(d => ({
          title: "Ocupado",
          start: d.dia,
          allDay: true,
          backgroundColor: "#ff5e5e",
        }));
        successCallback(eventos);
      } catch (err) {
        console.error("Error cargando días ocupados:", err);
        failureCallback(err);
      }
    },
  });

  calendar.render();

  // Cerrar modal
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
    form.reset();
  });

  // Enviar el formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const reserva = {
      fecha: dateInput.value,
      nombre: document.getElementById("nameInput").value.trim(),
      telefono: document.getElementById("phoneInput").value.trim(),
      descripcion: document.getElementById("notesInput").value.trim(),
    };

    if (!reserva.nombre || !reserva.telefono) {
      alert("⚠️ Por favor, rellena los campos obligatorios.");
      return;
    }

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reserva),
      });

      const data = await res.json();

      if (data.ok || data.success) {
        alert("✅ Cita reservada correctamente.");
        modal.classList.add("hidden");
        form.reset();
        calendar.refetchEvents();
      } else {
        alert(data.error || "⚠️ Error al reservar el día.");
      }
    } catch (err) {
      console.error("Error al enviar cita:", err);
      alert("⚠️ No se pudo conectar con el servidor.");
    }
  });
});

// Obtener días ocupados del servidor
async function getDiasOcupados() {
  try {
    const res = await fetch("/api/citas");
    const data = await res.json();

    if (Array.isArray(data.ocupados)) {
      // Si vienen como strings, los convertimos a objetos
      if (typeof data.ocupados[0] === "string") {
        return data.ocupados.map(d => ({ dia: d }));
      }
      return data.ocupados;
    }

    return [];
  } catch (err) {
    console.error("Error al obtener días ocupados:", err);
    return [];
  }
}
