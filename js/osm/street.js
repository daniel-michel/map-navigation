import OSMData from "./data.js";
import Rect from "../math/rect.js";
import GeoPos, { MercatorPos } from "../math/pos.js";
import Vec3 from "../math/vec3.js";
import Vec2 from "../math/vec2.js";
import OSMNode from "./node.js";
import OSMElement from "./osm_element.js";
import OSMWay from "./way.js";


export class StreetPosition
{
	/**
	 * 
	 * @param {Street} street 
	 * @param {number} index 
	 * @param {number} t 
	 */
	constructor(street, index, t = 0)
	{
		this.street = street;
		this.index = index;
		this.t = t;
		/* if (t === 1)
		{
			this.index++;
			this.t = 0;
		} */
		if (index >= street.nodes.length || index < 0 || (this.index >= this.street.nodes.length - 1 && t !== 0))
			console.error("initializing StreetPosition", index, t, street.nodes.length);
		if (this.t === 0)
			true;
		else if (this.index >= this.street.nodes.length - 1)
			console.error(this, this.street.nodes.length, this.street.geoCoordinates.length, this.street);
	}
	/**
	 * The position might be inaccurate because interpolating latitude and longitude won't give a point actually between the interpolated points
	 * @returns {GeoPos}
	 */
	getGeoPos()
	{
		if (this.t === 0)
			return this.street.geoCoordinates[this.index].copy();
		let pos = GeoPos.interpolate(this.street.geoCoordinates[this.index], this.street.geoCoordinates[this.index + 1], this.t);
		return pos;
	}
	getMercatorPos()
	{
		if (this.t === 0)
			return this.street.mercatorCoordinates[this.index];
		let pos = MercatorPos.interpolate(this.street.mercatorCoordinates[this.index], this.street.mercatorCoordinates[this.index + 1], this.t);
		return pos;
	}
	async getNextJunctions()
	{
		let junctions = await this.street.getNextJunctions(this.index, this.t > 0);
		if (junctions.next)
			junctions.next.section.start.t = this.t;
		if (junctions.previous)
			junctions.previous.section.start.t = this.t;
		return junctions;
	}
	/**
	 * 
	 * @param {Street} street 
	 * @param {number} index 
	 * @param {number} t 
	 */
	static getGeoPos(street, index, t = 0)
	{
		if (t === 0)
			return street.geoCoordinates[index].copy();
		let pos = GeoPos.interpolate(street.geoCoordinates[index], street.geoCoordinates[index + 1], t);
		return pos;
	}
}

