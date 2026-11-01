import {describe,it,expect} from 'vitest';
import {PullGesture} from './pull';
describe('pull to refresh gesture',()=>{
  it('requires a deliberate downward pull and resets after release',()=>{const g=new PullGesture();g.begin(20,10);expect(g.move(22,130)).toBe(60);expect(g.end()).toBe(false);g.begin(20,10);expect(g.move(22,170)).toBe(80);expect(g.end()).toBe(true);expect(g.end()).toBe(false);});
  it('cancels sideways, upward and interrupted gestures',()=>{const g=new PullGesture();g.begin(20,10);g.move(80,20);g.move(80,200);expect(g.end()).toBe(false);g.begin(20,100);g.move(20,90);g.move(20,300);expect(g.end()).toBe(false);g.begin(20,10);g.move(20,200);g.cancel();expect(g.end()).toBe(false);});
  it('limits the indicator and ignores moves without an eligible start',()=>{const g=new PullGesture();expect(g.move(20,300)).toBe(0);g.begin(20,10);expect(g.move(20,1000)).toBe(110);});
});
