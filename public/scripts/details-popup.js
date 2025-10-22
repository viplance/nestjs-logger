function showLogDetails(log) {
  const popup = document.getElementById(`popup`);

  popup.innerHTML = `
    <div class="content center">
      <div class="container">
        <h2 class="popup-title ${log.type}">${log.type}: ${log.message}</h2>
        <div class="mt-05">${getDate(log.updatedAt)}</div>
          ${
            log.trace
              ? `
              <h3 class="mt-15">Trace</h3>
              <p class="key pl-2"><span>${getTrace(log.trace)}</span></p>
              `
              : ""
          }
          ${
            log.context
              ? `
            <h3 class="mt-15">Context</h3>
            <p>${jsonViewer(log.context)}</p>
            `
              : ""
          }
          ${
            log.breadcrumbs && log.breadcrumbs.length > 0
              ? `
            <h3 class="mt-15">Breadcrumbs</h3>
            <p>${jsonViewer(log.breadcrumbs)}</p>
            `
              : ""
          }
        <div class="content">
          <button class="white mt-2" onclick="closePopup()">Close</button>
          <button class="light mt-2" onclick="deleteLog('${
            log._id
          }')">Delete</button>
        </div>
      </div>
    <div>`;

  popup.style.display = "block";
}

function getTrace(trace) {
  return trace.replace(new RegExp(String.fromCharCode(10), "g"), "<br />");
}

function closePopup() {
  const popup = document.getElementById(`popup`);
  popup.style.display = "none";
}