export class StreetSection
{
	/**
	 * 
	 * @param {Street} street
	 * @param {{index: number, t: number}} start 
	 * @param {{index: number, t: number}} end
	 */
	constructor(street, start, end)
	{
		this.street = street;
		this.start = start;
		this.end = end;
	}
	get forwards()
	{
		return this.start.index < this.end.index || (this.start.index === this.end.index && this.start.t <= this.end.t);
	}
	getLength()
	{
		return StreetSection.getLength(this.street, this.start, this.end);
	}
	getGeoCoordinates()
	{
		return StreetSection.getGeoCoordinates(this.street, this.start, this.end);
	}
	static getGeoCoordinates(street, start, end)
	{
		let geoCoordinates = [];
		if (start.index === end.index)
		{
			geoCoordinates.push(StreetPosition.getGeoPos(street, start.index, start.t));
			if (start.t !== end.t)
				geoCoordinates.push(StreetPosition.getGeoPos(street, end.index, end.t));
		}
		else if (start.index < end.index)
		{
			if (start.t < 1)
				geoCoordinates.push(StreetPosition.getGeoPos(street, start.index, start.t));
			geoCoordinates.push(...StreetSection.getGeoCoordinatesOnStreet(street, start.index + 1, end.index));
			if (end.t > 0)
				geoCoordinates.push(StreetPosition.getGeoPos(street, end.index, end.t));
		}
		else
		{
			if (start.t > 0)
				geoCoordinates.push(StreetPosition.getGeoPos(street, start.index, start.t));
			geoCoordinates.push(...StreetSection.getGeoCoordinatesOnStreet(street, start.index, end.index + 1));
			if (end.t < 1)
				geoCoordinates.push(StreetPosition.getGeoPos(street, end.index, end.t));
		}
		return geoCoordinates;
	}
	/**
	 *
	 * @param {Street} street
	 * @param {{index: number, t: number}} start
	 * @param {{index: number, t: number}} end
	 * @returns {number}
	 */
	static getLength(street, start, end)
	{
		let length = 0;
		let positions = StreetSection.getGeoCoordinates(street, start, end).map(goePos => goePos.get3dCoordinates());
		for (let i = 0; i < positions.length - 1; i++)
		{
			let l = Vec3.distance(positions[i], positions[i + 1]);
			length += l;
		}
		return length;
	}
	/**
	 * 
	 * @param {StreetPosition} a 
	 * @param {StreetPosition} b 
	 */
	static fromStreetPositions(a, b)
	{
		if (a.street !== b.street)
			throw "Error: a street section has to be just on one street";
		return new StreetSection(a.street, { index: a.index, t: a.t }, { index: b.index, t: b.t });
	}
	/**
	 * 
	 * @param {StreetPosition} streetPos 
	 * @param {OSMNode} node 
	 */
	static fromStreetPositionToNode(streetPos, node)
	{
		let index = streetPos.street.nodes.findIndex(n => n === node);
		return new StreetSection(streetPos.street, { index: streetPos.index, t: streetPos.t }, { index, t: 0 });
	}
	/**
	 * 
	 * @param {OSMNode} node 
	 * @param {StreetPosition} streetPos 
	 */
	static fromNodeToStreetPosition(node, streetPos)
	{
		let index = streetPos.street.nodes.findIndex(n => n === node);
		return new StreetSection(streetPos.street, { index, t: 0 }, { index: streetPos.index, t: streetPos.t });
	}
	/**
	 * 
	 * @param {Street} street 
	 * @param {number} start 
	 * @param {number} end 
	 */
	static getNodesOnStreet(street, start, end)
	{
		let nodes = [];
		if (start < end)
		{
			for (let i = start; i <= end; i++)
				nodes.push(street.nodes[i]);
		}
		else
		{
			for (let i = start; i >= end; i--)
				nodes.push(street.nodes[i]);
		}
		return nodes;
	}
	/**
	 * 
	 * @param {Street} street 
	 * @param {number} start 
	 * @param {number} end 
	 */
	static getGeoCoordinatesOnStreet(street, start, end)
	{
		let geoCoordinates = [];
		if (start < end)
		{
			for (let i = start; i <= end; i++)
				geoCoordinates.push(street.geoCoordinates[i]);
		}
		else
		{
			for (let i = start; i >= end; i--)
				geoCoordinates.push(street.geoCoordinates[i]);
		}
		return geoCoordinates;
	}
}
export class StreetPath
{
	/**
	 * 
	 * @param {OSMNode[]} nodes 
	 * @param {{start: number, end: number, street: Street}[]} streets 
	 * @param {StreetSection} start 
	 * @param {StreetSection} end 
	 */
	constructor(nodes, streets, start = undefined, end = undefined)
	{
		this.start = start;
		this.junctions = nodes;
		this.end = end;
		this.streets = streets;
		/**
		 * @private
		 * @type {GeoPos[]}
		 */
		this._geoCoordinates = null;
		/**
		 * @private
		 * @type {MercatorPos[]}
		 */
		this._mercatorCoordinates = null;
		if (!this.junctions?.length && !this.start)
			throw "Invalid initilization! Either there have to be junction nodes or start has to be set";
	}
	getGeoCoordinates()
	{
		if (!this._geoCoordinates)
		{
			let coordinates = [];
			if (this.start)
				coordinates.push(...this.start.getGeoCoordinates());
			if (this.junctions.length > 0)
			{
				if (!this.start)
					coordinates.push(this.junctions[0].geoPos);
				for (let i = 0; i < this.streets.length; i++)
				{
					let s = this.streets[i];
					let start = s.start + (i === 0 ? (s.end > s.start ? 1 : -1) : 0);
					let end = s.end + (s.end > s.start ? -1 : 1);
					if (start !== end && (start < end !== s.start < s.end))
						continue;
					coordinates.push(...new StreetSection(s.street, { index: start, t: 0 }, { index: end, t: 0 }).getGeoCoordinates());
				}
				let lastJunction = this.junctions[this.junctions.length - 1];
				if (!this.end)
					coordinates.push(lastJunction.geoPos);
			}
			if (this.end)
			{
				if (this.start && !(this.junctions.length > 0))
					coordinates.push(...new StreetSection(this.end.street, { index: this.end.start.index + (this.end.forwards ? 1 : -1), t: 0 }, { index: this.end.end.index, t: this.end.end.t }).getGeoCoordinates());
				else
					coordinates.push(...this.end.getGeoCoordinates());
			}
			this._geoCoordinates = coordinates;
		}
		return this._geoCoordinates;
	}
	getMercatorCoordinates()
	{
		if (!this._mercatorCoordinates)
		{
			this._mercatorCoordinates = this.getGeoCoordinates().map(geo => geo.getMercatorProjection());
		}
		return this._mercatorCoordinates;
	}
	/**
	 * 
	 * @param {StreetSection[]} streetsections 
	 */
	static fromStreetSections(streetsections)
	{
		let streets = [];
		let nodes = [];
		let start = streetsections.shift();
		if (streetsections.length > 1)
			nodes.push(start.street.nodes[start.end.index]);
		let end = streetsections.pop();
		for (let section of streetsections)
		{
			streets.push({ street: section.street, start: section.start.index, end: section.end.index });
			nodes.push(section.street.nodes[section.end.index]);
		}
		return new StreetPath(nodes, streets, start, end);
	}
}

/**
 * @typedef {{hasToExist?: boolean, condition: string, key: string, value: string|string[]}} Rule
 */

/**
 * @type {Rule[]}
 */
