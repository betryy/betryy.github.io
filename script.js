document.addEventListener("DOMContentLoaded", function() {
  
  // --- 0. ФОНОВЫЙ ЭМБИЕНТ И МИКШЕР ---
  const bgAudio = document.getElementById('bg-ambient');
  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');
  const volumeIcon = document.getElementById('volume-icon');
  let previousVolume = 0.4;

  // Функция обновления иконки динамика
  function updateVolumeIcon(vol) {
    if (vol === 0) {
      volumeIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
    } else if (vol < 0.5) {
      volumeIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    } else {
      volumeIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>';
    }
  }

  if (bgAudio && volumeSlider && muteBtn) {
    bgAudio.volume = volumeSlider.value;
    updateVolumeIcon(bgAudio.volume);

    // Запуск аудио (с обходом блокировки автоплея)
    let playPromise = bgAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const startAudio = () => {
          bgAudio.play();
          document.removeEventListener('click', startAudio);
          document.removeEventListener('keydown', startAudio);
        };
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
      });
    }

    // Слайдер
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      bgAudio.volume = vol;
      updateVolumeIcon(vol);
      if (vol > 0) {
        bgAudio.muted = false;
        previousVolume = vol;
      }
    });

    // Кнопка Mute
    muteBtn.addEventListener('click', () => {
      if (bgAudio.volume > 0) {
        previousVolume = bgAudio.volume;
        bgAudio.volume = 0;
        volumeSlider.value = 0;
      } else {
        bgAudio.volume = previousVolume || 0.4;
        volumeSlider.value = bgAudio.volume;
      }
      updateVolumeIcon(bgAudio.volume);
    });
  }

  // --- 1. КАРУСЕЛЬ ССЫЛОК ---
  const cards = document.querySelectorAll('.link-card');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const track = document.getElementById('carousel-track');
  let currentIndex = 0;

  function updateCarousel() {
    cards.forEach((card, i) => card.classList.toggle('active', i === currentIndex));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
  }

  if (prevBtn) prevBtn.onclick = function() { currentIndex = (currentIndex - 1 + cards.length) % cards.length; updateCarousel(); };
  if (nextBtn) nextBtn.onclick = function() { currentIndex = (currentIndex + 1) % cards.length; updateCarousel(); };
  if (track) track.onwheel = function(e) {
    e.preventDefault();
    if (e.deltaY > 0) currentIndex = (currentIndex + 1) % cards.length;
    else currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCarousel();
  };

  // --- 2. БЕЛЫЕ ЧАСТИЦЫ НА ФОНЕ ---
  const pCanvas = document.getElementById('particles-canvas');
  if (pCanvas) {
    const ctx = pCanvas.getContext('2d');
    let particles = [];
    function resizeParticles() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeParticles);
    resizeParticles();

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * pCanvas.width, y: Math.random() * pCanvas.height,
        size: Math.random() * 2 + 0.5, speedX: Math.random() * 0.8 - 0.4, speedY: Math.random() * -0.8 - 0.2,
        opacity: Math.random() * 0.6 + 0.1, fade: Math.random() * 0.02 + 0.005, direction: 1
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY;
        p.opacity += p.fade * p.direction;
        if (p.opacity > 0.7) p.direction = -1;
        if (p.opacity < 0.1) p.direction = 1;
        if (p.y < 0) { p.y = pCanvas.height; p.x = Math.random() * pCanvas.width; }
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // --- 3. 3D МОДЕЛЬ ---
  const container = document.getElementById('canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping; 
  renderer.toneMappingExposure = 1.3; 
  container.appendChild(renderer.domElement);

  // Свет
  scene.add(new THREE.AmbientLight(0xffffff, 2.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4);
  keyLight.position.set(5, 5, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffaa55, 2);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const loader = new THREE.GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  const modelUrl = "./assets/oskolok.glb"; 
  const textureUrl = "./assets/oskolok_diff.png"; 

  textureLoader.load(textureUrl, function(texture) {
    texture.encoding = THREE.sRGBEncoding;
    loadModel(texture);
  }, undefined, function() {
    loadModel(null);
  });

  function loadModel(texture) {
    loader.load(modelUrl, function(gltf) {
      const model = gltf.scene;
      
      model.traverse((child) => {
        if (child.isMesh) {
          if (texture) {
            child.material = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.1, roughness: 0.8 });
          } else {
            child.material = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.3, roughness: 0.5 });
          }
        }
      });

      const wrapper = new THREE.Group();
      wrapper.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;

      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDimension; 
      wrapper.scale.setScalar(scale);

      modelGroup.add(wrapper);
    }, undefined, function(error) {
      console.error("ОШИБКА МОДЕЛИ:", error);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    modelGroup.rotation.y += 0.005; 
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function() {
    if (container.clientWidth && container.clientHeight) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });
});