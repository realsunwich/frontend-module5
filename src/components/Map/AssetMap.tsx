'use client';

import { useEffect } from 'react'; // <--- เพิ่ม useEffect
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Button, Typography } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';

// ... (Icon definition เหมือนเดิม) ...
const icon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

interface Asset {
    id?: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
}

interface MapProps {
    assets?: Asset[];
    isEditable?: boolean;
    onLocationSelect?: (lat: number, lng: number) => void;
    center?: [number, number]; // <--- เพิ่ม Prop รับค่า Center
}

// 1. Component พิเศษสำหรับสั่ง Map ให้ขยับ (FlyTo)
function MapController({ center }: { center?: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16); // 16 คือระดับ Zoom
        }
    }, [center, map]);
    return null;
}

function LocationSelector({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

const AssetMap = ({ assets = [], isEditable = false, onLocationSelect, center }: MapProps) => { // <--- รับ prop center

    const handleNavigate = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    return (
        <Box sx={{ height: '100%', width: '100%' }}> {/* ตัด style height fix ออก ให้ parent คุม */}
            <MapContainer
                center={[13.7563, 100.5018]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='© OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* เรียกใช้ Controller เพื่อขยับ map */}
                <MapController center={center} />

                {assets.map((asset, index) => (
                    <Marker key={index} position={[asset.latitude, asset.longitude]} icon={icon}>
                        <Popup>
                            <Typography variant="subtitle1" fontWeight="bold">{asset.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{asset.description}</Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<NavigationIcon />}
                                onClick={() => handleNavigate(asset.latitude, asset.longitude)}
                                sx={{ mt: 1, width: '100%' }}
                            >
                                นำทาง
                            </Button>
                        </Popup>
                    </Marker>
                ))}

                {isEditable && onLocationSelect && (
                    <LocationSelector onSelect={onLocationSelect} />
                )}
            </MapContainer>
        </Box>
    );
};

export default AssetMap;