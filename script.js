const peer_id = Math.floor(Math.random() * 2 ** 18)
  .toString(36)
  .padStart(4, 0);

const peer = new Peer(
  `${peer_id}`,
  {
    host: location.hostname,
    debug: 1,
    path: "/myapp",
  },
);

window.peer = peer;

var socket = io();

socket.emit('peer_id', peer_id);
