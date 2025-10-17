function showLogDetails(log) {
  const popup = document.getElementById(`popup`);
  console.log(log.context);
  popup.innerHTML = `
    <div class="content center">
      <div class="container mt-2">
        <h2 class="${log.type}">${log.type}: ${log.message}</h2>
        <span class="date">${getDate(log.updatedAt)}</span>
        ${
          log.trace
            ? `
            <h3 class="mt-2">Trace</h3>
            <p class="pl-2">${log.trace}</p>
            `
            : ""
        }
          ${
            log.context
              ? `
            <h3 class="mt-2">Context</h3>
            <p>${jsonViewer(log.context)}</p>
            `
              : ""
          }
        <button class="white mt-2" onclick="closePopup()">Close</button>
      </div>
    <div>`;
  popup.style.display = "block";
}

function closePopup() {
  const popup = document.getElementById(`popup`);
  popup.style.display = "none";
}
