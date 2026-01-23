// WebSocket connection
let socket;
let frozen = false;

async function connectWebSocket() {
  const { hostname, origin, pathname, search } = window.location;

  const res = await fetch(`${origin}${pathname}settings${search}`);

  if (!res.ok) {
    alert(
      'An error occurred while fetching settings. Check the `key` url parameter.'
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
    getLogs();
  };

  socket.onclose = (event) => {
    console.log(event);
    setTimeout(connectWebSocket, 5000);
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());

    if (data['action'] && !frozen) {
      switch (data['action']) {
        case 'list':
          logs = data['data'];
          checkElementsVisibility(logs);
          renderLogs(logs);
          break;
        case 'insert':
          getLogs();
          break;
        case 'update':
          getLogs();
          return;
        case 'delete':
          return;
      }
    }
  };
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
  }
}
