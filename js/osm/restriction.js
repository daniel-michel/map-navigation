import OSMRelation from "./relation.js";
import OSMData from "./data.js";
import OSMElement from "./osm_element.js";


export default class OSMRestrictionRelation extends OSMRelation
{
	/**
	 * 
	 * @param {OSMRestrictionRelationElement} relation 
	 * @param {OSMData} data 
	 */
	constructor(relation, data)
	{
		super(relation, data);
	}

	/**
	 * 
	 * @returns {{from?: OSMElement, via?: OSMElement, to?: OSMElement}}
	 */
	getMembers()
	{
		let roles = ["from", "via", "to"];
		let obj = {};
		for (const role of roles)
		{
			let mem = this.element.members.find(member => member.role === role);
			if (mem?.ref)
				obj[role] = mem.type === "node" ? this.data.nodes.get(mem.ref) : this.data.ways.get(mem.ref);
		}
		return obj;
	}
	/**
	 * 
	 * @param {OSMElement} from 
	 * @param {OSMElement} via 
	 * @param {OSMElement} to 
	 */
	forbids(from, via, to)
	{
		let memebers = this.getMembers();
		if (from !== memebers.from || via !== memebers.via)
			return false;
		return (memebers.to === to) !== /only/.test(this.element.tags.restriction);
	}
}