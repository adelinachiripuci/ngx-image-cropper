export class CropperSettings {
    constructor() {
        // From options
        this.format = 'png';
        this.maintainAspectRatio = true;
        this.transform = {};
        this.aspectRatio = 1;
        this.resizeToWidth = 0;
        this.resizeToHeight = 0;
        this.cropperMinWidth = 0;
        this.cropperMinHeight = 0;
        this.cropperMaxHeight = 0;
        this.cropperMaxWidth = 0;
        this.cropperStaticWidth = 0;
        this.cropperStaticHeight = 0;
        this.canvasRotation = 0;
        this.initialStepSize = 3;
        this.roundCropper = false;
        this.onlyScaleDown = false;
        this.imageQuality = 92;
        this.autoCrop = true;
        this.backgroundColor = null;
        this.containWithinAspectRatio = false;
        this.hideResizeSquares = false;
        this.alignImage = 'center';
        // Internal
        this.cropperScaledMinWidth = 20;
        this.cropperScaledMinHeight = 20;
        this.cropperScaledMaxWidth = 20;
        this.cropperScaledMaxHeight = 20;
        this.stepSize = this.initialStepSize;
    }
    setOptions(options) {
        Object.keys(options)
            .filter((k) => k in this)
            .forEach((k) => this[k] = options[k]);
        this.validateOptions();
    }
    setOptionsFromChanges(changes) {
        Object.keys(changes)
            .filter((k) => k in this)
            .forEach((k) => this[k] = changes[k].currentValue);
        this.validateOptions();
    }
    validateOptions() {
        if (this.maintainAspectRatio && !this.aspectRatio) {
            throw new Error('`aspectRatio` should > 0 when `maintainAspectRatio` is enabled');
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JvcHBlci5zZXR0aW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1pbWFnZS1jcm9wcGVyL3NyYy9saWIvaW50ZXJmYWNlcy9jcm9wcGVyLnNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE1BQU0sT0FBTyxlQUFlO0lBQTVCO1FBRUUsZUFBZTtRQUNmLFdBQU0sR0FBaUIsS0FBSyxDQUFDO1FBQzdCLHdCQUFtQixHQUFHLElBQUksQ0FBQztRQUMzQixjQUFTLEdBQW1CLEVBQUUsQ0FBQztRQUMvQixnQkFBVyxHQUFHLENBQUMsQ0FBQztRQUNoQixrQkFBYSxHQUFHLENBQUMsQ0FBQztRQUNsQixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUNuQixvQkFBZSxHQUFHLENBQUMsQ0FBQztRQUNwQixxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDckIscUJBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLHVCQUFrQixHQUFHLENBQUMsQ0FBQztRQUN2Qix3QkFBbUIsR0FBRyxDQUFDLENBQUM7UUFDeEIsbUJBQWMsR0FBRyxDQUFDLENBQUM7UUFDbkIsb0JBQWUsR0FBRyxDQUFDLENBQUM7UUFDcEIsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFDckIsa0JBQWEsR0FBRyxLQUFLLENBQUM7UUFDdEIsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFDbEIsYUFBUSxHQUFHLElBQUksQ0FBQztRQUNoQixvQkFBZSxHQUFrQixJQUFJLENBQUM7UUFDdEMsNkJBQXdCLEdBQUcsS0FBSyxDQUFDO1FBQ2pDLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQUMxQixlQUFVLEdBQXNCLFFBQVEsQ0FBQztRQUV6QyxXQUFXO1FBQ1gsMEJBQXFCLEdBQUcsRUFBRSxDQUFDO1FBQzNCLDJCQUFzQixHQUFHLEVBQUUsQ0FBQztRQUM1QiwwQkFBcUIsR0FBRyxFQUFFLENBQUM7UUFDM0IsMkJBQXNCLEdBQUcsRUFBRSxDQUFDO1FBQzVCLGFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBcUJsQyxDQUFDO0lBbkJDLFVBQVUsQ0FBQyxPQUFnQztRQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUNqQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7YUFDeEIsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBRSxJQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUksT0FBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxxQkFBcUIsQ0FBQyxPQUFzQjtRQUMxQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUNqQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7YUFDeEIsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBRSxJQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRU8sZUFBZTtRQUNyQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDakQsTUFBTSxJQUFJLEtBQUssQ0FBQyxnRUFBZ0UsQ0FBQyxDQUFDO1NBQ25GO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3JvcHBlck9wdGlvbnMsIE91dHB1dEZvcm1hdCB9IGZyb20gJy4vY3JvcHBlci1vcHRpb25zLmludGVyZmFjZSc7XHJcbmltcG9ydCB7IEltYWdlVHJhbnNmb3JtIH0gZnJvbSAnLi9pbWFnZS10cmFuc2Zvcm0uaW50ZXJmYWNlJztcclxuaW1wb3J0IHsgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIENyb3BwZXJTZXR0aW5ncyB7XHJcblxyXG4gIC8vIEZyb20gb3B0aW9uc1xyXG4gIGZvcm1hdDogT3V0cHV0Rm9ybWF0ID0gJ3BuZyc7XHJcbiAgbWFpbnRhaW5Bc3BlY3RSYXRpbyA9IHRydWU7XHJcbiAgdHJhbnNmb3JtOiBJbWFnZVRyYW5zZm9ybSA9IHt9O1xyXG4gIGFzcGVjdFJhdGlvID0gMTtcclxuICByZXNpemVUb1dpZHRoID0gMDtcclxuICByZXNpemVUb0hlaWdodCA9IDA7XHJcbiAgY3JvcHBlck1pbldpZHRoID0gMDtcclxuICBjcm9wcGVyTWluSGVpZ2h0ID0gMDtcclxuICBjcm9wcGVyTWF4SGVpZ2h0ID0gMDtcclxuICBjcm9wcGVyTWF4V2lkdGggPSAwO1xyXG4gIGNyb3BwZXJTdGF0aWNXaWR0aCA9IDA7XHJcbiAgY3JvcHBlclN0YXRpY0hlaWdodCA9IDA7XHJcbiAgY2FudmFzUm90YXRpb24gPSAwO1xyXG4gIGluaXRpYWxTdGVwU2l6ZSA9IDM7XHJcbiAgcm91bmRDcm9wcGVyID0gZmFsc2U7XHJcbiAgb25seVNjYWxlRG93biA9IGZhbHNlO1xyXG4gIGltYWdlUXVhbGl0eSA9IDkyO1xyXG4gIGF1dG9Dcm9wID0gdHJ1ZTtcclxuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gIGNvbnRhaW5XaXRoaW5Bc3BlY3RSYXRpbyA9IGZhbHNlO1xyXG4gIGhpZGVSZXNpemVTcXVhcmVzID0gZmFsc2U7XHJcbiAgYWxpZ25JbWFnZTogJ2xlZnQnIHwgJ2NlbnRlcicgPSAnY2VudGVyJztcclxuXHJcbiAgLy8gSW50ZXJuYWxcclxuICBjcm9wcGVyU2NhbGVkTWluV2lkdGggPSAyMDtcclxuICBjcm9wcGVyU2NhbGVkTWluSGVpZ2h0ID0gMjA7XHJcbiAgY3JvcHBlclNjYWxlZE1heFdpZHRoID0gMjA7XHJcbiAgY3JvcHBlclNjYWxlZE1heEhlaWdodCA9IDIwO1xyXG4gIHN0ZXBTaXplID0gdGhpcy5pbml0aWFsU3RlcFNpemU7XHJcblxyXG4gIHNldE9wdGlvbnMob3B0aW9uczogUGFydGlhbDxDcm9wcGVyT3B0aW9ucz4pOiB2b2lkIHtcclxuICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpXHJcbiAgICAgIC5maWx0ZXIoKGspID0+IGsgaW4gdGhpcylcclxuICAgICAgLmZvckVhY2goKGspID0+ICh0aGlzIGFzIGFueSlba10gPSAob3B0aW9ucyBhcyBhbnkpW2tdKTtcclxuICAgIHRoaXMudmFsaWRhdGVPcHRpb25zKCk7XHJcbiAgfVxyXG5cclxuICBzZXRPcHRpb25zRnJvbUNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgT2JqZWN0LmtleXMoY2hhbmdlcylcclxuICAgICAgLmZpbHRlcigoaykgPT4gayBpbiB0aGlzKVxyXG4gICAgICAuZm9yRWFjaCgoaykgPT4gKHRoaXMgYXMgYW55KVtrXSA9IGNoYW5nZXNba10uY3VycmVudFZhbHVlKTtcclxuICAgIHRoaXMudmFsaWRhdGVPcHRpb25zKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHZhbGlkYXRlT3B0aW9ucygpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLm1haW50YWluQXNwZWN0UmF0aW8gJiYgIXRoaXMuYXNwZWN0UmF0aW8pIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgYXNwZWN0UmF0aW9gIHNob3VsZCA+IDAgd2hlbiBgbWFpbnRhaW5Bc3BlY3RSYXRpb2AgaXMgZW5hYmxlZCcpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=