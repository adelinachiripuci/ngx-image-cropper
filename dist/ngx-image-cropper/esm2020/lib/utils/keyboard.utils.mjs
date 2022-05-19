export function getPositionForKey(key) {
    switch (key) {
        case 'ArrowUp':
            return 'top';
        case 'ArrowRight':
            return 'right';
        case 'ArrowDown':
            return 'bottom';
        case 'ArrowLeft':
        default:
            return 'left';
    }
}
export function getInvertedPositionForKey(key) {
    switch (key) {
        case 'ArrowUp':
            return 'bottom';
        case 'ArrowRight':
            return 'left';
        case 'ArrowDown':
            return 'top';
        case 'ArrowLeft':
        default:
            return 'right';
    }
}
export function getEventForKey(key, stepSize) {
    switch (key) {
        case 'ArrowUp':
            return { clientX: 0, clientY: stepSize * -1 };
        case 'ArrowRight':
            return { clientX: stepSize, clientY: 0 };
        case 'ArrowDown':
            return { clientX: 0, clientY: stepSize };
        case 'ArrowLeft':
        default:
            return { clientX: stepSize * -1, clientY: 0 };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmQudXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtaW1hZ2UtY3JvcHBlci9zcmMvbGliL3V0aWxzL2tleWJvYXJkLnV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxHQUFXO0lBQzNDLFFBQVEsR0FBRyxFQUFFO1FBQ1gsS0FBSyxTQUFTO1lBQ1osT0FBTyxLQUFLLENBQUM7UUFDZixLQUFLLFlBQVk7WUFDZixPQUFPLE9BQU8sQ0FBQztRQUNqQixLQUFLLFdBQVc7WUFDZCxPQUFPLFFBQVEsQ0FBQztRQUNsQixLQUFLLFdBQVcsQ0FBQztRQUNqQjtZQUNFLE9BQU8sTUFBTSxDQUFDO0tBQ2pCO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxHQUFXO0lBQ25ELFFBQVEsR0FBRyxFQUFFO1FBQ1gsS0FBSyxTQUFTO1lBQ1osT0FBTyxRQUFRLENBQUM7UUFDbEIsS0FBSyxZQUFZO1lBQ2YsT0FBTyxNQUFNLENBQUM7UUFDaEIsS0FBSyxXQUFXO1lBQ2QsT0FBTyxLQUFLLENBQUM7UUFDZixLQUFLLFdBQVcsQ0FBQztRQUNqQjtZQUNFLE9BQU8sT0FBTyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsR0FBVyxFQUFFLFFBQWdCO0lBQzFELFFBQVEsR0FBRyxFQUFFO1FBQ1gsS0FBSyxTQUFTO1lBQ1osT0FBTyxFQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDO1FBQzlDLEtBQUssWUFBWTtZQUNmLE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUMsQ0FBQztRQUN6QyxLQUFLLFdBQVc7WUFDZCxPQUFPLEVBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7UUFDekMsS0FBSyxXQUFXLENBQUM7UUFDakI7WUFDRSxPQUFPLEVBQUMsT0FBTyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFDLENBQUM7S0FDL0M7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGdldFBvc2l0aW9uRm9yS2V5KGtleTogc3RyaW5nKTogc3RyaW5nIHtcclxuICBzd2l0Y2ggKGtleSkge1xyXG4gICAgY2FzZSAnQXJyb3dVcCc6XHJcbiAgICAgIHJldHVybiAndG9wJztcclxuICAgIGNhc2UgJ0Fycm93UmlnaHQnOlxyXG4gICAgICByZXR1cm4gJ3JpZ2h0JztcclxuICAgIGNhc2UgJ0Fycm93RG93bic6XHJcbiAgICAgIHJldHVybiAnYm90dG9tJztcclxuICAgIGNhc2UgJ0Fycm93TGVmdCc6XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gJ2xlZnQnO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEludmVydGVkUG9zaXRpb25Gb3JLZXkoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHN3aXRjaCAoa2V5KSB7XHJcbiAgICBjYXNlICdBcnJvd1VwJzpcclxuICAgICAgcmV0dXJuICdib3R0b20nO1xyXG4gICAgY2FzZSAnQXJyb3dSaWdodCc6XHJcbiAgICAgIHJldHVybiAnbGVmdCc7XHJcbiAgICBjYXNlICdBcnJvd0Rvd24nOlxyXG4gICAgICByZXR1cm4gJ3RvcCc7XHJcbiAgICBjYXNlICdBcnJvd0xlZnQnOlxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuICdyaWdodCc7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRGb3JLZXkoa2V5OiBzdHJpbmcsIHN0ZXBTaXplOiBudW1iZXIpOiBhbnkge1xyXG4gIHN3aXRjaCAoa2V5KSB7XHJcbiAgICBjYXNlICdBcnJvd1VwJzpcclxuICAgICAgcmV0dXJuIHtjbGllbnRYOiAwLCBjbGllbnRZOiBzdGVwU2l6ZSAqIC0xfTtcclxuICAgIGNhc2UgJ0Fycm93UmlnaHQnOlxyXG4gICAgICByZXR1cm4ge2NsaWVudFg6IHN0ZXBTaXplLCBjbGllbnRZOiAwfTtcclxuICAgIGNhc2UgJ0Fycm93RG93bic6XHJcbiAgICAgIHJldHVybiB7Y2xpZW50WDogMCwgY2xpZW50WTogc3RlcFNpemV9O1xyXG4gICAgY2FzZSAnQXJyb3dMZWZ0JzpcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiB7Y2xpZW50WDogc3RlcFNpemUgKiAtMSwgY2xpZW50WTogMH07XHJcbiAgfVxyXG59XHJcbiJdfQ==