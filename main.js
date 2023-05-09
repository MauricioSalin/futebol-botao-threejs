Physijs.scripts.worker = "js/physijs_worker.js";
Physijs.scripts.ammo = "/js/ammo.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let initScene,
  initEventHandling,
  render,
  renderer,
  renderStats,
  scene,
  camera,
  blocks = [],
  intersectPlane,
  selectedPlayer = null,
  mousePosition = new THREE.Vector3(),
  playerOffset = new THREE.Vector3();

const fieldWidth = 60;
const fieldLength = 110;

const lineWidth = 1;
const lineHeigth = 0.05;

const goalWidth = 18;

const areaLength = fieldLength / 6;
const areaWidth = 38;

const rotationX = -Math.PI / 2;

const borderHeight = 2;
const borderWidth = 2;

//LOADER PARA TESTURA
const loader = new THREE.TextureLoader();

initScene = function () {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true;
  document.getElementById("viewport").appendChild(renderer.domElement);

  //CRIA A CENA
  scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });

  scene.setGravity(new THREE.Vector3(0, -350, 0));

  scene.addEventListener("update", function () {
    let i;
    let vector = new THREE.Vector3();

    if (selectedPlayer !== null) {
      vector
        .copy(mousePosition)
        .add(playerOffset)
        .sub(selectedPlayer.position)
        .multiplyScalar(2);
      vector.y = 0;
      selectedPlayer.setLinearVelocity(vector);

      vector.set(0, 0, 0);

      for (i = 0; i < blocks.length; i++) {
        blocks[i].applyCentralImpulse(vector);
      }
    }

    scene.simulate(undefined, 1);
    physicsStats.update();
  });

  //AJUSTES DE CAMERA
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  camera.position.set(0, 55, 60);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  scene.add(camera);

  // LUZ AMBIENTE
  const amLight = new THREE.AmbientLight(0x444444);
  scene.add(amLight);

  // LUZ DIRECIONAL
  let dirLight = new THREE.DirectionalLight(0xffffff);

  dirLight.position.set(15, 20, -5);

  dirLight.target.position.copy(scene.position);
  dirLight.castShadow = true;

  dirLight.shadowCameraLeft = -30;
  dirLight.shadowCameraTop = -30;
  dirLight.shadowCameraRight = 30;
  dirLight.shadowCameraBottom = 30;
  dirLight.shadowCameraNear = 20;
  dirLight.shadowCameraFar = 200;
  dirLight.shadowBias = -0.001;
  dirLight.shadowMapWidth = dirLight.shadowMapHeight = 2048;
  dirLight.shadowDarkness = 0.5;

  scene.add(dirLight);

  intersectPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshBasicMaterial({ opacity: 0, transparent: true })
  );
  intersectPlane.rotation.x = Math.PI / -2;
  scene.add(intersectPlane);

  createField(scene);
  createPlayers();
  initEventHandling();

  requestAnimationFrame(render);
  scene.simulate();
};

render = () => {
  requestAnimationFrame(render);

  renderer.render(scene, camera);
};

