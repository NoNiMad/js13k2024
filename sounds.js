import { zzfx } from "zzfx";

const sounds = {
	"interact": [.4,0,55,.03,.01,.03,4,2,,6,-353,.11,,,,,,.55,.03,,-604],
	"shoot": [,,354,,,0,,3.6,-6,5,,,,,,,,0,.19],
	"explode": [.3,.3,,.02,.27,.41,,3.7,7,,,,.21,,,.3,,.4,.27]
};

let muted = false;

export function toggleMute()
{
	muted = !muted;
}

export function playSound(name)
{
	if (muted)
		return;

	zzfx(...sounds[name]);
}