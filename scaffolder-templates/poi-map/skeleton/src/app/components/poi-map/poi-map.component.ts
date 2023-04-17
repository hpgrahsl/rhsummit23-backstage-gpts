import { AfterViewInit, Component } from '@angular/core';
import { LeafletControlLayersConfig } from '@asymmetrik/ngx-leaflet';
import { latLng, Map, Layer, TileLayer, MapOptions } from 'leaflet';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Backend, BackendChangeEvent, RegistryEventType } from '../../models/custom-types';
import { BackendRegistryService } from '../../services/backend-registry.service';
import { GatewayService } from '../../services/gateway.service';
import { createNewBackendLayer, createTileLayer } from '../../utils/map-utils';
import { environment as env } from '../../../environments/environment';

@Component({
  selector: 'app-poi-map',
  templateUrl: './poi-map.component.html',
  styleUrls: ['./poi-map.component.css'],
})
export class PoiMapComponent implements AfterViewInit {
  
  poiMap!: Map;
  mapOptions!: MapOptions;
  coloredLayer: TileLayer;
  grayscaleLayer: TileLayer;
  inputLayers: Array<Layer>;
  baseLayers: { [name: string]: Layer };
  overlays: { [name: string]: Layer };
  layersControl: LeafletControlLayersConfig;

  backendRegistry: Record<string, Backend> = {};

  hasConnectionError$: Subject<boolean>;
  gatewayFeed$!: Observable<BackendChangeEvent>;

  constructor(
    private backendRegistryService: BackendRegistryService,
    private gatewayService: GatewayService
  ) {
    this.coloredLayer = createTileLayer(
      'mapbox/streets-v11',
      env.mapUrl,
      env.mapAttribution,
      env.mapToken
    );
    this.grayscaleLayer = createTileLayer(
      'mapbox/light-v10',
      env.mapUrl,
      env.mapAttribution,
      env.mapToken
    );

    this.baseLayers = {
      colored: this.coloredLayer,
      grayscale: this.grayscaleLayer,
    };

    this.inputLayers = [this.coloredLayer, this.grayscaleLayer];

    this.overlays = {};

    this.layersControl = {
      baseLayers: this.baseLayers,
      overlays: this.overlays,
    };

    this.mapOptions = {
      zoom: 3,
      center: latLng([0.0, 0.0]),
    };

    this.hasConnectionError$ = new BehaviorSubject(false);
  }

  ngAfterViewInit(): void {
    this.subscribeToGatewayChangeEvents();
  }

  subscribeToGatewayChangeEvents() {
    this.gatewayFeed$ = this.backendRegistryService.messages$.pipe(
      tap({
        next: (gatewayEvent) => {
          switch(gatewayEvent.eventType) {
            case RegistryEventType.REGISTERED:
              this.handleRegisterEvent(gatewayEvent);
              break;
            case RegistryEventType.UNREGISTERED:
              this.handleUnregisterEvent(gatewayEvent);
              break;
            default: 
              throw new Error('unkown RegistryEventType '+gatewayEvent.eventType+' for gateway event');
          }
        },
      })
    );
    this.gatewayFeed$.subscribe();
  }

  handleRegisterEvent(gatewayEvent: BackendChangeEvent) {
    console.log('📬 received gateway event for backend registration');
    console.log(JSON.stringify(gatewayEvent));
    const backendId = gatewayEvent.backendInfo.id;
    if(this.backendRegistry[backendId] !== undefined) {
      this.cleanUpMapLayerAndControls(backendId);
    }
    this.backendRegistry[backendId] = gatewayEvent.backendInfo;
    console.log('📢 calling gateway service to fetch data from backend');
    this.gatewayService.getAll(backendId).subscribe((dataPoints) => {
      console.log('📬 received ' + dataPoints.length + ' data 📍 from backend via gateway');
      console.log('➕ add 🗺️ and 🎮 for backend: ' + backendId);
      const backendLayer = createNewBackendLayer(dataPoints);
      this.poiMap.addLayer(backendLayer);
      this.overlays[this.backendRegistry[backendId].displayName] = backendLayer;
    });
  }

  handleUnregisterEvent(gatewayEvent: BackendChangeEvent) {
    console.log('📬 received gateway event for backend de-registration');
    console.log(JSON.stringify(gatewayEvent));
    const backendId = gatewayEvent.backendInfo.id;
    this.cleanUpMapLayerAndControls(backendId);
  }

  cleanUpMapLayerAndControls(backendId:string) {
    console.log('➖ remove 🗺️ and 🎮 for backend: ' + backendId);
    this.poiMap.removeLayer(
      this.overlays[this.backendRegistry[backendId].displayName]
    );
    delete this.overlays[this.backendRegistry[backendId].displayName];
    delete this.backendRegistry[backendId];
  }

  onMapReady(map: Map) {
    this.poiMap = map;
  }

}
