let scene, camera, renderer, sphere, controls;
let uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() }
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Adjust camera to look straight at the shader
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 2;
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('glCanvas'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 4;

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float iTime;
            uniform vec3 iResolution;
            varying vec2 vUv;
            varying vec3 vPosition;

            vec3 palette( float t ) {
                vec3 a = vec3(0.5, 0.5, 0.5);
                vec3 b = vec3(0.5, 0.5, 0.5);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.811765, 0.262745, 0.996078);

                return a + b*cos( 6.28318*(c*t+d) );
            }

            #define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

            float TAU = 2.*3.14159;

            float eqTri( in vec2 p, in float r ) {
                const float k = sqrt(3.0);
                p.x = abs(p.x) - r;
                p.x = p.x + r/k;
                if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
                p.x -= clamp( p.x, -2.0*r, 0.0 );
                return -length(p)*sign(p.y);
            }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
                vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
                vec2 uv0 = uv;
                vec3 finalColor = vec3(0.0);
                
                for (float i = 0.0; i < 4.0; i++) {
                    vec3 col2 = vec3(0.);
                    float t = fract(.1 * iTime*0.51);
                    uv *= rotation(3. * TAU * (.3 - clamp(length(uv),0.,.3)));

                    float s = -1.;
                    for(float i = 0.; i < 5.; i++){
                        float rad = 1.4 / pow(2.,i) * (.9 - .2 * i);
                        uv *= rotation(-2. * s * (i + 1.) * TAU * t);
                        float tri = eqTri(uv, rad);
                        s *= -1.;
                        col2 += 1.004 / abs(tri);
                    }
                    uv = fract(uv * 1.5) - 0.5;

                    float d = length(uv) * exp(-length(uv0));

                    vec3 col = palette(length(uv0) + i*.4 + iTime*.4);

                    d = sin(d*8. + iTime)/8.;
                    d = abs(d);

                    d = pow(0.01 / d, 1.2);

                    finalColor += col * d;
                }
                    
                fragColor = vec4(finalColor, 1.0);
            }

            void main() {
                mainImage(gl_FragColor, vUv * iResolution.xy);
            }
        `,
        transparent: true
    });

    sphere = new THREE.Mesh(geometry, material);
    
    // Create a quaternion rotation that shows the main pattern
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(
        -4.7,               // X: -4.7 (-270 degrees) - Centers the main feature
        Math.PI,           // Y: Math.PI (180 degrees) - Correct horizontal orientation
        Math.PI / 2,      // Z: Math.PI/2 (90 degrees) - Perfect tilt for pattern visibility
    ));
    sphere.setRotationFromQuaternion(quaternion);
    
    scene.add(sphere);

    window.addEventListener('resize', onWindowResize, true);
    onWindowResize();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
}

function animate() {
    requestAnimationFrame(animate);
    uniforms.iTime.value += 0.01;
    controls.update();
    renderer.render(scene, camera);
}

init();
