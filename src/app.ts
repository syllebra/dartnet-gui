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

import { HtmlMesh, HtmlMeshRenderer, FitStrategy } from 'babylon-htmlmesh';

class App {
    constructor() {
        const canvas: any = document.getElementById("renderCanvas"); // Get the canvas element
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

        //scene.clearColor = new Color4(0.1, 0.1, 0.12,1.0);
        // It is critical to have a transparent clear color for HtmlMesh to work.
        scene.clearColor = new Color4(0,0,0,0);
        
   
        // Create the HtmlMeshRenderer
        const htmlMeshRenderer = new HtmlMeshRenderer(scene);

        var bgCamera = new ArcRotateCamera("BGCamera", Math.PI / 2 + Math.PI / 7, Math.PI / 2, 100,
            new Vector3(0, 20, 0),
            scene);
        bgCamera.layerMask = 0x10000000;


        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 80, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        var defaultPipeline = new DefaultRenderingPipeline(
            "defaultPipeline", // The name of the pipeline
            true, // Do you want the pipeline to use HDR texture?
            scene, // The scene instance
            [camera] // The list of cameras to be attached to
        );
        // var defaultPipeline = new StandardRenderingPipeline(
        //     "defaultPipeline", // The name of the pipeline
        //     scene,
        //     1.0,null, [camera]
        // );


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
        var grain_texture = new Texture("textures/refract.jpg");
        // var grain_texture = new DynamicTexture("dynamic texture", {width:512, height:256}, scene);   
        // //Add text to dynamic texture
        // var font = "bold 44px monospace";
        // grain_texture.drawText("Grass", 75, 135, font, "green", "white", true, true);
        // //grain_texture.scale(1.0)

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



        // Shows how this can be used to include html content, such
    // as a form, in your scene.  This can be used to create
    // richer UIs than can be created with the standard Babylon
    // UI control, albeit with the restriction that such UIs would
    // not display in native mobile apps or XR applications.
    const htmlMeshDiv = new HtmlMesh(scene, "html-mesh-div", { isCanvasOverlay: true });
    const div = document.createElement('div');
    div.innerHTML = `
        <form style="padding: 10px; transform: scale(4); transform-origin: 0 0;">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required><br><br>
            
            <label for="country">Country:</label>
            <select id="country" name="country">
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="UK">UK</option>
                <option value="Australia">Australia</option>
            </select><br><br>
            
            <label for="hobbies">Hobbies:</label><br>
            <input type="checkbox" id="hobby1" name="hobbies" value="Reading">
            <label for="hobby1">Reading</label><br>
            <input type="checkbox" id="hobby2" name="hobbies" value="Gaming">
            <label for="hobby2">Gaming</label><br>
            <input type="checkbox" id="hobby3" name="hobbies" value="Sports">
            <label for="hobby3">Sports</label><br><br>
        </form>
    `;
    div.style.backgroundColor = 'white';
    div.style.width = '480px';
    div.style.height = '360px';
    // Style the form
    
    htmlMeshDiv.setContent(div, 6, 4);
    htmlMeshDiv.position.x = -3;
    htmlMeshDiv.position.y = 2;
    htmlMeshDiv.position.z = 4;

    // Shows how this can be used to include a PDF in your scene.  Note this is 
    // conceptual only.  Displaying a PDF like this works, but any links in the
    // PDF will navigate the current tab, which is probably not what you want.
    // There are other solutions out there such as PDF.js that may give you more
    // control, but ultimately proper display of PDFs is not within the scope of
    // this project.
    const pdfUrl = 'https://cdn.glitch.com/3da1885b-3463-4252-8ded-723332b5de34%2FNew_Horizons.pdf#zoom=200?v=1599831745689'
    const htmlMeshPdf = new HtmlMesh(scene, "html-mesh-pdf");
    const iframePdf = document.createElement('iframe');
    iframePdf.src = pdfUrl;
    iframePdf.width = '480px';
    iframePdf.height = '360px';
    htmlMeshPdf.setContent(iframePdf, 4, 3);
    htmlMeshPdf.position.x = 3;
    htmlMeshPdf.position.y = 2;
    htmlMeshPdf.position.z = 4;

    // // Shows how this can be used to include a website in your scene
    // const siteUrl = 'https://www.babylonjs.com/';
    // const htmlMeshSite = new HtmlMesh(scene, "html-mesh-site");
    // const iframeSite = document.createElement('iframe');
    // iframeSite.src = siteUrl;
    // iframeSite.width = '480px';
    // iframeSite.height = '360px';
    // htmlMeshSite.setContent(iframeSite, 4, 3);
    // htmlMeshSite.position.x = -3;
    // htmlMeshSite.position.y = -2;
    
    // // Shows how this can be used to include a YouTube video in your scene
    // const videoId = 'zELYw2qEUjI';
    // const videoUrl = [ 'https://www.youtube.com/embed/', videoId, '?rel=0&enablejsapi=1&disablekb=1&controls=0&fs=0&modestbranding=1' ].join( '' );
    // const htmlMeshVideo = new HtmlMesh(scene, "html-mesh-video");
    // const iframeVideo = document.createElement('iframe');
    // iframeVideo.src = videoUrl;
    // iframeVideo.width = '480px';
    // iframeVideo.height = '360px';
    // htmlMeshVideo.setContent(iframeVideo, 4, 3);
    // htmlMeshVideo.position.x = 3;
    // htmlMeshVideo.position.y = -2;

    // Shows how to create an HTML Overlay by the fit strategy: FitStrategy.NONE
    const overlayMesh = new HtmlMesh(scene, "html-overlay-mesh", { isCanvasOverlay: true });
    const overlayMeshDiv = document.createElement('div');
    overlayMeshDiv.innerHTML = `<p>This is an overlay. It is positioned in front of the canvas This allows it to have transparency and to be non-rectangular, but it will always show over any other content in the scene</p>`;
    overlayMeshDiv.style.backgroundColor = 'rgba(0,255,0,0.49)';
    overlayMeshDiv.style.width = '120px';
    overlayMeshDiv.style.height = '90px';
    overlayMeshDiv.style.display = 'flex';
    overlayMeshDiv.style.alignItems = 'center';
    overlayMeshDiv.style.justifyContent = 'center';
    overlayMeshDiv.style.borderRadius = '20px';
    overlayMeshDiv.style.fontSize = 'xx-small';
    overlayMeshDiv.style.padding = '10px';
    // Style the form

    overlayMesh.setContent(overlayMeshDiv, 4, 3);
    overlayMesh.position.x = 0;
    overlayMesh.position.y = 0;

    // // Shows how to create an HTML Overlay by the fit strategy: FitStrategy.CONTAIN
    // const overlayContainMesh = new HtmlMesh(scene, "html-overlay-mesh-contain",{ isCanvasOverlay: true, fitStrategy: FitStrategy.CONTAIN });
    // const overlayContainMeshDiv = document.createElement('div');
    // overlayContainMeshDiv.innerHTML = `Contain: This is an overlay. It is positioned in front of the canvas This allows it to have transparency and to be non-rectangular, but it will always show over any other content in the scene`;
    // overlayContainMeshDiv.style.width = '200px';
    // overlayContainMeshDiv.style.display = 'flex';
    // overlayContainMeshDiv.style.alignItems = 'center';
    // overlayContainMeshDiv.style.justifyContent = 'center';
    // overlayContainMeshDiv.style.padding = '10px';
    // overlayContainMeshDiv.style.backgroundColor = 'rgba(25,0,255,0.49)';
  
    // overlayContainMesh.setContent(overlayContainMeshDiv, 4, 3);
    // overlayContainMesh.position.x = 0;
    // overlayContainMesh.position.y = 3.5;
    // overlayContainMesh.billboardMode = 7;
  
    // // Shows how to create an HTML Overlay by the fit strategy: FitStrategy.COVER
    // const overlayCoverMesh = new HtmlMesh(scene, "html-overlay-mesh-cover", { isCanvasOverlay: true, fitStrategy: FitStrategy.COVER });
    // const overlayCoverMeshDiv = document.createElement('div');
    // overlayCoverMeshDiv.innerHTML = `Cover: This is an overlay. It is positioned in front of the canvas This allows it to have transparency and to be non-rectangular, but it will always show over any other content in the scene`;
    // overlayCoverMeshDiv.style.backgroundColor = 'rgba(25,0,255,0.49)';
    // overlayCoverMeshDiv.style.width = '150px';
    // overlayCoverMeshDiv.style.display = 'flex';
    // overlayCoverMeshDiv.style.alignItems = 'center';
    // overlayCoverMeshDiv.style.justifyContent = 'center';
    // overlayCoverMeshDiv.style.padding = '10px';
    // overlayCoverMeshDiv.style.overflow = 'hidden';
  
    // overlayCoverMesh.setContent(overlayCoverMeshDiv, 4, 3);
    // overlayCoverMesh.position.x = -2.5;
    // overlayCoverMesh.position.y = 7;
    // overlayCoverMesh.billboardMode = 7;

    // // Shows how to create an HTML Overlay by the fit strategy: FitStrategy.STRETCH
    // const overlayStretchMesh = new HtmlMesh(scene, "html-overlay-mesh-stretch", { isCanvasOverlay: true, fitStrategy: FitStrategy.STRETCH });
    // const overlayStretchMeshDiv = document.createElement('div');
    // overlayStretchMeshDiv.innerHTML = `Stretch: This is an overlay. It is positioned in front of the canvas This allows it to have transparency and to be non-rectangular, but it will always show over any other content in the scene`;
    // overlayStretchMeshDiv.style.backgroundColor = 'rgba(25,0,255,0.49)';
    // overlayStretchMeshDiv.style.width = '400px';
    // overlayStretchMeshDiv.style.display = 'flex';
    // overlayStretchMeshDiv.style.alignItems = 'center';
    // overlayStretchMeshDiv.style.justifyContent = 'center';
    // overlayStretchMeshDiv.style.padding = '10px';
  
    // overlayStretchMesh.setContent(overlayStretchMeshDiv, 4, 3);
    // overlayStretchMesh.position.x = 2;
    // overlayStretchMesh.position.y = 7;
    // overlayStretchMesh.billboardMode = 7;
        //defaultPipeline.lensTexture = new Texture("textures/lensdirt.jpg", scene);

        // var motionblur = new MotionBlurPostProcess(
        //     "mb", // The name of the effect.
        //     scene, // The scene containing the objects to blur according to their velocity.
        //     1.0, // The required width/height ratio to downsize to before computing the render pass.
        //     camera // The camera to apply the render pass to.
        // );

                
        createFrostShader(camera, scene, "textures/2148486759.jpg", true);

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