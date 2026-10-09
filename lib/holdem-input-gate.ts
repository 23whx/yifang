/** UI-side lock. Transport validates acknowledgement identity before calling ack.
 * Other seats' broadcasts must not unlock a request still in flight. */
export class PokerInputGate {
  private state:'ready'|'pending'|'acknowledged'|'closed'='ready';
  get pending(){return this.state==='pending'||this.state==='acknowledged';}
  get closed(){return this.state==='closed';}
  begin(){if(this.state!=='ready')return false;this.state='pending';return true;}
  ack(){if(this.state==='pending')this.state='acknowledged';}
  view(){if(this.state==='acknowledged')this.state='ready';}
  failed(){if(!this.closed)this.state='ready';}
  close(){this.state='closed';}
}
