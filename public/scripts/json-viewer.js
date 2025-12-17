function jsonViewer(json, parentKey) {
  if (!json) {
    return '';
  }

  res = `<div>`;

  if (Array.isArray(json)) {
    json.forEach((item) => {
      res += `<div class="key pl-2">${
        typeof item === 'object' ? jsonViewer(item) : `<span>${item}</span>`
      }</div>`;
    });

    return res;
  }

  const keys = Object.keys(json);
  const showParentKey = parentKey && keys.length > 0; // hide an empty object

  if (showParentKey) {
    res += `<div class="pl-2"><div>&#9662; ${parentKey}</div>`;
  }

  for (const key of keys) {
    if (typeof json[key] === 'object') {
      res += jsonViewer(json[key], key);
    } else {
      res += `<div class="key pl-2">${key}: <span>${json[key]}</span></div>`;
    }
  }

  if (showParentKey) {
    res += `</div>`;
  }

  res += '</div>';

  return res;
}