const createField = () => {
  // MATERIAIS
  const fieldMaterial = new THREE.MeshPhongMaterial({
    color: 0x7ec850,
    side: THREE.DoubleSide,
  });

  const defaultMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

  const borderMaterial = Physijs.createMaterial(
    new THREE.MeshLambertMaterial({ map: loader.load("images/wood.jpg") }),
    0.9,
    0.2
  );
  borderMaterial.map.wrapS = borderMaterial.map.wrapT = THREE.RepeatWrapping;
  borderMaterial.map.repeat.set(5, 5);

  // CAMPO
  let field = new Physijs.BoxMesh(
    new THREE.BoxGeometry(fieldLength + 10, 1, fieldWidth + 10),
    fieldMaterial,
    0,
    { restitution: 0.2, friction: 0.8 }
  );

  field.position.y = -0.5;

  field.receiveShadow = true;
  field.castShadow = true;

  scene.add(field);

  // BORDAS
  const createBorder = (x, y, z) =>
    new Physijs.BoxMesh(new THREE.BoxGeometry(x, y, z), borderMaterial, 0);

  let border1 = createBorder(borderWidth, borderHeight, fieldWidth + 10);

  border1.position.x = fieldLength / 2 + 6;
  border1.position.y = borderHeight / 4;

  border1.receiveShadow = true;
  border1.castShadow = true;

  scene.add(border1);

  let border2 = createBorder(borderWidth, borderHeight, fieldWidth + 10);

  border2.position.x = -fieldLength / 2 - 6;
  border2.position.y = borderHeight / 4;

  border2.receiveShadow = true;
  border2.castShadow = true;

  scene.add(border2);

  const border3 = createBorder(fieldLength + 14, borderHeight, borderWidth);

  border3.position.z = fieldWidth / 2 + 6;
  border3.position.y = borderHeight / 4;

  border3.receiveShadow = true;
  border3.castShadow = true;

  scene.add(border3);

  const border4 = createBorder(fieldLength + 14, borderHeight, borderWidth);

  border4.position.z = -fieldWidth / 2 - 6;
  border4.position.y = borderHeight / 4;

  border4.receiveShadow = true;
  border4.castShadow = true;

  scene.add(border4);

  // LINHAS DO CAMPO
  const createLine = (x, y, z) =>
    new THREE.Mesh(new THREE.BoxGeometry(x, y, z), defaultMaterial);

  const midFieldLine = createLine(lineWidth, lineHeigth, fieldWidth);

  midFieldLine.receiveShadow = true;
  midFieldLine.castShadow = true;
  scene.add(midFieldLine);

  const gk1FieldLine = createLine(lineWidth, lineHeigth, fieldWidth + 1);

  gk1FieldLine.position.x = fieldLength / 2;
  gk1FieldLine.position.y = lineHeigth;

  gk1FieldLine.receiveShadow = true;
  gk1FieldLine.castShadow = true;
  scene.add(gk1FieldLine);

  const gk2FieldLine = createLine(lineWidth, lineHeigth, fieldWidth + 1);

  gk2FieldLine.position.x = -fieldLength / 2;
  gk2FieldLine.position.y = lineHeigth;

  gk2FieldLine.receiveShadow = true;
  gk2FieldLine.castShadow = true;
  scene.add(gk2FieldLine);

  const side1FieldLine = createLine(fieldLength, lineHeigth, lineWidth);

  side1FieldLine.position.z = fieldWidth / 2;
  side1FieldLine.position.y = lineHeigth;

  side1FieldLine.receiveShadow = true;
  side1FieldLine.castShadow = true;
  scene.add(side1FieldLine);

  const side2FieldLine = createLine(fieldLength, lineHeigth, lineWidth);

  side2FieldLine.position.z = -fieldWidth / 2;
  side2FieldLine.position.y = lineHeigth;

  side2FieldLine.receiveShadow = true;
  side2FieldLine.castShadow = true;
  scene.add(side2FieldLine);

  // GOLEIRAS
  const createBeam = (x, y, z) =>
    new Physijs.CylinderMesh(
      new THREE.CylinderGeometry(x, y, z),
      defaultMaterial,
      0
    );

  let beam1 = createBeam(0.3, 0.3, 18.5);

  beam1.position.y = 7.8;
  beam1.position.x = -fieldLength / 2;
  beam1.rotation.x = rotationX;

  beam1.castShadow = true;
  beam1.receiveShadow = true;
  scene.add(beam1);

  let beam2 = createBeam(0.3, 0.3, 8);

  beam2.position.z = goalWidth / 2;
  beam2.position.y = 4;
  beam2.position.x = -fieldLength / 2;

  beam2.castShadow = true;
  beam2.receiveShadow = true;
  scene.add(beam2);

  let beam3 = createBeam(0.3, 0.3, 8);

  beam3.position.z = -goalWidth / 2;
  beam3.position.y = 4;
  beam3.position.x = -fieldLength / 2;

  beam3.castShadow = true;
  beam3.receiveShadow = true;
  scene.add(beam3);

  let beam4 = createBeam(0.3, 0.3, 18.5);

  beam4.position.y = 7.8;
  beam4.position.x = fieldLength / 2;
  beam4.rotation.x = rotationX;

  beam4.castShadow = true;
  beam4.receiveShadow = true;
  scene.add(beam4);

  let beam5 = createBeam(0.3, 0.3, 8);

  beam5.position.z = goalWidth / 2;
  beam5.position.y = 4;
  beam5.position.x = fieldLength / 2;

  beam5.castShadow = true;
  beam5.receiveShadow = true;
  scene.add(beam5);

  let beam6 = createBeam(0.3, 0.3, 8);

  beam6.position.z = -goalWidth / 2;
  beam6.position.y = 4;
  beam6.position.x = fieldLength / 2;

  beam6.castShadow = true;
  beam6.receiveShadow = true;
  scene.add(beam6);

  // CIRCULO CENTRAL
  const centralRing = new THREE.Mesh(
    new THREE.RingGeometry(10, 11, 30),
    new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );

  centralRing.position.y = lineHeigth;
  centralRing.rotation.x = rotationX;

  centralRing.castShadow = true;
  centralRing.receiveShadow = true;
  scene.add(centralRing);

  const centralCircle = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 32),
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );

  centralCircle.position.y = lineHeigth;
  centralCircle.rotation.x = rotationX;

  centralCircle.castShadow = true;
  centralCircle.receiveShadow = true;
  scene.add(centralCircle);

  //CRIAÇÃO DAS AREAS
  const createArea = (x, y, z) =>
    new THREE.Mesh(
      new THREE.BoxGeometry(x, y, z),
      new THREE.MeshPhongMaterial({ color: 0xffffff })
    );

  //AREA DIREITA
  const rightAreaCenterLine = createArea(lineWidth, areaWidth, lineHeigth);

  rightAreaCenterLine.position.y = lineHeigth;
  rightAreaCenterLine.rotation.x = rotationX;
  rightAreaCenterLine.position.x = -(fieldLength / 2 - areaLength);

  rightAreaCenterLine.castShadow = true;
  rightAreaCenterLine.receiveShadow = true;
  scene.add(rightAreaCenterLine);

  const rightAreaSupLine = createArea(areaLength, lineWidth, lineHeigth);

  rightAreaSupLine.position.y = lineHeigth;
  rightAreaSupLine.rotation.x = rotationX;
  rightAreaSupLine.position.x = -(fieldLength / 2 - areaLength / 2);
  rightAreaSupLine.position.z = -(areaWidth / 2) + 0.5;

  rightAreaSupLine.castShadow = true;
  rightAreaSupLine.receiveShadow = true;
  scene.add(rightAreaSupLine);

  const rightAreaInfLine = createArea(areaLength, lineWidth, lineHeigth);

  rightAreaInfLine.position.y = lineHeigth;
  rightAreaInfLine.rotation.x = rotationX;
  rightAreaInfLine.position.x = -(fieldLength / 2 - areaLength / 2);
  rightAreaInfLine.position.z = areaWidth / 2 - 0.5;

  rightAreaInfLine.castShadow = true;
  rightAreaInfLine.receiveShadow = true;
  scene.add(rightAreaInfLine);

  //AREA ESQUERDA
  const leftAreaCenterLine = createArea(lineWidth, areaWidth, lineHeigth);

  leftAreaCenterLine.position.y = lineHeigth;
  leftAreaCenterLine.rotation.x = rotationX;
  leftAreaCenterLine.position.x = fieldLength / 2 - areaLength;

  leftAreaCenterLine.castShadow = true;
  leftAreaCenterLine.receiveShadow = true;
  scene.add(leftAreaCenterLine);

  const leftAreaSupLine = createArea(areaLength, lineWidth, lineHeigth);

  leftAreaSupLine.position.y = lineHeigth;
  leftAreaSupLine.rotation.x = rotationX;
  leftAreaSupLine.position.x = fieldLength / 2 - areaLength / 2;
  leftAreaSupLine.position.z = -(areaWidth / 2) + 0.5;

  leftAreaSupLine.castShadow = true;
  leftAreaSupLine.receiveShadow = true;
  scene.add(leftAreaSupLine);

  const leftAreaInfLine = createArea(areaLength, lineWidth, lineHeigth);

  leftAreaInfLine.position.y = lineHeigth;
  leftAreaInfLine.rotation.x = rotationX;
  leftAreaInfLine.position.x = fieldLength / 2 - areaLength / 2;
  leftAreaInfLine.position.z = areaWidth / 2 - 0.5;

  leftAreaInfLine.castShadow = true;
  leftAreaInfLine.receiveShadow = true;
  scene.add(leftAreaInfLine);
};

