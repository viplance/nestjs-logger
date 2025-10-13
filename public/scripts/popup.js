function showLogDetails(log) {
  const popup = document.getElementById(`popup`);
  popup.innerHTML = `
    <div class="content center">
      <div class="container">
        <h2>${log.type}</h2>
        <p>${log.message}</p>
        <p>${getContext(log.context)}</p>
        <p>${log.trace}</p>
        <button class="white" onclick="closePopup()">Close</button>
      </div>
    <div>`;
  popup.style.display = "block";
}

function getContext(context) {
  if (typeof context === `object`) {
    return JSON.stringify(context);
  }

  return context || "";
}

function closePopup() {
  const popup = document.getElementById(`popup`);
  popup.style.display = "none";
}
