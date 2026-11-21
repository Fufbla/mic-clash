"""Index cleaned, identity-matched sprite sheets without changing their pixels."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
path=root/'dist/assets/atlas.json'
atlas=json.loads(path.read_text())
def index(name,rows,indices,reference_height,hands=None):
    im=Image.open(root/'dist/assets'/name)
    alpha=np.array(im)[:,:,3]
    frames=[]
    for number,i in enumerate(indices):
        cx=round(i%4*im.width/4);right=round((i%4+1)*im.width/4)
        cy=round(i//4*im.height/rows);bottom=round((i//4+1)*im.height/rows)
        yy,xx=np.where(alpha[cy:bottom,cx:right]>35)
        x=max(0,int(xx.min())-1);y=max(0,int(yy.min())-1)
        x2=min(right-cx,int(xx.max())+2);y2=min(bottom-cy,int(yy.max())+2)
        f={'x':cx+x,'y':cy+y,'w':x2-x,'h':y2-y,'cellX':cx,'cellY':cy,
           'cellW':right-cx,'cellH':bottom-cy,'anchorX':(right-cx)*.52-x,
           'anchorY':y2-y-2,'sourceGridIndex':i}
        if hands:
            f['handX']=hands[number][0]-x;f['handY']=hands[number][1]-y
        frames.append(f)
    return {'src':'assets/'+name,'width':im.width,'height':im.height,'cols':4,'rows':rows,
            'alphaThreshold':35,'referenceHeight':reference_height,'frames':frames}
atlas['dr-no-bunnies']=index('dr-no-bunnies-fighter.png',6,range(24),228)
atlas['noBunniesWalk']=index('dr-no-bunnies-actions.png',4,range(8),272)
atlas['noBunniesBelt']=index('dr-no-bunnies-actions.png',4,range(8,16),272,
    [(96,202),(187,207),(65,123),(65,105),(252,155),(242,177),(118,189),(250,151)])
path.write_text(json.dumps(atlas,indent=2)+'\n')
print('Indexed 40 complete Dr. No Bunnies poses; existing atlas entries preserved.')
