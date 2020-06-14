import OSMData from "./data.js";
import GeoPos from "../math/pos.js";
import Rect from "../math/rect.js";
import OSMElement from "./osm_element.js";
import Street, { StreetSection } from "./street.js";

export default class OSMNode extends OSMElement
{
	/**
	 * 
	 * @param {OSMNodeElement} node 
	 * @param {OSMData} data
	 */
	constructor(node, data)
	{
		super(node, data);
		/**
		 * @readonly
		 * @constant
		 */
		this.geoPos = new GeoPos(node.lat, node.lon);
		Object.freeze(this.geoPos);
		/**
		 * @readonly
		 * @constant
		 */
		this.mercatorPos = this.geoPos.getMercatorProjection();
		Object.freeze(this.mercatorPos);

		/**
		 * @private
		 */
		this._isJunction = undefined;
		/**
		 * @type {Street[]}
		 */
		this._streets = [];
		/**
		 * @private
		 */
		this._loaded = false;
	}
	async getIsJunction()
	{
		if (this._isJunction !== undefined)
			return this._isJunction;

		let streets = await this.getStreets();
		if (streets.length > 1 || (streets.length === 1 && getAllIndices(streets[0].nodes, this).length > 1))
			return this._isJunction = true;
		return this._isJunction = false;
	}
	async getStreets()
	{
		if (!this._loaded)
		{
			this._loaded = true;
			let area = new Rect(this.geoPos, new GeoPos(0.01, 0.00001));
			await this.data.load(area);
		}
		return this._streets;
	}
	async getConnectionsToNeighbors()
	{
		let streets = await this.getStreets();
		let connections = [];
		for (let street of streets)
		{
			let indices = getAllIndices(street.nodes, this);
			/**
			 * @type {{node: OSMNode, section: StreetSection}[]}
			 */
			let junctions = [];
			for (let index of indices)
				junctions.push(...Object.values(await street.getNextJunctions(index, false)));
			let juns = junctions.filter(jun => jun);
			for (let junction of juns)
				connections.push({ street, section: junction.section, node: junction.node });
		}
		return connections;
	}
}

/**
 * 
 * @template T
 * @param {T[]} array 
 * @param {T} value 
 */
export function getAllIndices(array, value)
{
	let indices = [];
	for (let i = 0; i < array.length; i++)
		if (array[i] === value)
			indices.push(i);
	return indices;
}