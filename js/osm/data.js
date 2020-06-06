import QuadTree from "../math/quad_tree.js";
import Rect from "../math/rect.js";
import GeoPos, { MercatorPos } from "../math/pos.js";
import SortedArrayUniqueValues from "../sorted_array_unique_values.js";
import OSMRequest from "./request.js";
import Street, { StreetPosition } from "./street.js";
import Vec2 from "../math/vec2.js";
import OSMNode from "./node.js";
import OSMRelation from "./relation.js";
import OSMWay from "./way.js";
import OSMRestrictionRelation from "./restriction.js";

export default class OSMData
{
	constructor()
	{
		//this.grid_size = 0.05;
		this.grid_size = 0.1;
		this.squares_loaded = [];



		let wholeWorld = new Rect(new GeoPos(0, 0), new GeoPos(90, 180));
		///**
		// * @private
		// * @type {SortedArrayUniqueValues<OSMRawElement>}
		// */
		//this.rawElements = new SortedArrayUniqueValues(elem => elem.id);
		/**
		 * @type {SortedArrayUniqueValues<OSMNode>}
		 */
		this.nodes = new SortedArrayUniqueValues(elem => elem.element.id);
		/**
		 * @type {SortedArrayUniqueValues<OSMWay>}
		 */
		this.ways = new SortedArrayUniqueValues(elem => elem.element.id);
		/**
		 * @type {SortedArrayUniqueValues<OSMRelation>}
		 */
		this.relations = new SortedArrayUniqueValues(elem => elem.element.id);
		/**
		 * @type {QuadTree<Street>}
		 */
		this.streets = new QuadTree(wholeWorld, Math.floor(Math.log2(360 / 0.05)));
		/**
		 * @private
		 */
		this.osmRequest = new OSMRequest();
	}
	/**
	 * loads the specified area if it is not already loaded 
	 * @param {Rect} area 
	 */
	async load(area)
	{
		let minLat = Math.floor(area.bottom / this.grid_size);
		let maxLat = Math.ceil(area.top / this.grid_size);
		let minLon = Math.floor(area.left / this.grid_size);
		let maxLon = Math.ceil(area.right / this.grid_size);
		let promises = [];
		for (let lat = minLat; lat < maxLat; lat++)
			for (let lon = minLon; lon < maxLon; lon++)
				promises.push(this.loadSquare(lat, lon));
		await Promise.all(promises);
	}
	checkLoaded(area)
	{
		let minLat = Math.floor(area.bottom / this.grid_size);
		let maxLat = Math.ceil(area.top / this.grid_size);
		let minLon = Math.floor(area.left / this.grid_size);
		let maxLon = Math.ceil(area.right / this.grid_size);
		for (let lat = minLat; lat < maxLat; lat++)
		{
			for (let lon = minLon; lon < maxLon; lon++)
			{
				let status = this.checkSquare(lat, lon);
				if (!status?.loaded)
					return false;
			}
		}
		return true;
	}
	/**
	 * 
	 * @private
	 * @param {number} lat 
	 * @param {number} lon 
	 */
	async loadSquare(lat, lon)
	{
		let status = this.checkSquare(lat, lon);
		if (status)
		{
			while (!status.loaded) await new Promise(r => setTimeout(r, 100));
		}
		else
		{
			console.log("loading square", { lat, lon });
			//let area = Rect.fromBounds(new GeoPos(lat * this.grid_size, lon * this.grid_size), new GeoPos((lat + 1) * this.grid_size, (lon + 1) * this.grid_size));
			let area = new Rect(new GeoPos((lat + 0.5) * this.grid_size, (lon + 0.5) * this.grid_size), new GeoPos(this.grid_size / 2, this.grid_size / 2));
			//console.log(area);
			let status = { area, lat, lon, loaded: false };
			this.squares_loaded.push(status);
			await this.loadArea(area);
			status.loaded = true;
			console.log("loaded!");
		}
	}
	/**
	 * 
	 * @private
	 * @param {number} lat 
	 * @param {number} lon 
	 */
	checkSquare(lat, lon)
	{
		for (let i = 0; i < this.squares_loaded.length; i++)
			if (lat === this.squares_loaded[i].lat && lon === this.squares_loaded[i].lon)
				return this.squares_loaded[i];
		return false;
	}
	/**
	 * 
	 * @private
	 * @param {Rect} rect 
	 */
	async loadArea(rect)
	{
		let boundingBox = `(${rect.bottom}, ${rect.left}, ${rect.top}, ${rect.right})`;
		let code = `
			[out:json][timeout:60];
			(
				way["highway"]${boundingBox};
				relation["restriction"]${boundingBox};
			);
			( ._; >; );
			out;
		`;
		//console.log(code);
		let res = await this.osmRequest.request(code);
		console.time("adding elements");
		this.addElements(res.elements);
		console.timeEnd("adding elements");
	}
	/**
	 * 
	 * @private
	 * @param {OSMRawElement[]} elements 
	 */
	addElements(elements)
	{
		//let newRawElements = this.rawElements.addAll(elements);
		let nodes = elements.filter(elem => elem.type === "node").map(node => new OSMNode(node, this));
		let ways = elements.filter(elem => elem.type === "way").map(way => way?.tags?.highway ? new Street(way, this) : new OSMWay(way, this));
		let relations = elements.filter(elem => elem.type === "relation").map(relation => relation?.tags?.restriction ? new OSMRestrictionRelation(relation, this) : new OSMRelation(relation, this));

		let newNodes = this.nodes.addAll(nodes);
		let newWays = this.ways.addAll(ways);
		let newRelations = this.relations.addAll(relations);

		/**
		 * @type {Street[]}
		 */
		let streets = newWays.filter(way => way instanceof Street);
		/**
		 * @type {OSMRestrictionRelation[]}
		 */
		let restrictions = newRelations.filter(elem => elem instanceof OSMRestrictionRelation);
		for (let street of streets)
		{
			this.streets.add({ elem: street, area: street.area });
		}
		for (let restriction of restrictions)
		{
			let elements = Object.values(restriction.getMembers());
			elements = elements.filter(elem => elem);
			elements.forEach(elem => elem.restrictions.push(restriction));
		}
	}
	/**
	 * 
	 * @param {MercatorPos|GeoPos} pos 
	 * @param {number} searchRadius 
	 * @param {boolean} load determines whether to load the area to search in if it hasn't been loaded
	 * @param {import("./street.js").Rule[]} rules
	 * @returns {Promise<StreetPosition>}
	 */
	async getClosestStreet(pos, searchRadius, load = true, rules = undefined)
	{
		let mercator = pos instanceof MercatorPos ? pos : pos.getMercatorProjection();
		let searchArea = new Rect(mercator, new Vec2(searchRadius, searchRadius));
		searchArea = GeoPos.rectFromMercatorProjection(searchArea);
		if (load)
			await this.load(searchArea);
		let streets = this.streets.get(searchArea);
		/**
		 * @type {import("./street.js").ClosestPoint}
		 */
		let closest = null;
		for (let street of streets)
		{
			if (rules && !street.matchesRules(rules))
				continue;
			let point = street.closestPointTo(mercator);
			if (!closest || closest.dist > point.dist)
			{
				closest = point;
			}
		}
		if (closest)
			return closest.streetPosition;
	}
}