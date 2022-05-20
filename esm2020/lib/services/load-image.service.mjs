import { Injectable } from '@angular/core';
import { getTransformationsFromExifData, supportsAutomaticRotation } from '../utils/exif.utils';
import * as i0 from "@angular/core";
export class LoadImageService {
    constructor() {
        this.autoRotateSupported = supportsAutomaticRotation();
    }
    loadImageFile(file, cropperSettings) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = (event) => {
                this.loadImage(event.target.result, file.type, cropperSettings)
                    .then(resolve)
                    .catch(reject);
            };
            fileReader.readAsDataURL(file);
        });
    }
    loadImage(imageBase64, imageType, cropperSettings) {
        if (!this.isValidImageType(imageType)) {
            return Promise.reject(new Error('Invalid image type'));
        }
        return this.loadBase64Image(imageBase64, cropperSettings);
    }
    isValidImageType(type) {
        return /image\/(png|jpg|jpeg|bmp|gif|tiff|webp|x-icon|vnd.microsoft.icon)/.test(type);
    }
    loadImageFromURL(url, cropperSettings) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onerror = () => reject;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context?.drawImage(img, 0, 0);
                this.loadBase64Image(canvas.toDataURL(), cropperSettings).then(resolve);
            };
            img.crossOrigin = 'anonymous';
            img.src = url;
        });
    }
    loadBase64Image(imageBase64, cropperSettings) {
        return new Promise((resolve, reject) => {
            const originalImage = new Image();
            originalImage.onload = () => resolve({
                originalImage,
                originalBase64: imageBase64
            });
            originalImage.onerror = reject;
            originalImage.src = imageBase64;
        }).then((res) => this.transformImageBase64(res, cropperSettings));
    }
    async transformImageBase64(res, cropperSettings) {
        const autoRotate = await this.autoRotateSupported;
        const exifTransform = await getTransformationsFromExifData(autoRotate ? -1 : res.originalBase64);
        if (!res.originalImage || !res.originalImage.complete) {
            return Promise.reject(new Error('No image loaded'));
        }
        const loadedImage = {
            original: {
                base64: res.originalBase64,
                image: res.originalImage,
                size: {
                    width: res.originalImage.naturalWidth,
                    height: res.originalImage.naturalHeight
                }
            },
            exifTransform
        };
        return this.transformLoadedImage(loadedImage, cropperSettings);
    }
    async transformLoadedImage(loadedImage, cropperSettings) {
        const canvasRotation = cropperSettings.canvasRotation + loadedImage.exifTransform.rotate;
        const originalSize = {
            width: loadedImage.original.image.naturalWidth,
            height: loadedImage.original.image.naturalHeight
        };
        if (canvasRotation === 0 && !loadedImage.exifTransform.flip && !cropperSettings.containWithinAspectRatio) {
            return {
                original: {
                    base64: loadedImage.original.base64,
                    image: loadedImage.original.image,
                    size: { ...originalSize }
                },
                transformed: {
                    base64: loadedImage.original.base64,
                    image: loadedImage.original.image,
                    size: { ...originalSize }
                },
                exifTransform: loadedImage.exifTransform
            };
        }
        const transformedSize = this.getTransformedSize(originalSize, loadedImage.exifTransform, cropperSettings);
        const canvas = document.createElement('canvas');
        canvas.width = transformedSize.width;
        canvas.height = transformedSize.height;
        const ctx = canvas.getContext('2d');
        ctx?.setTransform(loadedImage.exifTransform.flip ? -1 : 1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
        ctx?.rotate(Math.PI * (canvasRotation / 2));
        ctx?.drawImage(loadedImage.original.image, -originalSize.width / 2, -originalSize.height / 2);
        const transformedBase64 = canvas.toDataURL();
        const transformedImage = await this.loadImageFromBase64(transformedBase64);
        return {
            original: {
                base64: loadedImage.original.base64,
                image: loadedImage.original.image,
                size: { ...originalSize }
            },
            transformed: {
                base64: transformedBase64,
                image: transformedImage,
                size: {
                    width: transformedImage.width,
                    height: transformedImage.height
                }
            },
            exifTransform: loadedImage.exifTransform
        };
    }
    loadImageFromBase64(imageBase64) {
        return new Promise(((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = imageBase64;
        }));
    }
    getTransformedSize(originalSize, exifTransform, cropperSettings) {
        const canvasRotation = cropperSettings.canvasRotation + exifTransform.rotate;
        if (cropperSettings.containWithinAspectRatio) {
            if (canvasRotation % 2) {
                const minWidthToContain = originalSize.width * cropperSettings.aspectRatio;
                const minHeightToContain = originalSize.height / cropperSettings.aspectRatio;
                return {
                    width: Math.max(originalSize.height, minWidthToContain),
                    height: Math.max(originalSize.width, minHeightToContain)
                };
            }
            else {
                const minWidthToContain = originalSize.height * cropperSettings.aspectRatio;
                const minHeightToContain = originalSize.width / cropperSettings.aspectRatio;
                return {
                    width: Math.max(originalSize.width, minWidthToContain),
                    height: Math.max(originalSize.height, minHeightToContain)
                };
            }
        }
        if (canvasRotation % 2) {
            return {
                height: originalSize.width,
                width: originalSize.height
            };
        }
        return {
            width: originalSize.width,
            height: originalSize.height
        };
    }
}
LoadImageService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.1", ngImport: i0, type: LoadImageService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
LoadImageService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.1.1", ngImport: i0, type: LoadImageService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.1", ngImport: i0, type: LoadImageService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1pbWFnZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWltYWdlLWNyb3BwZXIvc3JjL2xpYi9zZXJ2aWNlcy9sb2FkLWltYWdlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUkzQyxPQUFPLEVBQUUsOEJBQThCLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQzs7QUFRaEcsTUFBTSxPQUFPLGdCQUFnQjtJQUQ3QjtRQUdVLHdCQUFtQixHQUFxQix5QkFBeUIsRUFBRSxDQUFDO0tBbUw3RTtJQWpMQyxhQUFhLENBQUMsSUFBVSxFQUFFLGVBQWdDO1FBQ3hELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNwQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBVSxFQUFFLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7cUJBQzVELElBQUksQ0FBQyxPQUFPLENBQUM7cUJBQ2IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25CLENBQUMsQ0FBQztZQUNGLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sU0FBUyxDQUFDLFdBQW1CLEVBQUUsU0FBaUIsRUFBRSxlQUFnQztRQUN4RixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3JDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxvQkFB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Q0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQztpQkFDekQsQ0FBQzthQUNIO2lCQUFNO2dCQUNMLE1BQU0saUJBQWlCLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDO2dCQUM1RSxNQUFNLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxLQUFLLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQztnQkFDNUUsT0FBTztvQkFDTCxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDO29CQUN0RCxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDO2lCQUMxRCxDQUFDO2FBQ0g7U0FDRjtRQUVELElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtZQUN0QixPQUFPO2dCQUNMLE1BQU0sRUFBRSxZQUFZLENBQUMsS0FBSztnQkFDMUIsS0FBSyxFQUFFLFlBQVksQ0FBQyxNQUFNO2FBQzNCLENBQUM7U0FDSDtRQUNELE9BQU87WUFDTCxLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7WUFDekIsTUFBTSxFQUFFLFlBQVksQ0FBQyxNQUFNO1NBQzVCLENBQUM7SUFDSixDQUFDOzs2R0FwTFUsZ0JBQWdCO2lIQUFoQixnQkFBZ0IsY0FESixNQUFNOzJGQUNsQixnQkFBZ0I7a0JBRDVCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBEaW1lbnNpb25zLCBMb2FkZWRJbWFnZSB9IGZyb20gJy4uL2ludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBDcm9wcGVyU2V0dGluZ3MgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2Nyb3BwZXIuc2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBFeGlmVHJhbnNmb3JtIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9leGlmLXRyYW5zZm9ybS5pbnRlcmZhY2UnO1xyXG5pbXBvcnQgeyBnZXRUcmFuc2Zvcm1hdGlvbnNGcm9tRXhpZkRhdGEsIHN1cHBvcnRzQXV0b21hdGljUm90YXRpb24gfSBmcm9tICcuLi91dGlscy9leGlmLnV0aWxzJztcclxuXHJcbmludGVyZmFjZSBMb2FkSW1hZ2VCYXNlNjQge1xyXG4gIG9yaWdpbmFsSW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQ7XHJcbiAgb3JpZ2luYWxCYXNlNjQ6IHN0cmluZztcclxufVxyXG5cclxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXHJcbmV4cG9ydCBjbGFzcyBMb2FkSW1hZ2VTZXJ2aWNlIHtcclxuXHJcbiAgcHJpdmF0ZSBhdXRvUm90YXRlU3VwcG9ydGVkOiBQcm9taXNlPGJvb2xlYW4+ID0gc3VwcG9ydHNBdXRvbWF0aWNSb3RhdGlvbigpO1xyXG5cclxuICBsb2FkSW1hZ2VGaWxlKGZpbGU6IEZpbGUsIGNyb3BwZXJTZXR0aW5nczogQ3JvcHBlclNldHRpbmdzKTogUHJvbWlzZTxMb2FkZWRJbWFnZT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgIGZpbGVSZWFkZXIub25sb2FkID0gKGV2ZW50OiBhbnkpID0+IHtcclxuICAgICAgICB0aGlzLmxvYWRJbWFnZShldmVudC50YXJnZXQucmVzdWx0LCBmaWxlLnR5cGUsIGNyb3BwZXJTZXR0aW5ncylcclxuICAgICAgICAgIC50aGVuKHJlc29sdmUpXHJcbiAgICAgICAgICAuY2F0Y2gocmVqZWN0KTtcclxuICAgICAgfTtcclxuICAgICAgZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvYWRJbWFnZShpbWFnZUJhc2U2NDogc3RyaW5nLCBpbWFnZVR5cGU6IHN0cmluZywgY3JvcHBlclNldHRpbmdzOiBDcm9wcGVyU2V0dGluZ3MpOiBQcm9taXNlPExvYWRlZEltYWdlPiB7XHJcbiAgICBpZiAoIXRoaXMuaXNWYWxpZEltYWdlVHlwZShpbWFnZVR5cGUpKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaW1hZ2UgdHlwZScpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmxvYWRCYXNlNjRJbWFnZShpbWFnZUJhc2U2NCwgY3JvcHBlclNldHRpbmdzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaXNWYWxpZEltYWdlVHlwZSh0eXBlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAvaW1hZ2VcXC8ocG5nfGpwZ3xqcGVnfGJtcHxnaWZ8dGlmZnx3ZWJwfHgtaWNvbnx2bmQubWljcm9zb2Z0Lmljb24pLy50ZXN0KHR5cGUpO1xyXG4gIH1cclxuXHJcbiAgbG9hZEltYWdlRnJvbVVSTCh1cmw6IHN0cmluZywgY3JvcHBlclNldHRpbmdzOiBDcm9wcGVyU2V0dGluZ3MpOiBQcm9taXNlPExvYWRlZEltYWdlPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3Q7XHJcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGltZy53aWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcclxuICAgICAgICBjb250ZXh0Py5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmxvYWRCYXNlNjRJbWFnZShjYW52YXMudG9EYXRhVVJMKCksIGNyb3BwZXJTZXR0aW5ncykudGhlbihyZXNvbHZlKTtcclxuICAgICAgfTtcclxuICAgICAgaW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcbiAgICAgIGltZy5zcmMgPSB1cmw7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGxvYWRCYXNlNjRJbWFnZShpbWFnZUJhc2U2NDogc3RyaW5nLCBjcm9wcGVyU2V0dGluZ3M6IENyb3BwZXJTZXR0aW5ncyk6IFByb21pc2U8TG9hZGVkSW1hZ2U+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxMb2FkSW1hZ2VCYXNlNjQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3Qgb3JpZ2luYWxJbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICBvcmlnaW5hbEltYWdlLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoe1xyXG4gICAgICAgIG9yaWdpbmFsSW1hZ2UsXHJcbiAgICAgICAgb3JpZ2luYWxCYXNlNjQ6IGltYWdlQmFzZTY0XHJcbiAgICAgIH0pO1xyXG4gICAgICBvcmlnaW5hbEltYWdlLm9uZXJyb3IgPSByZWplY3Q7XHJcbiAgICAgIG9yaWdpbmFsSW1hZ2Uuc3JjID0gaW1hZ2VCYXNlNjQ7XHJcbiAgICB9KS50aGVuKChyZXM6IExvYWRJbWFnZUJhc2U2NCkgPT4gdGhpcy50cmFuc2Zvcm1JbWFnZUJhc2U2NChyZXMsIGNyb3BwZXJTZXR0aW5ncykpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyB0cmFuc2Zvcm1JbWFnZUJhc2U2NChyZXM6IExvYWRJbWFnZUJhc2U2NCwgY3JvcHBlclNldHRpbmdzOiBDcm9wcGVyU2V0dGluZ3MpOiBQcm9taXNlPExvYWRlZEltYWdlPiB7XHJcbiAgICBjb25zdCBhdXRvUm90YXRlID0gYXdhaXQgdGhpcy5hdXRvUm90YXRlU3VwcG9ydGVkO1xyXG4gICAgY29uc3QgZXhpZlRyYW5zZm9ybSA9IGF3YWl0IGdldFRyYW5zZm9ybWF0aW9uc0Zyb21FeGlmRGF0YShhdXRvUm90YXRlID8gLTEgOiByZXMub3JpZ2luYWxCYXNlNjQpO1xyXG4gICAgaWYgKCFyZXMub3JpZ2luYWxJbWFnZSB8fCAhcmVzLm9yaWdpbmFsSW1hZ2UuY29tcGxldGUpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gaW1hZ2UgbG9hZGVkJykpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9hZGVkSW1hZ2UgPSB7XHJcbiAgICAgIG9yaWdpbmFsOiB7XHJcbiAgICAgICAgYmFzZTY0OiByZXMub3JpZ2luYWxCYXNlNjQsXHJcbiAgICAgICAgaW1hZ2U6IHJlcy5vcmlnaW5hbEltYWdlLFxyXG4gICAgICAgIHNpemU6IHtcclxuICAgICAgICAgIHdpZHRoOiByZXMub3JpZ2luYWxJbWFnZS5uYXR1cmFsV2lkdGgsXHJcbiAgICAgICAgICBoZWlnaHQ6IHJlcy5vcmlnaW5hbEltYWdlLm5hdHVyYWxIZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGV4aWZUcmFuc2Zvcm1cclxuICAgIH07XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Mb2FkZWRJbWFnZShsb2FkZWRJbWFnZSwgY3JvcHBlclNldHRpbmdzKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHRyYW5zZm9ybUxvYWRlZEltYWdlKGxvYWRlZEltYWdlOiBQYXJ0aWFsPExvYWRlZEltYWdlPiwgY3JvcHBlclNldHRpbmdzOiBDcm9wcGVyU2V0dGluZ3MpOiBQcm9taXNlPExvYWRlZEltYWdlPiB7XHJcbiAgICBjb25zdCBjYW52YXNSb3RhdGlvbiA9IGNyb3BwZXJTZXR0aW5ncy5jYW52YXNSb3RhdGlvbiArIGxvYWRlZEltYWdlLmV4aWZUcmFuc2Zvcm0hLnJvdGF0ZTtcclxuICAgIGNvbnN0IG9yaWdpbmFsU2l6ZSA9IHtcclxuICAgICAgd2lkdGg6IGxvYWRlZEltYWdlLm9yaWdpbmFsIS5pbWFnZS5uYXR1cmFsV2lkdGgsXHJcbiAgICAgIGhlaWdodDogbG9hZGVkSW1hZ2Uub3JpZ2luYWwhLmltYWdlLm5hdHVyYWxIZWlnaHRcclxuICAgIH07XHJcbiAgICBpZiAoY2FudmFzUm90YXRpb24gPT09IDAgJiYgIWxvYWRlZEltYWdlLmV4aWZUcmFuc2Zvcm0hLmZsaXAgJiYgIWNyb3BwZXJTZXR0aW5ncy5jb250YWluV2l0aGluQXNwZWN0UmF0aW8pIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBvcmlnaW5hbDoge1xyXG4gICAgICAgICAgYmFzZTY0OiBsb2FkZWRJbWFnZS5vcmlnaW5hbCEuYmFzZTY0LFxyXG4gICAgICAgICAgaW1hZ2U6IGxvYWRlZEltYWdlLm9yaWdpbmFsIS5pbWFnZSxcclxuICAgICAgICAgIHNpemU6IHsuLi5vcmlnaW5hbFNpemV9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0cmFuc2Zvcm1lZDoge1xyXG4gICAgICAgICAgYmFzZTY0OiBsb2FkZWRJbWFnZS5vcmlnaW5hbCEuYmFzZTY0LFxyXG4gICAgICAgICAgaW1hZ2U6IGxvYWRlZEltYWdlLm9yaWdpbmFsIS5pbWFnZSxcclxuICAgICAgICAgIHNpemU6IHsuLi5vcmlnaW5hbFNpemV9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBleGlmVHJhbnNmb3JtOiBsb2FkZWRJbWFnZS5leGlmVHJhbnNmb3JtIVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkU2l6ZSA9IHRoaXMuZ2V0VHJhbnNmb3JtZWRTaXplKG9yaWdpbmFsU2l6ZSwgbG9hZGVkSW1hZ2UuZXhpZlRyYW5zZm9ybSEsIGNyb3BwZXJTZXR0aW5ncyk7XHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIGNhbnZhcy53aWR0aCA9IHRyYW5zZm9ybWVkU2l6ZS53aWR0aDtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSB0cmFuc2Zvcm1lZFNpemUuaGVpZ2h0O1xyXG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICBjdHg/LnNldFRyYW5zZm9ybShcclxuICAgICAgbG9hZGVkSW1hZ2UuZXhpZlRyYW5zZm9ybSEuZmxpcCA/IC0xIDogMSxcclxuICAgICAgMCxcclxuICAgICAgMCxcclxuICAgICAgMSxcclxuICAgICAgY2FudmFzLndpZHRoIC8gMixcclxuICAgICAgY2FudmFzLmhlaWdodCAvIDJcclxuICAgICk7XHJcbiAgICBjdHg/LnJvdGF0ZShNYXRoLlBJICogKGNhbnZhc1JvdGF0aW9uIC8gMikpO1xyXG4gICAgY3R4Py5kcmF3SW1hZ2UoXHJcbiAgICAgIGxvYWRlZEltYWdlLm9yaWdpbmFsIS5pbWFnZSxcclxuICAgICAgLW9yaWdpbmFsU2l6ZS53aWR0aCAvIDIsXHJcbiAgICAgIC1vcmlnaW5hbFNpemUuaGVpZ2h0IC8gMlxyXG4gICAgKTtcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkQmFzZTY0ID0gY2FudmFzLnRvRGF0YVVSTCgpO1xyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRJbWFnZSA9IGF3YWl0IHRoaXMubG9hZEltYWdlRnJvbUJhc2U2NCh0cmFuc2Zvcm1lZEJhc2U2NCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBvcmlnaW5hbDoge1xyXG4gICAgICAgIGJhc2U2NDogbG9hZGVkSW1hZ2Uub3JpZ2luYWwhLmJhc2U2NCxcclxuICAgICAgICBpbWFnZTogbG9hZGVkSW1hZ2Uub3JpZ2luYWwhLmltYWdlLFxyXG4gICAgICAgIHNpemU6IHsuLi5vcmlnaW5hbFNpemV9XHJcbiAgICAgIH0sXHJcbiAgICAgIHRyYW5zZm9ybWVkOiB7XHJcbiAgICAgICAgYmFzZTY0OiB0cmFuc2Zvcm1lZEJhc2U2NCxcclxuICAgICAgICBpbWFnZTogdHJhbnNmb3JtZWRJbWFnZSxcclxuICAgICAgICBzaXplOiB7XHJcbiAgICAgICAgICB3aWR0aDogdHJhbnNmb3JtZWRJbWFnZS53aWR0aCxcclxuICAgICAgICAgIGhlaWdodDogdHJhbnNmb3JtZWRJbWFnZS5oZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGV4aWZUcmFuc2Zvcm06IGxvYWRlZEltYWdlLmV4aWZUcmFuc2Zvcm0hXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBsb2FkSW1hZ2VGcm9tQmFzZTY0KGltYWdlQmFzZTY0OiBzdHJpbmcpOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PigoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKGltYWdlKTtcclxuICAgICAgaW1hZ2Uub25lcnJvciA9IHJlamVjdDtcclxuICAgICAgaW1hZ2Uuc3JjID0gaW1hZ2VCYXNlNjQ7XHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFRyYW5zZm9ybWVkU2l6ZShcclxuICAgIG9yaWdpbmFsU2l6ZTogeyB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9LFxyXG4gICAgZXhpZlRyYW5zZm9ybTogRXhpZlRyYW5zZm9ybSxcclxuICAgIGNyb3BwZXJTZXR0aW5nczogQ3JvcHBlclNldHRpbmdzXHJcbiAgKTogRGltZW5zaW9ucyB7XHJcbiAgICBjb25zdCBjYW52YXNSb3RhdGlvbiA9IGNyb3BwZXJTZXR0aW5ncy5jYW52YXNSb3RhdGlvbiArIGV4aWZUcmFuc2Zvcm0ucm90YXRlO1xyXG4gICAgaWYgKGNyb3BwZXJTZXR0aW5ncy5jb250YWluV2l0aGluQXNwZWN0UmF0aW8pIHtcclxuICAgICAgaWYgKGNhbnZhc1JvdGF0aW9uICUgMikge1xyXG4gICAgICAgIGNvbnN0IG1pbldpZHRoVG9Db250YWluID0gb3JpZ2luYWxTaXplLndpZHRoICogY3JvcHBlclNldHRpbmdzLmFzcGVjdFJhdGlvO1xyXG4gICAgICAgIGNvbnN0IG1pbkhlaWdodFRvQ29udGFpbiA9IG9yaWdpbmFsU2l6ZS5oZWlnaHQgLyBjcm9wcGVyU2V0dGluZ3MuYXNwZWN0UmF0aW87XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHdpZHRoOiBNYXRoLm1heChvcmlnaW5hbFNpemUuaGVpZ2h0LCBtaW5XaWR0aFRvQ29udGFpbiksXHJcbiAgICAgICAgICBoZWlnaHQ6IE1hdGgubWF4KG9yaWdpbmFsU2l6ZS53aWR0aCwgbWluSGVpZ2h0VG9Db250YWluKVxyXG4gICAgICAgIH07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgbWluV2lkdGhUb0NvbnRhaW4gPSBvcmlnaW5hbFNpemUuaGVpZ2h0ICogY3JvcHBlclNldHRpbmdzLmFzcGVjdFJhdGlvO1xyXG4gICAgICAgIGNvbnN0IG1pbkhlaWdodFRvQ29udGFpbiA9IG9yaWdpbmFsU2l6ZS53aWR0aCAvIGNyb3BwZXJTZXR0aW5ncy5hc3BlY3RSYXRpbztcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgd2lkdGg6IE1hdGgubWF4KG9yaWdpbmFsU2l6ZS53aWR0aCwgbWluV2lkdGhUb0NvbnRhaW4pLFxyXG4gICAgICAgICAgaGVpZ2h0OiBNYXRoLm1heChvcmlnaW5hbFNpemUuaGVpZ2h0LCBtaW5IZWlnaHRUb0NvbnRhaW4pXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChjYW52YXNSb3RhdGlvbiAlIDIpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBoZWlnaHQ6IG9yaWdpbmFsU2l6ZS53aWR0aCxcclxuICAgICAgICB3aWR0aDogb3JpZ2luYWxTaXplLmhlaWdodFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgd2lkdGg6IG9yaWdpbmFsU2l6ZS53aWR0aCxcclxuICAgICAgaGVpZ2h0OiBvcmlnaW5hbFNpemUuaGVpZ2h0XHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG4iXX0=