export const DRIVEABLE_STREET_RULE = [
	{
		hasToExist: false,
		condition: "equals",
		key: "access",
		value: "yes",
	},
	{
		hasToExist: false,
		condition: "not equals",
		key: "vehicle",
		value: "no",
	},
	/* {
		hasToExist: true,
		condition: "not equals",
		key: "highway",
		//value: ["service", "unclassified", "track", "path", "footway", "pedestrian", "steps"],
		value: ["pedestrian", "track", "bus_guideway", "escape", "raceway", "road", "footway", "bridleway", "steps", "corridor", "path", "cycleway", "construction", "proposed", "bus_stop", "elevator", "platform"],
	}, */
	{
		hasToExist: true,
		condition: "equals",
		key: "highway",
		value: [
			"motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential",
			"motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
			"living_street", "service"
		],
	}
];


/**
 * 
 * @param {{}} values 
 * @param {Rule[]} rules
 */
function matchConditions(values, rules)
{
	for (let rule of rules)
	{
		let val = values[rule.key];
		if (val === undefined)
		{
			if (rule.hasToExist)
				return false;
			continue;
		}
		if (rule.condition === "equals")
		{
			if (rule.value instanceof Array)
			{
				let equals = false;
				for (let value of rule.value)
				{
					if (value === val)
					{
						equals = true;
						break;
					}
				}
				if (!equals)
					return false;
			}
			else if (rule.value !== val)
				return false;
		}
		else if (rule.condition === "not equals")
		{
			if (rule.value instanceof Array)
			{
				for (let value of rule.value)
					if (value === val)
						return false;
			}
			else if (rule.value === val)
				return false;
		}
	}
	return true;
}

/**
 * @exports
 * @typedef {{point: Vec2, clamped: boolean, t: number, dist: number, streetPosition: StreetPosition}} ClosestPoint
 */
export default class Street extends OSMWay
{
	/**
	 * 
	 * @param {OSMWayElement} way 
	 * @param {OSMData} data
	 */
	constructor(way, data)
	{
		super(way, data);
		/**
		 * @type {OSMNode[]}
		 */
		this.nodes = this.element.nodes.map(id =>
		{
			let node = this.data.nodes[id];
			node._streets.push(this);
			return node;
		});
		/**
		 * @private
		 * @type {GeoPos[]}
		 */
		this._geoCoordinates;
		/**
		 * @private
		 * @type {MercatorPos[]}
		 */
		this._mercatorCoordinates;
		/**
		 * @private
		 */
		this._area;
	}
	get area()
	{
		if (!this._area)
			this._area = Rect.createContaining(...this.geoCoordinates);
		return this._area;
	}
	get geoCoordinates()
	{
		if (!this._geoCoordinates)
			this._geoCoordinates = this.nodes.map(node => node.geoPos);
		return this._geoCoordinates;
	}
	get mercatorCoordinates()
	{
		if (!this._mercatorCoordinates)
			this._mercatorCoordinates = this.nodes.map(node => node.mercatorPos);
		return this._mercatorCoordinates;
	}
	getLength()
	{
		return StreetSection.getLength(this, { index: 0, t: 0 }, { index: this.element.nodes.length - 1, t: 0 });
	}
	/**
	 *
	 * @param {Vec3} p the position as mercator projection
	 * @returns {ClosestPoint}
	 */
	closestPointTo(p)
	{
		/**
		 * @type {ClosestPoint}
		 */
		let closest = null;
		for (let i = 0; i < this.mercatorCoordinates.length - 1; i++)
		{
			let mercator0 = this.mercatorCoordinates[i];
			let mercator1 = this.mercatorCoordinates[i + 1];
			let point = Vec2.closestPointOnLine(mercator0, mercator1, p);
			let dist = Vec2.distance(point.point, p);
			if (!closest || dist < closest.dist)
			{
				let streetPosition = new StreetPosition(this, i, point.t);
				closest = Object.assign(point, { dist, streetPosition });
			}
		}
		return closest;
	}
	/**
	 * 
	 * @param {Rule[]} rules 
	 */
	matchesRules(rules = DRIVEABLE_STREET_RULE)
	{
		return matchConditions(this.element.tags, rules);
	}

	/**
	 * 
	 * @param {number} index 
	 * @param {boolean} include if true the node at the index will also be returned as a previous junction
	 * @returns {Promise<{previous: {node: OSMNode, section: StreetSection}, next: {node: OSMNode, section: StreetSection}}>}
	 */
	async getNextJunctions(index, include = false)
	{
		let previous = null;
		let next = null;
		for (let i = index - (include ? 0 : 1); i >= 0; i--)
		{
			let node = this.nodes[i];
			if (await node.getIsJunction())
			{
				previous = { node, section: new StreetSection(this, { index, t: 0 }, { index: i, t: 0 }) };
				break;
			}
		}
		for (let i = index + 1; i < this.nodes.length; i++)
		{
			let node = this.nodes[i];
			if (await node.getIsJunction())
			{
				next = { node, section: new StreetSection(this, { index, t: 0 }, { index: i, t: 0 }) };
				break;
			}
		}
		return { previous, next };
	}
}