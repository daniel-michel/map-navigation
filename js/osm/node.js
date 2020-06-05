import OSMData from "./data.js";
import GeoPos from "../math/pos.js";
import Rect from "../math/rect.js";
import OSMElement from "./osm_element.js";

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
		this.geoPos = new GeoPos(node.lat, node.lon);

		this._isJunction = undefined;
		this._streets = undefined;
	}
	/* async get isJunction()
	{
		if (this._isJunction === undefined)
			this._isJunction = (await this.streets).length > 1;
		return this._isJunction;
	}
	async get streets()
	{
		if (!this._streets)
		{
			let area = new Rect(this.geoPos);
			await this.data.load(area);
			let potentialStreets = this.data.streets.get(area);
			this._streets = potentialStreets.filter(street => street.nodes.includes(this.element));
		}
		return this._streets;
	} */
	async getIsJunction()
	{
		if (this._isJunction === undefined)
			this._isJunction = (await this.getStreets()).length > 1;
		return this._isJunction;
		//return (await this.getStreets()).length > 1;
	}
	async getStreets()
	{
		if (!this._streets)
		{
			let area = new Rect(this.geoPos, new GeoPos(0.01, 0.00001));
			await this.data.load(area);
			let potentialStreets = this.data.streets.get(area);
			//console.log("potential streets:", potentialStreets);
			this._streets = potentialStreets.filter(street => street.nodes.includes(this));
			//console.log(this._streets);
		}
		return this._streets;
		/* let area = new Rect(this.geoPos);
		await this.data.load(area);
		let potentialStreets = this.data.streets.get(area);
		let streets = potentialStreets.filter(street => street.nodes.includes(this.element));
		return streets; */
	}
	async getConnectionsToNeighbors()
	{
		let streets = await this.getStreets();
		let connections = [];
		for (let street of streets)
		{
			let junctions = await street.getNextJunctions(street.nodes.findIndex(node => node === this), false);
			let juns = Object.values(junctions).filter(jun => jun);
			for (let junction of juns)
				connections.push({ street, section: junction.section, node: junction.node });
		}
		return connections;
	}
}