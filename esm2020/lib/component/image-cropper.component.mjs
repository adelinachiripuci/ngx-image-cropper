import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, HostListener, Input, isDevMode, Output, ViewChild } from '@angular/core';
import { CropperSettings } from '../interfaces/cropper.settings';
import { MoveTypes } from '../interfaces/move-start.interface';
import { getEventForKey, getInvertedPositionForKey, getPositionForKey } from '../utils/keyboard.utils';
import * as i0 from "@angular/core";
import * as i1 from "../services/crop.service";
import * as i2 from "../services/cropper-position.service";
import * as i3 from "../services/load-image.service";
import * as i4 from "@angular/platform-browser";
import * as i5 from "@angular/common";
export class ImageCropperComponent {
    constructor(cropService, cropperPositionService, loadImageService, sanitizer, cd) {
        this.cropService = cropService;
        this.cropperPositionService = cropperPositionService;
        this.loadImageService = loadImageService;
        this.sanitizer = sanitizer;
        this.cd = cd;
        this.Hammer = window?.['Hammer'] || null;
        this.settings = new CropperSettings();
        this.setImageMaxSizeRetries = 0;
        this.marginLeft = '0px';
        this.maxSize = {
            width: 0,
            height: 0
        };
        this.moveTypes = MoveTypes;
        this.imageVisible = false;
        this.format = this.settings.format;
        this.transform = {};
        this.maintainAspectRatio = this.settings.maintainAspectRatio;
        this.aspectRatio = this.settings.aspectRatio;
        this.resizeToWidth = this.settings.resizeToWidth;
        this.resizeToHeight = this.settings.resizeToHeight;
        this.cropperMinWidth = this.settings.cropperMinWidth;
        this.cropperMinHeight = this.settings.cropperMinHeight;
        this.cropperMaxHeight = this.settings.cropperMaxHeight;
        this.cropperMaxWidth = this.settings.cropperMaxWidth;
        this.cropperStaticWidth = this.settings.cropperStaticWidth;
        this.cropperStaticHeight = this.settings.cropperStaticHeight;
        this.canvasRotation = this.settings.canvasRotation;
        this.initialStepSize = this.settings.initialStepSize;
        this.roundCropper = this.settings.roundCropper;
        this.onlyScaleDown = this.settings.onlyScaleDown;
        this.imageQuality = this.settings.imageQuality;
        this.autoCrop = this.settings.autoCrop;
        this.backgroundColor = this.settings.backgroundColor;
        this.containWithinAspectRatio = this.settings.containWithinAspectRatio;
        this.hideResizeSquares = this.settings.hideResizeSquares;
        this.cropper = {
            x1: -100,
            y1: -100,
            x2: 10000,
            y2: 10000
        };
        this.alignImage = this.settings.alignImage;
        this.disabled = false;
        this.imageCropped = new EventEmitter();
        this.startCropImage = new EventEmitter();
        this.imageLoaded = new EventEmitter();
        this.cropperReady = new EventEmitter();
        this.loadImageFailed = new EventEmitter();
        this.reset();
    }
    ngOnChanges(changes) {
        this.onChangesUpdateSettings(changes);
        this.onChangesInputImage(changes);
        if (this.loadedImage?.original.image.complete && (changes['containWithinAspectRatio'] || changes['canvasRotation'])) {
            this.loadImageService
                .transformLoadedImage(this.loadedImage, this.settings)
                .then((res) => this.setLoadedImage(res))
                .catch((err) => this.loadImageError(err));
        }
        if (changes['cropper'] || changes['maintainAspectRatio'] || changes['aspectRatio']) {
            this.setMaxSize();
            this.setCropperScaledMinSize();
            this.setCropperScaledMaxSize();
            if (this.maintainAspectRatio && (changes['maintainAspectRatio'] || changes['aspectRatio'])) {
                this.resetCropperPosition();
            }
            else if (changes['cropper']) {
                this.checkCropperPosition(false);
                this.doAutoCrop();
            }
            this.cd.markForCheck();
        }
        if (changes['transform']) {
            this.transform = this.transform || {};
            this.setCssTransform();
            this.doAutoCrop();
        }
    }
    onChangesUpdateSettings(changes) {
        this.settings.setOptionsFromChanges(changes);
        if (this.settings.cropperStaticHeight && this.settings.cropperStaticWidth) {
            this.settings.setOptions({
                hideResizeSquares: true,
                cropperMinWidth: this.settings.cropperStaticWidth,
                cropperMinHeight: this.settings.cropperStaticHeight,
                cropperMaxHeight: this.settings.cropperStaticHeight,
                cropperMaxWidth: this.settings.cropperStaticWidth,
                maintainAspectRatio: false
            });
        }
    }
    onChangesInputImage(changes) {
        if (changes['imageChangedEvent'] || changes['imageURL'] || changes['imageBase64'] || changes['imageFile']) {
            this.reset();
        }
        if (changes['imageChangedEvent'] && this.isValidImageChangedEvent()) {
            this.loadImageFile(this.imageChangedEvent.target.files[0]);
        }
        if (changes['imageURL'] && this.imageURL) {
            this.loadImageFromURL(this.imageURL);
        }
        if (changes['imageBase64'] && this.imageBase64) {
            this.loadBase64Image(this.imageBase64);
        }
        if (changes['imageFile'] && this.imageFile) {
            this.loadImageFile(this.imageFile);
        }
    }
    isValidImageChangedEvent() {
        return this.imageChangedEvent?.target?.files?.length > 0;
    }
    setCssTransform() {
        this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle('scaleX(' + (this.transform.scale || 1) * (this.transform.flipH ? -1 : 1) + ')' +
            'scaleY(' + (this.transform.scale || 1) * (this.transform.flipV ? -1 : 1) + ')' +
            'rotate(' + (this.transform.rotate || 0) + 'deg)' +
            `translate(${this.transform.translateH || 0}%, ${this.transform.translateV || 0}%)`);
    }
    ngOnInit() {
        this.settings.stepSize = this.initialStepSize;
        this.activatePinchGesture();
    }
    reset() {
        this.imageVisible = false;
        this.loadedImage = undefined;
        this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
            + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
            + 'AAarVyFEAAAAASUVORK5CYII=';
        this.moveStart = {
            active: false,
            type: null,
            position: null,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            clientX: 0,
            clientY: 0
        };
        this.maxSize = {
            width: 0,
            height: 0
        };
        this.cropper.x1 = -100;
        this.cropper.y1 = -100;
        this.cropper.x2 = 10000;
        this.cropper.y2 = 10000;
    }
    loadImageFile(file) {
        this.loadImageService
            .loadImageFile(file, this.settings)
            .then((res) => this.setLoadedImage(res))
            .catch((err) => this.loadImageError(err));
    }
    loadBase64Image(imageBase64) {
        this.loadImageService
            .loadBase64Image(imageBase64, this.settings)
            .then((res) => this.setLoadedImage(res))
            .catch((err) => this.loadImageError(err));
    }
    loadImageFromURL(url) {
        this.loadImageService
            .loadImageFromURL(url, this.settings)
            .then((res) => this.setLoadedImage(res))
            .catch((err) => this.loadImageError(err));
    }
    setLoadedImage(loadedImage) {
        this.loadedImage = loadedImage;
        this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.base64);
        this.cd.markForCheck();
    }
    loadImageError(error) {
        console.error(error);
        this.loadImageFailed.emit();
    }
    imageLoadedInView() {
        if (this.loadedImage != null) {
            this.imageLoaded.emit(this.loadedImage);
            this.setImageMaxSizeRetries = 0;
            setTimeout(() => this.checkImageMaxSizeRecursively());
        }
    }
    checkImageMaxSizeRecursively() {
        if (this.setImageMaxSizeRetries > 40) {
            this.loadImageFailed.emit();
        }
        else if (this.sourceImageLoaded()) {
            this.setMaxSize();
            this.setCropperScaledMinSize();
            this.setCropperScaledMaxSize();
            this.resetCropperPosition();
            this.cropperReady.emit({ ...this.maxSize });
            this.cd.markForCheck();
        }
        else {
            this.setImageMaxSizeRetries++;
            setTimeout(() => this.checkImageMaxSizeRecursively(), 50);
        }
    }
    sourceImageLoaded() {
        return this.sourceImage?.nativeElement?.offsetWidth > 0;
    }
    onResize() {
        if (!this.loadedImage) {
            return;
        }
        this.resizeCropperPosition();
        this.setMaxSize();
        this.setCropperScaledMinSize();
        this.setCropperScaledMaxSize();
    }
    activatePinchGesture() {
        if (this.Hammer) {
            const hammer = new this.Hammer(this.wrapper.nativeElement);
            hammer.get('pinch').set({ enable: true });
            hammer.on('pinchmove', this.onPinch.bind(this));
            hammer.on('pinchend', this.pinchStop.bind(this));
            hammer.on('pinchstart', this.startPinch.bind(this));
        }
        else if (isDevMode()) {
            console.warn('[NgxImageCropper] Could not find HammerJS - Pinch Gesture won\'t work');
        }
    }
    resizeCropperPosition() {
        const sourceImageElement = this.sourceImage.nativeElement;
        if (this.maxSize.width !== sourceImageElement.offsetWidth || this.maxSize.height !== sourceImageElement.offsetHeight) {
            this.cropper.x1 = this.cropper.x1 * sourceImageElement.offsetWidth / this.maxSize.width;
            this.cropper.x2 = this.cropper.x2 * sourceImageElement.offsetWidth / this.maxSize.width;
            this.cropper.y1 = this.cropper.y1 * sourceImageElement.offsetHeight / this.maxSize.height;
            this.cropper.y2 = this.cropper.y2 * sourceImageElement.offsetHeight / this.maxSize.height;
        }
    }
    resetCropperPosition() {
        this.cropperPositionService.resetCropperPosition(this.sourceImage, this.cropper, this.settings);
        this.doAutoCrop();
        this.imageVisible = true;
    }
    keyboardAccess(event) {
        this.changeKeyboardStepSize(event);
        this.keyboardMoveCropper(event);
    }
    changeKeyboardStepSize(event) {
        const key = +event.key;
        if (key >= 1 && key <= 9) {
            this.settings.stepSize = key;
        }
    }
    keyboardMoveCropper(event) {
        const keyboardWhiteList = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
        if (!(keyboardWhiteList.includes(event.key))) {
            return;
        }
        const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move;
        const position = event.altKey ? getInvertedPositionForKey(event.key) : getPositionForKey(event.key);
        const moveEvent = getEventForKey(event.key, this.settings.stepSize);
        event.preventDefault();
        event.stopPropagation();
        this.startMove({ clientX: 0, clientY: 0 }, moveType, position);
        this.moveImg(moveEvent);
        this.moveStop();
    }
    startMove(event, moveType, position = null) {
        if (this.moveStart?.active && this.moveStart?.type === MoveTypes.Pinch) {
            return;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        this.moveStart = {
            active: true,
            type: moveType,
            position,
            clientX: this.cropperPositionService.getClientX(event),
            clientY: this.cropperPositionService.getClientY(event),
            ...this.cropper
        };
    }
    startPinch(event) {
        if (!this.safeImgDataUrl) {
            return;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        this.moveStart = {
            active: true,
            type: MoveTypes.Pinch,
            position: 'center',
            clientX: this.cropper.x1 + (this.cropper.x2 - this.cropper.x1) / 2,
            clientY: this.cropper.y1 + (this.cropper.y2 - this.cropper.y1) / 2,
            ...this.cropper
        };
    }
    moveImg(event) {
        if (this.moveStart.active) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            if (this.moveStart.type === MoveTypes.Move) {
                this.cropperPositionService.move(event, this.moveStart, this.cropper);
                this.checkCropperPosition(true);
            }
            else if (this.moveStart.type === MoveTypes.Resize) {
                if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
                    this.cropperPositionService.resize(event, this.moveStart, this.cropper, this.maxSize, this.settings);
                }
                this.checkCropperPosition(false);
            }
            this.cd.detectChanges();
        }
    }
    onPinch(event) {
        if (this.moveStart.active) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            if (this.moveStart.type === MoveTypes.Pinch) {
                this.cropperPositionService.resize(event, this.moveStart, this.cropper, this.maxSize, this.settings);
                this.checkCropperPosition(false);
            }
            this.cd.detectChanges();
        }
    }
    setMaxSize() {
        if (this.sourceImage) {
            const sourceImageElement = this.sourceImage.nativeElement;
            this.maxSize.width = sourceImageElement.offsetWidth;
            this.maxSize.height = sourceImageElement.offsetHeight;
            this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
        }
    }
    setCropperScaledMinSize() {
        if (this.loadedImage?.transformed?.image) {
            this.setCropperScaledMinWidth();
            this.setCropperScaledMinHeight();
        }
        else {
            this.settings.cropperScaledMinWidth = 20;
            this.settings.cropperScaledMinHeight = 20;
        }
    }
    setCropperScaledMinWidth() {
        this.settings.cropperScaledMinWidth = this.cropperMinWidth > 0
            ? Math.max(20, this.cropperMinWidth / this.loadedImage.transformed.image.width * this.maxSize.width)
            : 20;
    }
    setCropperScaledMinHeight() {
        if (this.maintainAspectRatio) {
            this.settings.cropperScaledMinHeight = Math.max(20, this.settings.cropperScaledMinWidth / this.aspectRatio);
        }
        else if (this.cropperMinHeight > 0) {
            this.settings.cropperScaledMinHeight = Math.max(20, this.cropperMinHeight / this.loadedImage.transformed.image.height * this.maxSize.height);
        }
        else {
            this.settings.cropperScaledMinHeight = 20;
        }
    }
    setCropperScaledMaxSize() {
        if (this.loadedImage?.transformed?.image) {
            const ratio = this.loadedImage.transformed.size.width / this.maxSize.width;
            this.settings.cropperScaledMaxWidth = this.cropperMaxWidth > 20 ? this.cropperMaxWidth / ratio : this.maxSize.width;
            this.settings.cropperScaledMaxHeight = this.cropperMaxHeight > 20 ? this.cropperMaxHeight / ratio : this.maxSize.height;
            if (this.maintainAspectRatio) {
                if (this.settings.cropperScaledMaxWidth > this.settings.cropperScaledMaxHeight * this.aspectRatio) {
                    this.settings.cropperScaledMaxWidth = this.settings.cropperScaledMaxHeight * this.aspectRatio;
                }
                else if (this.settings.cropperScaledMaxWidth < this.settings.cropperScaledMaxHeight * this.aspectRatio) {
                    this.settings.cropperScaledMaxHeight = this.settings.cropperScaledMaxWidth / this.aspectRatio;
                }
            }
        }
        else {
            this.settings.cropperScaledMaxWidth = this.maxSize.width;
            this.settings.cropperScaledMaxHeight = this.maxSize.height;
        }
    }
    checkCropperPosition(maintainSize = false) {
        if (this.cropper.x1 < 0) {
            this.cropper.x2 -= maintainSize ? this.cropper.x1 : 0;
            this.cropper.x1 = 0;
        }
        if (this.cropper.y1 < 0) {
            this.cropper.y2 -= maintainSize ? this.cropper.y1 : 0;
            this.cropper.y1 = 0;
        }
        if (this.cropper.x2 > this.maxSize.width) {
            this.cropper.x1 -= maintainSize ? (this.cropper.x2 - this.maxSize.width) : 0;
            this.cropper.x2 = this.maxSize.width;
        }
        if (this.cropper.y2 > this.maxSize.height) {
            this.cropper.y1 -= maintainSize ? (this.cropper.y2 - this.maxSize.height) : 0;
            this.cropper.y2 = this.maxSize.height;
        }
    }
    moveStop() {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.doAutoCrop();
        }
    }
    pinchStop() {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.doAutoCrop();
        }
    }
    doAutoCrop() {
        if (this.autoCrop) {
            this.crop();
        }
    }
    crop() {
        if (this.loadedImage?.transformed?.image != null) {
            this.startCropImage.emit();
            const output = this.cropService.crop(this.sourceImage, this.loadedImage, this.cropper, this.settings);
            if (output != null) {
                this.imageCropped.emit(output);
            }
            return output;
        }
        return null;
    }
}
ImageCropperComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.1", ngImport: i0, type: ImageCropperComponent, deps: [{ token: i1.CropService }, { token: i2.CropperPositionService }, { token: i3.LoadImageService }, { token: i4.DomSanitizer }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
ImageCropperComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.1.1", type: ImageCropperComponent, selector: "image-cropper", inputs: { imageChangedEvent: "imageChangedEvent", imageURL: "imageURL", imageBase64: "imageBase64", imageFile: "imageFile", format: "format", transform: "transform", maintainAspectRatio: "maintainAspectRatio", aspectRatio: "aspectRatio", resizeToWidth: "resizeToWidth", resizeToHeight: "resizeToHeight", cropperMinWidth: "cropperMinWidth", cropperMinHeight: "cropperMinHeight", cropperMaxHeight: "cropperMaxHeight", cropperMaxWidth: "cropperMaxWidth", cropperStaticWidth: "cropperStaticWidth", cropperStaticHeight: "cropperStaticHeight", canvasRotation: "canvasRotation", initialStepSize: "initialStepSize", roundCropper: "roundCropper", onlyScaleDown: "onlyScaleDown", imageQuality: "imageQuality", autoCrop: "autoCrop", backgroundColor: "backgroundColor", containWithinAspectRatio: "containWithinAspectRatio", hideResizeSquares: "hideResizeSquares", cropper: "cropper", alignImage: "alignImage", disabled: "disabled" }, outputs: { imageCropped: "imageCropped", startCropImage: "startCropImage", imageLoaded: "imageLoaded", cropperReady: "cropperReady", loadImageFailed: "loadImageFailed" }, host: { listeners: { "window:resize": "onResize()", "document:mousemove": "moveImg($event)", "document:touchmove": "moveImg($event)", "document:mouseup": "moveStop()", "document:touchend": "moveStop()" }, properties: { "style.text-align": "this.alignImage", "class.disabled": "this.disabled" } }, viewQueries: [{ propertyName: "wrapper", first: true, predicate: ["wrapper"], descendants: true, static: true }, { propertyName: "sourceImage", first: true, predicate: ["sourceImage"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div [style.background]=\"imageVisible && backgroundColor\"\r\n     #wrapper\r\n>\r\n    <img\r\n      #sourceImage\r\n      class=\"ngx-ic-source-image\"\r\n      *ngIf=\"safeImgDataUrl\"\r\n      [src]=\"safeImgDataUrl\"\r\n      [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\r\n      [style.transform]=\"safeTransformStyle\"\r\n      (load)=\"imageLoadedInView()\"\r\n    />\r\n    <div\r\n        class=\"ngx-ic-overlay\"\r\n        [style.width.px]=\"maxSize.width\"\r\n        [style.height.px]=\"maxSize.height\"\r\n        [style.margin-left]=\"alignImage === 'center' ? marginLeft : null\"\r\n    ></div>\r\n    <div class=\"ngx-ic-cropper\"\r\n         *ngIf=\"imageVisible\"\r\n         [class.ngx-ic-round]=\"roundCropper\"\r\n         [style.top.px]=\"cropper.y1\"\r\n         [style.left.px]=\"cropper.x1\"\r\n         [style.width.px]=\"cropper.x2 - cropper.x1\"\r\n         [style.height.px]=\"cropper.y2 - cropper.y1\"\r\n         [style.margin-left]=\"alignImage === 'center' ? marginLeft : null\"\r\n         [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\r\n         (keydown)=\"keyboardAccess($event)\"\r\n         tabindex=\"0\"\r\n    >\r\n        <div\r\n            (mousedown)=\"startMove($event, moveTypes.Move)\"\r\n            (touchstart)=\"startMove($event, moveTypes.Move)\"\r\n            class=\"ngx-ic-move\">\r\n        </div>\r\n        <ng-container *ngIf=\"!hideResizeSquares\">\r\n            <span class=\"ngx-ic-resize ngx-ic-topleft\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'topleft')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'topleft')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-top\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-topright\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'topright')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'topright')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-right\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-bottomright\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottomright')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottomright')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-bottom\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-bottomleft\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottomleft')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottomleft')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-left\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-top\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'top')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'top')\">\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-right\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'right')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'right')\">\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-bottom\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottom')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottom')\">\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-left\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'left')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'left')\">\r\n            </span>\r\n        </ng-container>\r\n    </div>\r\n</div>\r\n", styles: [":host{display:flex;position:relative;width:100%;max-width:100%;max-height:100%;overflow:hidden;padding:5px;text-align:center}:host>div{width:100%;position:relative}:host>div img.ngx-ic-source-image{max-width:100%;max-height:100%;transform-origin:center}:host .ngx-ic-overlay{position:absolute;pointer-events:none;touch-action:none;outline:var(--cropper-overlay-color, white) solid 100vw;top:0;left:0}:host .ngx-ic-cropper{position:absolute;display:flex;color:#53535c;background:transparent;outline:rgba(255,255,255,.3) solid 100vw;outline:var(--cropper-outline-color, rgba(255, 255, 255, .3)) solid 100vw;touch-action:none}@media (orientation: portrait){:host .ngx-ic-cropper{outline-width:100vh}}:host .ngx-ic-cropper:after{position:absolute;content:\"\";top:0;bottom:0;left:0;right:0;pointer-events:none;border:dashed 1px;opacity:.75;color:inherit;z-index:1}:host .ngx-ic-cropper .ngx-ic-move{width:100%;cursor:move;border:1px solid rgba(255,255,255,.5)}:host .ngx-ic-cropper:focus .ngx-ic-move{border-color:#1e90ff;border-width:2px}:host .ngx-ic-cropper .ngx-ic-resize{position:absolute;display:inline-block;line-height:6px;padding:8px;opacity:.85;z-index:1}:host .ngx-ic-cropper .ngx-ic-resize .ngx-ic-square{display:inline-block;background:#53535C;width:6px;height:6px;border:1px solid rgba(255,255,255,.5);box-sizing:content-box}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-topleft{top:-12px;left:-12px;cursor:nwse-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-top{top:-12px;left:calc(50% - 12px);cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-topright{top:-12px;right:-12px;cursor:nesw-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-right{top:calc(50% - 12px);right:-12px;cursor:ew-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-bottomright{bottom:-12px;right:-12px;cursor:nwse-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-bottom{bottom:-12px;left:calc(50% - 12px);cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-bottomleft{bottom:-12px;left:-12px;cursor:nesw-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-left{top:calc(50% - 12px);left:-12px;cursor:ew-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar{position:absolute;z-index:1}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-top{top:-11px;left:11px;width:calc(100% - 22px);height:22px;cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-right{top:11px;right:-11px;height:calc(100% - 22px);width:22px;cursor:ew-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-bottom{bottom:-11px;left:11px;width:calc(100% - 22px);height:22px;cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-left{top:11px;left:-11px;height:calc(100% - 22px);width:22px;cursor:ew-resize}:host .ngx-ic-cropper.ngx-ic-round{outline-color:transparent}:host .ngx-ic-cropper.ngx-ic-round:after{border-radius:100%;box-shadow:0 0 0 100vw #ffffff4d;box-shadow:0 0 0 100vw var(--cropper-outline-color, rgba(255, 255, 255, .3))}@media (orientation: portrait){:host .ngx-ic-cropper.ngx-ic-round:after{box-shadow:0 0 0 100vh #ffffff4d;box-shadow:0 0 0 100vh var(--cropper-outline-color, rgba(255, 255, 255, .3))}}:host .ngx-ic-cropper.ngx-ic-round .ngx-ic-move{border-radius:100%}:host.disabled .ngx-ic-cropper .ngx-ic-resize,:host.disabled .ngx-ic-cropper .ngx-ic-resize-bar,:host.disabled .ngx-ic-cropper .ngx-ic-move{display:none}\n"], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.1", ngImport: i0, type: ImageCropperComponent, decorators: [{
            type: Component,
            args: [{ selector: 'image-cropper', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div [style.background]=\"imageVisible && backgroundColor\"\r\n     #wrapper\r\n>\r\n    <img\r\n      #sourceImage\r\n      class=\"ngx-ic-source-image\"\r\n      *ngIf=\"safeImgDataUrl\"\r\n      [src]=\"safeImgDataUrl\"\r\n      [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\r\n      [style.transform]=\"safeTransformStyle\"\r\n      (load)=\"imageLoadedInView()\"\r\n    />\r\n    <div\r\n        class=\"ngx-ic-overlay\"\r\n        [style.width.px]=\"maxSize.width\"\r\n        [style.height.px]=\"maxSize.height\"\r\n        [style.margin-left]=\"alignImage === 'center' ? marginLeft : null\"\r\n    ></div>\r\n    <div class=\"ngx-ic-cropper\"\r\n         *ngIf=\"imageVisible\"\r\n         [class.ngx-ic-round]=\"roundCropper\"\r\n         [style.top.px]=\"cropper.y1\"\r\n         [style.left.px]=\"cropper.x1\"\r\n         [style.width.px]=\"cropper.x2 - cropper.x1\"\r\n         [style.height.px]=\"cropper.y2 - cropper.y1\"\r\n         [style.margin-left]=\"alignImage === 'center' ? marginLeft : null\"\r\n         [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\r\n         (keydown)=\"keyboardAccess($event)\"\r\n         tabindex=\"0\"\r\n    >\r\n        <div\r\n            (mousedown)=\"startMove($event, moveTypes.Move)\"\r\n            (touchstart)=\"startMove($event, moveTypes.Move)\"\r\n            class=\"ngx-ic-move\">\r\n        </div>\r\n        <ng-container *ngIf=\"!hideResizeSquares\">\r\n            <span class=\"ngx-ic-resize ngx-ic-topleft\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'topleft')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'topleft')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-top\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-topright\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'topright')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'topright')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-right\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-bottomright\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottomright')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottomright')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-bottom\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-bottomleft\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottomleft')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottomleft')\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize ngx-ic-left\">\r\n                <span class=\"ngx-ic-square\"></span>\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-top\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'top')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'top')\">\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-right\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'right')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'right')\">\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-bottom\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottom')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottom')\">\r\n            </span>\r\n            <span class=\"ngx-ic-resize-bar ngx-ic-left\"\r\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'left')\"\r\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'left')\">\r\n            </span>\r\n        </ng-container>\r\n    </div>\r\n</div>\r\n", styles: [":host{display:flex;position:relative;width:100%;max-width:100%;max-height:100%;overflow:hidden;padding:5px;text-align:center}:host>div{width:100%;position:relative}:host>div img.ngx-ic-source-image{max-width:100%;max-height:100%;transform-origin:center}:host .ngx-ic-overlay{position:absolute;pointer-events:none;touch-action:none;outline:var(--cropper-overlay-color, white) solid 100vw;top:0;left:0}:host .ngx-ic-cropper{position:absolute;display:flex;color:#53535c;background:transparent;outline:rgba(255,255,255,.3) solid 100vw;outline:var(--cropper-outline-color, rgba(255, 255, 255, .3)) solid 100vw;touch-action:none}@media (orientation: portrait){:host .ngx-ic-cropper{outline-width:100vh}}:host .ngx-ic-cropper:after{position:absolute;content:\"\";top:0;bottom:0;left:0;right:0;pointer-events:none;border:dashed 1px;opacity:.75;color:inherit;z-index:1}:host .ngx-ic-cropper .ngx-ic-move{width:100%;cursor:move;border:1px solid rgba(255,255,255,.5)}:host .ngx-ic-cropper:focus .ngx-ic-move{border-color:#1e90ff;border-width:2px}:host .ngx-ic-cropper .ngx-ic-resize{position:absolute;display:inline-block;line-height:6px;padding:8px;opacity:.85;z-index:1}:host .ngx-ic-cropper .ngx-ic-resize .ngx-ic-square{display:inline-block;background:#53535C;width:6px;height:6px;border:1px solid rgba(255,255,255,.5);box-sizing:content-box}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-topleft{top:-12px;left:-12px;cursor:nwse-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-top{top:-12px;left:calc(50% - 12px);cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-topright{top:-12px;right:-12px;cursor:nesw-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-right{top:calc(50% - 12px);right:-12px;cursor:ew-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-bottomright{bottom:-12px;right:-12px;cursor:nwse-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-bottom{bottom:-12px;left:calc(50% - 12px);cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-bottomleft{bottom:-12px;left:-12px;cursor:nesw-resize}:host .ngx-ic-cropper .ngx-ic-resize.ngx-ic-left{top:calc(50% - 12px);left:-12px;cursor:ew-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar{position:absolute;z-index:1}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-top{top:-11px;left:11px;width:calc(100% - 22px);height:22px;cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-right{top:11px;right:-11px;height:calc(100% - 22px);width:22px;cursor:ew-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-bottom{bottom:-11px;left:11px;width:calc(100% - 22px);height:22px;cursor:ns-resize}:host .ngx-ic-cropper .ngx-ic-resize-bar.ngx-ic-left{top:11px;left:-11px;height:calc(100% - 22px);width:22px;cursor:ew-resize}:host .ngx-ic-cropper.ngx-ic-round{outline-color:transparent}:host .ngx-ic-cropper.ngx-ic-round:after{border-radius:100%;box-shadow:0 0 0 100vw #ffffff4d;box-shadow:0 0 0 100vw var(--cropper-outline-color, rgba(255, 255, 255, .3))}@media (orientation: portrait){:host .ngx-ic-cropper.ngx-ic-round:after{box-shadow:0 0 0 100vh #ffffff4d;box-shadow:0 0 0 100vh var(--cropper-outline-color, rgba(255, 255, 255, .3))}}:host .ngx-ic-cropper.ngx-ic-round .ngx-ic-move{border-radius:100%}:host.disabled .ngx-ic-cropper .ngx-ic-resize,:host.disabled .ngx-ic-cropper .ngx-ic-resize-bar,:host.disabled .ngx-ic-cropper .ngx-ic-move{display:none}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CropService }, { type: i2.CropperPositionService }, { type: i3.LoadImageService }, { type: i4.DomSanitizer }, { type: i0.ChangeDetectorRef }]; }, propDecorators: { wrapper: [{
                type: ViewChild,
                args: ['wrapper', { static: true }]
            }], sourceImage: [{
                type: ViewChild,
                args: ['sourceImage', { static: false }]
            }], imageChangedEvent: [{
                type: Input
            }], imageURL: [{
                type: Input
            }], imageBase64: [{
                type: Input
            }], imageFile: [{
                type: Input
            }], format: [{
                type: Input
            }], transform: [{
                type: Input
            }], maintainAspectRatio: [{
                type: Input
            }], aspectRatio: [{
                type: Input
            }], resizeToWidth: [{
                type: Input
            }], resizeToHeight: [{
                type: Input
            }], cropperMinWidth: [{
                type: Input
            }], cropperMinHeight: [{
                type: Input
            }], cropperMaxHeight: [{
                type: Input
            }], cropperMaxWidth: [{
                type: Input
            }], cropperStaticWidth: [{
                type: Input
            }], cropperStaticHeight: [{
                type: Input
            }], canvasRotation: [{
                type: Input
            }], initialStepSize: [{
                type: Input
            }], roundCropper: [{
                type: Input
            }], onlyScaleDown: [{
                type: Input
            }], imageQuality: [{
                type: Input
            }], autoCrop: [{
                type: Input
            }], backgroundColor: [{
                type: Input
            }], containWithinAspectRatio: [{
                type: Input
            }], hideResizeSquares: [{
                type: Input
            }], cropper: [{
                type: Input
            }], alignImage: [{
                type: HostBinding,
                args: ['style.text-align']
            }, {
                type: Input
            }], disabled: [{
                type: HostBinding,
                args: ['class.disabled']
            }, {
                type: Input
            }], imageCropped: [{
                type: Output
            }], startCropImage: [{
                type: Output
            }], imageLoaded: [{
                type: Output
            }], cropperReady: [{
                type: Output
            }], loadImageFailed: [{
                type: Output
            }], onResize: [{
                type: HostListener,
                args: ['window:resize']
            }], moveImg: [{
                type: HostListener,
                args: ['document:mousemove', ['$event']]
            }, {
                type: HostListener,
                args: ['document:touchmove', ['$event']]
            }], moveStop: [{
                type: HostListener,
                args: ['document:mouseup']
            }, {
                type: HostListener,
                args: ['document:touchend']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UtY3JvcHBlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtaW1hZ2UtY3JvcHBlci9zcmMvbGliL2NvbXBvbmVudC9pbWFnZS1jcm9wcGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1pbWFnZS1jcm9wcGVyL3NyYy9saWIvY29tcG9uZW50L2ltYWdlLWNyb3BwZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsWUFBWSxFQUNaLFdBQVcsRUFDWCxZQUFZLEVBQ1osS0FBSyxFQUNMLFNBQVMsRUFHVCxNQUFNLEVBRU4sU0FBUyxFQUNWLE1BQU0sZUFBZSxDQUFDO0FBSXZCLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNqRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFLL0QsT0FBTyxFQUFFLGNBQWMsRUFBRSx5QkFBeUIsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDOzs7Ozs7O0FBUXZHLE1BQU0sT0FBTyxxQkFBcUI7SUErRGhDLFlBQ1UsV0FBd0IsRUFDeEIsc0JBQThDLEVBQzlDLGdCQUFrQyxFQUNsQyxTQUF1QixFQUN2QixFQUFxQjtRQUpyQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQUN4QiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1FBQzlDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsY0FBUyxHQUFULFNBQVMsQ0FBYztRQUN2QixPQUFFLEdBQUYsRUFBRSxDQUFtQjtRQW5FdkIsV0FBTSxHQUFrQixNQUFjLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDM0QsYUFBUSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7UUFDakMsMkJB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Z0JBT0csVUFBVTtzQkFEbEIsV0FBVzt1QkFBQyxrQkFBa0I7O3NCQUM5QixLQUFLO2dCQUVHLFFBQVE7c0JBRGhCLFdBQVc7dUJBQUMsZ0JBQWdCOztzQkFDNUIsS0FBSztnQkFFSSxZQUFZO3NCQUFyQixNQUFNO2dCQUNHLGNBQWM7c0JBQXZCLE1BQU07Z0JBQ0csV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxZQUFZO3NCQUFyQixNQUFNO2dCQUNHLGVBQWU7c0JBQXhCLE1BQU07Z0JBb0xQLFFBQVE7c0JBRFAsWUFBWTt1QkFBQyxlQUFlO2dCQXNHN0IsT0FBTztzQkFGTixZQUFZO3VCQUFDLG9CQUFvQixFQUFFLENBQUMsUUFBUSxDQUFDOztzQkFDN0MsWUFBWTt1QkFBQyxvQkFBb0IsRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFtSDlDLFFBQVE7c0JBRlAsWUFBWTt1QkFBQyxrQkFBa0I7O3NCQUMvQixZQUFZO3VCQUFDLG1CQUFtQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXHJcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXHJcbiAgQ29tcG9uZW50LFxyXG4gIEVsZW1lbnRSZWYsXHJcbiAgRXZlbnRFbWl0dGVyLFxyXG4gIEhvc3RCaW5kaW5nLFxyXG4gIEhvc3RMaXN0ZW5lcixcclxuICBJbnB1dCxcclxuICBpc0Rldk1vZGUsXHJcbiAgT25DaGFuZ2VzLFxyXG4gIE9uSW5pdCxcclxuICBPdXRwdXQsXHJcbiAgU2ltcGxlQ2hhbmdlcyxcclxuICBWaWV3Q2hpbGRcclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgRG9tU2FuaXRpemVyLCBTYWZlU3R5bGUsIFNhZmVVcmwgfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcclxuaW1wb3J0IHsgQ3JvcHBlclBvc2l0aW9uLCBEaW1lbnNpb25zLCBJbWFnZUNyb3BwZWRFdmVudCwgSW1hZ2VUcmFuc2Zvcm0sIExvYWRlZEltYWdlLCBNb3ZlU3RhcnQgfSBmcm9tICcuLi9pbnRlcmZhY2VzJztcclxuaW1wb3J0IHsgT3V0cHV0Rm9ybWF0IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jcm9wcGVyLW9wdGlvbnMuaW50ZXJmYWNlJztcclxuaW1wb3J0IHsgQ3JvcHBlclNldHRpbmdzIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jcm9wcGVyLnNldHRpbmdzJztcclxuaW1wb3J0IHsgTW92ZVR5cGVzIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9tb3ZlLXN0YXJ0LmludGVyZmFjZSc7XHJcbmltcG9ydCB7IENyb3BTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvY3JvcC5zZXJ2aWNlJztcclxuaW1wb3J0IHsgQ3JvcHBlclBvc2l0aW9uU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2Nyb3BwZXItcG9zaXRpb24uc2VydmljZSc7XHJcbmltcG9ydCB7IExvYWRJbWFnZVNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9sb2FkLWltYWdlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBIYW1tZXJTdGF0aWMgfSBmcm9tICcuLi91dGlscy9oYW1tZXIudXRpbHMnO1xyXG5pbXBvcnQgeyBnZXRFdmVudEZvcktleSwgZ2V0SW52ZXJ0ZWRQb3NpdGlvbkZvcktleSwgZ2V0UG9zaXRpb25Gb3JLZXkgfSBmcm9tICcuLi91dGlscy9rZXlib2FyZC51dGlscyc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ2ltYWdlLWNyb3BwZXInLFxyXG4gIHRlbXBsYXRlVXJsOiAnLi9pbWFnZS1jcm9wcGVyLmNvbXBvbmVudC5odG1sJyxcclxuICBzdHlsZVVybHM6IFsnLi9pbWFnZS1jcm9wcGVyLmNvbXBvbmVudC5zY3NzJ10sXHJcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcclxufSlcclxuZXhwb3J0IGNsYXNzIEltYWdlQ3JvcHBlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgT25Jbml0IHtcclxuICBwcml2YXRlIEhhbW1lcjogSGFtbWVyU3RhdGljID0gKHdpbmRvdyBhcyBhbnkpPy5bJ0hhbW1lciddIHx8IG51bGw7XHJcbiAgcHJpdmF0ZSBzZXR0aW5ncyA9IG5ldyBDcm9wcGVyU2V0dGluZ3MoKTtcclxuICBwcml2YXRlIHNldEltYWdlTWF4U2l6ZVJldHJpZXMgPSAwO1xyXG4gIHByaXZhdGUgbW92ZVN0YXJ0PzogTW92ZVN0YXJ0O1xyXG4gIHByaXZhdGUgbG9hZGVkSW1hZ2U/OiBMb2FkZWRJbWFnZTtcclxuXHJcbiAgc2FmZUltZ0RhdGFVcmw/OiBTYWZlVXJsIHwgc3RyaW5nO1xyXG4gIHNhZmVUcmFuc2Zvcm1TdHlsZT86IFNhZmVTdHlsZSB8IHN0cmluZztcclxuICBtYXJnaW5MZWZ0OiBTYWZlU3R5bGUgfCBzdHJpbmcgPSAnMHB4JztcclxuICBtYXhTaXplOiBEaW1lbnNpb25zID0ge1xyXG4gICAgd2lkdGg6IDAsXHJcbiAgICBoZWlnaHQ6IDBcclxuICB9O1xyXG4gIG1vdmVUeXBlcyA9IE1vdmVUeXBlcztcclxuICBpbWFnZVZpc2libGUgPSBmYWxzZTtcclxuXHJcbiAgQFZpZXdDaGlsZCgnd3JhcHBlcicsIHsgc3RhdGljOiB0cnVlIH0pIHdyYXBwZXIhOiBFbGVtZW50UmVmPEhUTUxEaXZFbGVtZW50PjtcclxuICBAVmlld0NoaWxkKCdzb3VyY2VJbWFnZScsIHsgc3RhdGljOiBmYWxzZSB9KSBzb3VyY2VJbWFnZSE6IEVsZW1lbnRSZWY8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICBASW5wdXQoKSBpbWFnZUNoYW5nZWRFdmVudD86IGFueTtcclxuICBASW5wdXQoKSBpbWFnZVVSTD86IHN0cmluZztcclxuICBASW5wdXQoKSBpbWFnZUJhc2U2ND86IHN0cmluZztcclxuICBASW5wdXQoKSBpbWFnZUZpbGU/OiBGaWxlO1xyXG5cclxuICBASW5wdXQoKSBmb3JtYXQ6IE91dHB1dEZvcm1hdCA9IHRoaXMuc2V0dGluZ3MuZm9ybWF0O1xyXG4gIEBJbnB1dCgpIHRyYW5zZm9ybTogSW1hZ2VUcmFuc2Zvcm0gPSB7fTtcclxuICBASW5wdXQoKSBtYWludGFpbkFzcGVjdFJhdGlvID0gdGhpcy5zZXR0aW5ncy5tYWludGFpbkFzcGVjdFJhdGlvO1xyXG4gIEBJbnB1dCgpIGFzcGVjdFJhdGlvID0gdGhpcy5zZXR0aW5ncy5hc3BlY3RSYXRpbztcclxuICBASW5wdXQoKSByZXNpemVUb1dpZHRoID0gdGhpcy5zZXR0aW5ncy5yZXNpemVUb1dpZHRoO1xyXG4gIEBJbnB1dCgpIHJlc2l6ZVRvSGVpZ2h0ID0gdGhpcy5zZXR0aW5ncy5yZXNpemVUb0hlaWdodDtcclxuICBASW5wdXQoKSBjcm9wcGVyTWluV2lkdGggPSB0aGlzLnNldHRpbmdzLmNyb3BwZXJNaW5XaWR0aDtcclxuICBASW5wdXQoKSBjcm9wcGVyTWluSGVpZ2h0ID0gdGhpcy5zZXR0aW5ncy5jcm9wcGVyTWluSGVpZ2h0O1xyXG4gIEBJbnB1dCgpIGNyb3BwZXJNYXhIZWlnaHQgPSB0aGlzLnNldHRpbmdzLmNyb3BwZXJNYXhIZWlnaHQ7XHJcbiAgQElucHV0KCkgY3JvcHBlck1heFdpZHRoID0gdGhpcy5zZXR0aW5ncy5jcm9wcGVyTWF4V2lkdGg7XHJcbiAgQElucHV0KCkgY3JvcHBlclN0YXRpY1dpZHRoID0gdGhpcy5zZXR0aW5ncy5jcm9wcGVyU3RhdGljV2lkdGg7XHJcbiAgQElucHV0KCkgY3JvcHBlclN0YXRpY0hlaWdodCA9IHRoaXMuc2V0dGluZ3MuY3JvcHBlclN0YXRpY0hlaWdodDtcclxuICBASW5wdXQoKSBjYW52YXNSb3RhdGlvbiA9IHRoaXMuc2V0dGluZ3MuY2FudmFzUm90YXRpb247XHJcbiAgQElucHV0KCkgaW5pdGlhbFN0ZXBTaXplID0gdGhpcy5zZXR0aW5ncy5pbml0aWFsU3RlcFNpemU7XHJcbiAgQElucHV0KCkgcm91bmRDcm9wcGVyID0gdGhpcy5zZXR0aW5ncy5yb3VuZENyb3BwZXI7XHJcbiAgQElucHV0KCkgb25seVNjYWxlRG93biA9IHRoaXMuc2V0dGluZ3Mub25seVNjYWxlRG93bjtcclxuICBASW5wdXQoKSBpbWFnZVF1YWxpdHkgPSB0aGlzLnNldHRpbmdzLmltYWdlUXVhbGl0eTtcclxuICBASW5wdXQoKSBhdXRvQ3JvcCA9IHRoaXMuc2V0dGluZ3MuYXV0b0Nyb3A7XHJcbiAgQElucHV0KCkgYmFja2dyb3VuZENvbG9yID0gdGhpcy5zZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3I7XHJcbiAgQElucHV0KCkgY29udGFpbldpdGhpbkFzcGVjdFJhdGlvID0gdGhpcy5zZXR0aW5ncy5jb250YWluV2l0aGluQXNwZWN0UmF0aW87XHJcbiAgQElucHV0KCkgaGlkZVJlc2l6ZVNxdWFyZXMgPSB0aGlzLnNldHRpbmdzLmhpZGVSZXNpemVTcXVhcmVzO1xyXG4gIEBJbnB1dCgpIGNyb3BwZXI6IENyb3BwZXJQb3NpdGlvbiA9IHtcclxuICAgIHgxOiAtMTAwLFxyXG4gICAgeTE6IC0xMDAsXHJcbiAgICB4MjogMTAwMDAsXHJcbiAgICB5MjogMTAwMDBcclxuICB9O1xyXG4gIEBIb3N0QmluZGluZygnc3R5bGUudGV4dC1hbGlnbicpXHJcbiAgQElucHV0KCkgYWxpZ25JbWFnZTogJ2xlZnQnIHwgJ2NlbnRlcicgPSB0aGlzLnNldHRpbmdzLmFsaWduSW1hZ2U7XHJcbiAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kaXNhYmxlZCcpXHJcbiAgQElucHV0KCkgZGlzYWJsZWQgPSBmYWxzZTtcclxuXHJcbiAgQE91dHB1dCgpIGltYWdlQ3JvcHBlZCA9IG5ldyBFdmVudEVtaXR0ZXI8SW1hZ2VDcm9wcGVkRXZlbnQ+KCk7XHJcbiAgQE91dHB1dCgpIHN0YXJ0Q3JvcEltYWdlID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG4gIEBPdXRwdXQoKSBpbWFnZUxvYWRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8TG9hZGVkSW1hZ2U+KCk7XHJcbiAgQE91dHB1dCgpIGNyb3BwZXJSZWFkeSA9IG5ldyBFdmVudEVtaXR0ZXI8RGltZW5zaW9ucz4oKTtcclxuICBAT3V0cHV0KCkgbG9hZEltYWdlRmFpbGVkID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgY3JvcFNlcnZpY2U6IENyb3BTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBjcm9wcGVyUG9zaXRpb25TZXJ2aWNlOiBDcm9wcGVyUG9zaXRpb25TZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBsb2FkSW1hZ2VTZXJ2aWNlOiBMb2FkSW1hZ2VTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBzYW5pdGl6ZXI6IERvbVNhbml0aXplcixcclxuICAgIHByaXZhdGUgY2Q6IENoYW5nZURldGVjdG9yUmVmXHJcbiAgKSB7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICB0aGlzLm9uQ2hhbmdlc1VwZGF0ZVNldHRpbmdzKGNoYW5nZXMpO1xyXG4gICAgdGhpcy5vbkNoYW5nZXNJbnB1dEltYWdlKGNoYW5nZXMpO1xyXG5cclxuICAgIGlmICh0aGlzLmxvYWRlZEltYWdlPy5vcmlnaW5hbC5pbWFnZS5jb21wbGV0ZSAmJiAoY2hhbmdlc1snY29udGFpbldpdGhpbkFzcGVjdFJhdGlvJ10gfHwgY2hhbmdlc1snY2FudmFzUm90YXRpb24nXSkpIHtcclxuICAgICAgdGhpcy5sb2FkSW1hZ2VTZXJ2aWNlXHJcbiAgICAgICAgLnRyYW5zZm9ybUxvYWRlZEltYWdlKHRoaXMubG9hZGVkSW1hZ2UsIHRoaXMuc2V0dGluZ3MpXHJcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gdGhpcy5zZXRMb2FkZWRJbWFnZShyZXMpKVxyXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB0aGlzLmxvYWRJbWFnZUVycm9yKGVycikpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNoYW5nZXNbJ2Nyb3BwZXInXSB8fCBjaGFuZ2VzWydtYWludGFpbkFzcGVjdFJhdGlvJ10gfHwgY2hhbmdlc1snYXNwZWN0UmF0aW8nXSkge1xyXG4gICAgICB0aGlzLnNldE1heFNpemUoKTtcclxuICAgICAgdGhpcy5zZXRDcm9wcGVyU2NhbGVkTWluU2l6ZSgpO1xyXG4gICAgICB0aGlzLnNldENyb3BwZXJTY2FsZWRNYXhTaXplKCk7XHJcbiAgICAgIGlmICh0aGlzLm1haW50YWluQXNwZWN0UmF0aW8gJiYgKGNoYW5nZXNbJ21haW50YWluQXNwZWN0UmF0aW8nXSB8fCBjaGFuZ2VzWydhc3BlY3RSYXRpbyddKSkge1xyXG4gICAgICAgIHRoaXMucmVzZXRDcm9wcGVyUG9zaXRpb24oKTtcclxuICAgICAgfSBlbHNlIGlmIChjaGFuZ2VzWydjcm9wcGVyJ10pIHtcclxuICAgICAgICB0aGlzLmNoZWNrQ3JvcHBlclBvc2l0aW9uKGZhbHNlKTtcclxuICAgICAgICB0aGlzLmRvQXV0b0Nyb3AoKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmNkLm1hcmtGb3JDaGVjaygpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNoYW5nZXNbJ3RyYW5zZm9ybSddKSB7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtID0gdGhpcy50cmFuc2Zvcm0gfHwge307XHJcbiAgICAgIHRoaXMuc2V0Q3NzVHJhbnNmb3JtKCk7XHJcbiAgICAgIHRoaXMuZG9BdXRvQ3JvcCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvbkNoYW5nZXNVcGRhdGVTZXR0aW5ncyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XHJcbiAgICB0aGlzLnNldHRpbmdzLnNldE9wdGlvbnNGcm9tQ2hhbmdlcyhjaGFuZ2VzKTtcclxuXHJcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5jcm9wcGVyU3RhdGljSGVpZ2h0ICYmIHRoaXMuc2V0dGluZ3MuY3JvcHBlclN0YXRpY1dpZHRoKSB7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3Muc2V0T3B0aW9ucyh7XHJcbiAgICAgICAgaGlkZVJlc2l6ZVNxdWFyZXM6IHRydWUsXHJcbiAgICAgICAgY3JvcHBlck1pbldpZHRoOiB0aGlzLnNldHRpbmdzLmNyb3BwZXJTdGF0aWNXaWR0aCxcclxuICAgICAgICBjcm9wcGVyTWluSGVpZ2h0OiB0aGlzLnNldHRpbmdzLmNyb3BwZXJTdGF0aWNIZWlnaHQsXHJcbiAgICAgICAgY3JvcHBlck1heEhlaWdodDogdGhpcy5zZXR0aW5ncy5jcm9wcGVyU3RhdGljSGVpZ2h0LFxyXG4gICAgICAgIGNyb3BwZXJNYXhXaWR0aDogdGhpcy5zZXR0aW5ncy5jcm9wcGVyU3RhdGljV2lkdGgsXHJcbiAgICAgICAgbWFpbnRhaW5Bc3BlY3RSYXRpbzogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uQ2hhbmdlc0lucHV0SW1hZ2UoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgaWYgKGNoYW5nZXNbJ2ltYWdlQ2hhbmdlZEV2ZW50J10gfHwgY2hhbmdlc1snaW1hZ2VVUkwnXSB8fCBjaGFuZ2VzWydpbWFnZUJhc2U2NCddIHx8IGNoYW5nZXNbJ2ltYWdlRmlsZSddKSB7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH1cclxuICAgIGlmIChjaGFuZ2VzWydpbWFnZUNoYW5nZWRFdmVudCddICYmIHRoaXMuaXNWYWxpZEltYWdlQ2hhbmdlZEV2ZW50KCkpIHtcclxuICAgICAgdGhpcy5sb2FkSW1hZ2VGaWxlKHRoaXMuaW1hZ2VDaGFuZ2VkRXZlbnQudGFyZ2V0LmZpbGVzWzBdKTtcclxuICAgIH1cclxuICAgIGlmIChjaGFuZ2VzWydpbWFnZVVSTCddICYmIHRoaXMuaW1hZ2VVUkwpIHtcclxuICAgICAgdGhpcy5sb2FkSW1hZ2VGcm9tVVJMKHRoaXMuaW1hZ2VVUkwpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNoYW5nZXNbJ2ltYWdlQmFzZTY0J10gJiYgdGhpcy5pbWFnZUJhc2U2NCkge1xyXG4gICAgICB0aGlzLmxvYWRCYXNlNjRJbWFnZSh0aGlzLmltYWdlQmFzZTY0KTtcclxuICAgIH1cclxuICAgIGlmIChjaGFuZ2VzWydpbWFnZUZpbGUnXSAmJiB0aGlzLmltYWdlRmlsZSkge1xyXG4gICAgICB0aGlzLmxvYWRJbWFnZUZpbGUodGhpcy5pbWFnZUZpbGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpc1ZhbGlkSW1hZ2VDaGFuZ2VkRXZlbnQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pbWFnZUNoYW5nZWRFdmVudD8udGFyZ2V0Py5maWxlcz8ubGVuZ3RoID4gMDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2V0Q3NzVHJhbnNmb3JtKCkge1xyXG4gICAgdGhpcy5zYWZlVHJhbnNmb3JtU3R5bGUgPSB0aGlzLnNhbml0aXplci5ieXBhc3NTZWN1cml0eVRydXN0U3R5bGUoXHJcbiAgICAgICdzY2FsZVgoJyArICh0aGlzLnRyYW5zZm9ybS5zY2FsZSB8fCAxKSAqICh0aGlzLnRyYW5zZm9ybS5mbGlwSCA/IC0xIDogMSkgKyAnKScgK1xyXG4gICAgICAnc2NhbGVZKCcgKyAodGhpcy50cmFuc2Zvcm0uc2NhbGUgfHwgMSkgKiAodGhpcy50cmFuc2Zvcm0uZmxpcFYgPyAtMSA6IDEpICsgJyknICtcclxuICAgICAgJ3JvdGF0ZSgnICsgKHRoaXMudHJhbnNmb3JtLnJvdGF0ZSB8fCAwKSArICdkZWcpJyArXHJcbiAgICAgIGB0cmFuc2xhdGUoJHt0aGlzLnRyYW5zZm9ybS50cmFuc2xhdGVIIHx8IDB9JSwgJHt0aGlzLnRyYW5zZm9ybS50cmFuc2xhdGVWIHx8IDB9JSlgXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgbmdPbkluaXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnNldHRpbmdzLnN0ZXBTaXplID0gdGhpcy5pbml0aWFsU3RlcFNpemU7XHJcbiAgICB0aGlzLmFjdGl2YXRlUGluY2hHZXN0dXJlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc2V0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5pbWFnZVZpc2libGUgPSBmYWxzZTtcclxuICAgIHRoaXMubG9hZGVkSW1hZ2UgPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLnNhZmVJbWdEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnJ1xyXG4gICAgICArICdvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQUMwbEVRVlFZVjJOZ0FBSUFBQVUnXHJcbiAgICAgICsgJ0FBYXJWeUZFQUFBQUFTVVZPUks1Q1lJST0nO1xyXG4gICAgdGhpcy5tb3ZlU3RhcnQgPSB7XHJcbiAgICAgIGFjdGl2ZTogZmFsc2UsXHJcbiAgICAgIHR5cGU6IG51bGwsXHJcbiAgICAgIHBvc2l0aW9uOiBudWxsLFxyXG4gICAgICB4MTogMCxcclxuICAgICAgeTE6IDAsXHJcbiAgICAgIHgyOiAwLFxyXG4gICAgICB5MjogMCxcclxuICAgICAgY2xpZW50WDogMCxcclxuICAgICAgY2xpZW50WTogMFxyXG4gICAgfTtcclxuICAgIHRoaXMubWF4U2l6ZSA9IHtcclxuICAgICAgd2lkdGg6IDAsXHJcbiAgICAgIGhlaWdodDogMFxyXG4gICAgfTtcclxuICAgIHRoaXMuY3JvcHBlci54MSA9IC0xMDA7XHJcbiAgICB0aGlzLmNyb3BwZXIueTEgPSAtMTAwO1xyXG4gICAgdGhpcy5jcm9wcGVyLngyID0gMTAwMDA7XHJcbiAgICB0aGlzLmNyb3BwZXIueTIgPSAxMDAwMDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbG9hZEltYWdlRmlsZShmaWxlOiBGaWxlKTogdm9pZCB7XHJcbiAgICB0aGlzLmxvYWRJbWFnZVNlcnZpY2VcclxuICAgICAgLmxvYWRJbWFnZUZpbGUoZmlsZSwgdGhpcy5zZXR0aW5ncylcclxuICAgICAgLnRoZW4oKHJlcykgPT4gdGhpcy5zZXRMb2FkZWRJbWFnZShyZXMpKVxyXG4gICAgICAuY2F0Y2goKGVycikgPT4gdGhpcy5sb2FkSW1hZ2VFcnJvcihlcnIpKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbG9hZEJhc2U2NEltYWdlKGltYWdlQmFzZTY0OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIHRoaXMubG9hZEltYWdlU2VydmljZVxyXG4gICAgICAubG9hZEJhc2U2NEltYWdlKGltYWdlQmFzZTY0LCB0aGlzLnNldHRpbmdzKVxyXG4gICAgICAudGhlbigocmVzKSA9PiB0aGlzLnNldExvYWRlZEltYWdlKHJlcykpXHJcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB0aGlzLmxvYWRJbWFnZUVycm9yKGVycikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBsb2FkSW1hZ2VGcm9tVVJMKHVybDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0aGlzLmxvYWRJbWFnZVNlcnZpY2VcclxuICAgICAgLmxvYWRJbWFnZUZyb21VUkwodXJsLCB0aGlzLnNldHRpbmdzKVxyXG4gICAgICAudGhlbigocmVzKSA9PiB0aGlzLnNldExvYWRlZEltYWdlKHJlcykpXHJcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB0aGlzLmxvYWRJbWFnZUVycm9yKGVycikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRMb2FkZWRJbWFnZShsb2FkZWRJbWFnZTogTG9hZGVkSW1hZ2UpOiB2b2lkIHtcclxuICAgIHRoaXMubG9hZGVkSW1hZ2UgPSBsb2FkZWRJbWFnZTtcclxuICAgIHRoaXMuc2FmZUltZ0RhdGFVcmwgPSB0aGlzLnNhbml0aXplci5ieXBhc3NTZWN1cml0eVRydXN0UmVzb3VyY2VVcmwobG9hZGVkSW1hZ2UudHJhbnNmb3JtZWQuYmFzZTY0KTtcclxuICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvYWRJbWFnZUVycm9yKGVycm9yOiBhbnkpOiB2b2lkIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgdGhpcy5sb2FkSW1hZ2VGYWlsZWQuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgaW1hZ2VMb2FkZWRJblZpZXcoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5sb2FkZWRJbWFnZSAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuaW1hZ2VMb2FkZWQuZW1pdCh0aGlzLmxvYWRlZEltYWdlKTtcclxuICAgICAgdGhpcy5zZXRJbWFnZU1heFNpemVSZXRyaWVzID0gMDtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNoZWNrSW1hZ2VNYXhTaXplUmVjdXJzaXZlbHkoKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNoZWNrSW1hZ2VNYXhTaXplUmVjdXJzaXZlbHkoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5zZXRJbWFnZU1heFNpemVSZXRyaWVzID4gNDApIHtcclxuICAgICAgdGhpcy5sb2FkSW1hZ2VGYWlsZWQuZW1pdCgpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnNvdXJjZUltYWdlTG9hZGVkKCkpIHtcclxuICAgICAgdGhpcy5zZXRNYXhTaXplKCk7XHJcbiAgICAgIHRoaXMuc2V0Q3JvcHBlclNjYWxlZE1pblNpemUoKTtcclxuICAgICAgdGhpcy5zZXRDcm9wcGVyU2NhbGVkTWF4U2l6ZSgpO1xyXG4gICAgICB0aGlzLnJlc2V0Q3JvcHBlclBvc2l0aW9uKCk7XHJcbiAgICAgIHRoaXMuY3JvcHBlclJlYWR5LmVtaXQoeyAuLi50aGlzLm1heFNpemUgfSk7XHJcbiAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnNldEltYWdlTWF4U2l6ZVJldHJpZXMrKztcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNoZWNrSW1hZ2VNYXhTaXplUmVjdXJzaXZlbHkoKSwgNTApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzb3VyY2VJbWFnZUxvYWRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnNvdXJjZUltYWdlPy5uYXRpdmVFbGVtZW50Py5vZmZzZXRXaWR0aCA+IDA7XHJcbiAgfVxyXG5cclxuICBASG9zdExpc3RlbmVyKCd3aW5kb3c6cmVzaXplJylcclxuICBvblJlc2l6ZSgpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5sb2FkZWRJbWFnZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLnJlc2l6ZUNyb3BwZXJQb3NpdGlvbigpO1xyXG4gICAgdGhpcy5zZXRNYXhTaXplKCk7XHJcbiAgICB0aGlzLnNldENyb3BwZXJTY2FsZWRNaW5TaXplKCk7XHJcbiAgICB0aGlzLnNldENyb3BwZXJTY2FsZWRNYXhTaXplKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFjdGl2YXRlUGluY2hHZXN0dXJlKCkge1xyXG4gICAgaWYgKHRoaXMuSGFtbWVyKSB7XHJcbiAgICAgIGNvbnN0IGhhbW1lciA9IG5ldyB0aGlzLkhhbW1lcih0aGlzLndyYXBwZXIubmF0aXZlRWxlbWVudCk7XHJcbiAgICAgIGhhbW1lci5nZXQoJ3BpbmNoJykuc2V0KHsgZW5hYmxlOiB0cnVlIH0pO1xyXG4gICAgICBoYW1tZXIub24oJ3BpbmNobW92ZScsIHRoaXMub25QaW5jaC5iaW5kKHRoaXMpKTtcclxuICAgICAgaGFtbWVyLm9uKCdwaW5jaGVuZCcsIHRoaXMucGluY2hTdG9wLmJpbmQodGhpcykpO1xyXG4gICAgICBoYW1tZXIub24oJ3BpbmNoc3RhcnQnLCB0aGlzLnN0YXJ0UGluY2guYmluZCh0aGlzKSk7XHJcbiAgICB9IGVsc2UgaWYgKGlzRGV2TW9kZSgpKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignW05neEltYWdlQ3JvcHBlcl0gQ291bGQgbm90IGZpbmQgSGFtbWVySlMgLSBQaW5jaCBHZXN0dXJlIHdvblxcJ3Qgd29yaycpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXNpemVDcm9wcGVyUG9zaXRpb24oKTogdm9pZCB7XHJcbiAgICBjb25zdCBzb3VyY2VJbWFnZUVsZW1lbnQgPSB0aGlzLnNvdXJjZUltYWdlLm5hdGl2ZUVsZW1lbnQ7XHJcbiAgICBpZiAodGhpcy5tYXhTaXplLndpZHRoICE9PSBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggfHwgdGhpcy5tYXhTaXplLmhlaWdodCAhPT0gc291cmNlSW1hZ2VFbGVtZW50Lm9mZnNldEhlaWdodCkge1xyXG4gICAgICB0aGlzLmNyb3BwZXIueDEgPSB0aGlzLmNyb3BwZXIueDEgKiBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLm1heFNpemUud2lkdGg7XHJcbiAgICAgIHRoaXMuY3JvcHBlci54MiA9IHRoaXMuY3JvcHBlci54MiAqIHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRXaWR0aCAvIHRoaXMubWF4U2l6ZS53aWR0aDtcclxuICAgICAgdGhpcy5jcm9wcGVyLnkxID0gdGhpcy5jcm9wcGVyLnkxICogc291cmNlSW1hZ2VFbGVtZW50Lm9mZnNldEhlaWdodCAvIHRoaXMubWF4U2l6ZS5oZWlnaHQ7XHJcbiAgICAgIHRoaXMuY3JvcHBlci55MiA9IHRoaXMuY3JvcHBlci55MiAqIHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRIZWlnaHQgLyB0aGlzLm1heFNpemUuaGVpZ2h0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVzZXRDcm9wcGVyUG9zaXRpb24oKTogdm9pZCB7XHJcbiAgICB0aGlzLmNyb3BwZXJQb3NpdGlvblNlcnZpY2UucmVzZXRDcm9wcGVyUG9zaXRpb24odGhpcy5zb3VyY2VJbWFnZSwgdGhpcy5jcm9wcGVyLCB0aGlzLnNldHRpbmdzKTtcclxuICAgIHRoaXMuZG9BdXRvQ3JvcCgpO1xyXG4gICAgdGhpcy5pbWFnZVZpc2libGUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAga2V5Ym9hcmRBY2Nlc3MoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuICAgIHRoaXMuY2hhbmdlS2V5Ym9hcmRTdGVwU2l6ZShldmVudCk7XHJcbiAgICB0aGlzLmtleWJvYXJkTW92ZUNyb3BwZXIoZXZlbnQpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjaGFuZ2VLZXlib2FyZFN0ZXBTaXplKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XHJcbiAgICBjb25zdCBrZXkgPSArZXZlbnQua2V5O1xyXG4gICAgaWYgKGtleSA+PSAxICYmIGtleSA8PSA5KSB7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3RlcFNpemUgPSBrZXk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGtleWJvYXJkTW92ZUNyb3BwZXIoZXZlbnQ6IGFueSkge1xyXG4gICAgY29uc3Qga2V5Ym9hcmRXaGl0ZUxpc3Q6IHN0cmluZ1tdID0gWydBcnJvd1VwJywgJ0Fycm93RG93bicsICdBcnJvd1JpZ2h0JywgJ0Fycm93TGVmdCddO1xyXG4gICAgaWYgKCEoa2V5Ym9hcmRXaGl0ZUxpc3QuaW5jbHVkZXMoZXZlbnQua2V5KSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW92ZVR5cGUgPSBldmVudC5zaGlmdEtleSA/IE1vdmVUeXBlcy5SZXNpemUgOiBNb3ZlVHlwZXMuTW92ZTtcclxuICAgIGNvbnN0IHBvc2l0aW9uID0gZXZlbnQuYWx0S2V5ID8gZ2V0SW52ZXJ0ZWRQb3NpdGlvbkZvcktleShldmVudC5rZXkpIDogZ2V0UG9zaXRpb25Gb3JLZXkoZXZlbnQua2V5KTtcclxuICAgIGNvbnN0IG1vdmVFdmVudCA9IGdldEV2ZW50Rm9yS2V5KGV2ZW50LmtleSwgdGhpcy5zZXR0aW5ncy5zdGVwU2l6ZSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB0aGlzLnN0YXJ0TW92ZSh7IGNsaWVudFg6IDAsIGNsaWVudFk6IDAgfSwgbW92ZVR5cGUsIHBvc2l0aW9uKTtcclxuICAgIHRoaXMubW92ZUltZyhtb3ZlRXZlbnQpO1xyXG4gICAgdGhpcy5tb3ZlU3RvcCgpO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRNb3ZlKGV2ZW50OiBhbnksIG1vdmVUeXBlOiBNb3ZlVHlwZXMsIHBvc2l0aW9uOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMubW92ZVN0YXJ0Py5hY3RpdmUgJiYgdGhpcy5tb3ZlU3RhcnQ/LnR5cGUgPT09IE1vdmVUeXBlcy5QaW5jaCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIH1cclxuICAgIHRoaXMubW92ZVN0YXJ0ID0ge1xyXG4gICAgICBhY3RpdmU6IHRydWUsXHJcbiAgICAgIHR5cGU6IG1vdmVUeXBlLFxyXG4gICAgICBwb3NpdGlvbixcclxuICAgICAgY2xpZW50WDogdGhpcy5jcm9wcGVyUG9zaXRpb25TZXJ2aWNlLmdldENsaWVudFgoZXZlbnQpLFxyXG4gICAgICBjbGllbnRZOiB0aGlzLmNyb3BwZXJQb3NpdGlvblNlcnZpY2UuZ2V0Q2xpZW50WShldmVudCksXHJcbiAgICAgIC4uLnRoaXMuY3JvcHBlclxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHN0YXJ0UGluY2goZXZlbnQ6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnNhZmVJbWdEYXRhVXJsKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tb3ZlU3RhcnQgPSB7XHJcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcclxuICAgICAgdHlwZTogTW92ZVR5cGVzLlBpbmNoLFxyXG4gICAgICBwb3NpdGlvbjogJ2NlbnRlcicsXHJcbiAgICAgIGNsaWVudFg6IHRoaXMuY3JvcHBlci54MSArICh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLmNyb3BwZXIueDEpIC8gMixcclxuICAgICAgY2xpZW50WTogdGhpcy5jcm9wcGVyLnkxICsgKHRoaXMuY3JvcHBlci55MiAtIHRoaXMuY3JvcHBlci55MSkgLyAyLFxyXG4gICAgICAuLi50aGlzLmNyb3BwZXJcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBASG9zdExpc3RlbmVyKCdkb2N1bWVudDptb3VzZW1vdmUnLCBbJyRldmVudCddKVxyXG4gIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OnRvdWNobW92ZScsIFsnJGV2ZW50J10pXHJcbiAgbW92ZUltZyhldmVudDogYW55KTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5tb3ZlU3RhcnQhLmFjdGl2ZSkge1xyXG4gICAgICBpZiAoZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XHJcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5tb3ZlU3RhcnQhLnR5cGUgPT09IE1vdmVUeXBlcy5Nb3ZlKSB7XHJcbiAgICAgICAgdGhpcy5jcm9wcGVyUG9zaXRpb25TZXJ2aWNlLm1vdmUoZXZlbnQsIHRoaXMubW92ZVN0YXJ0ISwgdGhpcy5jcm9wcGVyKTtcclxuICAgICAgICB0aGlzLmNoZWNrQ3JvcHBlclBvc2l0aW9uKHRydWUpO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMubW92ZVN0YXJ0IS50eXBlID09PSBNb3ZlVHlwZXMuUmVzaXplKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNyb3BwZXJTdGF0aWNXaWR0aCAmJiAhdGhpcy5jcm9wcGVyU3RhdGljSGVpZ2h0KSB7XHJcbiAgICAgICAgICB0aGlzLmNyb3BwZXJQb3NpdGlvblNlcnZpY2UucmVzaXplKGV2ZW50LCB0aGlzLm1vdmVTdGFydCEsIHRoaXMuY3JvcHBlciwgdGhpcy5tYXhTaXplLCB0aGlzLnNldHRpbmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jaGVja0Nyb3BwZXJQb3NpdGlvbihmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5jZC5kZXRlY3RDaGFuZ2VzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBvblBpbmNoKGV2ZW50OiBhbnkpIHtcclxuICAgIGlmICh0aGlzLm1vdmVTdGFydCEuYWN0aXZlKSB7XHJcbiAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIHtcclxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLm1vdmVTdGFydCEudHlwZSA9PT0gTW92ZVR5cGVzLlBpbmNoKSB7XHJcbiAgICAgICAgdGhpcy5jcm9wcGVyUG9zaXRpb25TZXJ2aWNlLnJlc2l6ZShldmVudCwgdGhpcy5tb3ZlU3RhcnQhLCB0aGlzLmNyb3BwZXIsIHRoaXMubWF4U2l6ZSwgdGhpcy5zZXR0aW5ncyk7XHJcbiAgICAgICAgdGhpcy5jaGVja0Nyb3BwZXJQb3NpdGlvbihmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5jZC5kZXRlY3RDaGFuZ2VzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldE1heFNpemUoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5zb3VyY2VJbWFnZSkge1xyXG4gICAgICBjb25zdCBzb3VyY2VJbWFnZUVsZW1lbnQgPSB0aGlzLnNvdXJjZUltYWdlLm5hdGl2ZUVsZW1lbnQ7XHJcbiAgICAgIHRoaXMubWF4U2l6ZS53aWR0aCA9IHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRXaWR0aDtcclxuICAgICAgdGhpcy5tYXhTaXplLmhlaWdodCA9IHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgIHRoaXMubWFyZ2luTGVmdCA9IHRoaXMuc2FuaXRpemVyLmJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSgnY2FsYyg1MCUgLSAnICsgdGhpcy5tYXhTaXplLndpZHRoIC8gMiArICdweCknKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2V0Q3JvcHBlclNjYWxlZE1pblNpemUoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5sb2FkZWRJbWFnZT8udHJhbnNmb3JtZWQ/LmltYWdlKSB7XHJcbiAgICAgIHRoaXMuc2V0Q3JvcHBlclNjYWxlZE1pbldpZHRoKCk7XHJcbiAgICAgIHRoaXMuc2V0Q3JvcHBlclNjYWxlZE1pbkhlaWdodCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zZXR0aW5ncy5jcm9wcGVyU2NhbGVkTWluV2lkdGggPSAyMDtcclxuICAgICAgdGhpcy5zZXR0aW5ncy5jcm9wcGVyU2NhbGVkTWluSGVpZ2h0ID0gMjA7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldENyb3BwZXJTY2FsZWRNaW5XaWR0aCgpOiB2b2lkIHtcclxuICAgIHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1pbldpZHRoID0gdGhpcy5jcm9wcGVyTWluV2lkdGggPiAwXHJcbiAgICAgID8gTWF0aC5tYXgoMjAsIHRoaXMuY3JvcHBlck1pbldpZHRoIC8gdGhpcy5sb2FkZWRJbWFnZSEudHJhbnNmb3JtZWQuaW1hZ2Uud2lkdGggKiB0aGlzLm1heFNpemUud2lkdGgpXHJcbiAgICAgIDogMjA7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldENyb3BwZXJTY2FsZWRNaW5IZWlnaHQoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5tYWludGFpbkFzcGVjdFJhdGlvKSB7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1pbkhlaWdodCA9IE1hdGgubWF4KDIwLCB0aGlzLnNldHRpbmdzLmNyb3BwZXJTY2FsZWRNaW5XaWR0aCAvIHRoaXMuYXNwZWN0UmF0aW8pO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmNyb3BwZXJNaW5IZWlnaHQgPiAwKSB7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1pbkhlaWdodCA9IE1hdGgubWF4KFxyXG4gICAgICAgIDIwLFxyXG4gICAgICAgIHRoaXMuY3JvcHBlck1pbkhlaWdodCAvIHRoaXMubG9hZGVkSW1hZ2UhLnRyYW5zZm9ybWVkLmltYWdlLmhlaWdodCAqIHRoaXMubWF4U2l6ZS5oZWlnaHRcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1pbkhlaWdodCA9IDIwO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRDcm9wcGVyU2NhbGVkTWF4U2l6ZSgpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLmxvYWRlZEltYWdlPy50cmFuc2Zvcm1lZD8uaW1hZ2UpIHtcclxuICAgICAgY29uc3QgcmF0aW8gPSB0aGlzLmxvYWRlZEltYWdlLnRyYW5zZm9ybWVkLnNpemUud2lkdGggLyB0aGlzLm1heFNpemUud2lkdGg7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1heFdpZHRoID0gdGhpcy5jcm9wcGVyTWF4V2lkdGggPiAyMCA/IHRoaXMuY3JvcHBlck1heFdpZHRoIC8gcmF0aW8gOiB0aGlzLm1heFNpemUud2lkdGg7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1heEhlaWdodCA9IHRoaXMuY3JvcHBlck1heEhlaWdodCA+IDIwID8gdGhpcy5jcm9wcGVyTWF4SGVpZ2h0IC8gcmF0aW8gOiB0aGlzLm1heFNpemUuaGVpZ2h0O1xyXG4gICAgICBpZiAodGhpcy5tYWludGFpbkFzcGVjdFJhdGlvKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY3JvcHBlclNjYWxlZE1heFdpZHRoID4gdGhpcy5zZXR0aW5ncy5jcm9wcGVyU2NhbGVkTWF4SGVpZ2h0ICogdGhpcy5hc3BlY3RSYXRpbykge1xyXG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy5jcm9wcGVyU2NhbGVkTWF4V2lkdGggPSB0aGlzLnNldHRpbmdzLmNyb3BwZXJTY2FsZWRNYXhIZWlnaHQgKiB0aGlzLmFzcGVjdFJhdGlvO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5jcm9wcGVyU2NhbGVkTWF4V2lkdGggPCB0aGlzLnNldHRpbmdzLmNyb3BwZXJTY2FsZWRNYXhIZWlnaHQgKiB0aGlzLmFzcGVjdFJhdGlvKSB7XHJcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLmNyb3BwZXJTY2FsZWRNYXhIZWlnaHQgPSB0aGlzLnNldHRpbmdzLmNyb3BwZXJTY2FsZWRNYXhXaWR0aCAvIHRoaXMuYXNwZWN0UmF0aW87XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnNldHRpbmdzLmNyb3BwZXJTY2FsZWRNYXhXaWR0aCA9IHRoaXMubWF4U2l6ZS53aWR0aDtcclxuICAgICAgdGhpcy5zZXR0aW5ncy5jcm9wcGVyU2NhbGVkTWF4SGVpZ2h0ID0gdGhpcy5tYXhTaXplLmhlaWdodDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgY2hlY2tDcm9wcGVyUG9zaXRpb24obWFpbnRhaW5TaXplID0gZmFsc2UpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLmNyb3BwZXIueDEgPCAwKSB7XHJcbiAgICAgIHRoaXMuY3JvcHBlci54MiAtPSBtYWludGFpblNpemUgPyB0aGlzLmNyb3BwZXIueDEgOiAwO1xyXG4gICAgICB0aGlzLmNyb3BwZXIueDEgPSAwO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuY3JvcHBlci55MSA8IDApIHtcclxuICAgICAgdGhpcy5jcm9wcGVyLnkyIC09IG1haW50YWluU2l6ZSA/IHRoaXMuY3JvcHBlci55MSA6IDA7XHJcbiAgICAgIHRoaXMuY3JvcHBlci55MSA9IDA7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5jcm9wcGVyLngyID4gdGhpcy5tYXhTaXplLndpZHRoKSB7XHJcbiAgICAgIHRoaXMuY3JvcHBlci54MSAtPSBtYWludGFpblNpemUgPyAodGhpcy5jcm9wcGVyLngyIC0gdGhpcy5tYXhTaXplLndpZHRoKSA6IDA7XHJcbiAgICAgIHRoaXMuY3JvcHBlci54MiA9IHRoaXMubWF4U2l6ZS53aWR0aDtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLmNyb3BwZXIueTIgPiB0aGlzLm1heFNpemUuaGVpZ2h0KSB7XHJcbiAgICAgIHRoaXMuY3JvcHBlci55MSAtPSBtYWludGFpblNpemUgPyAodGhpcy5jcm9wcGVyLnkyIC0gdGhpcy5tYXhTaXplLmhlaWdodCkgOiAwO1xyXG4gICAgICB0aGlzLmNyb3BwZXIueTIgPSB0aGlzLm1heFNpemUuaGVpZ2h0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6bW91c2V1cCcpXHJcbiAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6dG91Y2hlbmQnKVxyXG4gIG1vdmVTdG9wKCk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMubW92ZVN0YXJ0IS5hY3RpdmUpIHtcclxuICAgICAgdGhpcy5tb3ZlU3RhcnQhLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmRvQXV0b0Nyb3AoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHBpbmNoU3RvcCgpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLm1vdmVTdGFydCEuYWN0aXZlKSB7XHJcbiAgICAgIHRoaXMubW92ZVN0YXJ0IS5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgdGhpcy5kb0F1dG9Dcm9wKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGRvQXV0b0Nyb3AoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5hdXRvQ3JvcCkge1xyXG4gICAgICB0aGlzLmNyb3AoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNyb3AoKTogSW1hZ2VDcm9wcGVkRXZlbnQgfCBudWxsIHtcclxuICAgIGlmICh0aGlzLmxvYWRlZEltYWdlPy50cmFuc2Zvcm1lZD8uaW1hZ2UgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLnN0YXJ0Q3JvcEltYWdlLmVtaXQoKTtcclxuICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5jcm9wU2VydmljZS5jcm9wKHRoaXMuc291cmNlSW1hZ2UsIHRoaXMubG9hZGVkSW1hZ2UsIHRoaXMuY3JvcHBlciwgdGhpcy5zZXR0aW5ncyk7XHJcbiAgICAgIGlmIChvdXRwdXQgIT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuaW1hZ2VDcm9wcGVkLmVtaXQob3V0cHV0KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcbiIsIjxkaXYgW3N0eWxlLmJhY2tncm91bmRdPVwiaW1hZ2VWaXNpYmxlICYmIGJhY2tncm91bmRDb2xvclwiXHJcbiAgICAgI3dyYXBwZXJcclxuPlxyXG4gICAgPGltZ1xyXG4gICAgICAjc291cmNlSW1hZ2VcclxuICAgICAgY2xhc3M9XCJuZ3gtaWMtc291cmNlLWltYWdlXCJcclxuICAgICAgKm5nSWY9XCJzYWZlSW1nRGF0YVVybFwiXHJcbiAgICAgIFtzcmNdPVwic2FmZUltZ0RhdGFVcmxcIlxyXG4gICAgICBbc3R5bGUudmlzaWJpbGl0eV09XCJpbWFnZVZpc2libGUgPyAndmlzaWJsZScgOiAnaGlkZGVuJ1wiXHJcbiAgICAgIFtzdHlsZS50cmFuc2Zvcm1dPVwic2FmZVRyYW5zZm9ybVN0eWxlXCJcclxuICAgICAgKGxvYWQpPVwiaW1hZ2VMb2FkZWRJblZpZXcoKVwiXHJcbiAgICAvPlxyXG4gICAgPGRpdlxyXG4gICAgICAgIGNsYXNzPVwibmd4LWljLW92ZXJsYXlcIlxyXG4gICAgICAgIFtzdHlsZS53aWR0aC5weF09XCJtYXhTaXplLndpZHRoXCJcclxuICAgICAgICBbc3R5bGUuaGVpZ2h0LnB4XT1cIm1heFNpemUuaGVpZ2h0XCJcclxuICAgICAgICBbc3R5bGUubWFyZ2luLWxlZnRdPVwiYWxpZ25JbWFnZSA9PT0gJ2NlbnRlcicgPyBtYXJnaW5MZWZ0IDogbnVsbFwiXHJcbiAgICA+PC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwibmd4LWljLWNyb3BwZXJcIlxyXG4gICAgICAgICAqbmdJZj1cImltYWdlVmlzaWJsZVwiXHJcbiAgICAgICAgIFtjbGFzcy5uZ3gtaWMtcm91bmRdPVwicm91bmRDcm9wcGVyXCJcclxuICAgICAgICAgW3N0eWxlLnRvcC5weF09XCJjcm9wcGVyLnkxXCJcclxuICAgICAgICAgW3N0eWxlLmxlZnQucHhdPVwiY3JvcHBlci54MVwiXHJcbiAgICAgICAgIFtzdHlsZS53aWR0aC5weF09XCJjcm9wcGVyLngyIC0gY3JvcHBlci54MVwiXHJcbiAgICAgICAgIFtzdHlsZS5oZWlnaHQucHhdPVwiY3JvcHBlci55MiAtIGNyb3BwZXIueTFcIlxyXG4gICAgICAgICBbc3R5bGUubWFyZ2luLWxlZnRdPVwiYWxpZ25JbWFnZSA9PT0gJ2NlbnRlcicgPyBtYXJnaW5MZWZ0IDogbnVsbFwiXHJcbiAgICAgICAgIFtzdHlsZS52aXNpYmlsaXR5XT1cImltYWdlVmlzaWJsZSA/ICd2aXNpYmxlJyA6ICdoaWRkZW4nXCJcclxuICAgICAgICAgKGtleWRvd24pPVwia2V5Ym9hcmRBY2Nlc3MoJGV2ZW50KVwiXHJcbiAgICAgICAgIHRhYmluZGV4PVwiMFwiXHJcbiAgICA+XHJcbiAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAobW91c2Vkb3duKT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5Nb3ZlKVwiXHJcbiAgICAgICAgICAgICh0b3VjaHN0YXJ0KT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5Nb3ZlKVwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwibmd4LWljLW1vdmVcIj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwiIWhpZGVSZXNpemVTcXVhcmVzXCI+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXJlc2l6ZSBuZ3gtaWMtdG9wbGVmdFwiXHJcbiAgICAgICAgICAgICAgICAgIChtb3VzZWRvd24pPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ3RvcGxlZnQnKVwiXHJcbiAgICAgICAgICAgICAgICAgICh0b3VjaHN0YXJ0KT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5SZXNpemUsICd0b3BsZWZ0JylcIj5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXNxdWFyZVwiPjwvc3Bhbj5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5neC1pYy1yZXNpemUgbmd4LWljLXRvcFwiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtc3F1YXJlXCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXJlc2l6ZSBuZ3gtaWMtdG9wcmlnaHRcIlxyXG4gICAgICAgICAgICAgICAgICAobW91c2Vkb3duKT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5SZXNpemUsICd0b3ByaWdodCcpXCJcclxuICAgICAgICAgICAgICAgICAgKHRvdWNoc3RhcnQpPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ3RvcHJpZ2h0JylcIj5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXNxdWFyZVwiPjwvc3Bhbj5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5neC1pYy1yZXNpemUgbmd4LWljLXJpZ2h0XCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5neC1pYy1zcXVhcmVcIj48L3NwYW4+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtcmVzaXplIG5neC1pYy1ib3R0b21yaWdodFwiXHJcbiAgICAgICAgICAgICAgICAgIChtb3VzZWRvd24pPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ2JvdHRvbXJpZ2h0JylcIlxyXG4gICAgICAgICAgICAgICAgICAodG91Y2hzdGFydCk9XCJzdGFydE1vdmUoJGV2ZW50LCBtb3ZlVHlwZXMuUmVzaXplLCAnYm90dG9tcmlnaHQnKVwiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtc3F1YXJlXCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXJlc2l6ZSBuZ3gtaWMtYm90dG9tXCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5neC1pYy1zcXVhcmVcIj48L3NwYW4+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtcmVzaXplIG5neC1pYy1ib3R0b21sZWZ0XCJcclxuICAgICAgICAgICAgICAgICAgKG1vdXNlZG93bik9XCJzdGFydE1vdmUoJGV2ZW50LCBtb3ZlVHlwZXMuUmVzaXplLCAnYm90dG9tbGVmdCcpXCJcclxuICAgICAgICAgICAgICAgICAgKHRvdWNoc3RhcnQpPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ2JvdHRvbWxlZnQnKVwiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtc3F1YXJlXCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXJlc2l6ZSBuZ3gtaWMtbGVmdFwiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtc3F1YXJlXCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXJlc2l6ZS1iYXIgbmd4LWljLXRvcFwiXHJcbiAgICAgICAgICAgICAgICAgIChtb3VzZWRvd24pPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ3RvcCcpXCJcclxuICAgICAgICAgICAgICAgICAgKHRvdWNoc3RhcnQpPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ3RvcCcpXCI+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZ3gtaWMtcmVzaXplLWJhciBuZ3gtaWMtcmlnaHRcIlxyXG4gICAgICAgICAgICAgICAgICAobW91c2Vkb3duKT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5SZXNpemUsICdyaWdodCcpXCJcclxuICAgICAgICAgICAgICAgICAgKHRvdWNoc3RhcnQpPVwic3RhcnRNb3ZlKCRldmVudCwgbW92ZVR5cGVzLlJlc2l6ZSwgJ3JpZ2h0JylcIj5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5neC1pYy1yZXNpemUtYmFyIG5neC1pYy1ib3R0b21cIlxyXG4gICAgICAgICAgICAgICAgICAobW91c2Vkb3duKT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5SZXNpemUsICdib3R0b20nKVwiXHJcbiAgICAgICAgICAgICAgICAgICh0b3VjaHN0YXJ0KT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5SZXNpemUsICdib3R0b20nKVwiPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmd4LWljLXJlc2l6ZS1iYXIgbmd4LWljLWxlZnRcIlxyXG4gICAgICAgICAgICAgICAgICAobW91c2Vkb3duKT1cInN0YXJ0TW92ZSgkZXZlbnQsIG1vdmVUeXBlcy5SZXNpemUsICdsZWZ0JylcIlxyXG4gICAgICAgICAgICAgICAgICAodG91Y2hzdGFydCk9XCJzdGFydE1vdmUoJGV2ZW50LCBtb3ZlVHlwZXMuUmVzaXplLCAnbGVmdCcpXCI+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cclxuICAgIDwvZGl2PlxyXG48L2Rpdj5cclxuIl19