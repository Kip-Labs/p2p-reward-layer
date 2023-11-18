
var connected_peer_ids = [];
var peer_conn_map = new Map();
var peer_id = null;


var init_new_peer = function () {
  peer_id = Math.floor(Math.random() * 2 ** 18)
    .toString(36)
    .padStart(4, 0);

  connected_peer_ids = [];

  const peer = new Peer(
    `${peer_id}`,
    {
      host: location.hostname,
      debug: 1,
      path: "/peerapp",
    },
  );

  peer.on('open', function () {
    console.log('My PeerJS ID is:', self.peer.id);
  });

  peer.on('connection', (conn) => {
    console.log("Incoming connection from peer", conn.peer);
    conn.on('data', (p_data) => {
      console.log("Received data from peer", conn.peer, p_data);
    });
    conn.on('open', () => {
      console.log("Connection to peer", conn.peer, "opened.");
      peer_conn_map.set(conn.peer, conn);
    });
    conn.on('error', (err) => {
      console.error("Error in peer data connection", err);
    });
  });

  peer.on('close', function () {
    console.error('close in PeerChat');
  });

  peer.on('disconnected', function () {
    console.error('disconnected in PeerChat');
    // where backoff is a value in seconds which I increment everytime I try up to a maximum.
    // this.disconnectBackoff = 1;
    // this.retrySocketConnection();
    init_new_peer();
  });

  // Non-Fatal error:
  // 'peer-unavailable' = maybe they left?
  // 'disconnected' = this means the Peering server disconnected, we have a seperate retry for that on('disconnect')
  // pretty much all of the rest are fatal.
  // Error handling adapted from https://github.com/peers/peerjs/issues/650
  const FATAL_ERRORS = ['invalid-id', 'invalid-key', 'network', 'ssl-unavailable', 'server-error', 'socket-error', 'socket-closed', 'unavailable-id', 'webrtc'];
  peer.on('error', function (err) {
    // try {
    // console.error('error in PeerChat', err);

    // Errors on the peer are almost always fatal and will destroy the peer
    if (FATAL_ERRORS.includes(err.type)) {
      // TODO Add increasing timeout here to avoid thrashing the browser
      console.error('Fatal error: ', err.type);
      // init_new_peer();
      // this.reconnectTimeout(e); // this function waits then tries the entire connection over again
    } else {
      console.log('Non fatal error: ', err.type);
      // call_next_peer();
    }
  });


  window.peer = peer;

  return peer;
}
var peer = init_new_peer();

var call_peer_with_id = function (peer_id) {
  if (peer_id == peer.id) {
    console.warn("Cannot call self.");
    return;
  }

  let conn = peer.connect(peer_id);

  conn.on('open', function () {
    console.log("Connection to peer", peer_id, "opened.");
    peer_conn_map.set(peer_id, conn);

    send_data_to_all_peers({ "peer_id": peer.id });
  });
  conn.on('data', function (p_data) {
    console.log("Received data from peer", peer_id, p_data);
  });
  conn.on('error', (err) => {
    console.error("Error in peer data connection", err);
  });

}

var send_data_to_all_peers = function (data) {
  for (let [peer_id, conn] of peer_conn_map) {
    conn.send(data);
  }
}


var socket = io();

socket.emit('peer_id', peer_id);

socket.on('peer_id_list', (msg) => {
  console.log('peer_ids: ' + msg);
  connected_peer_ids = msg;
  for (let peer_id of connected_peer_ids) {
    call_peer_with_id(peer_id);
  }
});