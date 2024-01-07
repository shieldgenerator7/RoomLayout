"use strict";

let body = $("body");
let flm = new FileManager(body);
flm.onImageUploaded.add((image) => console.log("image uploaded!", image.name));

var loader = new FileLoader();
var player = new APP.Player();

//Load empty scene
loader.load('app.json', function (text) {

    player.load(JSON.parse(text));
    player.setSize(window.innerWidth, window.innerHeight);
    player.play();
    window.player = player;
    document.body.appendChild(player.dom);
    player.dom.firstChild.id = "cvsDisplay";

    window.addEventListener('resize', function () {

        player.setSize(window.innerWidth, window.innerHeight);

    });

    //Load starter scene
    loader.load('scene.json', function (text) {
        var objloader = new ObjectLoader();
        player.setScene(objloader.parse(JSON.parse(text)));

        //Input init
        var input = new Input();
        window.input = input;
        window.onkeydown = input.processKeyDown.bind(input);
        window.onkeyup = input.processKeyUp.bind(input);
        window.onmousedown = input.processMouseDown.bind(input);
        window.onmousemove = input.processMouseMove.bind(input);
        window.onmouseup = input.processMouseUp.bind(input);

        //Controller init
        var controllerEdit = new Controller(player.camera, player.scene);
        window.controllerEdit = controllerEdit;
        var object = player.scene.children[0];
        var controllerFPS = new FirstPersonControls(player.camera, object, player.dom);
        window.controllerFPS = controllerFPS;

        //
        window.looping = false;
        var loop;
        var lastTime = 0;
        loop = (now) => {
            if (!looping) { return; }

            if (!(lastTime > 0)) {
                lastTime = now;
            }
            if (!(now > 0)) {
                now = lastTime;
            }
            var delta = now - lastTime;
            if (!(delta > 0)) {
                delta = 0;
            }
            delta /= 1000;
            controllerFPS.update(delta);

            window.requestAnimationFrame(loop);

            lastTime = now;
        }
        window.loop = loop;

        let simulate = (on) => {
            if (on) {
                if (!window.looping) {
                    lastTime = 0;
                    window.looping = true;
                    loop();
                }
            }
            else {
                window.looping = false;
            }
        };

        let switchMode;

        let registerKeyBindings = (edit, play) => {
            input.clearAllDelegates();

            if (edit) {
                input.key.down.add(controllerEdit.processInput.bind(controllerEdit));
                input.mouse.down.add(controllerEdit.processMouseDown.bind(controllerEdit));
                input.mouse.move.add(controllerEdit.processMouseMove.bind(controllerEdit));
                input.mouse.up.add(controllerEdit.processMouseUp.bind(controllerEdit));

                window.controller = controllerEdit;
            }
            if (play) {
                input.key.down.add(controllerFPS._onKeyDown);
                input.key.up.add(controllerFPS._onKeyUp);
                input.mouse.down.add(controllerFPS._onPointerDown);
                input.mouse.move.add(controllerFPS._onPointerMove);
                input.mouse.up.add(controllerFPS._onPointerUp);

                window.controller = controllerFPS;
            }

            input.key.down.add((s, e) => {
                switch (e.keyCode) {
                    //esc
                    case 27: switchMode(true); break;
                    //enter
                    case 13: switchMode(false); break;
                    //tab
                    case 9:
                        switchMode(!inEditMode);
                        e.preventDefault();
                        break;
                    //space
                    case 32:
                        switchMode(!inEditMode);
                        e.preventDefault();
                        break;

                }
            });
            // input.mouse.move.add((s,e)=>{
            //     if (s.mouse.lmbDown){
            //         console.log("mouseevent", e);
            //     }
            // })
        };

        let inEditMode = true;
        switchMode = (editMode = !inEditMode) => {
            inEditMode = editMode;
            window.controller = (editMode)
                ? controllerEdit
                : controllerFPS;
            registerKeyBindings(editMode, !editMode);
            simulate(!editMode);
            player.camera.quaternion.copy(window.controller.save.quaternion);
            player.camera.position.copy(window.controller.save.position);
            if (!editMode) {
                controllerFPS._onPointerMove();
            }
        };
        window.switchMode = switchMode;

        switchMode(true);

        //Upload image to new box
        const materialImage = player.scene.children[2].material;

        flm.onImageUploaded.add((image) => {
            let newbox = new Mesh(
                new BoxGeometry(),
                materialImage.clone()
            );
            newbox.userData ??= {};
            newbox.userData.selectable = true;
            player.scene.add(newbox);
            new TextureLoader().load(
                image.imageURL,
                (texture) => {
                    newbox.material.aoMap = texture;
                    newbox.material.lightMap = texture;
                    newbox.material.map = texture;
                    newbox.material.needsUpdate = true;
                }
            );
        });

    });
});