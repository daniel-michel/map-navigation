export default class Loop
{
	/**
	 * 
	 * @param {number} timeout 
	 * @param {function(number, number):void} callback 
	 */
	constructor(timeout = 0, callback)
	{
		this.timeout = timeout;
		this.looping = false;
		this.actually_looping = false;
		this.callback = callback;
		this.time = 0;
		this.lasttime = -1;
	}

	start()
	{
		if (this.looping)
			return this;
		this.looping = true;
		if (!this.actually_looping)
			this.loop();
		this.actually_looping = true;
		return this;
	}
	stop()
	{
		this.looping = false;
		this.lasttime = -1;
		return this;
	}

	async loop()
	{
		if (!this.looping)
		{
			this.actually_looping = false;
			return;
		}
		let time = performance.now();
		let deltatime = this.lasttime < 0 ? 1 : time - this.lasttime;
		deltatime /= 1000;
		this.time += deltatime;
		await this.callback(deltatime, this.time);
		this.lasttime = time;
		if (this.timeout > 0)
			window.setTimeout(() => this.loop(), this.timeout);
		else
			window.requestAnimationFrame(() => this.loop());
	}
}