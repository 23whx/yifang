import type {BoardConnection} from './board/manual-connection';

/** Adapts an already selected PeerJS data connection to the same protocol used
 * by manual Hold'em. This class does not create a Peer or contact a service.
 * The caller still owns Peer lifecycle and selects/binds the one opponent.
 * Instantiate before any data arrives; queue open until protocol handlers exist.
 */
export class PokerPeerChannel {
  private stopped=false;
  private opened=false;
  onopen:()=>void=()=>{};
  ondata:(value:unknown)=>void=()=>{};
  onclose:()=>void=()=>{};
  onerror:()=>void=()=>{};
  constructor(private connection:BoardConnection){
    const opened=()=>queueMicrotask(()=>{
      if(this.stopped||this.opened||!connection.open)return;
      this.opened=true;this.onopen();
    });
    connection.on('open',opened);
    connection.on('data',value=>{if(!this.stopped)this.ondata(value);});
    connection.on('close',()=>this.close());
    connection.on('error',()=>{if(this.stopped)return;try{this.onerror();}finally{this.close();}});
    if(connection.open)opened();
  }
  get open(){return !this.stopped&&this.connection.open;}
  send(value:unknown){if(!this.open)throw new Error('Closed poker connection');this.connection.send(value);}
  close(){if(this.stopped)return;this.stopped=true;try{this.connection.close();}finally{this.onclose();}}
  // Manual negotiation is bypassed only because the caller supplied the exact
  // data connection. No synthetic offer/answer is exposed to a user or network.
  async offer(){if(this.stopped)throw new Error('Closed');return '';}
  async answer(){if(this.stopped)throw new Error('Closed');return '';}
  async finish(){if(this.stopped)throw new Error('Closed');}
}
