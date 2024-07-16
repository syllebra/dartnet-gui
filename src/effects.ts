import { RefractionPostProcess, Color3, Texture, Vector2, Effect, EffectRenderer, RenderTargetTexture, Layer, EffectWrapper, PostProcess} from "@babylonjs/core"
export function createShaderBasedDynamicBackground(scene, engine) {
    
        // Create a render target.
        var rtt = new RenderTargetTexture("", 200, scene)
        
        // Create the background from it
        var background = new Layer("back", null, scene);
        background.isBackground = true;
        background.texture = rtt;
        
        // Create the background effect.
        var renderImage = new EffectWrapper({
            engine: engine,
            fragmentShader: `
                precision highp float;

                varying vec2 vUV;
                uniform float iTime;

                void main(void) {
                    //gl_FragColor = vec4(vUV, 0., 1.0);
                                    vec2 uv = vUV;//fragCoord.xy / iResolution.xy;
    
                    float mult = 0.04;
                    float offset = 0.04;
                    gl_FragColor = vec4( sin(iTime)*mult+offset,
                            sin(iTime+1.0+uv.y)*mult+offset,
                            sin(iTime+2.0+uv.x)*mult*2.0+offset,
                            1.0 );

                }
            `,
            uniformNames: ["iTime"]
        });

        // When the effect has been ready,
        // Create the effect render and change which effects will be renderered
        var renderer = new EffectRenderer(engine);
        renderImage.effect.executeWhenCompiled(() => {
            // Render the effect in the RTT.
            renderer.render(renderImage, rtt);
        });
        

        var time = 0;
        renderImage.effect.onBindObservable.add(function(e) {       
            renderImage.effect.setFloat("iTime",time)
            time +=0.01;
        })
        scene.registerBeforeRender(function() {
            //console.log(renderImage.effect._uniforms);
            if(renderImage.effect.isReady())
                renderer.render(renderImage, rtt);
        });            
        
}

export function createPostProcessShader(camera, src, name, uniforms = [], samplers=[]) {
    delete Effect.ShadersStore[name+"_customEffectPostProcessFragmentShader"]
    Effect.ShadersStore[name+"_customEffectPostProcessFragmentShader"] = src;

    // Define post process effect to set "uniforms"
    const postEffect = new PostProcess(name+" post process",
        name+"_customEffectPostProcess",
        uniforms,
        samplers, 1.0, camera,);
        // undefined, undefined, undefined, undefined, undefined,
        // "customEffectPostProcess"); // set custom vertex shader


    return postEffect;
}

export function createFrostShader(camera, scene, texture_url, distortion = false) {

    var frost_shader = `
    
    precision highp float;

    uniform sampler2D textureSampler;
    uniform sampler2D frost_texture;
    uniform float iTime;
    uniform vec2 iResolution;

    varying vec2 vUV;

    precision highp float;

    //constants are located here
    float blurRadius = 32.0;
    float blurSamples = 32.0;
    //end constants
    
    //begin color based code below
    vec2 pixelateUV(vec2 coord, float factor) {
        return floor(coord / factor) * factor;
    }
    float random2 (in vec2 st) {
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))* 43758.5453123);
    }
    #define PI2 6.2831853072 // PI * 2
    #define PI_O_2 1.5707963268 // PI / 2
    vec3 blur(vec2 uv, float passes, float radius, float lossiness) {
        const float preserveOriginal = 0.0;
        vec2 pixel = 1.0 / iResolution.xy;
    
        float count = 1.0 + preserveOriginal;
        vec4 color = texture2D(textureSampler, uv) * count;
        float directionStep = PI2 / passes;
    
        vec2 off;
        float c, s, dist, dist2, weight;
        for(float d = 0.0; d < PI2; d += directionStep) {
            c = cos(d);
            s = sin(d);
            dist = 1.0 / max(abs(c), abs(s));
            dist2 = dist * (2.0 + lossiness);
            off = vec2(c, s);
            for(float i= dist * 1.5; i <= radius; i += dist2) {
                weight = i / radius; // 1.0 - cos(i / radius * PI_O_2);
                count += weight;
                color += texture2D(textureSampler, uv + off * pixel * i) * weight;
            }
        }
        vec4 toRet = color / count;
        return vec3(toRet.x, toRet.y, toRet.z);
    }

    float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
    }

    float blendOverlay(float base, float blend) {
        return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
    }

    vec3 blendOverlay(vec3 base, vec3 blend) {
        return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
    }

    vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
        return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
    }

    float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
    }

    vec3 blendScreen(vec3 base, vec3 blend) {
        return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
    }

    vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
        return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
    }


    void main(void) {
        vec4 color = texture2D(textureSampler, vUV);
        float l = luma(color.rgb);
        l = pow(l+0.1,3.0);
        vec3 dirt = texture2D(frost_texture, vUV).rgb;
        blurRadius = luma(dirt) * 64.0;
        vec3 col = blur(vUV, blurSamples, blurRadius, 2.0);
        //col += f*l * 0.2;
        col = blendScreen(col, dirt, l*10.0);
        gl_FragColor = vec4(col,1.0);
    }`
    if(distortion)
        var postProcess = new RefractionPostProcess("frost_effect_refraction", texture_url, new Color3(1.0, 0.0, 1.0), 0.05, 0.05, 1, camera);
    var postEffect = createPostProcessShader(camera, frost_shader, "frost_effect", ["iTime", "iResolution"], ["frost_texture"]);
    
    var frost_texture = new Texture(texture_url, scene);
    
    postEffect.onApply = function (effect) {
        effect.setVector2('iResolution', new Vector2(postEffect.width, postEffect.height));
        effect.setFloat('iTime', 0.0);
        effect.setTexture('frost_texture',frost_texture);
    };
}

