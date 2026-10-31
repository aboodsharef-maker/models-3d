"""Generate the original cage GLB, in metres, with a hinged door animation."""
from pathlib import Path
import json, struct, math

groups={}
def box(x,y,z,dx,dy,dz,material=0,door=False):
    p=[(x,y,z),(x+dx,y,z),(x+dx,y+dy,z),(x,y+dy,z),(x,y,z+dz),(x+dx,y,z+dz),(x+dx,y+dy,z+dz),(x,y+dy,z+dz)]
    # Counterclockwise triangles, viewed from outside each face.
    faces=[([0,3,2,1],(0,0,-1)),([1,2,6,5],(1,0,0)),([3,7,6,2],(0,1,0)),([0,1,5,4],(0,-1,0)),([0,4,7,3],(-1,0,0)),([4,5,6,7],(0,0,1))]
    positions,normals=groups.setdefault((door,material),([],[]))
    for ids,n in faces:
        for j in [0,1,2,0,2,3]:
            positions.extend(v/100 for v in p[ids[j]])
            normals.extend(n)

def mesh(x0,x1,y0,y1,z,door=False):
    for x in range(round(x0*10),round(x1*10)+1,50): box(x/10-.10,y0,z-.1,.2,y1-y0,.2,1,door)
    for y in range(round(y0*10),round(y1*10)+1,50): box(x0,y/10-.10,z-.1,x1-x0,.2,.2,1,door)

mesh(-72,72,3,117,-53.5)
for x in [-73.5,73.5]:
    for z in range(-52,53,5): box(x-.1,3,z-.1,.2,114,.2,1)
    for y in range(3,118,5): box(x-.1,y-.1,-52,.2,.2,104,1)
mesh(-72,-43,3,117,53.5);mesh(43,72,3,117,53.5)
for x in [-75,72]:
    for z in [-55,52]: box(x,0,z,3,119.5,3)
for y in [0,116.5]:
    for z in [-55,52]: box(-72,y,z,144,3,3)
    for x in [-75,72]: box(x,y,-52,3,3,104)
for x in [-43,40]: box(x,3,52,3,114,3)
# Door geometry uses a local origin at the left hinge.
mesh(3,76,6.5,113.5,0,True)
for x in [0,76]:box(x,3.5,-3,3,113,3,0,True)
for y in [3.5,113.5]:box(3,y,-3,73,3,3,0,True)
box(70,56,0,2,10,2,2,True)
for y in [22,94]:box(-41,y,54,3,7,2)
# Grass tiles: no remote textures; roof top is exactly 120 cm.
for x in range(-75,75,5):
    for z in range(-55,55,5):
        shade=3+(abs(x*17+z*31)%7)
        box(x,119.5,z,5,.5,5,shade)

materials=[{'name':'White powder coat','pbrMetallicRoughness':{'baseColorFactor':[.9,.93,.88,1],'metallicFactor':.12,'roughnessFactor':.62}},
{'name':'White welded mesh','pbrMetallicRoughness':{'baseColorFactor':[.82,.88,.81,1],'metallicFactor':.15,'roughnessFactor':.65}},
{'name':'Latch','pbrMetallicRoughness':{'baseColorFactor':[.35,.42,.34,1],'metallicFactor':.65,'roughnessFactor':.4}}]
for i in range(7):materials.append({'name':'Artificial grass '+str(i),'pbrMetallicRoughness':{'baseColorFactor':[.16+i*.009,.28+i*.012,.055+i*.005,1],'metallicFactor':0,'roughnessFactor':1}})
doc={'asset':{'version':'2.0','generator':'Models 3D cage generator'},'scene':0,'scenes':[{'nodes':[0,1]}],'nodes':[{'name':'Cage frame','mesh':0},{'name':'Door hinge','mesh':1,'translation':[-.395,0,.55]}],'meshes':[{'primitives':[]},{'primitives':[]}],'materials':materials,'accessors':[],'bufferViews':[],'buffers':[]}
binary=bytearray()
def accessor(values,kind,components,limits=False):
    while len(binary)%4:binary.append(0)
    offset=len(binary);binary.extend(struct.pack('<'+'f'*len(values),*values))
    view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(values)*4})
    a={'bufferView':view,'componentType':5126,'count':len(values)//components,'type':kind}
    if limits:
        a['min']=[min(values[i::components]) for i in range(components)]
        a['max']=[max(values[i::components]) for i in range(components)]
    idx=len(doc['accessors']);doc['accessors'].append(a);return idx
for (door,material),(positions,normals) in groups.items():
    pi=accessor(positions,'VEC3',3,True);ni=accessor(normals,'VEC3',3)
    doc['meshes'][int(door)]['primitives'].append({'attributes':{'POSITION':pi,'NORMAL':ni},'material':material})
times=accessor([0,1.25],'SCALAR',1,True);angle=-math.radians(100)/2
rotations=accessor([0,0,0,1,0,math.sin(angle),0,math.cos(angle)],'VEC4',4)
doc['animations']=[{'name':'DoorOpen','samplers':[{'input':times,'output':rotations,'interpolation':'LINEAR'}],'channels':[{'sampler':0,'target':{'node':1,'path':'rotation'}}]}]
doc['buffers']=[{'byteLength':len(binary)}]
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary+=b'\0'*((-len(binary))%4)
out=struct.pack('<III',0x46546C67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(binary),0x004E4942)+binary
dest=Path(__file__).resolve().parents[1]/'models'/'white-cage.glb';dest.write_bytes(out)
print('Generated',dest.name,len(out),'bytes')
