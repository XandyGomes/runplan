'use client';

import { useEffect, useRef } from 'react';
import styles from './ActivityMap.module.css';

const LEAFLET_CSS_ID = 'leaflet-css';
const LEAFLET_JS_SRC = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet(): Promise<any> {
  return new Promise(resolve => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    if (!document.getElementById(LEAFLET_CSS_ID)) {
      const css = document.createElement('link');
      css.id = LEAFLET_CSS_ID;
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).L));
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS_SRC;
    script.async = true;
    script.onload = () => resolve((window as any).L);
    document.body.appendChild(script);
  });
}

export default function ActivityMap({ route }: { route: [number, number][] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then(L => {
      if (cancelled || !containerRef.current || route.length === 0) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const line = L.polyline(route, { color: '#14C9A8', weight: 4 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [24, 24] });

      const start = route[0];
      const end = route[route.length - 1];
      L.circleMarker(start, { radius: 6, color: '#fff', fillColor: '#14C9A8', fillOpacity: 1, weight: 2 }).addTo(map);
      L.circleMarker(end, { radius: 6, color: '#fff', fillColor: '#FF4D6A', fillOpacity: 1, weight: 2 }).addTo(map);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [route]);

  if (route.length === 0) {
    return null;
  }

  return <div ref={containerRef} className={styles.mapContainer} />;
}
