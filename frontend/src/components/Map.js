import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css"
import { useState } from "react";
import {MapContainer, Marker, Popup, TileLayer, useMapEvents} from "react-leaflet"

const Map = ({places,center,setCenter,setRerender,setBounds})=>{
    const [map,setMap]=useState(null)
    if(map){
        map.flyTo(center);
    }

    const MoveHandler=() =>{
        const map = useMapEvents({
            moveend: (e) => {
                const c=e.target.getCenter();
                if(center[0]==c.lat && center[1]==c.lng)
                    return
                
                const b=e.target.getBounds();
                setBounds([b.getNorth(),b.getSouth(),b.getEast(),b.getWest()]);
                setCenter([c.lat,c.lng]);
                setRerender(prev=>prev+1);
            }
        });
        return null;
    }

    return <MapContainer
        id="map"
        zoom={12}
        center={center}
        whenCreated={setMap}
        >
            <MoveHandler></MoveHandler>
            <TileLayer
                attribution= '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {
            places.map(p=>
                <Marker key={p.ID}
                    position={[p.Latitude,p.Longitude]}
                    icon={divIcon(
                        {
                            html:"<div class='markerIcon'>"+
                            "</div>"
                        }
                    )}
                >
                    <Popup>
                        <span className="userName">
                            {p.UserName}'s
                        </span> {p.Name}
                    </Popup>
                </Marker>
            )
            }
    </MapContainer>
}
export default Map;