
class Peer {
    constructor(mem_capacity) {
        this.totalMemory = mem_capacity;
        this.usedMemory = 0;
        this.files = [];

        this.connected_peer_ids = [];
        this.peer_conn_map = new Map();
        this.InitNewPeer();

        this.InitWebsocket();
    }

    InitNewPeer() {
        let self = this;

        const peer_id = Math.floor(Math.random() * 2 ** 18)
            .toString(36)
            .padStart(4, 0);

        this.connected_peer_ids = [];
        this.peer_conn_map = new Map();

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
            });
            conn.on('open', () => {
                console.log("Connection to peer", conn.peer, "opened.");
                this.peer_conn_map.set(conn.peer, conn);
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

    CallPeerWithId (peer_id) {
        if (peer_id == this.peer.id) {
            console.warn("Cannot call self.");
            return;
        }

        let conn = this.peer.connect(peer_id);

        conn.on('open', function () {
            console.log("Connection to peer", peer_id, "opened.");
            this.peer_conn_map.set(peer_id, conn);

            this.SendDataToAllPeers({ "peer_id": peer.id });
        });
        conn.on('data', function (p_data) {
            console.log("Received data from peer", peer_id, p_data);
        });
        conn.on('error', (err) => {
            console.error("Error in peer data connection", err);
        });

    }

    SendDataToAllPeers (data) {
        for (let [peer_id, conn] of this.peer_conn_map) {
            conn.send(data);
        }
    }

    SendDataToPeer(data, peer_id) {
        let conn = this.peer_conn_map.get(peer_id);
        if (conn) {
            conn.send(data);
        }
    }

    InitWebsocket() {
        this.socket = io();

        this.socket.emit('peer_id', this.peer.id);

        this.socket.on('peer_id_list', (msg) => {
            console.log('peer_ids: ' + msg);
            this.connected_peer_ids = msg;
            for (let peer_id of this.connected_peer_ids) {
                this.CallPeerWithId(peer_id);
            }
        });
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

        let file = await this.FetchFile(file_url);
        return file;
    }

    async FetchFile(file_url) {
        console.log("dowloading file...");

        let params = {
            method: "GET",
            mode: "cors"
        }
        let res = await fetch(file_url, params);

        let b = null;
        try {
            b = await res.blob();
            console.log(b);

            this.files.push({
                url: file_url,
                data: b
            });
            this.usedMemory += b.size;
        }
        catch (e) {
            console.log(e);
        }
        return b;
    }


};

class PeerNetwork {
    constructor() {
        this.index = 0;
        this.peers = [];
        this.NewPeer(10000000);
        this.NewPeer(10000000);
        this.NewPeer(10000000);
        this.NewPeer(10000000);
    }

    NewPeer(mem_capacity) {
        this.peers.push(new Peer(mem_capacity));
    }

    async GetFile(file_url) {
        return new Promise((resolve, reject) => {
            /// look for file if available, start at the index for the last request
            for (let i = 0; i < this.peers.length; i++) {
                this.index = (this.index + 1) % this.peers.length;
                let t_index = this.index;
                if (this.peers[t_index].HasFile(file_url)) {
                    this.peers[t_index].GetFile(file_url).then(file => {
                        resolve(file);
                    });
                    return;
                }
            }

            let gotFile = false;
            if (this.peers.length <= 3) {
                /// cache the file on all peers
                for (let i = 0; i < this.peers.length; i++) {
                    this.peers[i].GetFile(file_url).then(file => {
                        if (gotFile == false) {
                            gotFile = true;
                            resolve(file);
                        }
                    });
                }
            }
            else {
                /// get the three peers with the least amount of used memory to cache the file
                let indices = [];
                indices[0] = -1;
                indices[1] = -1;
                indices[2] = -1;
                let mins = [];
                mins[0] = 9999999999;
                mins[1] = 9999999999;
                mins[2] = 9999999999;
                for (let i = 0; i < this.peers.length; i++) {
                    let mem = this.peers[i].usedMemory;
                    if (mem < mins[0]) {
                        mins[2] = mins[1];
                        indices[2] = indices[1];

                        mins[1] = mins[0];
                        indices[1] = indices[0];

                        mins[0] = mem;
                        indices[0] = i;
                    }
                    else if (mem < mins[1]) {
                        mins[2] = mins[1];
                        indices[2] = indices[1];

                        mins[1] = mem;
                        indices[1] = i;
                    }
                    else if (mem < mins[2]) {
                        mins[2] = mem;
                        indices[2] = i;
                    }
                }

                for (let i = 0; i < 3; i++) {
                    if (indices[i] < 0) break;
                    this.peers[indices[i]].GetFile(file_url).then(file => {
                        if (gotFile == false) {
                            gotFile = true;
                            resolve(file);
                        }
                    });
                }
            }
        })
    }
}

var p2p = new PeerNetwork();