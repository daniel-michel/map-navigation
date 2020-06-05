/**
 * @typedef {{type: "way"|"node"|"relation", id: number}} OSMRawElement
 * @typedef {OSMRawElement & {type: "node", lat: number, lon: number, tags?: {}}} OSMNodeElement
 * @typedef {OSMRawElement & {type: "way", nodes: number[], tags?: {}}} OSMWayElement
 *
 *
 * Relations:
 * @typedef {{type: "way"|"node"|"relation", role?: string, ref: number}} OSMRelationMember
 * @typedef {OSMRawElement & {type: "relation", members: OSMRelationMember[], tags?: {}}} OSMRelationElement
 * Restrictions:
 * @typedef {OSMRelationMember & {role: "from"|"via"|"to"}} OSMRestrictionRelationMember
 * @typedef {OSMRelationElement & {members: OSMRestrictionRelationMember[], tags: {restriction: string, }}} OSMRestrictionRelationElement
 */