const createPlayers = (() => {
  const friction = 0.8;
  const ballSize = 1.5;
  const playerSize = 4;
  const gkSize = 5;
  const height = 1;

  const playerMaterial = (color) =>
    Physijs.createMaterial(
      new THREE.MeshPhongMaterial({ color }),
      friction,
      friction
    );

  const generatePlayer = (color, size) =>
    new Physijs.CylinderMesh(
      new THREE.CylinderGeometry(size, size, height, 32),
      playerMaterial(color)
    );

  const generateGk = (color, size) =>
    new Physijs.BoxMesh(
      new THREE.BoxGeometry(height, size, size * 1.5),
      playerMaterial(color),
      0 //mass
    );

  return () => {
    const team1Color = 0xde1f1f;
    const team2Color = 0x2775fe;

    const player1 = generatePlayer(team1Color, playerSize);
    const player2 = generatePlayer(team1Color, playerSize);
    const player3 = generatePlayer(team1Color, playerSize);

    const player4 = generatePlayer(team2Color, playerSize);
    const player5 = generatePlayer(team2Color, playerSize);
    const player6 = generatePlayer(team2Color, playerSize);

    const gk1 = generateGk(team2Color, gkSize);
    const gk2 = generateGk(team1Color, gkSize);

    const ball = new Physijs.CylinderMesh(
      new THREE.CylinderGeometry(ballSize, ballSize, height, 32),
      playerMaterial(0x4a4949),
      1
    );

    gk1.receiveShadow = true;
    gk1.castShadow = true;

    gk2.receiveShadow = true;
    gk2.castShadow = true;

    player1.receiveShadow = true;
    player1.castShadow = true;

    player2.receiveShadow = true;
    player2.castShadow = true;

    player3.receiveShadow = true;
    player3.castShadow = true;

    player4.receiveShadow = true;
    player4.castShadow = true;

    player5.receiveShadow = true;
    player5.castShadow = true;

    player6.receiveShadow = true;
    player6.castShadow = true;

    ball.receiveShadow = true;
    ball.castShadow = true;

    player1.position.x = -30;
    player1.position.y = height;
    player1.translateZ(-18);

    player2.position.x = -20;
    player2.position.y = height;

    player3.position.x = -30;
    player3.position.y = height;
    player3.translateZ(18);

    player4.position.x = 30;
    player4.position.y = height;
    player4.translateZ(-18);

    player5.position.x = 20;
    player5.position.y = height;

    player6.position.x = 30;
    player6.position.y = height;
    player6.translateZ(18);

    gk1.position.z = 0;
    gk1.position.y = height * 1.5;
    gk1.position.x = fieldLength / 2 - 2;

    gk2.position.z = 0;
    gk2.position.y = height * 1.5;
    gk2.position.x = -fieldLength / 2 + 2;

    scene.add(gk1);
    scene.add(gk2);
    scene.add(player1);
    scene.add(player2);
    scene.add(player3);
    scene.add(player4);
    scene.add(player5);
    scene.add(player6);

    scene.add(ball);

    blocks.push(gk1);
    blocks.push(gk2);
    blocks.push(player1);
    blocks.push(player2);
    blocks.push(player3);
    blocks.push(player4);
    blocks.push(player5);
    blocks.push(player6);
  };
})();

