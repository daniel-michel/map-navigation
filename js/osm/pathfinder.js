import OSMData from "./data.js";
import AStar from "../async_astar.js";
import Street, { StreetPosition, StreetSection, StreetPath } from "./street.js";
import OSMNode from "./node.js";
import Vec3 from "../math/vec3.js";


/**
 * @typedef {import("../async_astar.js").AStarWaypoint<{node: OSMNode | StreetPosition}, {street: Street}>} OSMWaypoint
 * @typedef {import("../async_astar.js").AStarConnection<{node: OSMNode | StreetPosition}, {street: Street}>} OSMConnection
 * @typedef {{waypoint: OSMWaypoint, from: {street: Street, direction: "forwards"|"backwards"|"none"}}} OSMWaypointsJunction
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
	 * @param {{calculateWeighting?: WeightingFunction, calculateSpeed?: EstimatedSpeedFunction, restrictions?: boolean, turnAround?: boolean}} arg3
	 */
	constructor(data, from, to, {
		calculateWeighting = () => 1,
		calculateSpeed = (street, forwards) => 1 / calculateWeighting(street, forwards),
		restrictions = true,
		turnAround = false } = {})
	{
		this.data = data;
		this.from = from;
		this.to = to;

		this.restrictions = restrictions;
		this.turnAround = turnAround;

		this.calculateWeighting = calculateWeighting;
		this.calculateSpeed = calculateSpeed;

		this.streetPositions = [this.from, this.to];

		/**
		 * @type {WeakMap<*, OSMWaypointsJunction[]>}
		 */
		this.waypoints = new WeakMap();

		this.ready = false;
		this.reset();
	}
	async reset()
	{
		this.ready = false;

		this.toWaypoint = this.getWaypoint(this.to);
		this.fromWaypoint = this.getWaypoint(this.from);

		/**
		 * @type {AStar<{node: OSMNode | StreetPosition}, {street: Street}>}
		 */
		this.astar = new AStar(this.fromWaypoint, this.toWaypoint);
		this.ready = true;
	}
	/**
	 * 
	 * @param {OSMNode|StreetPosition} node
	 * @param {{street: Street, direction: "forwards"|"backwards"|"none"}} [from]
	 * @returns {OSMWaypoint}
	 */
	getWaypoint(node, from = { street: undefined, direction: "none" })
	{
		if (!this.restrictions)
			from = { street: undefined, direction: "none" };
		let existing = this.waypoints.get(node);
		if (existing)
		{
			let allreadyExistingWaypoint = existing.filter(w => w.from.street === from.street && w.from.direction === from.direction)[0];
			if (allreadyExistingWaypoint)
				return allreadyExistingWaypoint.waypoint;
		}
		else
		{
			existing = [];
			this.waypoints.set(node, existing);
		}

		let getNeighbors = async () =>
		{
			/**
			 * @type {OSMConnection[]}
			 */
			let neighbors = [];
			let connections;
			if (node instanceof OSMNode)
			{
				connections = await node.getConnectionsToNeighbors();
				let restrictions = node.restrictions;
				if (this.restrictions && from.street)
					connections = connections.filter(conn => restrictions.every(res => !res.forbids(from.street, node, conn.street)));
			}
			else
				connections = Object.values(await node.getNextJunctions()).filter(con => con);
			if (!this.turnAround && this.restrictions)
				connections = connections.filter(conn => conn.section.street !== from.street || (conn.section.forwards ? "forwards" : "backwards") !== from.direction);
			for (let connection of connections)
			{
				let forwards = connection.section.forwards;
				let weight = this.calculateWeighting(connection.section.street, forwards);
				if (isNaN(weight))
					console.warn(weight, connection.section.street);
				if (weight < 0)
					continue;
				let cost = connection.section.getLength() * weight;
				neighbors.push({
					cost,
					waypoint: this.getWaypoint(connection.node, { street: connection.section.street, direction: forwards ? "backwards" : "forwards" }),
					userData: { street: connection.section.street },
				});
			}

			let additionalWaypoints;
			let streets;
			if (node instanceof OSMNode)
			{
				streets = await node.getStreets();
				additionalWaypoints = this.streetPositions.filter(pos => streets.includes(pos.street));
				let restrictions = node.restrictions;
				if (this.restrictions && from.street)
					additionalWaypoints = additionalWaypoints.filter(streetPos => restrictions.every(res => !res.forbids(from.street, node, streetPos.street)));
			}
			else
			{
				streets = [node.street];
				additionalWaypoints = this.streetPositions.filter(pos => node.street === pos.street && pos !== node);
			}
			for (let additional of additionalWaypoints)
			{
				let forwards;
				let cost;
				let weight;
				if (node instanceof OSMNode)
				{
					cost = StreetSection.fromNodeToStreetPosition(node, additional).getLength();
					forwards = additional.index > additional.street.nodes.findIndex(n => n === node);
					weight = this.calculateWeighting(additional.street, forwards);
				}
				else
				{
					cost = StreetSection.fromStreetPositions(node, additional).getLength();
					forwards = additional.index > node.index || (additional.index === node.index && additional.t > node.t);
					weight = this.calculateWeighting(node.street, forwards);
				}
				if (weight < 0)
					continue;
				cost *= weight;
				neighbors.push({
					cost,
					waypoint: this.getWaypoint(additional),//this.getWaypoint(additional, { street: additional.street, direction: forwards ? "backwards" : "forwards" }),
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
		existing.push({
			waypoint,
			from,
		});
		return waypoint;
	}
	/**
	 * 
	 * @param {OSMNode|StreetPosition} node 
	 */
	getHCost(node)
	{
		if (!this.toWaypoint)
			return 0;
		if (node instanceof OSMNode)
			return Vec3.distance(this.toWaypoint.userData.node.getGeoPos().get3dCoordinates(), node.geoPos.get3dCoordinates());
		return Vec3.distance(this.toWaypoint.userData.node.getGeoPos().get3dCoordinates(), node.getGeoPos().get3dCoordinates());
	}
	async find()
	{
		while (!this.ready) await new Promise(r => setTimeout(r, 50));
		let loadingTimeBefore = this.data.osmRequest.totalLoadingTime;
		let startTime = performance.now();
		let waypoints = await this.astar.find();
		let endTime = performance.now();
		let loadingTimeAfter = this.data.osmRequest.totalLoadingTime;
		let loadingTime = loadingTimeAfter - loadingTimeBefore;
		let totalTime = endTime - startTime;
		console.log(`pathfinding finished:
	loading time: ${loadingTime}ms (${(loadingTime / totalTime * 100).toFixed(2)}%)
	other time: ${totalTime - loadingTime}ms (${((totalTime - loadingTime) / totalTime * 100).toFixed(2)}%)
	total time: ${totalTime}ms (${(totalTime / 1000 / 60).toFixed(2)}min)`);


		console.log("path: ", waypoints);
		if (!waypoints)
			return;
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