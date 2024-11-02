precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uClickTime;
uniform sampler2D uTexture;

varying vec2 vUv;

// Noise function (adapted from IQ)
float noise3(vec3 x) {
    vec3 p = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    #define hash3(p) fract(sin(1e3 * dot(p, vec3(1.0, 57.0, -13.7))) * 4375.5453)
    
    return mix(
        mix(mix(hash3(p + vec3(0, 0, 0)), hash3(p + vec3(1, 0, 0)), f.x),
            mix(hash3(p + vec3(0, 1, 0)), hash3(p + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(hash3(p + vec3(0, 0, 1)), hash3(p + vec3(1, 0, 1)), f.x),
            mix(hash3(p + vec3(0, 1, 1)), hash3(p + vec3(1, 1, 1)), f.x), f.y),
        f.z
    );
}

#define noise(x) (noise3(x) + noise3(x + 11.5)) / 2.0

float ripple(vec2 uv, vec2 center, float time) {
    float d = distance(uv, center);
    float rippleSpeed = 2.0;
    float rippleWidth = 0.05;
    return sin(d * 50.0 - time * rippleSpeed) * exp(-d * 8.0) * rippleWidth;
}

void main() {
    vec2 uv = vUv;
    vec2 R = uResolution;
    float t = uTime;
    
    float n = noise(vec3(uv * 8.0, 0.1 * t));
    float v = sin(6.28 * 10.0 * n);
    
    v = smoothstep(1.0, 0.0, 0.5 * abs(v) / fwidth(v));
    
    vec4 texColor = texture2D(uTexture, uv + vec2(sin(t * 0.5) * 0.01, cos(t * 0.5) * 0.01));
    vec4 noiseColor = 0.5 + 0.5 * sin(12.0 * n + vec4(0.0, 2.1, -2.1, 0.0));
    
    vec4 O = mix(texColor, noiseColor, v);
    
    // Add ripple effect
    vec2 mouseUV = uMouse / R;
    float rippleEffect = ripple(uv, mouseUV, t - uClickTime);
    O.rgb += rippleEffect;
    
    gl_FragColor = O;
}
