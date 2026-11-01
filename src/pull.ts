export class PullGesture {
  private start: {x:number;y:number}|null=null;
  distance=0;
  begin(x:number,y:number){this.start={x,y};this.distance=0;}
  move(x:number,y:number){
    if(!this.start)return 0;
    const dy=y-this.start.y,dx=Math.abs(x-this.start.x);
    if(dy<0||dx>Math.max(12,dy)){this.cancel();return 0;}
    this.distance=Math.min(110,dy*.5);
    return this.distance;
  }
  end(){const refresh=this.start!==null&&this.distance>=72;this.cancel();return refresh;}
  cancel(){this.start=null;this.distance=0;}
}
