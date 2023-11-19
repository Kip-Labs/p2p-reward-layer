
class CachePeer {
    constructor(wallet_address, mem_capacity = 1000000000) {
        this.totalMemory = mem_capacity;
        this.usedMemory = 0;
        this.files = [];
        this.wallet = wallet_address;

        this.connected_peer_ids = [];
        this.peer_to_conn_map = new Map();
        this.InitNewPeer();

        this.InitWebsocket();
    }

    InitNewPeer() {
        let self = this;

        const peer_id = Math.floor(Math.random() * 2 ** 18)
            .toString(36)
            .padStart(4, 0);

        this.connected_peer_ids = [];
        this.peer_to_conn_map = new Map();

        this.peer = new Peer(
            `${peer_id}`,
            {
                host: location.hostname,
                debug: 1,
                path: "/peerapp",
            },
        );

        this.peer.on('open', function () {
            console.log('My PeerJS ID is:', self.peer.id);
        });

        this.peer.on('connection', (conn) => {
            console.log("Incoming connection from peer", conn.peer);
            conn.on('data', (p_data) => {
                console.log("Received data from peer", conn.peer, p_data);
                // console.log("File url: " + p_data.file_url + " File: " + p_data.file);
            });
            conn.on('open', () => {
                console.log("Connection to peer", conn.peer, "opened.");
                self.peer_to_conn_map.set(conn.peer, conn);
            });
            conn.on('error', (err) => {
                console.error("Error in peer data connection", err);
            });
        });

        this.peer.on('close', function () {
            console.error('close in PeerChat');
        });

        this.peer.on('disconnected', function () {
            console.error('disconnected in PeerChat');
            // where backoff is a value in seconds which I increment everytime I try up to a maximum.
            // this.disconnectBackoff = 1;
            // this.retrySocketConnection();
            this.InitNewPeer();
        });

        // Non-Fatal error:
        // 'peer-unavailable' = maybe they left?
        // 'disconnected' = this means the Peering server disconnected, we have a seperate retry for that on('disconnect')
        // pretty much all of the rest are fatal.
        // Error handling adapted from https://github.com/peers/peerjs/issues/650
        const FATAL_ERRORS = ['invalid-id', 'invalid-key', 'network', 'ssl-unavailable', 'server-error', 'socket-error', 'socket-closed', 'unavailable-id', 'webrtc'];
        this.peer.on('error', function (err) {
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

    }

    CallPeerWithId(peer_id) {
        let self = this;

        if (peer_id == this.peer.id) {
            console.warn("Cannot call self.");
            return;
        }

        if (this.connected_peer_ids.includes(peer_id)) {
            console.warn("Already connected to peer", peer_id);
            return;
        }

        let conn = this.peer.connect(peer_id);

        conn.on('open', function () {
            console.log("Connection to peer", peer_id, "opened.");
            self.peer_to_conn_map.set(peer_id, conn);
            self.connected_peer_ids.push(peer_id);

            // self.SendDataToAllPeers({ "peer_id": self.peer.id });
        });
        conn.on('data', function (p_data) {
            console.log("Received data from peer", peer_id, p_data);
            // console.log("File url: " + p_data.file_url + " File: " + p_data.file);
        });
        conn.on('error', (err) => {
            console.error("Error in peer data connection", err);
        });

    }

    SendDataToAllPeers (data) {
        for (let [peer_id, conn] of this.peer_to_conn_map) {
            conn.send(data);
        }
    }

    SendDataToPeer(data, peer_id) {
        let conn = this.peer_to_conn_map.get(peer_id);
        if (conn) {
            conn.send(data);
        }
    }

    InitWebsocket() {
        let self = this;

        this.socket = io();

        this.socket.emit('setup', {peer_id: this.peer.id, wallet: this.wallet});

        this.socket.on('peer_id_list', (msg) => {
            console.log('peer_ids: ' + msg);
            let new_peers_list = msg;

            for (let peer_id of this.connected_peer_ids) {
                if (new_peers_list.includes(peer_id) == false) {
                    self.connected_peer_ids.splice(self.connected_peer_ids.indexOf(peer_id), 1);
                    self.peer_to_conn_map.delete(peer_id);
                }
            }

            for (let peer_id of new_peers_list) {
                this.CallPeerWithId(peer_id);
            }
        });

        this.socket.on('send_file', (msg) => {
            let file_url = msg.file_url; // File to send
            let peer_id = msg.peer_id; // Peer to send the file to
            console.log("Sending file... " + file_url + " to peer " + peer_id);

            this.GetFile(file_url).then(fileBufferArray => {
                let data = {
                    file_url: file_url,
                    file: fileBufferArray
                };
                this.SendDataToPeer(data, peer_id);
                this.socket.emit('add_file', file_url);
            });
        });

    }

    RequestFile(file_url) {
        console.log("Requesting file... " + file_url);
        this.socket.emit('request_file', file_url);
    }

    RequestReward()
    {
        console.log("Requesting reward...");
        this.socket.emit('request_reward', null);
    }

    HasFile(file_url) {
        for (let i = 0; i < this.files.length; i++) if (this.files[i].url === file_url) return true;
        return false;
    }

    async GetFile(file_url) {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].url === file_url) {
                return this.files[i].data;
            }
        }

        let arrayBuffer = await this.FetchFile(file_url);
        return arrayBuffer;
    }

    async FetchFile(file_url) {
        console.log("dowloading file...");

        let params = {
            method: "GET",
            mode: "cors"
        }
        let res = await fetch(file_url, params);

        let _blob = null;
        let arrayBuffer = null;
        try {
            _blob = await res.blob();
            console.log(_blob);
            arrayBuffer = await _blob.arrayBuffer();

            this.files.push({
                url: file_url,
                data: arrayBuffer
            });
            this.usedMemory += _blob.size;
        }
        catch (e) {
            console.log(e);
        }
        return arrayBuffer;
    }


};

// var cachePeer = new CachePeer();
// cachePeer.RequestFile('https://upload.wikimedia.org/wikipedia/commons/0/09/Apollo_14_Shepard.jpg')
// CachePeer.RequestReward();