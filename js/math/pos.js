import Vec3 from "./vec3.js";
import Rect from "./rect.js";
import Vec2 from "./vec2.js";

const EARTH_RADIUS_AT_SEA_LEVEL = 6378137;
const DEGREE_TO_RAD = Math.PI / 180;

export default class GeoPos extends Vec3
{
	/**
	 * 
	 * @param {number|Vec2} lat position from south -90° to north 90°
	 * @param {number} lon position along the equator from -180° west to 180° east
	 * @param {number} ele
	 */
	constructor(lat = 0, lon = 0, ele = 0)
	{
		if (lat instanceof Vec2)
			super(lat);
		else
			super(lon, lat, ele);
	}
	get lat()
	{
		return this.y;
	}
	set lat(v)
	{
		this.y = v;
	}
	get lon()
	{
		return this.x;
	}
	set lon(v)
	{
		this.x = v;
	}
	get ele()
	{
		return this.z;
	}
	set ele(v)
	{
		this.z = v;
	}
	/**
	 * @returns {GeoPos}
	 */
	copy()
	{
		return new GeoPos(this);
	}

	/**
	 * converts the geo position to a 3d position relative to the center of the earth and the unit is meters
	 * meaning that:
	 * 0°N 0°E is equal to x: 0, y: 0, z: -(earth_radius_at_sea_level + elevation).
	 * @returns {Vec3}
	 */
	get3dCoordinates()
	{
		let elevation = EARTH_RADIUS_AT_SEA_LEVEL + this.ele;
		let y = Math.sin(this.lat * DEGREE_TO_RAD) * elevation;
		let r = Math.cos(this.lat * DEGREE_TO_RAD) * elevation;
		let x = Math.sin(this.lon * DEGREE_TO_RAD) * r;
		let z = -Math.cos(this.lon * DEGREE_TO_RAD) * r;
		return new Vec3(x, y, z);
	}

	/**
	 * 
	 * @returns {MercatorPos}
	 */
	getMercatorProjection()
	{
		let x = GeoPos.lonToMercatorProjection(this.lon);
		//let y = Math.tan(this.lat / 180 * Math.PI) * 35;
		//let mercN = Math.log(Math.tan((Math.PI / 4) + ((this.lat / 180 * Math.PI) / 2)));
		//let y = mercN / (2 * Math.PI);
		let y = GeoPos.latToMercatorProjection(this.lat);
		// mercN = (y * 2 * PI) / 360
		// y = b^x
		// x = logb(y)
		// mercN = Math.log(Math.tan((Math.PI / 4) + ((this.lat / 180 * Math.PI) / 2)))
		// Math.tan((Math.PI / 4) + ((this.lat / 180 * Math.PI) / 2)) = e^mercN
		// (Math.PI / 4) + ((this.lat / 180 * Math.PI) / 2) = Math.atan(e^mercN)
		// ((this.lat / 180 * Math.PI) / 2) = Math.atan(e^mercN) - Math.PI / 4
		// (this.lat / 180 * Math.PI) = (Math.atan(e^mercN) - Math.PI / 4) * 2
		// this.lat = (Math.atan(e^mercN) - Math.PI / 4) * 2 * 180 / Math.PI
		//return new Vec3(x, y, this.ele);
		return new MercatorPos(x, y, this.ele);
	}
	/**
	 * 
	 * @param {MercatorPos} mecratorPosition 
	 */
	static fromMercatorProjection(mecratorPosition)
	{
		let lon = GeoPos.lonFromMercatorProjection(mecratorPosition.x);
		let lat = GeoPos.latFromMercatorProjection(mecratorPosition.y);
		if (mecratorPosition instanceof Vec3)
			return new GeoPos(lat, lon, mecratorPosition.z);
		else
			return new GeoPos(lat, lon);
	}


	static rectToMercatorProjection(rect)
	{
		return Rect.fromBounds(
			GeoPos.lonToMercatorProjection(rect.left),
			GeoPos.lonToMercatorProjection(rect.right),
			GeoPos.latToMercatorProjection(rect.bottom),
			GeoPos.latToMercatorProjection(rect.top));
	}
	static rectFromMercatorProjection(rect)
	{
		return Rect.fromBounds(
			GeoPos.lonFromMercatorProjection(rect.left),
			GeoPos.lonFromMercatorProjection(rect.right),
			GeoPos.latFromMercatorProjection(rect.bottom),
			GeoPos.latFromMercatorProjection(rect.top));
	}


	static latToMercatorProjection(lat)
	{
		let mercN = Math.log(Math.tan((Math.PI / 4) + ((lat / 180 * Math.PI) / 2)));
		let y = mercN / (2 * Math.PI);
		return y;
	}
	static lonToMercatorProjection(lon)
	{
		let x = lon / 360;
		return x;
	}
	static latFromMercatorProjection(y)
	{
		let mercN = (y * 2 * Math.PI);
		let lat = (Math.atan(Math.E ** mercN) - Math.PI / 4) * 2 * 180 / Math.PI;
		return lat;
	}
	static lonFromMercatorProjection(x)
	{
		let lon = x * 360;
		return lon;
	}
}


export class MercatorPos extends Vec3
{
	/**
	 * 
	 * @param {number|Vec2} x 
	 * @param {number} y 
	 * @param {number} ele 
	 */
	constructor(x = 0, y = 0, ele = 0)
	{
		super(x, y, ele);
	}
	get ele()
	{
		return this.z;
	}
	set ele(v)
	{
		this.z = v;
	}
	copy()
	{
		return new MercatorPos(this);
	}
	/**
	 * 
	 * @returns {GeoPos}
	 */
	getGeographicCoordinates()
	{
		let lon = GeoPos.lonFromMercatorProjection(this.x);
		let lat = GeoPos.latFromMercatorProjection(this.y);
		return new GeoPos(lat, lon, this.ele);
	}
}