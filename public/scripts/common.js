const selectedLogTypes = {
  all: true,
  log: false,
  error: false,
  warn: false,
  debug: false,
  verbose: false,
};

const logTypes = Object.keys(selectedLogTypes).filter((key) => key !== `all`);

let logs = [];
let text = "";

connectWebSocket();

document.addEventListener(`click`, (e) => {
  const target = e.target;
  const isLi = target.closest(`li`);

  if (isLi) {
    const selector = target.dataset.selector;

    if (selector === `all`) {
      if (selectedLogTypes[`all`]) {
        reactivateAllTypeSelectors();

        selectedLogTypes[`all`] = false;
        unsetSelectorActive(target);
      } else {
        selectedLogTypes[`all`] = true;
        setSelectorActive(target);

        logTypes.forEach((type) => {
          unsetSelectorActive(document.querySelector(`li.${type}`));
        });
      }

      renderLogs();

      return;
    }

    if (selectedLogTypes[selector]) {
      unsetSelectorActive(target);
      selectedLogTypes[selector] = false;
    } else {
      setSelectorActive(target);
      selectedLogTypes[selector] = true;
      reactivateAllTypeSelectors();
    }

    selectedLogTypes[`all`] = false;
    unsetSelectorActive(document.querySelector(`li.all`));

    getLogs();

    return;
  }

  const logId =
    (target.parentNode?.classList.contains(`row`) && target.parentNode?.id) ||
    (target.parentNode?.parentNode?.classList?.contains(`row`) &&
      target.parentNode?.parentNode?.id) ||
    (target.parentNode?.parentNode?.parentNode?.classList?.contains(`row`) &&
      target.parentNode?.parentNode?.parentNode?.id) ||
    (target.classList?.contains(`row`) && target.id);

  if (logId) {
    let id = logId;

    try {
      if (Number(id) > 0) id = Number(id); // SQL DB numeric index
    } catch (e) {}

    const log = logs.find((log) => log._id === id);

    showLogDetails(log);
  }
});

function reactivateAllTypeSelectors() {
  logTypes.forEach((type) => {
    const li = document.querySelector(`li.${type}`);

    if (selectedLogTypes[type]) {
      setSelectorActive(li);
    } else {
      unsetSelectorActive(li);
    }
  });
}

function setSelectorActive(target) {
  const width = target.offsetWidth;
  target.classList.add(`active`);
  target.style.width = `${width}px`;
}

function unsetSelectorActive(target) {
  target.classList.remove(`active`);
}

function getDate(incomingDate) {
  const date = new Date(incomingDate);

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const obj = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const formatted = `${obj.hour}:${obj.minute}:${obj.second}, ${obj.month} ${obj.day} ${obj.year}`;

  return formatted;
}

function getTypeClass(type) {
  return type;
}

function getLogHtmlElement(log) {
  return `
    <div id="${log._id}" class="row">
      <div class="col ${getTypeClass(log.type)}">${log.type}</div>
      <div class="col">
        <div class="log-info">${log.message}</div>
        <div class="date">${getDate(log.updatedAt)}</div>
      </div>
      <div class="col context">${log.trace || ""}</div>
      <div class="col">${log.count}</div>
    </div>`;
}

function renderLogs(logList = logs) {
  let html = "";

  logList
    .filter((log) => {
      return selectedLogTypes["all"] || selectedLogTypes[log.type];
    })
    .filter((log) => {
      if (text === "") return true;

      return (
        log.message.toLowerCase().includes(text) ||
        log.trace?.toLowerCase().includes(text) ||
        JSON.stringify(log.context || {})
          .toLowerCase()
          .includes(text)
      );
    })
    .forEach((log) => {
      html += getLogHtmlElement(log);
    });

  document.getElementById("logs").innerHTML = html;
}

async function checkElementsVisibility(logList = logs) {
  if (logList.length === 0) {
    document.getElementById("no-logs").style.display = "block";
    document.getElementById("search").style.display = "none";
    document.querySelector(".table-header").style.display = "none";
    document.querySelector("nav").style.display = "none";
  } else {
    document.getElementById("no-logs").style.display = "none";
    document.getElementById("search").style.display = "inline-block";
    document.querySelector(".table-header").style.display = "flex";
    document.querySelector("nav").style.display = "flex";
  }
}

async function getLogs() {
  const { origin, pathname, search } = window.location;
  const searchParams = new URLSearchParams(search);
  const key = searchParams.get("key");

  if (!!socket) {
    socket.send(
      JSON.stringify({
        action: "getLogs",
        key,
      })
    );
  } else {
    const res = await fetch(`${origin}${pathname}api${search}`);

    if (res.ok) {
      logs = await res.json();

      checkElementsVisibility();

      renderLogs();
    } else {
      alert("An error occurred while fetching logs.");
    }
  }
}

async function deleteLog(_id) {
  if (!confirm("Are you sure? It can't be undone.")) return;

  const { origin, pathname, search: searchParams } = window.location;

  const searchParamsWithId = new URLSearchParams(searchParams);
  const key = searchParamsWithId.get("key");

  if (!!socket) {
    socket.send(
      JSON.stringify({
        action: "delete",
        key,
        data: {
          _id,
        },
      })
    );
    closePopup();
    getLogs();
  } else {
    searchParamsWithId.set("id", _id);

    const res = await fetch(
      `${origin}${pathname}api?${searchParamsWithId.toString()}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      closePopup();
      getLogs();
    } else {
      alert("An error occurred while deleting log.");
    }
  }
}

function search(event) {
  text = event.target.value.toLowerCase();

  renderLogs();
}
