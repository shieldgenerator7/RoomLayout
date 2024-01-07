"use strict";
//2023-12-28: copied from https://raw.githubusercontent.com/mrdoob/three.js/master/examples/jsm/controls/FirstPersonControls.js

const _lookDirection = new Vector3();
const _spherical = new Spherical();
// const _target = new Vector3();

class FirstPersonControls {

	constructor(camera, object, domElement) {

		this.camera = camera;
		this.object = object;
		this.domElement = domElement;

		this.save = {
			quaternion: this.camera.quaternion.clone(),
			position: this.object.position.clone(),
		};

		// API

		this.enabled = true;

		this.movementSpeed = 1.0;
		this.lookSpeed = 0.1;

		this.lookVertical = true;
		this.autoForward = false;

		this.activeLook = true;

		this.heightSpeed = false;
		this.heightCoef = 1.0;
		this.heightMin = 0.0;
		this.heightMax = 1.0;

		this.constrainVertical = false;
		this.verticalMin = 0;
		this.verticalMax = Math.PI;

		this.mouseDragOn = false;

		// internals

		this.autoSpeedFactor = 0.0;

		this.pointerX = 0;
		this.pointerY = 0;

		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;

		this.viewHalfX = 0;
		this.viewHalfY = 0;

		// private variables

		let lat = 0;
		let lon = 0;

		//

		this.handleResize = function () {

			if (this.domElement === document) {

				this.viewHalfX = window.innerWidth / 2;
				this.viewHalfY = window.innerHeight / 2;

			} else {

				this.viewHalfX = this.domElement.offsetWidth / 2;
				this.viewHalfY = this.domElement.offsetHeight / 2;

			}

		};

		this.onPointerDown = function (state, event) {

			if (this.domElement !== document) {

				this.domElement.focus();

			}

			if (this.activeLook) {

				switch (event.button) {

					case 0: this.moveForward = true; break;
					case 2: this.moveBackward = true; break;

				}

			}

			this.mouseDragOn = true;

		};

		this.onPointerUp = function (state, event) {

			if (this.activeLook) {

				switch (event.button) {

					case 0: this.moveForward = false; break;
					case 2: this.moveBackward = false; break;

				}

			}

			this.mouseDragOn = false;

		};

		this.onPointerMove = function (state, event) {
			if (!event) {
				event = {
					pageX: this.viewHalfX,
					pageY: this.viewHalfY,
				};
			}


			if (this.domElement === document) {

				this.pointerX = event.pageX - this.viewHalfX;
				this.pointerY = event.pageY - this.viewHalfY;

			} else {

				this.pointerX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
				this.pointerY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

			}

		};

		this.onKeyDown = function (state, event) {
			switch (event.code) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = true; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = true; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = true; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = true; break;

				case 'KeyR': this.moveUp = true; break;
				case 'KeyF': this.moveDown = true; break;

			}

		};

		this.onKeyUp = function (state, event) {

			switch (event.code) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = false; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = false; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = false; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = false; break;

				case 'KeyR': this.moveUp = false; break;
				case 'KeyF': this.moveDown = false; break;

			}

		};

		this.lookAt = function (x, y, z) {

			if (x.isVector3) {

				_target.copy(x);

			} else {

				_target.set(x, y, z);

			}

			this.camera.lookAt(_target);
			this.object.quaternion.copy(this.camera.quaternion);
			this.object.rotation.x = 0;
			this.object.rotation.z = 0;
			this.save.quaternion.copy(this.camera.quaternion);

			setOrientation(this);

			return this;

		};

		this.update = function () {

			const targetPosition = new Vector3();

			return function update(delta) {

				if (this.enabled === false) return;

				if (this.heightSpeed) {

					const y = MathUtils.clamp(this.object.position.y, this.heightMin, this.heightMax);
					const heightDelta = y - this.heightMin;

					this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);

				} else {

					this.autoSpeedFactor = 0.0;

				}

				const actualMoveSpeed = delta * this.movementSpeed;

				if (this.moveForward || (this.autoForward && !this.moveBackward)) this.object.translateZ(- (actualMoveSpeed + this.autoSpeedFactor));
				if (this.moveBackward) this.object.translateZ(actualMoveSpeed);

				if (this.moveLeft) this.object.translateX(- actualMoveSpeed);
				if (this.moveRight) this.object.translateX(actualMoveSpeed);

				if (this.moveUp) this.object.translateY(actualMoveSpeed);
				if (this.moveDown) this.object.translateY(- actualMoveSpeed);
				this.camera.position.copy(this.object.position);
				this.save.position.copy(this.object.position);

				let actualLookSpeed = delta * this.lookSpeed;

				if (!this.activeLook) {

					actualLookSpeed = 0;

				}

				let verticalLookRatio = 1;

				if (this.constrainVertical) {

					verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);

				}

				lon -= this.pointerX * actualLookSpeed;
				if (this.lookVertical) lat -= this.pointerY * actualLookSpeed * verticalLookRatio;

				lat = Math.max(- 85, Math.min(85, lat));

				let phi = MathUtils.degToRad(90 - lat);
				const theta = MathUtils.degToRad(lon);

				if (this.constrainVertical) {

					phi = MathUtils.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);

				}

				const position = this.camera.position;

				targetPosition.setFromSphericalCoords(1, phi, theta).add(position);

				this.camera.lookAt(targetPosition);
				this.object.quaternion.copy(this.camera.quaternion);
				this.object.rotation.x = 0;
				this.object.rotation.z = 0;
				this.save.quaternion.copy(this.camera.quaternion);

			};

		}();

		// this.dispose = function () {

		// 	this.domElement.removeEventListener( 'contextmenu', contextmenu );
		// 	this.domElement.removeEventListener( 'pointerdown', _onPointerDown );
		// 	this.domElement.removeEventListener( 'pointermove', _onPointerMove );
		// 	this.domElement.removeEventListener( 'pointerup', _onPointerUp );

		// 	window.removeEventListener( 'keydown', _onKeyDown );
		// 	window.removeEventListener( 'keyup', _onKeyUp );

		// };

		this._onPointerMove = this.onPointerMove.bind(this);
		this._onPointerDown = this.onPointerDown.bind(this);
		this._onPointerUp = this.onPointerUp.bind(this);
		this._onKeyDown = this.onKeyDown.bind(this);
		this._onKeyUp = this.onKeyUp.bind(this);

		this._update = this.update.bind(this);

		// this.domElement.addEventListener( 'contextmenu', contextmenu );
		// this.domElement.addEventListener( 'pointerdown', _onPointerDown );
		// this.domElement.addEventListener( 'pointermove', _onPointerMove );
		// this.domElement.addEventListener( 'pointerup', _onPointerUp );

		// window.addEventListener( 'keydown', _onKeyDown );
		// window.addEventListener( 'keyup', _onKeyUp );

		function setOrientation(controls) {

			const quaternion = controls.object.quaternion;

			_lookDirection.set(0, 0, - 1).applyQuaternion(quaternion);
			_spherical.setFromVector3(_lookDirection);

			lat = 90 - MathUtils.radToDeg(_spherical.phi);
			lon = MathUtils.radToDeg(_spherical.theta);

		}

		this.handleResize();

		setOrientation(this);

	}

}

function contextmenu(event) {

	event.preventDefault();

}