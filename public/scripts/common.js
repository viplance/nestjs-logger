const selectedLogTypes = {
  all: true,
  log: false,
  error: false,
  warn: false,
  debug: false,
  verbose: false,
};

const logTypes = Object.keys(selectedLogTypes).filter((key) => key !== `all`);

window.addEventListener("load", async () => {
  getLogs();
});

document.addEventListener(`click`, (e) => {
  const target = e.target;
  const origin = target.closest(`li`);

  if (origin) {
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

      getLogs();

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
  return `<div id="${log._id}" class="row">
    <div class="col ${getTypeClass(log.type)}">${log.type}</div>
    <div class="col">
      <div>${log.message}</div>
      <div class="date">${getDate(log.updatedAt)}</div>
    </div>
    <div class="col">${log.count}</div>
  </div>`;
}

async function getLogs() {
  const { origin, pathname, search } = window.location;
  const res = await fetch(`${origin}${pathname}api${search}`);

  if (res.ok) {
    const logs = (await res.json())
      .filter((log) => {
        return selectedLogTypes["all"] || selectedLogTypes[log.type];
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);

    let html = `<div class="header">
      <div class="col">Type</div>
      <div class="col">Info</div>
      <div class="col">Count</div>
    </div>`;

    logs.forEach((log) => {
      html += getLogHtmlElement(log);
    });

    document.getElementById("logs").innerHTML = html;
  }
}
