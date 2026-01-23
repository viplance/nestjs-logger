const LS_KEY = 'nestjs-logger';

function getLs(propertyName) {
  const item = localStorage.getItem(LS_KEY);

  if (!item) {
    return;
  }

  return JSON.parse(item)[propertyName];
}

function setLs(propertyName, value) {
  const item = localStorage.getItem(LS_KEY);

  if (!item) {
    localStorage.setItem(LS_KEY, JSON.stringify({}));
  }

  const ls = JSON.parse(item);
  ls[propertyName] = value;
  localStorage.setItem(LS_KEY, JSON.stringify(ls));
}
