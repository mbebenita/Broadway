// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.YUVWebGLCanvas = factory();
    }
}(this, function () {
  
  // --------------- imported from sylvester.js
  
  
  eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('9 17={3i:\'0.1.3\',16:1e-6};l v(){}v.23={e:l(i){8(i<1||i>7.4.q)?w:7.4[i-1]},2R:l(){8 7.4.q},1u:l(){8 F.1x(7.2u(7))},24:l(a){9 n=7.4.q;9 V=a.4||a;o(n!=V.q){8 1L}J{o(F.13(7.4[n-1]-V[n-1])>17.16){8 1L}}H(--n);8 2x},1q:l(){8 v.u(7.4)},1b:l(a){9 b=[];7.28(l(x,i){b.19(a(x,i))});8 v.u(b)},28:l(a){9 n=7.4.q,k=n,i;J{i=k-n;a(7.4[i],i+1)}H(--n)},2q:l(){9 r=7.1u();o(r===0){8 7.1q()}8 7.1b(l(x){8 x/r})},1C:l(a){9 V=a.4||a;9 n=7.4.q,k=n,i;o(n!=V.q){8 w}9 b=0,1D=0,1F=0;7.28(l(x,i){b+=x*V[i-1];1D+=x*x;1F+=V[i-1]*V[i-1]});1D=F.1x(1D);1F=F.1x(1F);o(1D*1F===0){8 w}9 c=b/(1D*1F);o(c<-1){c=-1}o(c>1){c=1}8 F.37(c)},1m:l(a){9 b=7.1C(a);8(b===w)?w:(b<=17.16)},34:l(a){9 b=7.1C(a);8(b===w)?w:(F.13(b-F.1A)<=17.16)},2k:l(a){9 b=7.2u(a);8(b===w)?w:(F.13(b)<=17.16)},2j:l(a){9 V=a.4||a;o(7.4.q!=V.q){8 w}8 7.1b(l(x,i){8 x+V[i-1]})},2C:l(a){9 V=a.4||a;o(7.4.q!=V.q){8 w}8 7.1b(l(x,i){8 x-V[i-1]})},22:l(k){8 7.1b(l(x){8 x*k})},x:l(k){8 7.22(k)},2u:l(a){9 V=a.4||a;9 i,2g=0,n=7.4.q;o(n!=V.q){8 w}J{2g+=7.4[n-1]*V[n-1]}H(--n);8 2g},2f:l(a){9 B=a.4||a;o(7.4.q!=3||B.q!=3){8 w}9 A=7.4;8 v.u([(A[1]*B[2])-(A[2]*B[1]),(A[2]*B[0])-(A[0]*B[2]),(A[0]*B[1])-(A[1]*B[0])])},2A:l(){9 m=0,n=7.4.q,k=n,i;J{i=k-n;o(F.13(7.4[i])>F.13(m)){m=7.4[i]}}H(--n);8 m},2Z:l(x){9 a=w,n=7.4.q,k=n,i;J{i=k-n;o(a===w&&7.4[i]==x){a=i+1}}H(--n);8 a},3g:l(){8 S.2X(7.4)},2d:l(){8 7.1b(l(x){8 F.2d(x)})},2V:l(x){8 7.1b(l(y){8(F.13(y-x)<=17.16)?x:y})},1o:l(a){o(a.K){8 a.1o(7)}9 V=a.4||a;o(V.q!=7.4.q){8 w}9 b=0,2b;7.28(l(x,i){2b=x-V[i-1];b+=2b*2b});8 F.1x(b)},3a:l(a){8 a.1h(7)},2T:l(a){8 a.1h(7)},1V:l(t,a){9 V,R,x,y,z;2S(7.4.q){27 2:V=a.4||a;o(V.q!=2){8 w}R=S.1R(t).4;x=7.4[0]-V[0];y=7.4[1]-V[1];8 v.u([V[0]+R[0][0]*x+R[0][1]*y,V[1]+R[1][0]*x+R[1][1]*y]);1I;27 3:o(!a.U){8 w}9 C=a.1r(7).4;R=S.1R(t,a.U).4;x=7.4[0]-C[0];y=7.4[1]-C[1];z=7.4[2]-C[2];8 v.u([C[0]+R[0][0]*x+R[0][1]*y+R[0][2]*z,C[1]+R[1][0]*x+R[1][1]*y+R[1][2]*z,C[2]+R[2][0]*x+R[2][1]*y+R[2][2]*z]);1I;2P:8 w}},1t:l(a){o(a.K){9 P=7.4.2O();9 C=a.1r(P).4;8 v.u([C[0]+(C[0]-P[0]),C[1]+(C[1]-P[1]),C[2]+(C[2]-(P[2]||0))])}1d{9 Q=a.4||a;o(7.4.q!=Q.q){8 w}8 7.1b(l(x,i){8 Q[i-1]+(Q[i-1]-x)})}},1N:l(){9 V=7.1q();2S(V.4.q){27 3:1I;27 2:V.4.19(0);1I;2P:8 w}8 V},2n:l(){8\'[\'+7.4.2K(\', \')+\']\'},26:l(a){7.4=(a.4||a).2O();8 7}};v.u=l(a){9 V=25 v();8 V.26(a)};v.i=v.u([1,0,0]);v.j=v.u([0,1,0]);v.k=v.u([0,0,1]);v.2J=l(n){9 a=[];J{a.19(F.2F())}H(--n);8 v.u(a)};v.1j=l(n){9 a=[];J{a.19(0)}H(--n);8 v.u(a)};l S(){}S.23={e:l(i,j){o(i<1||i>7.4.q||j<1||j>7.4[0].q){8 w}8 7.4[i-1][j-1]},33:l(i){o(i>7.4.q){8 w}8 v.u(7.4[i-1])},2E:l(j){o(j>7.4[0].q){8 w}9 a=[],n=7.4.q,k=n,i;J{i=k-n;a.19(7.4[i][j-1])}H(--n);8 v.u(a)},2R:l(){8{2D:7.4.q,1p:7.4[0].q}},2D:l(){8 7.4.q},1p:l(){8 7.4[0].q},24:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(7.4.q!=M.q||7.4[0].q!=M[0].q){8 1L}9 b=7.4.q,15=b,i,G,10=7.4[0].q,j;J{i=15-b;G=10;J{j=10-G;o(F.13(7.4[i][j]-M[i][j])>17.16){8 1L}}H(--G)}H(--b);8 2x},1q:l(){8 S.u(7.4)},1b:l(a){9 b=[],12=7.4.q,15=12,i,G,10=7.4[0].q,j;J{i=15-12;G=10;b[i]=[];J{j=10-G;b[i][j]=a(7.4[i][j],i+1,j+1)}H(--G)}H(--12);8 S.u(b)},2i:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}8(7.4.q==M.q&&7.4[0].q==M[0].q)},2j:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(!7.2i(M)){8 w}8 7.1b(l(x,i,j){8 x+M[i-1][j-1]})},2C:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(!7.2i(M)){8 w}8 7.1b(l(x,i,j){8 x-M[i-1][j-1]})},2B:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}8(7.4[0].q==M.q)},22:l(a){o(!a.4){8 7.1b(l(x){8 x*a})}9 b=a.1u?2x:1L;9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(!7.2B(M)){8 w}9 d=7.4.q,15=d,i,G,10=M[0].q,j;9 e=7.4[0].q,4=[],21,20,c;J{i=15-d;4[i]=[];G=10;J{j=10-G;21=0;20=e;J{c=e-20;21+=7.4[i][c]*M[c][j]}H(--20);4[i][j]=21}H(--G)}H(--d);9 M=S.u(4);8 b?M.2E(1):M},x:l(a){8 7.22(a)},32:l(a,b,c,d){9 e=[],12=c,i,G,j;9 f=7.4.q,1p=7.4[0].q;J{i=c-12;e[i]=[];G=d;J{j=d-G;e[i][j]=7.4[(a+i-1)%f][(b+j-1)%1p]}H(--G)}H(--12);8 S.u(e)},31:l(){9 a=7.4.q,1p=7.4[0].q;9 b=[],12=1p,i,G,j;J{i=1p-12;b[i]=[];G=a;J{j=a-G;b[i][j]=7.4[j][i]}H(--G)}H(--12);8 S.u(b)},1y:l(){8(7.4.q==7.4[0].q)},2A:l(){9 m=0,12=7.4.q,15=12,i,G,10=7.4[0].q,j;J{i=15-12;G=10;J{j=10-G;o(F.13(7.4[i][j])>F.13(m)){m=7.4[i][j]}}H(--G)}H(--12);8 m},2Z:l(x){9 a=w,12=7.4.q,15=12,i,G,10=7.4[0].q,j;J{i=15-12;G=10;J{j=10-G;o(7.4[i][j]==x){8{i:i+1,j:j+1}}}H(--G)}H(--12);8 w},30:l(){o(!7.1y){8 w}9 a=[],n=7.4.q,k=n,i;J{i=k-n;a.19(7.4[i][i])}H(--n);8 v.u(a)},1K:l(){9 M=7.1q(),1c;9 n=7.4.q,k=n,i,1s,1n=7.4[0].q,p;J{i=k-n;o(M.4[i][i]==0){2e(j=i+1;j<k;j++){o(M.4[j][i]!=0){1c=[];1s=1n;J{p=1n-1s;1c.19(M.4[i][p]+M.4[j][p])}H(--1s);M.4[i]=1c;1I}}}o(M.4[i][i]!=0){2e(j=i+1;j<k;j++){9 a=M.4[j][i]/M.4[i][i];1c=[];1s=1n;J{p=1n-1s;1c.19(p<=i?0:M.4[j][p]-M.4[i][p]*a)}H(--1s);M.4[j]=1c}}}H(--n);8 M},3h:l(){8 7.1K()},2z:l(){o(!7.1y()){8 w}9 M=7.1K();9 a=M.4[0][0],n=M.4.q-1,k=n,i;J{i=k-n+1;a=a*M.4[i][i]}H(--n);8 a},3f:l(){8 7.2z()},2y:l(){8(7.1y()&&7.2z()===0)},2Y:l(){o(!7.1y()){8 w}9 a=7.4[0][0],n=7.4.q-1,k=n,i;J{i=k-n+1;a+=7.4[i][i]}H(--n);8 a},3e:l(){8 7.2Y()},1Y:l(){9 M=7.1K(),1Y=0;9 a=7.4.q,15=a,i,G,10=7.4[0].q,j;J{i=15-a;G=10;J{j=10-G;o(F.13(M.4[i][j])>17.16){1Y++;1I}}H(--G)}H(--a);8 1Y},3d:l(){8 7.1Y()},2W:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}9 T=7.1q(),1p=T.4[0].q;9 b=T.4.q,15=b,i,G,10=M[0].q,j;o(b!=M.q){8 w}J{i=15-b;G=10;J{j=10-G;T.4[i][1p+j]=M[i][j]}H(--G)}H(--b);8 T},2w:l(){o(!7.1y()||7.2y()){8 w}9 a=7.4.q,15=a,i,j;9 M=7.2W(S.I(a)).1K();9 b,1n=M.4[0].q,p,1c,2v;9 c=[],2c;J{i=a-1;1c=[];b=1n;c[i]=[];2v=M.4[i][i];J{p=1n-b;2c=M.4[i][p]/2v;1c.19(2c);o(p>=15){c[i].19(2c)}}H(--b);M.4[i]=1c;2e(j=0;j<i;j++){1c=[];b=1n;J{p=1n-b;1c.19(M.4[j][p]-M.4[i][p]*M.4[j][i])}H(--b);M.4[j]=1c}}H(--a);8 S.u(c)},3c:l(){8 7.2w()},2d:l(){8 7.1b(l(x){8 F.2d(x)})},2V:l(x){8 7.1b(l(p){8(F.13(p-x)<=17.16)?x:p})},2n:l(){9 a=[];9 n=7.4.q,k=n,i;J{i=k-n;a.19(v.u(7.4[i]).2n())}H(--n);8 a.2K(\'\\n\')},26:l(a){9 i,4=a.4||a;o(1g(4[0][0])!=\'1f\'){9 b=4.q,15=b,G,10,j;7.4=[];J{i=15-b;G=4[i].q;10=G;7.4[i]=[];J{j=10-G;7.4[i][j]=4[i][j]}H(--G)}H(--b);8 7}9 n=4.q,k=n;7.4=[];J{i=k-n;7.4.19([4[i]])}H(--n);8 7}};S.u=l(a){9 M=25 S();8 M.26(a)};S.I=l(n){9 a=[],k=n,i,G,j;J{i=k-n;a[i]=[];G=k;J{j=k-G;a[i][j]=(i==j)?1:0}H(--G)}H(--n);8 S.u(a)};S.2X=l(a){9 n=a.q,k=n,i;9 M=S.I(n);J{i=k-n;M.4[i][i]=a[i]}H(--n);8 M};S.1R=l(b,a){o(!a){8 S.u([[F.1H(b),-F.1G(b)],[F.1G(b),F.1H(b)]])}9 d=a.1q();o(d.4.q!=3){8 w}9 e=d.1u();9 x=d.4[0]/e,y=d.4[1]/e,z=d.4[2]/e;9 s=F.1G(b),c=F.1H(b),t=1-c;8 S.u([[t*x*x+c,t*x*y-s*z,t*x*z+s*y],[t*x*y+s*z,t*y*y+c,t*y*z-s*x],[t*x*z-s*y,t*y*z+s*x,t*z*z+c]])};S.3b=l(t){9 c=F.1H(t),s=F.1G(t);8 S.u([[1,0,0],[0,c,-s],[0,s,c]])};S.39=l(t){9 c=F.1H(t),s=F.1G(t);8 S.u([[c,0,s],[0,1,0],[-s,0,c]])};S.38=l(t){9 c=F.1H(t),s=F.1G(t);8 S.u([[c,-s,0],[s,c,0],[0,0,1]])};S.2J=l(n,m){8 S.1j(n,m).1b(l(){8 F.2F()})};S.1j=l(n,m){9 a=[],12=n,i,G,j;J{i=n-12;a[i]=[];G=m;J{j=m-G;a[i][j]=0}H(--G)}H(--12);8 S.u(a)};l 14(){}14.23={24:l(a){8(7.1m(a)&&7.1h(a.K))},1q:l(){8 14.u(7.K,7.U)},2U:l(a){9 V=a.4||a;8 14.u([7.K.4[0]+V[0],7.K.4[1]+V[1],7.K.4[2]+(V[2]||0)],7.U)},1m:l(a){o(a.W){8 a.1m(7)}9 b=7.U.1C(a.U);8(F.13(b)<=17.16||F.13(b-F.1A)<=17.16)},1o:l(a){o(a.W){8 a.1o(7)}o(a.U){o(7.1m(a)){8 7.1o(a.K)}9 N=7.U.2f(a.U).2q().4;9 A=7.K.4,B=a.K.4;8 F.13((A[0]-B[0])*N[0]+(A[1]-B[1])*N[1]+(A[2]-B[2])*N[2])}1d{9 P=a.4||a;9 A=7.K.4,D=7.U.4;9 b=P[0]-A[0],2a=P[1]-A[1],29=(P[2]||0)-A[2];9 c=F.1x(b*b+2a*2a+29*29);o(c===0)8 0;9 d=(b*D[0]+2a*D[1]+29*D[2])/c;9 e=1-d*d;8 F.13(c*F.1x(e<0?0:e))}},1h:l(a){9 b=7.1o(a);8(b!==w&&b<=17.16)},2T:l(a){8 a.1h(7)},1v:l(a){o(a.W){8 a.1v(7)}8(!7.1m(a)&&7.1o(a)<=17.16)},1U:l(a){o(a.W){8 a.1U(7)}o(!7.1v(a)){8 w}9 P=7.K.4,X=7.U.4,Q=a.K.4,Y=a.U.4;9 b=X[0],1z=X[1],1B=X[2],1T=Y[0],1S=Y[1],1M=Y[2];9 c=P[0]-Q[0],2s=P[1]-Q[1],2r=P[2]-Q[2];9 d=-b*c-1z*2s-1B*2r;9 e=1T*c+1S*2s+1M*2r;9 f=b*b+1z*1z+1B*1B;9 g=1T*1T+1S*1S+1M*1M;9 h=b*1T+1z*1S+1B*1M;9 k=(d*g/f+h*e)/(g-h*h);8 v.u([P[0]+k*b,P[1]+k*1z,P[2]+k*1B])},1r:l(a){o(a.U){o(7.1v(a)){8 7.1U(a)}o(7.1m(a)){8 w}9 D=7.U.4,E=a.U.4;9 b=D[0],1l=D[1],1k=D[2],1P=E[0],1O=E[1],1Q=E[2];9 x=(1k*1P-b*1Q),y=(b*1O-1l*1P),z=(1l*1Q-1k*1O);9 N=v.u([x*1Q-y*1O,y*1P-z*1Q,z*1O-x*1P]);9 P=11.u(a.K,N);8 P.1U(7)}1d{9 P=a.4||a;o(7.1h(P)){8 v.u(P)}9 A=7.K.4,D=7.U.4;9 b=D[0],1l=D[1],1k=D[2],1w=A[0],18=A[1],1a=A[2];9 x=b*(P[1]-18)-1l*(P[0]-1w),y=1l*((P[2]||0)-1a)-1k*(P[1]-18),z=1k*(P[0]-1w)-b*((P[2]||0)-1a);9 V=v.u([1l*x-1k*z,1k*y-b*x,b*z-1l*y]);9 k=7.1o(P)/V.1u();8 v.u([P[0]+V.4[0]*k,P[1]+V.4[1]*k,(P[2]||0)+V.4[2]*k])}},1V:l(t,a){o(1g(a.U)==\'1f\'){a=14.u(a.1N(),v.k)}9 R=S.1R(t,a.U).4;9 C=a.1r(7.K).4;9 A=7.K.4,D=7.U.4;9 b=C[0],1E=C[1],1J=C[2],1w=A[0],18=A[1],1a=A[2];9 x=1w-b,y=18-1E,z=1a-1J;8 14.u([b+R[0][0]*x+R[0][1]*y+R[0][2]*z,1E+R[1][0]*x+R[1][1]*y+R[1][2]*z,1J+R[2][0]*x+R[2][1]*y+R[2][2]*z],[R[0][0]*D[0]+R[0][1]*D[1]+R[0][2]*D[2],R[1][0]*D[0]+R[1][1]*D[1]+R[1][2]*D[2],R[2][0]*D[0]+R[2][1]*D[1]+R[2][2]*D[2]])},1t:l(a){o(a.W){9 A=7.K.4,D=7.U.4;9 b=A[0],18=A[1],1a=A[2],2N=D[0],1l=D[1],1k=D[2];9 c=7.K.1t(a).4;9 d=b+2N,2h=18+1l,2o=1a+1k;9 Q=a.1r([d,2h,2o]).4;9 e=[Q[0]+(Q[0]-d)-c[0],Q[1]+(Q[1]-2h)-c[1],Q[2]+(Q[2]-2o)-c[2]];8 14.u(c,e)}1d o(a.U){8 7.1V(F.1A,a)}1d{9 P=a.4||a;8 14.u(7.K.1t([P[0],P[1],(P[2]||0)]),7.U)}},1Z:l(a,b){a=v.u(a);b=v.u(b);o(a.4.q==2){a.4.19(0)}o(b.4.q==2){b.4.19(0)}o(a.4.q>3||b.4.q>3){8 w}9 c=b.1u();o(c===0){8 w}7.K=a;7.U=v.u([b.4[0]/c,b.4[1]/c,b.4[2]/c]);8 7}};14.u=l(a,b){9 L=25 14();8 L.1Z(a,b)};14.X=14.u(v.1j(3),v.i);14.Y=14.u(v.1j(3),v.j);14.Z=14.u(v.1j(3),v.k);l 11(){}11.23={24:l(a){8(7.1h(a.K)&&7.1m(a))},1q:l(){8 11.u(7.K,7.W)},2U:l(a){9 V=a.4||a;8 11.u([7.K.4[0]+V[0],7.K.4[1]+V[1],7.K.4[2]+(V[2]||0)],7.W)},1m:l(a){9 b;o(a.W){b=7.W.1C(a.W);8(F.13(b)<=17.16||F.13(F.1A-b)<=17.16)}1d o(a.U){8 7.W.2k(a.U)}8 w},2k:l(a){9 b=7.W.1C(a.W);8(F.13(F.1A/2-b)<=17.16)},1o:l(a){o(7.1v(a)||7.1h(a)){8 0}o(a.K){9 A=7.K.4,B=a.K.4,N=7.W.4;8 F.13((A[0]-B[0])*N[0]+(A[1]-B[1])*N[1]+(A[2]-B[2])*N[2])}1d{9 P=a.4||a;9 A=7.K.4,N=7.W.4;8 F.13((A[0]-P[0])*N[0]+(A[1]-P[1])*N[1]+(A[2]-(P[2]||0))*N[2])}},1h:l(a){o(a.W){8 w}o(a.U){8(7.1h(a.K)&&7.1h(a.K.2j(a.U)))}1d{9 P=a.4||a;9 A=7.K.4,N=7.W.4;9 b=F.13(N[0]*(A[0]-P[0])+N[1]*(A[1]-P[1])+N[2]*(A[2]-(P[2]||0)));8(b<=17.16)}},1v:l(a){o(1g(a.U)==\'1f\'&&1g(a.W)==\'1f\'){8 w}8!7.1m(a)},1U:l(a){o(!7.1v(a)){8 w}o(a.U){9 A=a.K.4,D=a.U.4,P=7.K.4,N=7.W.4;9 b=(N[0]*(P[0]-A[0])+N[1]*(P[1]-A[1])+N[2]*(P[2]-A[2]))/(N[0]*D[0]+N[1]*D[1]+N[2]*D[2]);8 v.u([A[0]+D[0]*b,A[1]+D[1]*b,A[2]+D[2]*b])}1d o(a.W){9 c=7.W.2f(a.W).2q();9 N=7.W.4,A=7.K.4,O=a.W.4,B=a.K.4;9 d=S.1j(2,2),i=0;H(d.2y()){i++;d=S.u([[N[i%3],N[(i+1)%3]],[O[i%3],O[(i+1)%3]]])}9 e=d.2w().4;9 x=N[0]*A[0]+N[1]*A[1]+N[2]*A[2];9 y=O[0]*B[0]+O[1]*B[1]+O[2]*B[2];9 f=[e[0][0]*x+e[0][1]*y,e[1][0]*x+e[1][1]*y];9 g=[];2e(9 j=1;j<=3;j++){g.19((i==j)?0:f[(j+(5-i)%3)%3])}8 14.u(g,c)}},1r:l(a){9 P=a.4||a;9 A=7.K.4,N=7.W.4;9 b=(A[0]-P[0])*N[0]+(A[1]-P[1])*N[1]+(A[2]-(P[2]||0))*N[2];8 v.u([P[0]+N[0]*b,P[1]+N[1]*b,(P[2]||0)+N[2]*b])},1V:l(t,a){9 R=S.1R(t,a.U).4;9 C=a.1r(7.K).4;9 A=7.K.4,N=7.W.4;9 b=C[0],1E=C[1],1J=C[2],1w=A[0],18=A[1],1a=A[2];9 x=1w-b,y=18-1E,z=1a-1J;8 11.u([b+R[0][0]*x+R[0][1]*y+R[0][2]*z,1E+R[1][0]*x+R[1][1]*y+R[1][2]*z,1J+R[2][0]*x+R[2][1]*y+R[2][2]*z],[R[0][0]*N[0]+R[0][1]*N[1]+R[0][2]*N[2],R[1][0]*N[0]+R[1][1]*N[1]+R[1][2]*N[2],R[2][0]*N[0]+R[2][1]*N[1]+R[2][2]*N[2]])},1t:l(a){o(a.W){9 A=7.K.4,N=7.W.4;9 b=A[0],18=A[1],1a=A[2],2M=N[0],2L=N[1],2Q=N[2];9 c=7.K.1t(a).4;9 d=b+2M,2p=18+2L,2m=1a+2Q;9 Q=a.1r([d,2p,2m]).4;9 e=[Q[0]+(Q[0]-d)-c[0],Q[1]+(Q[1]-2p)-c[1],Q[2]+(Q[2]-2m)-c[2]];8 11.u(c,e)}1d o(a.U){8 7.1V(F.1A,a)}1d{9 P=a.4||a;8 11.u(7.K.1t([P[0],P[1],(P[2]||0)]),7.W)}},1Z:l(a,b,c){a=v.u(a);a=a.1N();o(a===w){8 w}b=v.u(b);b=b.1N();o(b===w){8 w}o(1g(c)==\'1f\'){c=w}1d{c=v.u(c);c=c.1N();o(c===w){8 w}}9 d=a.4[0],18=a.4[1],1a=a.4[2];9 e=b.4[0],1W=b.4[1],1X=b.4[2];9 f,1i;o(c!==w){9 g=c.4[0],2l=c.4[1],2t=c.4[2];f=v.u([(1W-18)*(2t-1a)-(1X-1a)*(2l-18),(1X-1a)*(g-d)-(e-d)*(2t-1a),(e-d)*(2l-18)-(1W-18)*(g-d)]);1i=f.1u();o(1i===0){8 w}f=v.u([f.4[0]/1i,f.4[1]/1i,f.4[2]/1i])}1d{1i=F.1x(e*e+1W*1W+1X*1X);o(1i===0){8 w}f=v.u([b.4[0]/1i,b.4[1]/1i,b.4[2]/1i])}7.K=a;7.W=f;8 7}};11.u=l(a,b,c){9 P=25 11();8 P.1Z(a,b,c)};11.2I=11.u(v.1j(3),v.k);11.2H=11.u(v.1j(3),v.i);11.2G=11.u(v.1j(3),v.j);11.36=11.2I;11.35=11.2H;11.3j=11.2G;9 $V=v.u;9 $M=S.u;9 $L=14.u;9 $P=11.u;',62,206,'||||elements|||this|return|var||||||||||||function|||if||length||||create|Vector|null|||||||||Math|nj|while||do|anchor||||||||Matrix||direction||normal||||kj|Plane|ni|abs|Line|ki|precision|Sylvester|A2|push|A3|map|els|else||undefined|typeof|contains|mod|Zero|D3|D2|isParallelTo|kp|distanceFrom|cols|dup|pointClosestTo|np|reflectionIn|modulus|intersects|A1|sqrt|isSquare|X2|PI|X3|angleFrom|mod1|C2|mod2|sin|cos|break|C3|toRightTriangular|false|Y3|to3D|E2|E1|E3|Rotation|Y2|Y1|intersectionWith|rotate|v12|v13|rank|setVectors|nc|sum|multiply|prototype|eql|new|setElements|case|each|PA3|PA2|part|new_element|round|for|cross|product|AD2|isSameSizeAs|add|isPerpendicularTo|v22|AN3|inspect|AD3|AN2|toUnitVector|PsubQ3|PsubQ2|v23|dot|divisor|inverse|true|isSingular|determinant|max|canMultiplyFromLeft|subtract|rows|col|random|ZX|YZ|XY|Random|join|N2|N1|D1|slice|default|N3|dimensions|switch|liesIn|translate|snapTo|augment|Diagonal|trace|indexOf|diagonal|transpose|minor|row|isAntiparallelTo|ZY|YX|acos|RotationZ|RotationY|liesOn|RotationX|inv|rk|tr|det|toDiagonalMatrix|toUpperTriangular|version|XZ'.split('|'),0,{}));
  
  
  
  
  // --------------- imported from util.js
  
  /**
 * Joins a list of lines using a newline separator, not the fastest
 * thing in the world but good enough for initialization code. 
 */
  function text(lines) {
    return lines.join("\n");
  };

  /**
 * Creates a new prototype object derived from another objects prototype along with a list of additional properties.
 *
 * @param base object whose prototype to use as the created prototype object's prototype
 * @param properties additional properties to add to the created prototype object
 */
  function inherit(base, properties) {
    var prot = Object.create(base.prototype);
    for (var p in properties) {
      prot[p] = properties[p];
    }
    return prot;
  };
  
  function error(message) {
    console.error(message);
    console.trace();
  };

  
  function assert(condition, message) {
    if (!condition) {
      error(message);
    };
  };

  
  
  // --------------- imported from glutils.js
  

  // augment Sylvester some
  Matrix.Translation = function (v)
  {
    if (v.elements.length == 2) {
      var r = Matrix.I(3);
      r.elements[2][0] = v.elements[0];
      r.elements[2][1] = v.elements[1];
      return r;
    }

    if (v.elements.length == 3) {
      var r = Matrix.I(4);
      r.elements[0][3] = v.elements[0];
      r.elements[1][3] = v.elements[1];
      r.elements[2][3] = v.elements[2];
      return r;
    }

    throw "Invalid length for Translation";
  }

  Matrix.prototype.flatten = function ()
  {
    var result = [];
    if (this.elements.length == 0)
      return [];


    for (var j = 0; j < this.elements[0].length; j++)
      for (var i = 0; i < this.elements.length; i++)
        result.push(this.elements[i][j]);
    return result;
  }

  Matrix.prototype.ensure4x4 = function()
  {
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
      return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
      return null;

    for (var i = 0; i < this.elements.length; i++) {
      for (var j = this.elements[i].length; j < 4; j++) {
        if (i == j)
          this.elements[i].push(1);
        else
          this.elements[i].push(0);
      }
    }

    for (var i = this.elements.length; i < 4; i++) {
      if (i == 0)
        this.elements.push([1, 0, 0, 0]);
      else if (i == 1)
        this.elements.push([0, 1, 0, 0]);
      else if (i == 2)
        this.elements.push([0, 0, 1, 0]);
      else if (i == 3)
        this.elements.push([0, 0, 0, 1]);
    }

    return this;
  };

  Matrix.prototype.make3x3 = function()
  {
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
      return null;

    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
  };

  Vector.prototype.flatten = function ()
  {
    return this.elements;
  };

  function mht(m) {
    var s = "";
    if (m.length == 16) {
      for (var i = 0; i < 4; i++) {
        s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
      }
    } else if (m.length == 9) {
      for (var i = 0; i < 3; i++) {
        s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
      }
    } else {
      return m.toString();
    }
    return s;
  }

  //
  // gluLookAt
  //
  function makeLookAt(ex, ey, ez,
                       cx, cy, cz,
                       ux, uy, uz)
  {
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
  }

  //
  // glOrtho
  //
  function makeOrtho(left, right,
                      bottom, top,
                      znear, zfar)
  {
    var tx = -(right+left)/(right-left);
    var ty = -(top+bottom)/(top-bottom);
    var tz = -(zfar+znear)/(zfar-znear);

    return $M([[2/(right-left), 0, 0, tx],
               [0, 2/(top-bottom), 0, ty],
               [0, 0, -2/(zfar-znear), tz],
               [0, 0, 0, 1]]);
  }

  //
  // gluPerspective
  //
  function makePerspective(fovy, aspect, znear, zfar)
  {
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
  }

  //
  // glFrustum
  //
  function makeFrustum(left, right,
                        bottom, top,
                        znear, zfar)
  {
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
  }

  //
  // glOrtho
  //
  function makeOrtho(left, right, bottom, top, znear, zfar)
  {
    var tx = - (right + left) / (right - left);
    var ty = - (top + bottom) / (top - bottom);
    var tz = - (zfar + znear) / (zfar - znear);

    return $M([[2 / (right - left), 0, 0, tx],
               [0, 2 / (top - bottom), 0, ty],
               [0, 0, -2 / (zfar - znear), tz],
               [0, 0, 0, 1]]);
  }


  // -----------------------------------------------------------



  /*
 * This file wraps several WebGL constructs and provides a simple, single texture based WebGLCanvas as well as a
 * specialized YUVWebGLCanvas that can handle YUV->RGB conversion. 
 */

  /**
 * Represents a WebGL shader script.
 */
  var Script = (function script() {
    function constructor() {}

    constructor.createFromElementId = function(id) {
      var script = document.getElementById(id);

      // Didn't find an element with the specified ID, abort.
      assert(script , "Could not find shader with ID: " + id);

      // Walk through the source element's children, building the shader source string.
      var source = "";
      var currentChild = script .firstChild;
      while(currentChild) {
        if (currentChild.nodeType == 3) {
          source += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
      }

      var res = new constructor();
      res.type = script.type;
      res.source = source;
      return res;
    };

    constructor.createFromSource = function(type, source) {
      var res = new constructor();
      res.type = type;
      res.source = source;
      return res;
    };
    return constructor;
  })();

  /**
 * Represents a WebGL shader object and provides a mechanism to load shaders from HTML
 * script tags.
 */
  var Shader = (function shader() {
    function constructor(gl, script) {

      // Now figure out what type of shader script we have, based on its MIME type.
      if (script.type == "x-shader/x-fragment") {
        this.shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (script.type == "x-shader/x-vertex") {
        this.shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        error("Unknown shader type: " + script.type);
        return;
      }

      // Send the source to the shader object.
      gl.shaderSource(this.shader, script.source);

      // Compile the shader program.
      gl.compileShader(this.shader);

      // See if it compiled successfully.
      if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
        error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(this.shader));
        return;
      }
    }
    return constructor;
  })();

  var Program = (function () {
    function constructor(gl) {
      this.gl = gl;
      this.program = this.gl.createProgram();
    }
    constructor.prototype = {
      attach: function (shader) {
        this.gl.attachShader(this.program, shader.shader);
      }, 
      link: function () {
        this.gl.linkProgram(this.program);
        // If creating the shader program failed, alert.
        assert(this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS),
               "Unable to initialize the shader program.");
      },
      use: function () {
        this.gl.useProgram(this.program);
      },
      getAttributeLocation: function(name) {
        return this.gl.getAttribLocation(this.program, name);
      },
      setMatrixUniform: function(name, array) {
        var uniform = this.gl.getUniformLocation(this.program, name);
        this.gl.uniformMatrix4fv(uniform, false, array);
      }
    };
    return constructor;
  })();

  /**
 * Represents a WebGL texture object.
 */
  var Texture = (function texture() {
    function constructor(gl, size, format) {
      this.gl = gl;
      this.size = size;
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      this.format = format ? format : gl.LUMINANCE; 
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, size.w, size.h, 0, this.format, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    var textureIDs = null;
    constructor.prototype = {
      fill: function(textureData, useTexSubImage2D) {
        var gl = this.gl;
        assert(textureData.length >= this.size.w * this.size.h, 
               "Texture size mismatch, data:" + textureData.length + ", texture: " + this.size.w * this.size.h);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if (useTexSubImage2D) {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.size.w , this.size.h, this.format, gl.UNSIGNED_BYTE, textureData);
        } else {
          // texImage2D seems to be faster, thus keeping it as the default
          gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.size.w, this.size.h, 0, this.format, gl.UNSIGNED_BYTE, textureData);
        }
      },
      bind: function(n, program, name) {
        var gl = this.gl;
        if (!textureIDs) {
          textureIDs = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2];
        }
        gl.activeTexture(textureIDs[n]);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(program.program, name), n);
      }
    };
    return constructor; 
  })();

  /**
 * Generic WebGL backed canvas that sets up: a quad to paint a texture on, appropriate vertex/fragment shaders,
 * scene parameters and other things. Specialized versions of this class can be created by overriding several 
 * initialization methods.
 * 
 * <code>
 * var canvas = new WebGLCanvas(document.getElementById('canvas'), new Size(512, 512);
 * canvas.texture.fill(data);
 * canvas.drawScene();
 * </code>
 */
  var WebGLCanvas = (function () {

    var vertexShaderScript = Script.createFromSource("x-shader/x-vertex", text([
      "attribute vec3 aVertexPosition;",
      "attribute vec2 aTextureCoord;",
      "uniform mat4 uMVMatrix;",
      "uniform mat4 uPMatrix;",
      "varying highp vec2 vTextureCoord;",
      "void main(void) {",
      "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
      "  vTextureCoord = aTextureCoord;",
      "}"
    ]));

    var fragmentShaderScript = Script.createFromSource("x-shader/x-fragment", text([
      "precision highp float;",
      "varying highp vec2 vTextureCoord;",
      "uniform sampler2D texture;",
      "void main(void) {",
      "  gl_FragColor = texture2D(texture, vTextureCoord);",
      "}"
    ]));

    function constructor(canvas, size, useFrameBuffer) {
      this.canvas = canvas;
      this.size = size;
      this.canvas.width = size.w;
      this.canvas.height = size.h;

      this.onInitWebGL();
      this.onInitShaders();
      initBuffers.call(this);
      if (useFrameBuffer) {
        initFramebuffer.call(this);
      }
      this.onInitTextures();
      initScene.call(this);
    }

    /**
   * Initialize a frame buffer so that we can render off-screen.
   */
    function initFramebuffer() {
      var gl = this.gl;

      // Create framebuffer object and texture.
      this.framebuffer = gl.createFramebuffer(); 
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      this.framebufferTexture = new Texture(this.gl, this.size, gl.RGBA);

      // Create and allocate renderbuffer for depth data.
      var renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.size.w, this.size.h);

      // Attach texture and renderbuffer to the framebuffer.
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.framebufferTexture.texture, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    }

    /**
   * Initialize vertex and texture coordinate buffers for a plane.
   */
    function initBuffers() {
      var tmp;
      var gl = this.gl;

      // Create vertex position buffer.
      this.quadVPBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
      tmp = [
        1.0,  1.0, 0.0,
        -1.0,  1.0, 0.0, 
        1.0, -1.0, 0.0, 
        -1.0, -1.0, 0.0];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
      this.quadVPBuffer.itemSize = 3;
      this.quadVPBuffer.numItems = 4;

      /*
     +--------------------+ 
     | -1,1 (1)           | 1,1 (0)
     |                    |
     |                    |
     |                    |
     |                    |
     |                    |
     | -1,-1 (3)          | 1,-1 (2)
     +--------------------+
     */

      var scaleX = 1.0;
      var scaleY = 1.0;

      // Create vertex texture coordinate buffer.
      this.quadVTCBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
      tmp = [
        scaleX, 0.0,
        0.0, 0.0,
        scaleX, scaleY,
        0.0, scaleY,
      ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
    }

    function mvIdentity() {
      this.mvMatrix = Matrix.I(4);
    }

    function mvMultiply(m) {
      this.mvMatrix = this.mvMatrix.x(m);
    }

    function mvTranslate(m) {
      mvMultiply.call(this, Matrix.Translation($V([m[0], m[1], m[2]])).ensure4x4());
    }

    function setMatrixUniforms() {
      this.program.setMatrixUniform("uPMatrix", new Float32Array(this.perspectiveMatrix.flatten()));
      this.program.setMatrixUniform("uMVMatrix", new Float32Array(this.mvMatrix.flatten()));
    }

    function initScene() {
      var gl = this.gl;

      // Establish the perspective with which we want to view the
      // scene. Our field of view is 45 degrees, with a width/height
      // ratio of 640:480, and we only want to see objects between 0.1 units
      // and 100 units away from the camera.

      this.perspectiveMatrix = makePerspective(45, 1, 0.1, 100.0);

      // Set the drawing position to the "identity" point, which is
      // the center of the scene.
      mvIdentity.call(this);

      // Now move the drawing position a bit to where we want to start
      // drawing the square.
      mvTranslate.call(this, [0.0, 0.0, -2.4]);

      // Draw the cube by binding the array buffer to the cube's vertices
      // array, setting attributes, and pushing it to GL.
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
      gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      // Set the texture coordinates attribute for the vertices.

      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
      gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  

      this.onInitSceneTextures();

      setMatrixUniforms.call(this);

      if (this.framebuffer) {
        console.log("Bound Frame Buffer");
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      }
    }

    constructor.prototype = {
      toString: function() {
        return "WebGLCanvas Size: " + this.size;
      },
      checkLastError: function (operation) {
        var err = this.gl.getError();
        if (err != this.gl.NO_ERROR) {
          var name = this.glNames[err];
          name = (name !== undefined) ? name + "(" + err + ")":
          ("Unknown WebGL ENUM (0x" + value.toString(16) + ")");
          if (operation) {
            console.log("WebGL Error: %s, %s", operation, name);
          } else {
            console.log("WebGL Error: %s", name);
          }
          console.trace();
        }
      },
      onInitWebGL: function () {
        try {
          this.gl = this.canvas.getContext("experimental-webgl");
        } catch(e) {}

        if (!this.gl) {
          error("Unable to initialize WebGL. Your browser may not support it.");
        }
        if (this.glNames) {
          return;
        }
        this.glNames = {};
        for (var propertyName in this.gl) {
          if (typeof this.gl[propertyName] == 'number') {
            this.glNames[this.gl[propertyName]] = propertyName;
          }
        }
      },
      onInitShaders: function() {
        this.program = new Program(this.gl);
        this.program.attach(new Shader(this.gl, vertexShaderScript));
        this.program.attach(new Shader(this.gl, fragmentShaderScript));
        this.program.link();
        this.program.use();
        this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
        this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");;
        this.gl.enableVertexAttribArray(this.textureCoordAttribute);
      },
      onInitTextures: function () {
        var gl = this.gl;
        this.texture = new Texture(gl, this.size, gl.RGBA);
      },
      onInitSceneTextures: function () {
        this.texture.bind(0, this.program, "texture");
      },
      drawScene: function() {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      },
      readPixels: function(buffer) {
        var gl = this.gl;
        gl.readPixels(0, 0, this.size.w, this.size.h, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
      }
    };
    return constructor;
  })();

  var YUVWebGLCanvas = (function () {
    var vertexShaderScript = Script.createFromSource("x-shader/x-vertex", text([
      "attribute vec3 aVertexPosition;",
      "attribute vec2 aTextureCoord;",
      "uniform mat4 uMVMatrix;",
      "uniform mat4 uPMatrix;",
      "varying highp vec2 vTextureCoord;",
      "void main(void) {",
      "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
      "  vTextureCoord = aTextureCoord;",
      "}"
    ]));

    var fragmentShaderScriptOld = Script.createFromSource("x-shader/x-fragment", text([
      "precision highp float;",
      "varying highp vec2 vTextureCoord;",
      "uniform sampler2D YTexture;",
      "uniform sampler2D UTexture;",
      "uniform sampler2D VTexture;",

      "void main(void) {",
      "  vec3 YUV = vec3",
      "  (",
      "    texture2D(YTexture, vTextureCoord).x * 1.1643828125,   // premultiply Y",
      "    texture2D(UTexture, vTextureCoord).x,",
      "    texture2D(VTexture, vTextureCoord).x",
      "  );",
      "  gl_FragColor = vec4",
      "  (",
      "    YUV.x + 1.59602734375 * YUV.z - 0.87078515625,",
      "    YUV.x - 0.39176171875 * YUV.y - 0.81296875 * YUV.z + 0.52959375,",
      "    YUV.x + 2.017234375   * YUV.y - 1.081390625,",
      "    1",
      "  );",
      "}"
    ]));

    var fragmentShaderScriptSimple = Script.createFromSource("x-shader/x-fragment", text([
      "precision highp float;",
      "varying highp vec2 vTextureCoord;",
      "uniform sampler2D YTexture;",
      "uniform sampler2D UTexture;",
      "uniform sampler2D VTexture;",

      "void main(void) {",
      "  gl_FragColor = texture2D(YTexture, vTextureCoord);",
      "}"
    ]));

    var fragmentShaderScript = Script.createFromSource("x-shader/x-fragment", text([
      "precision highp float;",
      "varying highp vec2 vTextureCoord;",
      "uniform sampler2D YTexture;",
      "uniform sampler2D UTexture;",
      "uniform sampler2D VTexture;",
      "const mat4 YUV2RGB = mat4",
      "(",
      " 1.1643828125, 0, 1.59602734375, -.87078515625,",
      " 1.1643828125, -.39176171875, -.81296875, .52959375,",
      " 1.1643828125, 2.017234375, 0, -1.081390625,",
      " 0, 0, 0, 1",
      ");",

      "void main(void) {",
      " gl_FragColor = vec4( texture2D(YTexture,  vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;",
      "}"
    ]));


    function constructor(canvas, size) {
      WebGLCanvas.call(this, canvas, size);
    } 

    constructor.prototype = inherit(WebGLCanvas, {
      onInitShaders: function() {
        this.program = new Program(this.gl);
        this.program.attach(new Shader(this.gl, vertexShaderScript));
        this.program.attach(new Shader(this.gl, fragmentShaderScript));
        this.program.link();
        this.program.use();
        this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
        this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");;
        this.gl.enableVertexAttribArray(this.textureCoordAttribute);
      },
      onInitTextures: function () {
        console.log("creatingTextures: size: " + this.size);
        this.YTexture = new Texture(this.gl, this.size);
        this.UTexture = new Texture(this.gl, this.size.getHalfSize());
        this.VTexture = new Texture(this.gl, this.size.getHalfSize());
      },
      onInitSceneTextures: function () {
        this.YTexture.bind(0, this.program, "YTexture");
        this.UTexture.bind(1, this.program, "UTexture");
        this.VTexture.bind(2, this.program, "VTexture");
      },
      fillYUVTextures: function(y, u, v) {
        this.YTexture.fill(y);
        this.UTexture.fill(u);
        this.VTexture.fill(v);
      },
      toString: function() {
        return "YUVCanvas Size: " + this.size;
      }
    });

    return constructor;
  })(); 


  var FilterWebGLCanvas = (function () {
    var vertexShaderScript = Script.createFromSource("x-shader/x-vertex", text([
      "attribute vec3 aVertexPosition;",
      "attribute vec2 aTextureCoord;",
      "uniform mat4 uMVMatrix;",
      "uniform mat4 uPMatrix;",
      "varying highp vec2 vTextureCoord;",
      "void main(void) {",
      "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
      "  vTextureCoord = aTextureCoord;",
      "}"
    ]));

    var fragmentShaderScript = Script.createFromSource("x-shader/x-fragment", text([
      "precision highp float;",
      "varying highp vec2 vTextureCoord;",
      "uniform sampler2D FTexture;",

      "void main(void) {",
      " gl_FragColor = texture2D(FTexture,  vTextureCoord);",
      "}"
    ]));


    function constructor(canvas, size, useFrameBuffer) {
      WebGLCanvas.call(this, canvas, size, useFrameBuffer);
    } 

    constructor.prototype = inherit(WebGLCanvas, {
      onInitShaders: function() {
        this.program = new Program(this.gl);
        this.program.attach(new Shader(this.gl, vertexShaderScript));
        this.program.attach(new Shader(this.gl, fragmentShaderScript));
        this.program.link();
        this.program.use();
        this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
        this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");
        this.gl.enableVertexAttribArray(this.textureCoordAttribute);
      },
      onInitTextures: function () {
        console.log("creatingTextures: size: " + this.size);
        this.FTexture = new Texture(this.gl, this.size, this.gl.RGBA);
      },
      onInitSceneTextures: function () {
        this.FTexture.bind(0, this.program, "FTexture");
      },
      process: function(buffer, output) {
        this.FTexture.fill(buffer);
        this.drawScene();
        this.readPixels(output);
      },
      toString: function() {
        return "FilterWebGLCanvas Size: " + this.size;
      }
    });

    return constructor;
  })(); 
  
  
  return YUVWebGLCanvas;
  
}));