initEventHandling = (function () {
  let collisionVector = new THREE.Vector3();

  const handleMouseDown = function (evt) {
    collisionVector.set(
      (evt.clientX / window.innerWidth) * 2 - 1,
      -(evt.clientY / window.innerHeight) * 2 + 1,
      1
    );

    collisionVector.unproject(camera);

    let ray = new THREE.Raycaster(
      camera.position,
      collisionVector.sub(camera.position).normalize()
    );

    let intersections = ray.intersectObjects(blocks);

    if (intersections.length > 0) {
      selectedPlayer = intersections[0].object;

      collisionVector.set(0, 0, 0);
      selectedPlayer.setAngularFactor(collisionVector);
      selectedPlayer.setAngularVelocity(collisionVector);
      selectedPlayer.setLinearFactor(collisionVector);
      selectedPlayer.setLinearVelocity(collisionVector);

      mousePosition.copy(intersections[0].point);
      playerOffset.subVectors(selectedPlayer.position, mousePosition);

      intersectPlane.position.y = mousePosition.y;
    }
  };

  const handleMouseMove = function (evt) {
    if (selectedPlayer !== null) {
      collisionVector.set(
        (evt.clientX / window.innerWidth) * 2 - 1,
        -(evt.clientY / window.innerHeight) * 2 + 1,
        1
      );
      collisionVector.unproject(camera);

      const ray = new THREE.Raycaster(
        camera.position,
        collisionVector.sub(camera.position).normalize()
      );

      const intersection = ray.intersectObject(intersectPlane);
      mousePosition.copy(intersection[0].point);
    }
  };

  const handleMouseUp = function () {
    if (selectedPlayer !== null) {
      collisionVector.set(1, 1, 1);
      selectedPlayer.setAngularFactor(collisionVector);
      selectedPlayer.setLinearFactor(collisionVector);

      selectedPlayer = null;
    }
  };

  return function () {
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.rotateSpeed = 3;
    controls.mouseButtons = { LEFT: -1, MIDDLE: -1, RIGHT: -1 };
    controls.listenToKeyEvents(window);

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);
  };
})();

window.onload = initScene;
