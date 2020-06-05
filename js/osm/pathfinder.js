import OSMData from "./data.js";
import AStar from "../async_astar.js";
import Street, { StreetPosition, StreetSection, StreetPath } from "./street.js";
import OSMNode from "./node.js";
import GeoPos from "../math/pos.js";
import Vec3 from "../math/vec3.js";


/**
 * @typedef {{node: OSMNode | StreetPosition}} OSM.Pathfinder.Waypoint.UserDataType
 * @typedef {{street: Street}} OSM.Pathfinder.Connection.UserDataType
 */
/**
 * @typedef {import("../async_astar.js").AStarWaypoint<{node: OSMNode | StreetPosition}, {street: Street}>} OSMWaypoint
 */
/**
 * @typedef {import("../async_astar.js").AStarConnection<{node: OSMNode | StreetPosition}, {street: Street}>} OSMConnection
 */

/**
 * a function taking in the street and direction used to calculate the weight for the street in weight/meter
 * @param {Street} street the street to weight
 * @param {boolean} forwards true if the street is used in the forward direction otherwise false
 * @typedef {(street: Street, forwards: boolean) => number} WeightingFunction
 */
/**
 * a function taking in the street and direction used to calculate the speed for the street in m/s
 * @param {Street} street the street to weight
 * @param {boolean} forwards true if the street is used in the forward direction otherwise false
 * @typedef {(street: Street, forwards: boolean) => number} EstimatedSpeedFunction
 */

