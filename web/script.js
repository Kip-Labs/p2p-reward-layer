
class Peer {
    constructor(mem_capacity)
    {
        this.totalMemory = mem_capacity;
        this.usedMemory = 0;
        this.files = [];
    }

    HasFile(file_url)
    {
        for(let i = 0; i < this.files.length; i++) if(this.files[i].url === file_url) return true;
        return false;
    }
    
    async GetFile(file_url)
    {
        for(let i = 0; i < this.files.length; i++)
        {
            if(this.files[i].url === file_url)
            {
                return this.files[i].data;
            }
        }

        let file = await this.FetchFile(file_url);
        return file;
    }

    async FetchFile(file_url)
    {
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
        catch(e)
        {
            console.log(e);
        }
        return b;    
    }


};

class PeerNetwork {
    constructor()
    {
        this.index = 0;
        this.peers = [];
        this.NewPeer(10000000);
        this.NewPeer(10000000);
        this.NewPeer(10000000);
        this.NewPeer(10000000);
    }

    NewPeer(mem_capacity)
    {
        this.peers.push(new Peer(mem_capacity));
    }

    async GetFile(file_url)
    {
        return new Promise((resolve, reject) => {
            /// look for file if available, start at the index for the last request
            for(let i = 0; i < this.peers.length; i++)
            {
                this.index = (this.index + 1) % this.peers.length;
                let t_index = this.index;
                if(this.peers[t_index].HasFile(file_url))
                {
                    this.peers[t_index].GetFile(file_url).then(file => {
                        resolve(file);
                    });
                    return;
                }
            }

            let gotFile = false;
            if(this.peers.length <= 3)
            {
                /// cache the file on all peers
                for(let i = 0; i < this.peers.length; i++)
                {
                    this.peers[i].GetFile(file_url).then(file => {
                        if(gotFile == false)
                        {
                            gotFile = true;
                            resolve(file);
                        }
                    });
                }
            }
            else
            {
                /// get the three peers with the least amount of used memory to cache the file
                let indices = [];
                indices[0] = -1;
                indices[1] = -1;
                indices[2] = -1;
                let mins = [];
                mins[0] = 9999999999;
                mins[1] = 9999999999;
                mins[2] = 9999999999;
                for(let i = 0; i < this.peers.length; i++)
                {
                    let mem = this.peers[i].usedMemory;
                    if(mem < mins[0])
                    {
                        mins[2] = mins[1];
                        indices[2] = indices[1];

                        mins[1] = mins[0];
                        indices[1] = indices[0];

                        mins[0] = mem;
                        indices[0] = i;
                    }
                    else if(mem < mins[1])
                    {
                        mins[2] = mins[1];
                        indices[2] = indices[1];

                        mins[1] = mem;
                        indices[1] = i;
                    }
                    else if(mem < mins[2])
                    {
                        mins[2] = mem;
                        indices[2] = i;
                    }
                }

                for(let i = 0; i < 3; i++)
                {
                    if(indices[i] < 0) break;
                    this.peers[indices[i]].GetFile(file_url).then(file => {
                        if(gotFile == false)
                        {
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