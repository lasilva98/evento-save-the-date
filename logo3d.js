/* =========================================================
   Logo 8CX em 3D (Three.js)
   Extruda o SVG do logo com chanfro e material com verniz,
   gira suavemente e responde ao mouse/toque e ao scroll.
   ========================================================= */
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const wrap = document.getElementById("logo3d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

if (wrap) {
  if (supportsWebGL()) {
    try { init(); } catch { wrap.classList.add("no-3d"); }
  } else wrap.classList.add("no-3d");
}

function init() {
  const isMobile = matchMedia("(max-width: 860px)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  // alta resolução: até 2.5x em telas retina (2x no celular, por desempenho)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 2.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // luzes de recorte para destacar o chanfro
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb48a, 2.2); rim.position.set(-6, -2, -4); scene.add(rim);
  const fill = new THREE.PointLight(0xe25e30, 30, 30); fill.position.set(0, -3, 5); scene.add(fill);

  const pivot = new THREE.Group();
  scene.add(pivot);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xe25e30,
    metalness: 0.25,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xffc2a3),
  });

  let mesh = null;
  new SVGLoader().load("assets/logos/8cx.svg", (data) => {
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 220, bevelEnabled: true, bevelThickness: 46, bevelSize: 30, bevelSegments: 12, curveSegments: 32,
    });
    // SVG tem o eixo Y para baixo: espelha e corrige a ordem dos vértices
    geo.scale(1, -1, 1);
    flipWinding(geo);
    geo.computeBoundingBox();
    geo.center();
    const size = new THREE.Vector3(); geo.boundingBox.getSize(size);
    const s = 10 / size.x;
    geo.scale(s, s, s);

    mesh = new THREE.Mesh(geo, material);
    pivot.add(mesh);
    fit();
    // compila os shaders e desenha o primeiro quadro antes de mostrar,
    // para não haver travada nem piscada no celular
    applyPose(0, 0);
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    setTimeout(() => {
      wrap.classList.add("is-3d");
      intro.start = performance.now();
    }, 30);
  }, undefined, () => wrap.classList.add("no-3d"));

  function flipWinding(geo) {
    const attrs = Object.values(geo.attributes);
    const n = geo.attributes.position.count;
    for (let i = 0; i < n; i += 3) {
      attrs.forEach((a) => {
        const sz = a.itemSize;
        for (let k = 0; k < sz; k++) {
          const i1 = (i + 1) * sz + k, i2 = (i + 2) * sz + k;
          const t = a.array[i1]; a.array[i1] = a.array[i2]; a.array[i2] = t;
        }
      });
    }
    attrs.forEach((a) => (a.needsUpdate = true));
  }

  // enquadra o logo conforme o tamanho do container
  function fit() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // largura do logo = 10 unidades; deixa ~12% de respiro
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distW = (10 * 1.24) / 2 / Math.tan(fov / 2) / camera.aspect;
    const distH = (4.4 * 1.5) / 2 / Math.tan(fov / 2);
    camera.position.z = Math.max(distW, distH);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(fit).observe(wrap);
  fit();

  // interação: mouse no desktop, arrastar no celular
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let drag = null, dragY = 0;
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") {
      target.x = (e.clientX / innerWidth - 0.5) * 2;
      target.y = (e.clientY / innerHeight - 0.5) * 2;
    } else if (drag !== null) {
      dragY += (e.clientX - drag) * 0.012; drag = e.clientX;
    }
  }, { passive: true });
  wrap.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") drag = e.clientX; });
  addEventListener("pointerup", () => (drag = null));
  addEventListener("pointercancel", () => (drag = null));

  // entrada: o logo gira e cresce até a posição final
  const intro = { start: 0, dur: 2200 };
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  // pausa quando o hero sai da tela
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(wrap);

  function applyPose(t, k) {
    const sway = reduce ? 0 : Math.sin(t * 0.55) * 0.32;
    const scroll = Math.min(1, scrollY / innerHeight);
    pivot.rotation.y = (1 - k) * -Math.PI * 1.4 + sway + cur.x * 0.45 + dragY + scroll * 0.9;
    pivot.rotation.x = (1 - k) * 0.5 + (reduce ? 0 : Math.sin(t * 0.4) * 0.06) + cur.y * 0.25 - scroll * 0.25;
    pivot.position.y = (reduce ? 0 : Math.sin(t * 0.9) * 0.12) + scroll * 1.2;
    pivot.scale.setScalar(0.55 + 0.45 * k);
  }

  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    if (!visible || !mesh) return;
    const t = clock.getElapsedTime();
    const k = intro.start ? easeOut(Math.min(1, (performance.now() - intro.start) / intro.dur)) : 0;

    cur.x += (target.x - cur.x) * 0.06;
    cur.y += (target.y - cur.y) * 0.06;
    dragY *= 0.96;

    applyPose(t, k);
    renderer.render(scene, camera);
  }
  loop();
}
