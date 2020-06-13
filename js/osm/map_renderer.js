import Renderer from "../renderer.js";
import Vec3 from "../math/vec3.js";
import Mat3x3 from "../math/mat3x3.js";
import Vec2 from "../math/vec2.js";
import Rect from "../math/rect.js";
import { MercatorPos } from "../math/pos.js";
import Mat2x2 from "../math/mat2x2.js";
import OSMData from "./data.js";
import Animator from "../animation.js";

/**
 * @typedef {{scale?: number, fov?: number, position?: {x?: number, y?: number, z?: number}, rotation?: {x?: number, y?: number, z?: number}, screenFocus?: {x?: number, y?: number}}} CameraState
 * @typedef {(t: number) => CameraState} CameraAnimationFunction
 * @typedef {{start: {state: CameraState, time: number}, end: {state: CameraState, time: number}, timingFunction?: (t: number) => number, advancedTimingFunction?: CameraAnimationFunction, finishedCallback: () => void}} CameraAnimation
 */

export default class MapRenderer
{
	/**
	 * 
	 * @param {Renderer} renderer 
	 * @param {OSMData} data
	 */
	constructor(renderer, data)
	{
		this.renderer = renderer;
		this.data = data;
		this.threeDimensional = true;
		this.isThreeDimensional = false;

		/**
		 * @type {{scale: number, fov: number, position: {x: number, y: number, z: number}, rotation: {x: number, y: number, z: number}, screenFocus: {x: number, y: number}}}
		 */
		this.camera = {
			scale: renderer.width,
			fov: 75 / 180 * Math.PI,
			position: { x: 0, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			screenFocus: { x: 0, y: 0 },
		};
		this.animator = new Animator({
			rotation: {
				x: "angle",
				y: "angle",
				z: "angle",
			},
		});
		/**
		 * @private
		 */
		this.rotationMatrix = Mat3x3.createRotationMatrix(0, 0, 0);
		/**
		 * @private
		 * @type {CameraAnimation}
		 */
		this.animation = null;
	}
	/**
	 * @returns {MercatorPos}
	 */
	get cameraPosition()
	{
		return new MercatorPos(this.camera.position.x, this.camera.position.y, this.camera.position.z);
	}
	/**
	 * @returns {Vec2}
	 */
	get screenFocus()
	{
		return new Vec2(this.camera.screenFocus.x, this.camera.screenFocus.y);
	}
	/**
	 * 
	 * @param {CameraState} state 
	 * @param {number} duration
	 */
	async animateTo(state, duration = 500)
	{
		await this.animator.waitForAnimation(this.animator.animateTo(this.camera, state, duration));
	}

	update()
	{
		this.animator.applyToState(this.camera);
	}
	setFov(angle)
	{
		this.camera.fov = angle;
		this.updateFovFactors();
	}
	updateFovFactors()
	{
		this.fovFactor = 1 / Math.atan(this.camera.fov / 2);
		this.fovScaleFactor = this.renderer.height / 2 * this.fovFactor;
	}
	getCameraArea()
	{
		if (this.isThreeDimensional)
		{
			/* let maximumAngle = 70 / 180 * Math.PI;
			let horizon = -Math.tan(maximumAngle + this.camera.rotation.x) * this.fovScaleFactor + this.renderer.height * (1 - this.camera.screenFocus.y) / 2; */
			let horizon = this.project(new MercatorPos(Mat2x2.multiply(Mat2x2.create_rotation_matrix(this.camera.rotation.z), new MercatorPos(0, 0.05)).add(this.cameraPosition))).y;
			if (this.camera.fov / 2 - this.camera.rotation.x < Math.PI / 2)
				horizon = horizon * ((-this.camera.rotation.x) / (Math.PI / 2 - this.camera.fov / 2));
			if (horizon < 0)
				horizon = 0;
			let screenCorners = [new Vec2(0, horizon), new Vec2(this.renderer.width, horizon), new Vec2(this.renderer.width, this.renderer.height), new Vec2(0, this.renderer.height)];

			let inWorldSpace = screenCorners.map(p => this.project_back_3d(p));
			if (inWorldSpace.every(p => p))
			{
				let containing = Rect.createContaining(...inWorldSpace);
				return containing;
			}
		}
		let centerOfScreen = this.screenFocus.copy();
		centerOfScreen.x *= this.renderer.width;
		centerOfScreen.y *= this.renderer.height;
		centerOfScreen.multiply(-0.5 / this.camera.scale);
		centerOfScreen = Mat2x2.multiply(Mat2x2.create_rotation_matrix(this.camera.rotation.z), centerOfScreen);
		return new Rect(this.cameraPosition.copy().add(centerOfScreen), new MercatorPos(this.renderer.width, this.renderer.height).multiply(0.5 / this.camera.scale));
	}
	/**
	 * 
	 * @param {MercatorPos} point 
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
	 * @returns {MercatorPos}
	 */
	project_back(point)
	{
		if (this.isThreeDimensional)
			return this.project_back_3d(point);
		else
			return this.project_back_2d(point);
	}
	/**
	 * 
	 * @param {MercatorPos} point 
	 */
	project_3d(point)
	{
		let position = point.copy();
		position.subtract(this.camera.position).multiply(this.camera.scale);
		position.y *= -1;
		position.divide(this.fovScaleFactor);
		let v3 = new Vec3(position);
		let rotated = Mat3x3.multiply_vector(this.rotationMatrix, v3);
		rotated.add(new Vec3(0, 0, 1));
		let projected = rotated.vec2().divide(Math.max(rotated.z, 0.01)).multiply(this.fovScaleFactor);
		projected.add(new Vec2(this.renderer.width * (1 + this.camera.screenFocus.x), this.renderer.height * (1 - this.camera.screenFocus.y)).multiply(0.5));
		return projected;
	}
	/**
	 * 
	 * @param {Vec2} screenCoordinates 
	 * @returns {MercatorPos}
	 */
	project_back_3d(screenCoordinates)
	{
		let point = screenCoordinates.copy();
		point.subtract(new Vec2(this.renderer.width * (1 + this.camera.screenFocus.x), this.renderer.height * (1 - this.camera.screenFocus.y)).multiply(0.5));
		point.y *= -1;
		let ray = new Vec3(point.divide(this.fovScaleFactor));
		ray.z = 1;
		ray = Mat3x3.multiply(Mat3x3.create_reverse_rotation_matrix(-this.camera.rotation.x, -this.camera.rotation.y, -this.camera.rotation.z), ray);
		if (ray.z <= 0)
			return undefined;
		ray.multiply(Math.cos(this.camera.rotation.x) / ray.z);
		let offset = Mat3x3.multiply(Mat3x3.create_reverse_rotation_matrix(-this.camera.rotation.x, -this.camera.rotation.y, -this.camera.rotation.z), new Vec3(0, 0, -1)).vec2();
		ray.add(offset);
		ray.multiply(this.fovScaleFactor);
		let p = new MercatorPos(ray.x, ray.y).divide(this.camera.scale).add(this.camera.position);
		return p;
	}
	/**
	 * 
	 * @param {MercatorPos} point 
	 */
	project_2d(point)
	{
		let p = point.copy().subtract(this.camera.position).multiply(this.camera.scale);
		p.y *= -1;
		return p.add(new Vec2(this.renderer.width * (1 + this.camera.screenFocus.x), this.renderer.height * (1 - this.camera.screenFocus.y)).multiply(0.5));
	}
	/**
	 * 
	 * @param {Vec2} point 
	 */
	project_back_2d(point)
	{
		let p = point.copy().subtract(new Vec2(this.renderer.width * (1 + this.camera.screenFocus.x), this.renderer.height * (1 - this.camera.screenFocus.y)).multiply(0.5));
		p.y *= -1;
		return new MercatorPos(p.divide(this.camera.scale).add(this.cameraPosition));
	}
	clear()
	{
		this.renderer.clear();
		return this;
	}
	startFrame()
	{
		this.clear();
		this.update();
		this.updateFovFactors();
		this.isThreeDimensional = this.threeDimensional && (this.camera.rotation.x !== 0 || this.camera.rotation.y !== 0 || this.camera.rotation.z !== 0);;
		if (this.threeDimensional)
		{
			this.fovScaleFactor = this.renderer.canvas.height / 2 * this.fovFactor;
			this.rotationMatrix = Mat3x3.createRotationMatrix(this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z);
		}
	}
	/**
	 * 
	 * @param {MercatorPos} position 
	 * @param {number} radius 
	 */
	circle(position, radius)
	{
		let pos = this.project(position);
		this.renderer.context.beginPath();
		this.renderer.context.arc(pos.x, pos.y, radius * this.camera.scale, 0, Math.PI * 2);
		this.renderer.context.closePath();
		return this;
	}
	beginPath()
	{
		this.renderer.context.beginPath();
	}
	/**
	 * 
	 * @param {MercatorPos} vec 
	 */
	lineTo(vec)
	{
		let projected = this.project(vec);
		this.renderer.context.lineTo(projected.x, projected.y);
	}
	/**
	 * 
	 * @param {MercatorPos[]} path 
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
	 * @param {MercatorPos[]} path 
	 * @param {number} width
	 * @param {number} minWidthInPixel
	 */
	drawPathWithDirectionArrows(path, width, minWidthInPixel)
	{
		let pixelWidth = width * this.camera.scale;
		if (minWidthInPixel && minWidthInPixel > pixelWidth)
			pixelWidth = minWidthInPixel;
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
				d += diff.length / pixelWidth * this.camera.scale;
				if (d > 12)
				{
					d = 0;
					let tocurr = diff.normalize().multiply(pixelWidth / this.camera.scale * 3);
					let leftRotated = Mat2x2.multiply(Mat2x2.create_rotation_matrix(135 / 180 * Math.PI), tocurr);
					let rightRotated = Mat2x2.multiply(Mat2x2.create_rotation_matrix(-135 / 180 * Math.PI), tocurr);
					this.lineTo(curr.copy().add(leftRotated));
					this.lineTo(curr);
					this.lineTo(curr.copy().add(rightRotated));
					this.lineTo(curr);
				}
			}
		}
		this.renderer.context.lineWidth = pixelWidth;
		this.renderer.context.stroke();
		return this;
	}
	/**
	 * 
	 * @param {number} w 
	 * @param {number} minWidthInPixel
	 */
	lineWidth(w, minWidthInPixel = undefined)
	{
		let pixelWidth = w * this.camera.scale;
		if (minWidthInPixel && minWidthInPixel > pixelWidth)
			pixelWidth = minWidthInPixel;
		this.renderer.lineWidth(pixelWidth);
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	fillColor(color)
	{
		this.renderer.fillColor(color);
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	strokeColor(color)
	{
		this.renderer.strokeColor(color);
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	fill(color = undefined)
	{
		this.renderer.fill(color);
		return this;
	}
	/**
	 * 
	 * @param {string} color 
	 */
	stroke(color = undefined)
	{
		this.renderer.stroke(color);
		return this;
	}
}