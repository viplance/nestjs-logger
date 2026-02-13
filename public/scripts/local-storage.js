const LS_KEY = 'nestjs-logger';

const defaultSettings = {
  popupLeft: `${window.innerWidth / 4}px`,
};

function getLs(propertyName) {
  const item = localStorage.getItem(LS_KEY);

  if (!item) {
    return defaultSettings[propertyName];
  }

  return JSON.parse(item)[propertyName];
}

function setLs(propertyName, value) {
  const item = localStorage.getItem(LS_KEY);
  const ls = item ? JSON.parse(item) : { ...defaultSettings };

  ls[propertyName] = value;
  localStorage.setItem(LS_KEY, JSON.stringify(ls));
}
