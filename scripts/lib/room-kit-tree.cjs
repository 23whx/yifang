// Test helper: rooms render shared RoomKit components. Those are pure (no hooks),
// so expand them in place to let element-tree tests find their buttons and text.
const path=require('node:path');
let kit=null;
function expandRoomKit(node){
 if(!kit){kit=new Set(Object.values(require(path.resolve(__dirname,'../../components/remote/RoomKit.tsx'))).filter(v=>typeof v==='function'));
  // The host's door list is pure too; NicknameField keeps its own state and stays opaque.
  kit.add(require(path.resolve(__dirname,'../../components/remote/Visitors.tsx')).VisitorList);}
 if(Array.isArray(node))return node.map(expandRoomKit);
 if(!node||typeof node!=='object'||!node.props)return node;
 if(kit.has(node.type))return expandRoomKit(node.type(node.props));
 if(node.props.children===undefined)return node;
 return {...node,props:{...node.props,children:expandRoomKit(node.props.children)}};
}
module.exports={expandRoomKit};
