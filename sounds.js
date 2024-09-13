// zzfx() - the universal entry point -- returns a AudioBufferSourceNode
const zzfx=(...t)=>zzfxP(zzfxG(...t));

// zzfxP() - the sound player -- returns a AudioBufferSourceNode
const zzfxP=(...t)=>{let e=zzfxX.createBufferSource(),f=zzfxX.createBuffer(t.length,t[0].length,zzfxR);t.map((d,i)=>f.getChannelData(i).set(d)),e.buffer=f,e.connect(zzfxX.destination),e.start();return e};

// zzfxG() - the sound generator -- returns an array of sample data
const zzfxG=(q=1,k=.05,c=220,e=0,t=0,u=.1,r=0,F=1,v=0,z=0,w=0,A=0,l=0,B=0,x=0,G=0,d=0,y=1,m=0,C=0)=>{let b=2*Math.PI,H=v*=500*b/zzfxR**2,I=(0<x?1:-1)*b/4,D=c*=(1+2*k*Math.random()-k)*b/zzfxR,Z=[],g=0,E=0,a=0,n=1,J=0,K=0,f=0,p,h;e=99+zzfxR*e;m*=zzfxR;t*=zzfxR;u*=zzfxR;d*=zzfxR;z*=500*b/zzfxR**3;x*=b/zzfxR;w*=b/zzfxR;A*=zzfxR;l=zzfxR*l|0;for(h=e+m+t+u+d|0;a<h;Z[a++]=f)++K%(100*G|0)||(f=r?1<r?2<r?3<r?Math.sin((g%b)**3):Math.max(Math.min(Math.tan(g),1),-1):1-(2*g/b%2+2)%2:1-4*Math.abs(Math.round(g/b)-g/b):Math.sin(g),f=(l?1-C+C*Math.sin(2*Math.PI*a/l):1)*(0<f?1:-1)*Math.abs(f)**F*q*zzfxV*(a<e?a/e:a<e+m?1-(a-e)/m*(1-y):a<e+m+t?y:a<h-d?(h-a-d)/u*y:0),f=d?f/2+(d>a?0:(a<h-d?1:(h-a)/d)*Z[a-d|0]/2):f),p=(c+=v+=z)*Math.sin(E*x-I),g+=p-p*B*(1-1E9*(Math.sin(a)+1)%2),E+=p-p*B*(1-1E9*(Math.sin(a)**2+1)%2),n&&++n>A&&(c+=w,D+=w,n=0),!l||++J%l||(c=D,v=H,n=n||1);return Z};

// zzfxV - global volume
const zzfxV=.1;

// zzfxR - global sample rate
const zzfxR=44100;

// zzfxX - the common audio context
let zzfxX=null;

//! ZzFXM (v2.0.3) | (C) Keith Clark | MIT | https://github.com/keithclark/ZzFXM
const zzfxM=(n,f,t,e=125)=>{let l,o,z,r,g,h,x,a,u,c,d,i,m,p,G,M=0,R=[],b=[],j=[],k=0,q=0,s=1,v={},w=zzfxR/e*60>>2;for(;s;k++)R=[s=a=d=m=0],t.map((e,d)=>{for(x=f[e][k]||[0,0,0],s|=!!f[e][k],G=m+(f[e][0].length-2-!a)*w,p=d==t.length-1,o=2,r=m;o<x.length+p;a=++o){for(g=x[o],u=o==x.length+p-1&&p||c!=(x[0]||0)|g|0,z=0;z<w&&a;z++>w-99&&u?i+=(i<1)/99:0)h=(1-i)*R[M++]/2||0,b[r]=(b[r]||0)-h*q+h,j[r]=(j[r++]||0)+h*q+h;g&&(i=g%1,q=x[1]||0,(g|=0)&&(R=v[[c=x[M=0]||0,g]]=v[[c,g]]||(l=[...n[c]],l[2]*=2**((g-12)/12),g>0?zzfxG(...l):[])))}m=G});return[b,j]};

const sounds = {
	"interact": [.1,0,55,.03,.01,.03,4,2,,6,-353,.11,,,,,,.55,.03,,-604],
	"shoot": [,,354,,,0,,3.6,-6,5,,,,,,,,0,.19],
	"explode": [.2,.3,,.02,.27,.41,,3.7,7,,,,.21,,,.3,,.4,.27],
	"score": [.2,0,440,.02,.03,.05,,1.4,,,350,.05,,,,,,.7,.04]
};

let muted = false;

export function isMuted()
{
	return muted;
}

export function initZZFX()
{
	zzfxX = new AudioContext();
	music = zzfxM(...[[[.5,0,300,,,.3,,2,,,,,.1,,1,,.4,,.1,.2]],[[[,,15,19,22,20,19,15,19,17,15,12,15,22,20,24,22,20,19,15,17,26,27,31,34,22,24,20,22,19,15,27,26,,],[,,15,,10,,12,,7,,8,,3,,8,,10,,15,,10,,12,,7,,8,,3,,8,,10,,]]],[0],25,{"title":"Canon In D","instruments":["0"],"patterns":["0"]}]);
}

export function toggleMute()
{
	muted = !muted;
	if (muted)
	{
		stopMusic();
	}
	else
	{
		playMusic();
	}
}

export function playSound(name)
{
	if (muted)
		return;

	zzfx(...sounds[name]);
}

let music, musicNode;
export function playMusic()
{
	if (!music || muted)
		return;

	if (musicNode)
	{
		musicNode.stop();
	}

	musicNode = zzfxP(...music);
	musicNode.loop = true;
}

window.addEventListener("focus", () => playMusic());
window.addEventListener("blur", () => stopMusic());

export function stopMusic()
{
	musicNode.stop();
}