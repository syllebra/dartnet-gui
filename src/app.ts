import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    MotionBlurPostProcess,
    Mesh,
    Texture, Color3, Color4,
    RenderTargetTexture, EffectWrapper, Layer, EffectRenderer, Effect,
    RefractionPostProcess,
    PostProcess, Vector2,
    MeshBuilder, DefaultRenderingPipeline, HDRCubeTexture,PBRMaterial, LensRenderingPipeline, ColorCurves, DepthOfFieldEffectBlurLevel,  SceneLoader, BackgroundMaterial,
    BlurPostProcess,DynamicTexture,
    StandardRenderingPipeline} from "@babylonjs/core";
import { StackPanel, Control, AdvancedDynamicTexture, Checkbox, TextBlock, Slider, ColorPicker } from "@babylonjs/gui";

import { createDebugUI } from "./ui_test"
import { createShaderBasedDynamicBackground, createFrostShader} from "./effects"

//import * as rasterizeHTML from 'rasterizehtml';

class App {
    constructor() {
        const canvas: any = document.getElementById("renderCanvas"); // Get the canvas element
        if(!canvas)
            return;
        //console.log("Canvas context:",canvas.getContext("webgl2"))
        //rasterizeHTML.Options =
        // try{
        // rasterizeHTML.drawHTML('Some ' +
        //     '<span style="color: green; font-size: 20px;">HTML</span>' +
        //     ' with an image <img src="textures/refract.jpg">',
        //     canvas);
        // }
        // catch(e){
        //     console.log("Error:", e)
        // }

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        
        let divFps = document.getElementById("fps");

        SceneLoader.ShowLoadingScreen = false;
        var scene = new Scene(engine);
        var board = null;
        var boardLoader = SceneLoader.Append("./", "Board.glb", scene, function (scene) {
            // do something with the scene
            for(var mesh of scene.meshes) {
                if(mesh.name == "__root__")
                    //board = mesh;
                    mesh.scaling =new Vector3(mesh.scaling.x*10,mesh.scaling.y*10,mesh.scaling.z*10)
                }
          });

        scene.clearColor = new Color4(0.9, 0.9, 1,1.0);
        //scene.clearColor = new Color4(0.0, 0.0, 0.0,0.0);
        
        var bgCamera = new ArcRotateCamera("BGCamera", Math.PI / 2 + Math.PI / 7, Math.PI / 2, 100,
            new Vector3(0, 20, 0),
            scene);
        bgCamera.layerMask = 0x10000000;


        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 80, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        //camera.inputs.attached.mousewheel.wheelPrecisionY = 100;
        console.log(camera.wheelPrecision);
        camera.wheelPrecision = 15;

        var defaultPipeline = new DefaultRenderingPipeline(
            "defaultPipeline", // The name of the pipeline
            true, // Do you want the pipeline to use HDR texture?
            scene, // The scene instance
            [camera] // The list of cameras to be attached to
        );


        defaultPipeline.imageProcessing.contrast = 1.8;
        defaultPipeline.imageProcessing.exposure = 0.8;
        defaultPipeline.bloomEnabled  =true;
        defaultPipeline.bloomKernel = 100;
        defaultPipeline.bloomWeight = 0.38;

        defaultPipeline.bloomThreshold = 0.65;

        defaultPipeline.chromaticAberrationEnabled = false;
        defaultPipeline.chromaticAberration.aberrationAmount = 10;
        defaultPipeline.imageProcessing.vignetteEnabled = true;


        var curve = new ColorCurves();
        curve.globalHue = 200;
        curve.globalDensity = 80;
        curve.globalSaturation = 80;
        curve.highlightsHue = 20;
        curve.highlightsDensity = 80;
        curve.highlightsSaturation = -80;
        curve.shadowsHue = 2;
        curve.shadowsDensity = 80;
        curve.shadowsSaturation = 40;
        defaultPipeline.imageProcessing.colorCurves = curve;
        //defaultPipeline.depthOfField.focalLength = 150;
        defaultPipeline.fxaaEnabled = true;
        defaultPipeline.samples =4;
        defaultPipeline.sharpenEnabled = true;


        scene.activeCameras = [camera, bgCamera];

        bgCamera._skipRendering =true;
        var lensEffect = new LensRenderingPipeline('lens', {
            edge_blur: 1.0,
            chromatic_aberration: 1.0,
            distortion: 1.0,
            dof_focus_distance: 50,
            dof_aperture: 2.0,			// set this very high for tilt-shift effect
            grain_amount: 0.0,
            //grain_texture: grain_texture,
            dof_pentagon: true,
            dof_gain: 0.0,
            dof_threshold: 1.0,
            dof_darken: 0.25
        }, scene, 1.0, [camera]);
        //lensEffect._disableEffect

        camera.onViewMatrixChangedObservable.add(function(c: ArcRotateCamera ) {
            lensEffect.setAperture(c.radius*0.06);
        })

        createDebugUI(scene, defaultPipeline, lensEffect);

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        //light1.intensity *= 5;


        const reflectionTexture = new HDRCubeTexture("./textures/studio_small_09_1k.hdr", scene, 128, false, true, false, true);
        //reflectionTexture.level = reflectionTexture.level*3;
        scene.environmentTexture = reflectionTexture;


        //createShaderBasedDynamicBackground(scene, engine)

        scene.registerBeforeRender(function() {
            divFps.innerHTML = engine.getFps().toFixed() + " fps";
        });            


        // var motionblur = new MotionBlurPostProcess(
        //     "mb", // The name of the effect.
        //     scene, // The scene containing the objects to blur according to their velocity.
        //     1.0, // The required width/height ratio to downsize to before computing the render pass.
        //     camera // The camera to apply the render pass to.
        // );

                
        //createFrostShader(camera, scene, "textures/2148486759.jpg", true);

        /* When the openFullscreen() function is executed, open the video in fullscreen.
        Note that we must include prefixes for different browsers, as they don't support the requestFullscreen property yet */
        function openFullscreen() {
            var elem = document.getElementById("renderCanvas");
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            // } else if (document.webkitRequestFullscreen) { /* Safari */
            //     document.webkitRequestFullscreen();
            // } else if (document.msRequestFullscreen) { /* IE11 */
            //     document.msRequestFullscreen();
                }
        }
        var fsb = document.getElementById("fullscreen");
        fsb.onclick = () => {openFullscreen();}

         // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (/*ev.shiftKey && ev.ctrlKey &&*/ ev.altKey && ev.key === 'i') {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
            else if (/*ev.shiftKey && ev.ctrlKey &&*/ ev.key === 'e') {
                bgCamera._skipRendering = !bgCamera._skipRendering;
            }
            else if (ev.key === 'f')
            {
                openFullscreen();
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener("resize", function () {
            engine.resize();
          });
    }
}
new App();