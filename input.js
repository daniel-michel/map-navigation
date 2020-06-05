import Vec2 from "./math/vec2.js";


function copyObject(obj)
{
	if (obj instanceof Array)
	{
		let array = new Array(obj.length);
		for (let i = 0; i < obj.length; i++)
			array[i] = copyObject(obj[i]);
		return array;
	}
	else if (typeof obj === "object")
	{
		let new_obj = {};
		for (const name in obj)
			new_obj[name] = copyObject(obj[name]);
		return new_obj;
	}
	return obj;
}

export default class Input
{
	/**
	 * 
	 * @param {HTMLElement | Window} element 
	 */
	constructor(element, evnet_handler)
	{
		this.element = element;
		this.eventhandlers = [];
		this.eventhandlers.push(evnet_handler);

		/**
		 * @type {{current_pos: Vec2, last_pos: Vec2, start_pos: Vec2, id: number}[]}
		 */
		this.touches = [];
		this.threshold = 10;
		this.gesture = null;
		this.gesture_possible = true;
		this.setup_events();
	}
	setup_events()
	{
		let remove_touch = id =>
		{
			this.gesture_possible = false;
			let index = this.touches.findIndex(v => v.id === id);
			if (index >= 0)
				this.touches.splice(index, 1);
			if (this.touches.length === 0)
				this.gesture_possible = true;
		};
		let update_gesture = e =>
		{
			if (this.gesture)
			{
				if (this.gesture.touches.reduce((pv, cv) => pv && !!this.touches.find(v => v === cv), true))
				{
					let v = new Vec2();
					for (let i = 0; i < this.gesture.touches.length; i++)
						v.subtract(this.gesture.touches[i].start_pos).add(this.gesture.touches[i].current_pos);
					v.divide(this.gesture.touches.length);
					let mv = v;
					if (this.gesture.previous_movement)
						mv = new Vec2(mv).subtract(this.gesture.previous_movement);
					this.gesture.previous_movement = v;

					this.gesture.movement = mv;
					this.gesture.movement_from_start = v;

					if (this.gesture.n === 2)
					{
						let dist = new Vec2(this.gesture.touches[0].current_pos).subtract(this.gesture.touches[1].current_pos).length;
						let change_factor = 1;
						if (this.gesture.dist)
							change_factor = dist / this.gesture.dist;
						this.gesture.scale = change_factor;
						this.gesture.dist = dist;
					}

					let event = copyObject(this.gesture);
					Object.freeze(event);
					this.eventhandlers.forEach(handler => handler(event));
				}
				else
				{
					this.gesture = null;
				}
			}
		}
		this.element.addEventListener("touchstart",
			/**
			 * @param {TouchEvent} e
			 */
			e =>
			{
				e.preventDefault();
				let touches = e.changedTouches;
				console.log(touches);
				for (let i = 0; i < touches.length; i++)
				{
					let pos = new Vec2(touches[i].clientX, touches[i].clientY);
					let last_pos = new Vec2(pos);
					let touch = { current_pos: pos, last_pos, start_pos: pos, id: touches[i].identifier };
					this.touches.push(touch);
				}
			}
		);
		this.element.addEventListener("touchmove",
			/**
			 * @param {TouchEvent} e
			 */
			e =>
			{
				e.preventDefault();
				let start_gesture = false;
				let touches = e.changedTouches;
				for (let i = 0; i < touches.length; i++)
				{
					let pos = new Vec2(touches[i].clientX, touches[i].clientY);
					let touch = this.touches.find(v => v.id === touches[i].identifier);
					touch.last_pos = touch.current_pos;
					touch.current_pos = pos;
					if (new Vec2(touch.current_pos).subtract(touch.start_pos).length > this.threshold)
					{
						start_gesture = true;
					}
				}
				if (this.gesture_possible && !this.gesture && start_gesture)
				{
					let touches = this.touches.map(v => v);
					let n = touches.length;
					let gesture = { n, touches };
					if (n === 1)
						gesture.type = "move";
					else if (n === 2)
					{
						let va = new Vec2(this.touches[0].current_pos).subtract(this.touches[0].start_pos);
						let vb = new Vec2(this.touches[1].current_pos).subtract(this.touches[1].start_pos);
						let average_dist = (va.length + vb.length) / 2;
						let d = new Vec2(va).subtract(vb).length / average_dist;
						if (d > 1)
							gesture.type = "scale";
						else
							gesture.type = "move";
					}
					if (gesture.type)
						this.gesture = gesture;
				}
				update_gesture();
			}
		);
		this.element.addEventListener("touchend",
			/**
			 * @param {TouchEvent} e
			 */
			e =>
			{
				e.preventDefault();
				for (let touch of e.changedTouches)
					remove_touch(touch.identifier);
			}
		);
		this.element.addEventListener("touchcancel",
			/**
			 * @param {TouchEvent} e
			 */
			e =>
			{
				for (let touch of e.changedTouches)
					remove_touch(touch.identifier);
			}
		);
	}

	addListener(type, callback)
	{

	}
}
class UserInputEvent
{
	constructor()
	{

	}
}