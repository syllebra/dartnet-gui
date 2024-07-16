import {
    DepthOfFieldEffectBlurLevel, LensRenderingPipeline,
} from "@babylonjs/core"

import { StackPanel, Control, AdvancedDynamicTexture, Checkbox, TextBlock, Slider, ColorPicker } from "@babylonjs/gui";

export function createDebugUI(scene, defaultPipeline, lensPipeline:LensRenderingPipeline) {

    var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    if(!advancedTexture || !advancedTexture.layer)
        return;
    advancedTexture.layer.layerMask = 0x10000000;
    advancedTexture.renderScale = 1.5;

    var rightPanel = new StackPanel();
    rightPanel.width = "300px";
    rightPanel.isVertical = true;
    rightPanel.paddingRight = "20px";
    rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(rightPanel);

    var leftPanel = new StackPanel();
    leftPanel.width = "300px";
    leftPanel.isVertical = true;
    leftPanel.paddingRight = "20px";
    leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(leftPanel);

    function addCheckbox(text, func, initialValue, left:string|null=null, panel:StackPanel|null=null) {
        if(!panel){
            panel = leftPanel
        }
        var checkbox = new Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = initialValue;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(function(value) {
            func(value);
        });
    
        var header = Control.AddHeader(checkbox, text, "280px", { isHorizontal: true, controlFirst: true});
        header.height = "30px";
        header.color = "white";
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    
        if (left) {
            header.left = left;
        }
    
        panel.addControl(header);  
    }
    
    function addSlider(text, func, initialValue, min, max, left:string|null=null, panel:StackPanel|null=null) {
        if(!panel){
            panel = leftPanel
        }
        var header = new TextBlock();
        header.text = text;
        header.height = "30px";
        header.color = "white";
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.addControl(header); 
        if (left) {
            header.left = left;
        }
    
        var slider = new Slider();
        slider.minimum = min;
        slider.maximum = max;
        slider.value = initialValue;
        slider.height = "20px";
        slider.color = "green";
        slider.background = "white";
        slider.onValueChangedObservable.add(function(value) {
            func(value);
        });
    
        if (left) {
            slider.paddingLeft = left;
        }
    
       panel.addControl(slider);  
    }
    
    function addColorPicker(text, func, initialValue, left:string|null=null, panel:StackPanel|null=null) {
        if(!panel){
            panel = leftPanel
        }
        var header = new TextBlock();
        header.text = text;
        header.height = "30px";
        header.color = "white";
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.addControl(header); 
    
        if (left) {
            header.left = left;
        }        
    
        var colorPicker = new ColorPicker();
        colorPicker.value = initialValue;
        colorPicker.size = "100px";
        colorPicker.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        colorPicker.onValueChangedObservable.add(function(value) {
            func(value);
        });
    
        if (left) {
            colorPicker.left = left;
        }        
    
        panel.addControl(colorPicker);  
    }
    

        // Add gui for default pipeline effects
        addCheckbox("Multisample Anti-Aliasing", function(value) {
            defaultPipeline.samples = defaultPipeline.samples == 1 ? 4 : 1;
        }, defaultPipeline.samples == 4 );

        addCheckbox("Fast Approximate Anti-Aliasing", function(value) {
            defaultPipeline.fxaaEnabled = value;
            
        }, defaultPipeline.fxaaEnabled );

        addCheckbox("Tone Mapping", function(value) {
            defaultPipeline.imageProcessing.toneMappingEnabled = value;
        }, defaultPipeline.imageProcessing.toneMappingEnabled); 

        addSlider("camera contrast", function(value) {
            defaultPipeline.imageProcessing.contrast = value;
        }, defaultPipeline.imageProcessing.contrast, 0, 4);  

        addSlider("camera exposure", function(value) {
            defaultPipeline.imageProcessing.exposure = value;
        }, defaultPipeline.imageProcessing.exposure, 0, 4);      

        addCheckbox("Color curves", function(value) {
            defaultPipeline.imageProcessing.colorCurvesEnabled = value;
        }, defaultPipeline.imageProcessing.colorCurvesEnabled);    

        addCheckbox("Bloom", function(value) {
            defaultPipeline.bloomEnabled = value;
        }, defaultPipeline.bloomEnabled);    
        addSlider("Kernel", function(value) {
            defaultPipeline.bloomKernel = value;
        }, defaultPipeline.bloomKernel, 1, 500, "20px");
        addSlider("Weight", function(value) {
            defaultPipeline.bloomWeight = value;
        }, defaultPipeline.bloomWeight, 0, 1, "20px");
        addSlider("Threshold", function(value) {
            defaultPipeline.bloomThreshold = value;
        }, defaultPipeline.bloomThreshold, 0, 1, "20px");
        addSlider("Scale", function(value) {
            defaultPipeline.bloomScale = value;
        }, defaultPipeline.bloomScale, 0.0, 1, "20px");

        addCheckbox("Depth Of Field", function(value) {
            defaultPipeline.depthOfFieldEnabled = value;
        }, defaultPipeline.depthOfFieldEnabled);

        addSlider("Blur Level", function(value) {
            if(value < 1){
                defaultPipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Low;
            }else if(value < 2){
                defaultPipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Medium;
            }else if(value < 3){
                defaultPipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.High;
            }
        }, 1, 0, 3, "20px"); 

        addSlider("Focus Distance", function(value) {
            defaultPipeline.depthOfField.focusDistance = value;
        }, defaultPipeline.depthOfField.focusDistance, 1, 500, "20px");   

       

        addSlider("F-Stop", function(value) {
            defaultPipeline.depthOfField.fStop = value;
        }, defaultPipeline.depthOfField.fStop, 1.0, 10, "20px");   
        
        addSlider("Focal Length", function(value) {
            defaultPipeline.depthOfField.focalLength = value;
        }, defaultPipeline.depthOfField.focalLength, 1.0, 300, "20px"); 

        addSlider("DOF Focus Distance", function(value) {
            lensPipeline.setFocusDistance(value);
        }, 50, 1, 500, "20px");   


        leftPanel = rightPanel

        addCheckbox("Chromatic Aberration", function(value) {
            defaultPipeline.chromaticAberrationEnabled = value;
        }, defaultPipeline.chromaticAberrationEnabled);    

        addSlider("Amount", function(value) {
            defaultPipeline.chromaticAberration.aberrationAmount = value;
        },  0, -1000, 1000, "20px");   
        addSlider("Radial Intensity", function(value) {
            defaultPipeline.chromaticAberration.radialIntensity = value;
        },  0, 0.1, 5, "20px");   
        addSlider("Direction", function(value) {
            if(value == 0){
                defaultPipeline.chromaticAberration.direction.x = 0
                defaultPipeline.chromaticAberration.direction.y = 0
            }else{
                defaultPipeline.chromaticAberration.direction.x = Math.sin(value)
                defaultPipeline.chromaticAberration.direction.y = Math.cos(value)
            }
            
        },  0, 0, Math.PI*2, "20px"); 
        
        addCheckbox("Sharpen", function(value) {
            defaultPipeline.sharpenEnabled = value;
        }, defaultPipeline.sharpenEnabled);

        addSlider("Edge Amount", function(value) {
            defaultPipeline.sharpen.edgeAmount = value;
        }, defaultPipeline.sharpen.edgeAmount, 0, 2, "20px");

        addSlider("Color Amount", function(value) {
            defaultPipeline.sharpen.colorAmount = value;
        }, defaultPipeline.sharpen.colorAmount, 0, 1, "20px");   

        addCheckbox("Vignette", function(value) {
            defaultPipeline.imageProcessing.vignetteEnabled = value;
        }, defaultPipeline.imageProcessing.vignetteEnabled);     

        // addCheckbox("Multiply", function(value) {
        //     var blendMode = value ? ImageProcessingPostProcess.VIGNETTEMODE_MULTIPLY : ImageProcessingPostProcess.VIGNETTEMODE_OPAQUE;
        //     defaultPipeline.imageProcessing.vignetteBlendMode = blendMode;
        // }, defaultPipeline.imageProcessing.vignetteBlendMode === ImageProcessingPostProcess.VIGNETTEMODE_MULTIPLY, "40px");     

        addColorPicker("Color", function(value) {
            defaultPipeline.imageProcessing.vignetteColor = value;
        }, defaultPipeline.imageProcessing.vignetteColor, "20px");    

        addSlider("Weight", function(value) {
            defaultPipeline.imageProcessing.vignetteWeight = value;
        }, defaultPipeline.imageProcessing.vignetteWeight, 0, 10, "20px");             

        addCheckbox("Grain", function(value) {
            defaultPipeline.grainEnabled = value;
        }, defaultPipeline.grainEnabled);    

        addSlider("Intensity", function(value) {
            defaultPipeline.grain.intensity = value
        }, defaultPipeline.grain.intensity, 0, 100, "20px");      

        addCheckbox("Animated", function(value) {
            defaultPipeline.grain.animated = value;
        }, defaultPipeline.grain.animated, "20px");   
}
