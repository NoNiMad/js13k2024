const utils = {
	"disk": function(x, y, radius)
	{
		this.beginPath();
		this.arc(x, y, radius, 0, Math.PI * 2);
		this.fill();
	},
	"circle": function(x, y, radius)
	{
		this.beginPath();
		this.arc(x, y, radius, 0, Math.PI * 2);
		this.stroke();
	},
	"lineDir": function (x, y, dir, len)
	{
		this.beginPath();
		this.moveTo(x, y);
		this.lineTo(x + dir.x * len, y + dir.y * len);
		this.stroke();
	},
	"line": function (x1, y1, x2, y2)
	{
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.stroke();
	}
}

export function registerDrawUtils(ctx)
{
	for (const [name, func] of Object.entries(utils))
	{
		ctx[name] = func.bind(ctx);
	}
}