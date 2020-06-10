import Vec2 from "./math/vec2.js";
import Mat2x2 from "./math/mat2x2.js";

export default class Renderer
{
	/**
	 * 
	 * @param {HTMLCanvasElement} canvas 
	 */
	constructor(canvas)
	{
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
	}
	get width()
	{
		return this.canvas.width;
	}
	get height()
	{
		return this.canvas.height;
	}
	clear()
	{
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		return this;
	}
	startFrame()
	{
		this.clear();
	}
	/**
	 * 
	 * @param {Vec2} position 
	 * @param {number} radius 
	 */
	circle(position, radius)
	{
		this.context.beginPath();
		this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
		this.context.closePath();
		return this;
	}
	beginPath()
	{
		this.context.beginPath();
	}
	/**
	 * 
	 * @param {Vec2} vec 
	 */
	lineTo(vec)
	{
		this.context.lineTo(vec.x, vec.y);
	}
	/**
	 * 
	 * @param {Vec2[]} path 
	 */
	path(path)
	{
		this.beginPath();
		for (let point of path)
			this.lineTo(point);
		return this;
	}
	/**
	 * 
	 * @param {Vec2[]} path 
	 * @param {number} width
	 */
	drawPathWithDirectionArrows(path, width)
	{
		this.beginPath();
		let d = Infinity;
		for (let i = path.length - 1; i >= 0; i--)
		{
			let prev = path[i - 1];
			let curr = path[i];
			this.lineTo(curr);
			if (prev)
			{
				let diff = curr.copy().subtract(prev);
				d += diff.length / width;
				if (d > 12)
				{
					d = 0;
					let tocurr = diff.normalize().multiply(width * 3);
					let leftRotated = Mat2x2.multiply(Mat2x2.create_rotation_matrix(135 / 180 * Math.PI), tocurr);
					let rightRotated = Mat2x2.multiply(Mat2x2.create_rotation_matrix(-135 / 180 * Math.PI), tocurr);
					this.lineTo(curr.copy().add(leftRotated));
					this.lineTo(curr);
					this.lineTo(curr.copy().add(rightRotated));
					this.lineTo(curr);
				}
			}
		}
		this.context.lineWidth = width;
		this.context.stroke();
		return this;
	}
	/**
	 * 
	 * @param {number} width 
	 */
	lineWidth(width)
	{
		this.context.lineWidth = width;
		return this;
	}
	/**
	 * 
	 * @param {"butt"|"round"|"square"} cap 
	 */
	lineCap(cap)
	{
		this.context.lineCap = cap;
	}
	/**
	 * 
	 * @param {"bevel"|"miter"|"round"} join 
	 */
	lineJoin(join)
	{
		this.context.lineJoin = join;
	}
	/**
	 * 
	 * @param {{width?: number, cap?: "butt"|"round"|"square", join?: "bevel"|"miter"|"round"}} param0
	 */
	lineProp({ width, cap, join })
	{
		if (width)
			this.lineWidth(width);
		if (cap)
			this.lineCap(cap);
		if (join)
			this.lineJoin(join);
	}
	/**
	 * 
	 * @param {string} color 
	 */
	fillColor(color)
	{
		this.context.fillStyle = color;
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	strokeColor(color)
	{
		this.context.strokeStyle = color;
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	fill(color = undefined)
	{
		if (color)
			this.context.fillStyle = color;
		this.context.fill();
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	stroke(color = undefined)
	{
		if (color)
			this.context.strokeStyle = color;
		this.context.stroke();
		return this;
	}
	/**
	 * 
	 * @param {string} style
	 * @param {{align?: "start"|"end"|"left"|"right"|"center", baseline?: "top"|"middle"|"bottom"|"hanging"|"ideographic"|"alphabetic"}} param1
	 */
	font(style, { align, baseline } = {})
	{
		if (align)
			this.context.textAlign = align;
		if (baseline)
			this.context.textBaseline = baseline;
		if (style)
			this.context.font = style;
	}
	/**
	 * 
	 * @param {string} text 
	 * @param {Vec2} position 
	 * @param {{align?: "start"|"end"|"left"|"right"|"center", baseline?: "top"|"middle"|"bottom"|"hanging"|"ideographic"|"alphabetic", font?: string}} param2
	 */
	fillText(text, position, { align, baseline, font } = {})
	{
		if (font)
			this.font(font);
		if (align)
			this.context.textAlign = align;
		if (baseline)
			this.context.textBaseline = baseline;
		this.context.fillText(text, position.x, position.y);
	}
}