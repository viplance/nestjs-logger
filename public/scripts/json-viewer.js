function jsonViewer(json, parentKey) {
  if (!json) {
    return "";
  }

  res = `<div>`;

  if (parentKey) {
    res += `<div class="pl-2"><div>${parentKey}</div>`;
  }

  const keys = Object.keys(json);

  for (const key of keys) {
    if (typeof json[key] === "object") {
      res += jsonViewer(json[key], key);
    } else {
      res += `<div class="pl-2">${key}: ${json[key]}</div>`;
    }
  }

  if (parentKey) {
    res += `</div>`;
  }

  res += "</div>";

  return res;
}
