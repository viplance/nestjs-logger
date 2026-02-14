// WebSocket connection
let socket;
let connected = false;
let connectionAttempts = 0;
let frozen = false;

async function connectWebSocket() {
  connectionAttempts++;

  if (connectionAttempts > 3) {
    alert('Failed to connect to WebSocket. Check the `key` url parameter.');
    return;
  }

  const { hostname, origin, pathname, search } = window.location;

  const res = await fetch(`${origin}${pathname}settings${search}`);

  if (!res.ok) {
    alert(
      'An error occurred while fetching settings. Check the `key` url parameter.',
    );
    return;
  }

  const settings = await res.json();

  if (!!settings.websocket) {
    document.getElementById('refresh').style.display = 'none';
    document.getElementById('freeze').style.display = 'block';
  } else {
    document.getElementById('refresh').style.display = 'block';
    document.getElementById('freeze').style.display = 'none';
    getLogs();
    return;
  }

  if (!settings.websocket?.port) {
    alert('WebSocket port is not configured properly.');
    return;
  }

  const socketUrl = `ws://${hostname}:${settings.websocket.port}`;
  socket = new WebSocket(socketUrl, 'json');

  socket.onerror = (error) => {
    console.error(error);
  };

  socket.onopen = (event) => {
    connected = true;
    connectionAttempts = 0;
    getLogs();
  };

  socket.onclose = (event) => {
    connected = false;
    console.error(event);
    setTimeout(connectWebSocket, 5000);
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());

    if (data['action'] && !frozen) {
      switch (data['action']) {
        case 'list':
          if (currentPage === 1) {
            logs = data['data'];
          } else {
            logs = logs.concat(data['data']);
          }
          hasMore = data['data'].length === limit;
          isLoading = false;
          document.getElementById('loader').style.display = 'none';
          checkElementsVisibility(logs);
          renderLogs(logs);
          checkAndUpdatePopup();
          break;
        case 'insert':
          if (currentPage === 1) {
            handleWsInsert(data['data']);
          }
          break;
        case 'update':
          handleWsUpdate(data['data']);
          break;
        case 'delete':
          handleWsDelete(data['data']._id);
          break;
      }
    }
  };

  setTimeout(() => {
    if (!connected) connectWebSocket(); // fix for Safari browser
  }, 300);
}

function sendMessage(message) {
  socket.send(JSON.stringify(message));
}

function toggleFreeze() {
  frozen = !frozen;
  const button = document.querySelector('#freeze button');
  button.innerHTML = frozen ? 'Frozen' : 'Freeze';

  if (frozen) {
    button.classList.remove('white');
    button.classList.add('light');
  } else {
    button.classList.remove('light');
    button.classList.add('white');
    getLogs();
  }
}
