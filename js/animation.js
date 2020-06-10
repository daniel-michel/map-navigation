/**
 * @typedef {{}} AnimationState
 * @typedef {(t: number) => AnimationState} AnimationFunction
 * @typedef {{start: {state: AnimationState, time: number}, end: {state: AnimationState, time: number}, intType: *, timingFunction?: (t: number) => number, advancedTimingFunction?: AnimationFunction}} Animation
 */

function getAngleDiff(a, b)
{
	let diff = ((a - b) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
	if (diff > Math.PI)
		diff = diff - Math.PI * 2;
	return diff;
}
function interpolateAngle(a, b, t)
{
	return a + getAngleDiff(b, a) * t;
}
/**
 * 
 * @param {AnimationState|number} a 
 * @param {AnimationState|number} b 
 * @param {number} t 
 * @param {*} [intType]
 * @returns {AnimationState}
 */
function interpolateAnimationStates(a, b, t, intType)
{
	if (typeof a === "number")
	{
		if (!intType)
			return a * (1 - t) + b * t;
		else if (intType === "angle")
			return interpolateAngle(a, b, t);
		return undefined;
	}
	if (typeof a === "object")
	{
		let res = {};
		for (let prop in a)
		{
			if (b[prop] !== undefined)
			{
				let val = interpolateAnimationStates(a[prop], b[prop], t, intType?.[prop] ? intType[prop] : undefined);
				if (val !== undefined)
					res[prop] = val;
			}
		}
		return res;
	}
	return;
}
function getAnimationStateDiff(a, b, intType)
{
	if (typeof a === "number")
	{
		if (!intType)
			return a - b;
		else if (intType === "angle")
			return getAngleDiff(a, b);
		return undefined;
	}
	if (typeof a === "object")
	{
		let res = {};
		for (let prop in a)
		{
			if (b[prop] !== undefined)
			{
				let val = getAnimationStateDiff(a[prop], b[prop], intType?.[prop] ? intType[prop] : undefined);
				if (val !== undefined)
					res[prop] = val;
			}
		}
		return res;
	}
	return;
}
/**
 * 
 * @param {AnimationState} state 
 * @returns {AnimationState}
 */
function copyAnimationState(state)
{
	if (typeof state === "number")
	{
		return state;
	}
	if (typeof state === "object")
	{
		let res = {};
		for (let prop in state)
		{
			let val = copyAnimationState(state[prop]);
			if (val !== undefined)
				res[prop] = val;
		}
		return res;
	}
	return;
}
/**
 * 
 * @param {AnimationState} a 
 * @param {AnimationState} b 
 */
function onlyKeepOverlap(a, b)
{
	for (let prop in a)
	{
		if (b[prop] === undefined)
			delete a[prop];
		else if (typeof a[prop] === "object")
			onlyKeepOverlap(a[prop], b[prop]);
	}
	for (let prop in b)
	{
		if (a[prop] === undefined)
			delete b[prop];
	}
	return a;
}
function onlyKeepOverlapWith(a, b)
{
	for (let prop in a)
	{
		if (b[prop] === undefined)
			delete a[prop];
		else if (typeof a[prop] === "object")
			onlyKeepOverlapWith(a[prop], b[prop]);
	}
	return a;
}
/**
 * 
 * @param {AnimationState} from 
 * @param {AnimationState} remove 
 */
function removeOverlapWith(from, remove)
{
	for (let prop in remove)
	{
		if (from[prop] !== undefined)
		{
			if (typeof from[prop] === "object")
				removeOverlapWith(from[prop], remove[prop]);
			else
				delete from[prop];
		}
	}
}
function isStateEmpty(state)
{
	for (let prop in state)
	{
		if (typeof state[prop] === "object")
		{
			if (!isStateEmpty(state[prop]))
				return false;
		}
		else if (state[prop] !== undefined)
		{
			return false;
		}
	}
	return true;
}
/**
 * 
 * @param {AnimationState} target 
 * @param {AnimationState} source 
 * @returns {AnimationState}
 */
function assignToState(target, source)
{
	for (let prop in source)
	{
		if (target[prop] === undefined)
		{
			if (typeof source[prop] === "number")
				target[prop] = source[prop];
			else if (typeof source[prop] === "object")
				target[prop] = copyAnimationState(source[prop]);
		}
		else if (typeof target[prop] === "object")
			assignToState(target[prop], source[prop]);
		else if (typeof target[prop] === "number")
			target[prop] = source[prop];
	}
	return target;
}
/**
 * 
 * @param {AnimationState} a 
 * @param {AnimationState} b 
 * @param {AnimationState} diff 
 * @param {number} adaptFactor 
 * @param {number} t 
 * @param {*} intType 
 */
function interpolateWithStartRate(a, b, diff, adaptFactor, t, intType)
{
	if (typeof a === "number")
	{
		if (!intType)
		{
			return interpolateWithStartEndRate(a, b, diff * adaptFactor, 0, t);
		}
		else if (intType === "angle")
		{
			let angleDiff = getAngleDiff(a, b);
			let anglet = interpolateWithStartEndRate(0, 1, -(diff * adaptFactor) / angleDiff, 0, t);
			if (angleDiff === 0)
				anglet = 0;
			return interpolateAngle(a, b, anglet);
		}
		return undefined;
	}
	if (typeof a === "object")
	{
		let res = {};
		for (let prop in a)
		{
			if (b[prop] !== undefined && diff[prop] !== undefined)
			{
				let val = interpolateWithStartRate(a[prop], b[prop], diff[prop], adaptFactor, t, intType?.[prop] ? intType[prop] : undefined);
				if (val !== undefined)
					res[prop] = val;
			}
		}
		return res;
	}
	return;
}

/**
 * 
 * @param {number} startval 
 * @param {number} endval 
 * @param {number} startrate 
 * @param {number} endrate 
 * @param {number} t 
 */
function interpolateWithStartEndRate(startval, endval, startrate, endrate, t)
{
	return endval * (3 - 2 * t) * t * t + startval * (1 + t * t * (-3 + 2 * t)) + t * (startrate + t * (-2 * startrate - endrate + (startrate + endrate) * t));
	//(-2*b+c+2*a+d)*t^3+(3*b-2*c-3*a-d)*t^2+c*t+a
	//return (-2 * endval + startrate + 2 * startval + endrate) * t * t * t + (3 * endval - 2 * startrate - 3 * startval - endrate) * t * t + startrate * t + startval;
}

function getAnimationTime()
{
	return performance.now();
}



export default class Animator
{
	constructor(intTypes)
	{
		/**
		 * @type {{id: number, animation: Animation, callbacks: function[]}[]}
		 */
		this.animations = [];
		this.intTypes = intTypes;
		this.idCount = 0;
	}
	/**
	 * 
	 * @param {AnimationState} to 
	 */
	animateTo(from, to, duration)
	{
		/* let animation = createAnimationWithAdvancedTimingFunction(this, getAnimationTime(), to, duration, this.intTypes);
		this.addAnimation(animation); */
		let time = getAnimationTime();
		let h = 1;
		let at = assignToState(copyAnimationState(from), this.getCurrentState(time));
		let at_h = assignToState(copyAnimationState(from), this.getCurrentState(time + h));
		let stateChangeRate = getAnimationStateDiff(at_h, at);
		let adaptFactor = duration / h;
		let advancedTimingFunction = t =>
		{
			return interpolateWithStartRate(at, to, stateChangeRate, adaptFactor, t, this.intTypes)
		};
		let animation = {
			start: { state: at, time },
			end: { state: to, time: time + duration },
			advancedTimingFunction,
			intType: this.intTypes
		};
		return this.addAnimation(animation);
	}
	/**
	 * 
	 * @param {Animation} animation 
	 * @returns {number} id
	 */
	addAnimation(animation)
	{
		let id = this.idCount++;
		onlyKeepOverlap(animation.start.state, animation.end.state);
		this.animations.forEach(animObj => removeOverlapWith(animObj.animation.start.state, animation.start.state));
		let uneccessary = [];
		for (let animObj of this.animations)
			if (isStateEmpty(animObj.animation.start.state))
				uneccessary.push(animObj.id);
		uneccessary.forEach(id => this.cancelAnimation(id));
		this.animations.push({ animation, id, callbacks: [] });
		return id;
	}
	/**
	 * 
	 * @param {number} id 
	 */
	cancelAnimation(id)
	{
		let index = this.animations.findIndex(a => a.id === id);
		if (index >= 0)
		{
			let animation = this.animations[index];
			if (animation.callbacks)
			{
				for (let callback of animation.callbacks)
					callback();
			}
			this.animations.splice(index, 1);
			return true;
		}
		return false;
	}
	registerCallback(id, callback)
	{
		let animation = this.animations.find(a => a.id === id);
		if (animation)
		{
			animation.callbacks.push(callback);
			return true;
		}
		return false;
	}
	async waitForAnimation(id)
	{
		await new Promise(resolve =>
		{
			if (!this.registerCallback(id, resolve))
				resolve();
		});
	}
	/**
	 * @returns {AnimationState}
	 */
	getCurrentState(time = getAnimationTime())
	{
		let state = {};
		let cancelIDs = [];
		for (let animationObj of this.animations)
		{
			let animation = animationObj.animation;
			let t = (time - animation.start.time) / (animation.end.time - animation.start.time);
			if (t <= 0)
				continue;
			if (t < 1)
			{
				let modification;
				if (animation.advancedTimingFunction)
					modification = animation.advancedTimingFunction(t);
				else
				{
					if (animation.timingFunction)
						modification = interpolateAnimationStates(animation.start.state, animation.end.state, animation.timingFunction(t));
					else
						modification = interpolateAnimationStates(animation.start.state, animation.end.state, t);
				}
				assignToState(state, onlyKeepOverlapWith(modification, animation.start.state));
			}
			else
			{
				assignToState(state, onlyKeepOverlapWith(animation.end.state, animation.start.state));
				cancelIDs.push(animationObj.id);
			}
		}
		for (let id of cancelIDs)
			this.cancelAnimation(id);
		return state;
	}

	/**
	 * 
	 * @param {AnimationState} state 
	 */
	applyToState(state)
	{
		return assignToState(state, this.getCurrentState());
	}
}