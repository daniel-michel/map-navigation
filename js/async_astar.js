import SortedArray from "./sorted_array.js";
import OSMNode from "./osm/node.js";


/**
 * @template UserWaypointDataType
 * @template UserConnectionDataType
 * @typedef {{waypoint: AStarWaypoint<UserWaypointDataType, UserConnectionDataType>, cost: number, userData: UserConnectionDataType}} AStarConnection
 */
/**
 * @template UserWaypointDataType
 * @template UserConnectionDataType
 * @typedef {object} AStarWaypoint
 * @property {() => Promise<AStarConnection<UserWaypointDataType, UserConnectionDataType>[]>} getNeighbors
 * @property {{connection: AStarConnection<UserWaypointDataType, UserConnectionDataType>, previous: AStarWaypoint<UserWaypointDataType, UserConnectionDataType>}} previous
 * @property {number} hcost heuristic cost from the waypoint to the goal
 * @property {number} [gcost] the cost from the start to this waypoint
 * @property {number} [fcost] gcost + hcost
 * @property {boolean} [inClosedList] 
 * @property {UserWaypointDataType} userData
 */

/**
 * @template UserWaypointDataType
 * @template UserConnectionDataType
 */
export default class AStar
{
	/**
	 * @typedef {AStarWaypoint<UserWaypointDataType, UserConnectionDataType>} Waypoint
	 * @typedef {AStarConnection<UserWaypointDataType, UserConnectionDataType>} Connection
	 */
	/**
	 * 
	 * @param {Waypoint} from 
	 * @param {Waypoint} to 
	 */
	constructor(from, to)
	{
		/**
		 * @private
		 * @type {SortedArray<Waypoint>}
		 */
		this.openList = new SortedArray(elem => elem.fcost);
		this.from = from;
		this.to = to;
		this.accuracy = 0.4;
	}
	/**
	 * 
	 * @returns {Promise<{ waypoint: Waypoint, connection: Connection}[]>}
	 */
	async find()
	{
		this.from.gcost = 0;
		this.from.fcost = this.from.gcost + this.from.hcost;
		this.openList.add(this.from);
		while (true)
		{
			let waypoint = this.openList.shift();
			if (!waypoint)
				return undefined;
			waypoint.inClosedList = true;
			if (waypoint === this.to)
			{
				let path = [];
				let current = waypoint;
				while (current)
				{
					path.push({ waypoint: current, connection: current.previous?.connection });
					current = current.previous?.previous;
				}
				return path.reverse();
			}
			let connections = await waypoint.getNeighbors();
			for (let connection of connections)
			{
				let gcost = waypoint.gcost + connection.cost * this.accuracy;
				let fcost = gcost + connection.waypoint.hcost;
				let allreadyInList = !isNaN(connection.waypoint.gcost);
				if (connection.waypoint.inClosedList || (allreadyInList && connection.waypoint.fcost <= fcost))
					continue;
				if (allreadyInList)
					this.openList.remove(connection.waypoint.fcost);
				connection.waypoint.gcost = gcost;
				connection.waypoint.fcost = fcost;
				connection.waypoint.previous = { connection: connection, previous: waypoint };
				this.openList.add(connection.waypoint);
			}
		}
	}
}