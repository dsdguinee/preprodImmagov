
import { getConnexion } from "./auth.service";

export function getUser(){
    getConnexion().get("/api/whoami")
    
}