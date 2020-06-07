import Vec2 from "./math/vec2.js";
import Vec3 from "./math/vec3.js";
import Mat3x3 from "./math/mat3x3.js";
import Rect from "./math/rect.js";
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
		this.cameraPosition = new Vec2();
		this.threeDimensional = true;
		this.isThreeDimensional = false;
		this.scale = this.canvas.width * 1;
		this.setFov(75);
		//this.rotation = new Vec3(-45 / 180 * Math.PI, 0, 0);
		this.rotation = new Vec3(0, 0, 0);
		this.rotation_matrix = Mat3x3.createRotationMatrix(0, 0, 0);
		//this.center_projected = this.project(this.cameraPosition);
	}
	setFov(angle)
	{
		this.fov_factor = 1 / Math.atan(angle / 180 * Math.PI / 2);
		//this.fov_scale_factor = this.canvas.width / 2 * this.fov_factor;
		this.fovScaleFactor = this.canvas.height / 2 * this.fov_factor;
	}
	getCameraArea()
	{
		return new Rect(this.cameraPosition, new Vec2(this.canvas.width, this.canvas.height).multiply(0.5 / this.scale));
	}
	/**
	 * 
	 * @param {Vec2} point 
	 */
	project(point)
	{
		if (this.isThreeDimensional)
			return this.project_3d(point);
		else
			return this.project_2d(point);
	}
	/**
	 * 
	 * @param {Vec2} point 
	 */
	project_3d(point)
	{
		let position = point.copy();
		position.subtract(this.cameraPosition).multiply(this.scale);
		/* position.x = (position.x - this.cameraPosition.x) * this.scale;
		position.y = (position.y - this.cameraPosition.y) * -this.scale; */
		position.y *= -1;
		position.divide(this.fovScaleFactor);
		let v3 = new Vec3(position);
		let rotated = Mat3x3.multiply_vector(this.rotation_matrix, v3);
		rotated.add(new Vec3(0, 0, 1));
		//let rotated = v3;
		let projected = rotated.vec2().divide(Math.max(rotated.z, 0.01)).multiply(this.fovScaleFactor);
		projected.add(new Vec2(this.canvas.width, this.canvas.height).multiply(0.5));
		/* projected.x += this.canvas.width / 2;
		projected.y += this.canvas.height / 2; */
		return projected;
	}
	/**
	 * 
	 * @param {Vec2} point 
	 */
	project_2d(point)
	{
		let p = point.copy().subtract(this.cameraPosition).multiply(this.scale);
		p.y *= -1;
		return p.add(new Vec2(this.canvas.width, this.canvas.height).multiply(0.5));
	}
	/**
	 * 
	 * @param {Vec2} point 
	 */
	project_back_2d(point)
	{
		let p = point.copy().subtract(new Vec2(this.canvas.width, this.canvas.height).multiply(0.5));
		p.y *= -1;
		return p.divide(this.scale).add(this.cameraPosition);
	}
	clear()
	{
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		return this;
	}
	startFrame()
	{
		this.clear();
		this.isThreeDimensional = this.threeDimensional && (this.rotation.x !== 0 || this.rotation.y !== 0 || this.rotation.z !== 0);;
		//this.center_projected = this.center_location.project();
		if (this.threeDimensional)
		{
			this.fovScaleFactor = this.canvas.height / 2 * this.fov_factor;
			this.rotation_matrix = Mat3x3.createRotationMatrix(this.rotation.x, this.rotation.y, this.rotation.z);
		}
	}
	/**
	 * 
	 * @param {Vec2} position 
	 * @param {number} radius 
	 */
	circle(position, radius)
	{
		let pos = this.project(position);
		this.context.beginPath();
		this.context.arc(pos.x, pos.y, radius * this.scale, 0, Math.PI * 2);
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
		let projected = this.project(vec);
		this.context.lineTo(projected.x, projected.y);
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
	 * @param {number} minWidthInPixel
	 */
	drawPathWithDirectionArrows(path, width, minWidthInPixel)
	{
		let pixelWidth = width * this.scale;
		if (minWidthInPixel && minWidthInPixel > pixelWidth)
			pixelWidth = minWidthInPixel;
		this.beginPath();
		let d = Infinity;
		if (path.length > 0)
			this.lineTo(path[0]);
		for (let i = 1; i < path.length; i++)
		{
			let prev = path[i - 1];
			let curr = path[i];
			this.lineTo(curr);
			let diff = curr.copy().subtract(prev);
			d += diff.length / pixelWidth * this.scale;
			if (d > 8)
			{
				d = 0;
				let tocurr = diff.normalize().multiply(pixelWidth / this.scale * 3);
				let leftRotated = Mat2x2.multiply(Mat2x2.create_rotation_matrix(135 / 180 * Math.PI), tocurr);
				let rightRotated = Mat2x2.multiply(Mat2x2.create_rotation_matrix(-135 / 180 * Math.PI), tocurr);
				this.lineTo(curr.copy().add(leftRotated));
				this.lineTo(curr);
				this.lineTo(curr.copy().add(rightRotated));
				this.lineTo(curr);
			}
		}
		this.context.lineWidth = pixelWidth;
		this.context.stroke();
		return this;
	}
	/**
	 * 
	 * @param {number} w 
	 * @param {number} minWidthInPixel
	 */
	lineWidth(w, minWidthInPixel = undefined)
	{
		let pixelWidth = w * this.scale;
		if (minWidthInPixel && minWidthInPixel > pixelWidth)
			pixelWidth = minWidthInPixel;
		this.context.lineWidth = pixelWidth;
		return this;
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
}