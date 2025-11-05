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

    dateClick: async function (info) {
      const fecha = info.dateStr.slice(0, 10); // <-- quitamos horas
      const diasOcupados = await getDiasOcupados();
      occupiedNotice.classList.add("hidden");
      form.classList.remove("hidden");

      // Normalizamos formato
      const fechasOcupadas = diasOcupados.map(d => d.dia);

      if (fechasOcupadas.includes(fecha)) {
        occupiedNotice.classList.remove("hidden");
        form.classList.add("hidden");
        dateInput.value = fecha;
        modal.classList.remove("hidden");
        return;
      }

      // Día libre → mostrar formulario
      occupiedNotice.classList.add("hidden");
      form.classList.remove("hidden");
      dateInput.value = fecha;
      modal.classList.remove("hidden");
    },

    events: async function (fetchInfo, successCallback, failureCallback) {
      try {
        const diasOcupados = await getDiasOcupados();
        const eventos = diasOcupados.map(d => ({
          title: "Ocupado",
          start: d.dia,
          allDay: true,
          backgroundColor: "#ff5e5e"
        }));
        successCallback(eventos);
      } catch (err) {
        console.error("Error cargando días:", err);
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

  // Envío del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const reserva = {
      dia: dateInput.value,
      nombre: document.getElementById("nameInput").value.trim(),
      telefono: document.getElementById("phoneInput").value.trim(),
      descripcion: document.getElementById("notesInput").value.trim(),
    };

    if (!reserva.nombre || !reserva.telefono) {
      alert("Por favor, rellena los campos obligatorios.");
      return;
    }

    const res = await fetch("/api/dias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reserva),
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ Cita reservada correctamente.");
      modal.classList.add("hidden");
      form.reset();
      calendar.refetchEvents();
    } else {
      alert(data.error || "⚠️ Error al reservar el día.");
    }
  });
});

// Obtener días ocupados del servidor
async function getDiasOcupados() {
  const res = await fetch("/api/dias");
  const data = await res.json();
  // Si vienen como array plano, lo adaptamos
  if (Array.isArray(data.ocupados) && typeof data.ocupados[0] === "string") {
    return data.ocupados.map(d => ({ dia: d }));
  }
  return data.ocupados || [];
}

