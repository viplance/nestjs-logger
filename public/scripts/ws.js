// WebSocket connection
const key = "123";
let socket;

async function connectWebSocket() {
  const { hostname, origin, pathname, search } = window.location;

  const res = await fetch(`${origin}${pathname}settings${search}`);

  if (!res.ok) {
    alert("An error occurred while fetching settings.");
    return;
  }

  const settings = await res.json();

  if (!settings.websocket?.port) {
    alert("WebSocket port is not configured.");
    return;
  }

  const socketUrl = `ws://${hostname}:${settings.websocket.port}`;
  socket = new WebSocket(socketUrl, "json");

  socket.onerror = (error) => {
    console.error(error);
  };

  socket.onopen = (event) => {
    socket.send(JSON.stringify({ action: "getLogs", key }));
  };

  socket.onclose = (event) => {
    console.log(event);
    setTimeout(connectWebSocket, 5000);
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());

    if (data["action"]) {
      switch (data["action"]) {
        case "insert":
          getLogs();
          break;
        case "update":
          getLogs();
          return;
        case "delete":
          return;
      }
    }
  };
}
