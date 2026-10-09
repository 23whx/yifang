declare module '@kobalab/majiang-core' {
  export type Score = { hupai?: {name:string;fanshu:number|string;baojia?:string}[];fu?:number;fanshu?:number;damanguan?:number;defen:number;fenpei:number[] };
  export class Shoupai {
    static fromString(text:string):Shoupai;
    toString():string;
    clone():Shoupai;
    dapai(tile:string):Shoupai;
    lizhi:boolean;
  }
  export function rule(options?:Record<string,unknown>):Record<string,unknown>;
  export const Util: {
    xiangting(hand:Shoupai):number;
    hule_param(options?:Record<string,unknown>):Record<string,unknown>;
    hule(hand:Shoupai,winning:string|null,options:Record<string,unknown>):Score|undefined;
  };
  export type Reply={dapai?:string;fulou?:string;gang?:string;hule?:string;daopai?:string};
  export type Event=Record<string,unknown>;
  export class Shan {
    constructor(rule:Record<string,unknown>);
    _pai:string[];
    _rule:Record<string,unknown>;
    _baopai:string[];
    _fubaopai:string[]|null;
    _weikaigang:boolean;
    _closed:boolean;
    zimo():string;
    gangzimo():string;
    kaigang():this;
    close():this;
    readonly paishu:number;
    readonly baopai:string[];
    readonly fubaopai:string[]|null;
  }
  export class Player {
    action(event:Event,callback?:(reply:Reply)=>void):void;
    _callback?:(reply:Reply)=>void;
    _menfeng:number;
    shoupai:Shoupai;
    model:{zhuangfeng:number;jushu:number;changbang:number;lizhibang:number;defen:number[];player_id:number[];lunban:number;shan:{paishu:number;baopai:string[]}|null;shoupai:Shoupai[];he:{_pai:string[]}[]};
    get_dapai(hand:Shoupai):string[];
    get_chi_mianzi(hand:Shoupai,tile:string):string[];
    get_peng_mianzi(hand:Shoupai,tile:string):string[];
    get_gang_mianzi(hand:Shoupai,tile?:string|null):string[];
    allow_lizhi(hand:Shoupai,tile?:string|null):string[]|boolean;
    allow_hule(hand:Shoupai,tile?:string|null,situation?:boolean):boolean;
    allow_pingju(hand:Shoupai):boolean;
  }
  export class Game {
    constructor(players:Player[],callback?:(record:Record<string,unknown>)=>void,rule?:Record<string,unknown>,title?:string);
    speed:number;
    kaiju(dealer?:number):void;
    qipai(wall?:Shan):void;
    _rule:Record<string,unknown>;
    stop(callback?:()=>void):void;
    _sync:boolean;
    _reply:Reply[];
    call_players(type:string,messages:Event[],timeout?:number):void;
    reply(id:number,reply:Reply):void;
    do_sync():this;
    next():void;
    delay(callback:()=>void,timeout?:number):void;
    _timeout_id?:ReturnType<typeof setTimeout>;
  }
}
