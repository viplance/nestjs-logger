const popup = document.getElementById('popup');

function showLogDetails(log) {
  const context = getObject(log.context);
  const breadcrumbs = getObject(log.breadcrumbs);

  // Restore position from LocalStorage
  const savedLeft = getLs('popupLeft');
  if (savedLeft) {
    popup.style.left = savedLeft;
  }

  const timeInfo =
    log.updatedAt === log.createdAt
      ? getDate(log.updatedAt)
      : `Updated: ${getDate(
          log.updatedAt,
        )}.&nbsp;&nbsp;&nbsp;First seen: ${getDate(log.createdAt)}`;

  popup.innerHTML = `
    <div id="drag-handle" style="margin: -2rem -2rem 1rem -2rem; height: 1.5rem; background-color: #f1f1f1; border-bottom: 1px solid #ddd; cursor: grab; display: flex; align-items: center; justify-content: center;" title="Drag to move">
        <div style="width: 50px; height: 5px; background-color: #ccc; border-radius: 5px;"></div>
    </div>
    <div class="content center">
      <div class="container">
        <h2 class="popup-title ${log.type}">${log.type}: ${log.message} (${
          log.count
        })</h2>
        <div class="mt-05">${timeInfo}</div>
          ${
            log.trace
              ? `
              <h3 class="mt-15">Trace</h3>
              <p class="key pl-2"><span>${getTrace(log.trace)}</span></p>
              `
              : ''
          }
          ${
            context
              ? `
            <h3 class="mt-15">Context</h3>
            <p>${jsonViewer(context)}</p>
            `
              : ''
          }
          ${
            breadcrumbs && breadcrumbs.length > 0
              ? `
            <h3 class="mt-15">Breadcrumbs</h3>
            <p>${jsonViewer(breadcrumbs)}</p>
            `
              : ''
          }
        <div class="content">
          <button class="white mt-2" onclick="closePopup()">Close</button>
          <button class="light mt-2" onclick="deleteLog('${
            log._id
          }')">Delete</button>
        </div>
      </div>
    </div>`;

  popup.style.display = 'block';

  const left = parseFloat(getLs('popupLeft')) || 0;

  setPopupLeft(left);

  // Drag'n'Drop logic
  const handle = document.getElementById('drag-handle');

  if (handle) {
    handle.onmousedown = function (e) {
      e.preventDefault();

      const startX = e.clientX;
      const rect = popup.getBoundingClientRect();
      const startLeft = rect.left;

      handle.style.cursor = 'move';
      document.body.style.cursor = 'move';

      function onMouseMove(e) {
        const dx = e.clientX - startX;
        const left = startLeft + dx;

        setPopupLeft(left);
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        handle.style.cursor = 'grab';
        document.body.style.cursor = 'default';

        // Remember position
        setLs('popupLeft', popup.style.left);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
  }
}

function getObject(context) {
  if (typeof context === 'string') {
    return JSON.parse(context);
  }

  return context;
}

function getTrace(trace) {
  return trace.replace(new RegExp(String.fromCharCode(10), 'g'), '<br />');
}

function closePopup() {
  popup.style.display = 'none';
}

function setPopupLeft(left) {
  if (popup?.style.display === 'block') {
    if (left < 0) {
      left = 0;
    }
    const popupWidth = popup.offsetWidth;
    if (left > window.innerWidth - popupWidth) {
      left = window.innerWidth - popupWidth;
    }

    popup.style.left = `${left}px`;
    setLs('popupLeft', popup.style.left);
  }
}

window.addEventListener('resize', () => {
  const left = parseFloat(getLs('popupLeft')) || 0;

  setPopupLeft(left);
});
