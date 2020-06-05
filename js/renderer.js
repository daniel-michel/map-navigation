import Vec2 from "./math/vec2.js";
import Vec3 from "./math/vec3.js";
import Mat3x3 from "./math/mat3x3.js";
import Rect from "./math/rect.js";

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
		this.scale = this.canvas.width * 6400;
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
		let position = point;
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
	 * @param {number} w 
	 */
	lineWidth(w)
	{
		this.context.lineWidth = w * this.scale;
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