export default class OSMPathfinder
{
	/**
	 * 
	 * @param {OSMData} data 
	 * @param {StreetPosition} from
	 * @param {StreetPosition} to
	 * @param {WeightingFunction} calculateWeighting 
	 * @param {EstimatedSpeedFunction} calculateSpeed
	 */
	constructor(data, from, to, calculateWeighting = () => 1, calculateSpeed = calculateWeighting)
	{
		this.data = data;
		this.from = from;
		this.to = to;

		this.calculateWeighting = calculateWeighting;
		this.calculateSpeed = calculateSpeed;

		this.streetPositions = [this.from, this.to];

		/**
		 * @type {WeakMap<*, OSMWaypoint>}
		 */
		this.waypoints = new WeakMap();

		this.ready = false;
		this.reset();
	}
	async reset()
	{
		this.ready = false;


		/* let junctions = Object.values(await this.to.getNextJunctions()).filter(jun => jun);
		this.toWaypoint = this.getWaypoint(junctions[0].node);
		junctions = Object.values(await this.from.getNextJunctions()).filter(jun => jun);
		this.fromWaypoint = this.getWaypoint(junctions[0].node);
		console.log(this.fromWaypoint, this.toWaypoint); */


		this.toWaypoint = this.getWaypoint(this.to);
		this.fromWaypoint = this.getWaypoint(this.from);

		/**
		 * @type {AStar<OSM.Pathfinder.Waypoint.UserDataType, OSM.Pathfinder.Connection.UserDataType>}
		 */
		this.astar = new AStar(this.fromWaypoint, this.toWaypoint);
		this.ready = true;
	}
	/**
	 * 
	 * @param {OSMNode|StreetPosition} node
	 * @returns {OSMWaypoint}
	 */
	getWaypoint(node)
	{
		let existing = this.waypoints.get(node);
		if (existing)
			return existing;
		let getNeighbors = async () =>
		{
			/**
			 * @type {OSMConnection[]}
			 */
			let neighbors = [];
			let connections;
			if (node instanceof OSMNode)
				connections = await node.getConnectionsToNeighbors();
			else
				connections = Object.values(await node.getNextJunctions()).filter(con => con);
			for (let connection of connections)
			{
				let weight = this.calculateWeighting(connection.section.street, connection.section.forwards);
				if (isNaN(weight))
					console.warn(weight, connection.section.street);
				if (weight < 0)
					continue;
				let cost = connection.section.getLength();// * weight;
				neighbors.push({
					cost,
					waypoint: this.getWaypoint(connection.node),
					userData: { street: connection.section.street },
				});
			}

			let additionalWaypoints;
			let streets;
			if (node instanceof OSMNode)
			{
				streets = await node.getStreets();
				additionalWaypoints = this.streetPositions.filter(pos => streets.includes(pos.street));
			}
			else
			{
				streets = [node.street];
				additionalWaypoints = this.streetPositions.filter(pos => node.street === pos.street && pos !== node);
			}
			for (let additional of additionalWaypoints)
			{
				let cost;
				let weight;
				if (node instanceof OSMNode)
				{
					cost = StreetSection.fromNodeToStreetPosition(node, additional).getLength();
					weight = this.calculateWeighting(additional.street, additional.index > additional.street.nodes.findIndex(n => n === node));
				}
				else
				{
					cost = StreetSection.fromStreetPositions(node, additional).getLength();
					weight = this.calculateWeighting(node.street, additional.index > node.index || (additional.index === node.index && additional.t > node.t));
				}
				if (weight < 0)
					continue;
				cost *= weight;
				neighbors.push({
					cost,
					waypoint: this.getWaypoint(additional),
					userData: { street: additional.street },
				});
			}
			return neighbors;
		};
		let waypoint = {
			previous: null,
			hcost: this.getHCost(node),
			getNeighbors,
			userData: { node: node },
		};
		this.waypoints.set(node, waypoint);
		return waypoint;
	}
	/**
	 * 
	 * @param {OSMNode|StreetPosition} node 
	 */
	getHCost(node)
	{
		/* if (node instanceof OSMNode)
			return Vec3.distance(this.to.getGeoPos().get3dCoordinates(), node.geoPos.get3dCoordinates());
		return Vec3.distance(this.to.getGeoPos().get3dCoordinates(), node.getGeoPos().get3dCoordinates()); */
		if (!this.toWaypoint)
			return 0;
		if (node instanceof OSMNode)
			return Vec3.distance(this.toWaypoint.userData.node.getGeoPos().get3dCoordinates(), node.geoPos.get3dCoordinates());
		return Vec3.distance(this.toWaypoint.userData.node.getGeoPos().get3dCoordinates(), node.getGeoPos().get3dCoordinates());
	}
	async find()
	{
		while (!this.ready) await new Promise(r => setTimeout(r, 50));
		console.time("pathfinding");
		let waypoints = await this.astar.find();
		console.timeEnd("pathfinding");
		console.log("path: ", waypoints);
		/* let streets = [];
		for (let i = 0; i < waypoints.length - 1; i++)
		{
			let current = waypoints[i];
			let next = waypoints[i + 1];
			let currNode = current.node;
			let nextNode = next.node;
			let street;
			let streetSection;
			if (currNode instanceof OSMNode)
			{
				if (nextNode instanceof OSMNode)
				{
					let otherStreets = await nextNode.getStreets();
					street = (await currNode.getStreets()).filter(s => otherStreets.includes(s))[0];
					streetSection = new StreetSection(street, { index: street.nodes.findIndex(n => n === currNode), t: 0 }, { index: street.nodes.findIndex(n => n === nextNode), t: 0 });
				}
				else
				{
					street = nextNode.street;
					streetSection = new StreetSection(street, { index: street.nodes.findIndex(n => n === currNode), t: 0 }, { index: nextNode.index, t: nextNode.t });
				}
			}
			else
			{
				street = currNode.street;
				if (nextNode instanceof OSMNode)
				{
					streetSection = new StreetSection(street, { index: currNode.index, t: currNode.t }, { index: street.nodes.findIndex(n => n === nextNode), t: 0 });
				}
			}
			streets.push(streetSection);
		} */
		//return StreetPath.createFromNodesAndStreetPositions(waypoints.map(waypoint => waypoint.waypoint.userData.node));
		let streets = waypoints.map(waypoint => waypoint?.connection?.userData?.street).filter(v => v);
		let nodes = waypoints.map(waypoint => waypoint.waypoint.userData.node);
		streets.shift();
		streets.pop();
		let start = nodes.shift();
		let end = nodes.pop();
		let path = StreetPath.fromNodesAndStreets(nodes, streets, start, end);
		console.log("street path:", path);
		return path;
	}
}