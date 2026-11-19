/**
 * NutriScan – Three.js 3D Animated Background
 * Floating geometric meshes with glass/wireframe materials,
 * mouse-parallax, and smooth continuous animation loop.
 */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  /* ─── Canvas Setup ─────────────────────────────────────── */
  const canvas = document.getElementById('bg3d');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // transparent – CSS body bg shows through

  // Force pointer-events off — Three.js setSize() writes inline styles that
  // can override the CSS rule, making the canvas swallow all clicks.
  canvas.style.pointerEvents = 'none';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '0';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 28);

  /* ─── Lights ───────────────────────────────────────────── */
  const ambientLight = new THREE.AmbientLight(0xc4b5fd, 0.4);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xa78bfa, 2, 60);
  pointLight1.position.set(-15, 15, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x818cf8, 1.5, 50);
  pointLight2.position.set(15, -10, 8);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0xec4899, 1, 40);
  pointLight3.position.set(0, -20, 5);
  scene.add(pointLight3);

  /* ─── Materials ────────────────────────────────────────── */
  const glassMat = new THREE.MeshPhongMaterial({
    color: 0xa78bfa,
    emissive: 0x3b1f8c,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.18,
    shininess: 200,
    specular: 0xffffff,
    side: THREE.DoubleSide,
    wireframe: false,
  });

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xc4b5fd,
    transparent: true,
    opacity: 0.12,
    wireframe: true,
  });

  const wireMat2 = new THREE.MeshBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.1,
    wireframe: true,
  });

  const solidMat = new THREE.MeshPhongMaterial({
    color: 0x7c3aed,
    emissive: 0x4c1d95,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.22,
    shininess: 300,
    specular: 0xddd6fe,
  });

  const torusMat = new THREE.MeshPhongMaterial({
    color: 0xc4b5fd,
    emissive: 0x6d28d9,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.2,
    shininess: 180,
    specular: 0xffffff,
    side: THREE.DoubleSide,
  });

  /* ─── Geometry Factory ─────────────────────────────────── */
  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function spreadPosition(radius) {
    return new THREE.Vector3(
      randBetween(-radius, radius),
      randBetween(-radius * 0.8, radius * 0.8),
      randBetween(-radius * 0.4, radius * 0.1)
    );
  }

  const meshes = [];

  /* Large background wireframe sphere */
  {
    const geo = new THREE.IcosahedronGeometry(18, 2);
    const m = new THREE.Mesh(geo, wireMat2);
    m.position.set(0, 0, -20);
    m.userData = { rx: 0.0006, ry: 0.0004, rz: 0.0002, floatSpeed: 0, floatAmp: 0 };
    scene.add(m);
    meshes.push(m);
  }

  /* Floating icosahedra (solid glass look) */
  const icoConfigs = [
    { size: 3.2, mat: solidMat, pos: [-12, 7, -5] },
    { size: 2.4, mat: glassMat, pos: [11, -6, -3] },
    { size: 1.8, mat: solidMat, pos: [6, 10, -8] },
    { size: 2.8, mat: glassMat, pos: [-8, -9, -6] },
    { size: 1.5, mat: solidMat, pos: [0, -12, -4] },
    { size: 1.2, mat: glassMat, pos: [14, 4, -7] },
    { size: 2.0, mat: solidMat, pos: [-5, 12, -10] },
  ];

  icoConfigs.forEach(({ size, mat, pos }) => {
    const geo = new THREE.IcosahedronGeometry(size, 0);
    const m = new THREE.Mesh(geo, mat.clone());

    // Wire overlay
    const wm = new THREE.Mesh(geo, wireMat.clone());
    m.add(wm);

    m.position.set(...pos);
    m.userData = {
      rx: randBetween(0.001, 0.003) * (Math.random() > 0.5 ? 1 : -1),
      ry: randBetween(0.001, 0.003) * (Math.random() > 0.5 ? 1 : -1),
      rz: randBetween(0.0005, 0.001),
      floatSpeed: randBetween(0.4, 1.2),
      floatAmp: randBetween(0.3, 0.8),
      originY: pos[1],
      phase: Math.random() * Math.PI * 2,
    };
    scene.add(m);
    meshes.push(m);
  });

  /* Floating torus rings */
  const torusConfigs = [
    { R: 3.5, r: 0.25, pos: [10, 8, -6] },
    { R: 2.8, r: 0.2,  pos: [-11, -4, -4] },
    { R: 5.0, r: 0.3,  pos: [0, 0, -15] },
    { R: 2.0, r: 0.15, pos: [-4, 8, -2] },
    { R: 1.5, r: 0.12, pos: [8, -10, -3] },
  ];

  torusConfigs.forEach(({ R, r, pos }) => {
    const geo = new THREE.TorusGeometry(R, r, 16, 80);
    const m = new THREE.Mesh(geo, torusMat.clone());
    m.position.set(...pos);
    m.rotation.set(
      randBetween(0, Math.PI),
      randBetween(0, Math.PI),
      randBetween(0, Math.PI)
    );
    m.userData = {
      rx: randBetween(0.002, 0.006) * (Math.random() > 0.5 ? 1 : -1),
      ry: randBetween(0.003, 0.007) * (Math.random() > 0.5 ? 1 : -1),
      rz: randBetween(0.001, 0.003),
      floatSpeed: randBetween(0.5, 1.0),
      floatAmp: randBetween(0.2, 0.6),
      originY: pos[1],
      phase: Math.random() * Math.PI * 2,
    };
    scene.add(m);
    meshes.push(m);
  });

  /* Small floating octahedra for sparkle */
  for (let i = 0; i < 10; i++) {
    const size = randBetween(0.3, 0.8);
    const geo = new THREE.OctahedronGeometry(size, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xddd6fe,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: randBetween(0.15, 0.3),
      shininess: 400,
    });
    const m = new THREE.Mesh(geo, mat);
    const pos = spreadPosition(18);
    pos.z = randBetween(-10, 2);
    m.position.copy(pos);
    m.userData = {
      rx: randBetween(0.005, 0.015) * (Math.random() > 0.5 ? 1 : -1),
      ry: randBetween(0.005, 0.015) * (Math.random() > 0.5 ? 1 : -1),
      rz: randBetween(0.002, 0.008),
      floatSpeed: randBetween(0.8, 2.0),
      floatAmp: randBetween(0.5, 1.2),
      originY: pos.y,
      phase: Math.random() * Math.PI * 2,
    };
    scene.add(m);
    meshes.push(m);
  }

  /* Particle field */
  {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = randBetween(-30, 30);
      positions[i * 3 + 1] = randBetween(-20, 20);
      positions[i * 3 + 2] = randBetween(-25, 5);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xc4b5fd,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geo, mat);
    particles.userData = { ry: 0.0003 };
    scene.add(particles);
    meshes.push(particles);
  }

  /* ─── Mouse Parallax ───────────────────────────────────── */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  document.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * -2;
  });

  /* ─── Animation Loop ───────────────────────────────────── */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse follow
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    // Move camera slightly with mouse
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 1.0 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Animate lights
    pointLight1.position.x = Math.sin(t * 0.3) * 18;
    pointLight1.position.y = Math.cos(t * 0.2) * 12;
    pointLight2.position.x = Math.cos(t * 0.25) * 16;
    pointLight2.position.y = Math.sin(t * 0.35) * 10;

    // Animate each mesh
    meshes.forEach((m) => {
      const d = m.userData;
      if (d.rx) m.rotation.x += d.rx;
      if (d.ry) m.rotation.y += d.ry;
      if (d.rz) m.rotation.z += d.rz;
      if (d.floatAmp && d.originY !== undefined) {
        m.position.y = d.originY + Math.sin(t * d.floatSpeed + d.phase) * d.floatAmp;
      }
    });

    renderer.render(scene, camera);
  }

  animate();

  /* ─── Resize Handler ───────────────────────────────────── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Re-apply after setSize overwrites inline styles
    canvas.style.pointerEvents = 'none';
  });

  /* ─── Respect reduced-motion preference ────────────────── */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    renderer.domElement.style.display = 'none';
  }
})();
