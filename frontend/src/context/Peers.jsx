// src/context/Peer.js
import React, { useMemo, useCallback } from "react";
import { CONFIG } from '../config/webrtc.config';

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
    // Create peer connection once with improved configuration
    const peer = useMemo(
        () => {
            const peerConnection = new RTCPeerConnection(CONFIG.WEBRTC_CONFIG);
            
            // Add connection state monitoring
            peerConnection.onconnectionstatechange = () => {
                console.log('Peer connection state:', peerConnection.connectionState);
            };
            
            peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', peerConnection.iceConnectionState);
            };
            
            return peerConnection;
        },
        []
    );

    // Create an offer (called by the initiator)
    const createOffer = useCallback(async () => {
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            console.log("✅ Offer created:", offer);
            return offer;
        } catch (error) {
            console.error("❌ Error creating offer:", error);
            throw error;
        }
    }, [peer]);

    // Create an answer (called by the receiver)
    const createAnswer = useCallback(async (offer) => {
        try {
            // CRITICAL FIX: Pass the offer object, not the peer object
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("✅ Remote description (offer) set");
            
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            console.log("✅ Answer created:", answer);
            return answer;
        } catch (error) {
            console.error("❌ Error creating answer:", error);
            throw error;
        }
    }, [peer]);

    // Set remote answer (called by the initiator after receiving answer)
    const setRemoteAns = useCallback(async (ans) => {
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(ans));
            console.log("✅ Remote description (answer) set");
        } catch (error) {
            console.error("❌ Error setting remote answer:", error);
            throw error;
        }
    }, [peer]);

    // Restart ICE connection on failure
    const restartIce = useCallback(async () => {
        try {
            console.log("🔄 Restarting ICE connection");
            const offer = await peer.createOffer({ iceRestart: true });
            await peer.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error("❌ Error restarting ICE:", error);
            throw error;
        }
    }, [peer]);

    return (
        <PeerContext.Provider value={{ peer, createOffer, createAnswer, setRemoteAns, restartIce }}>
            {props.children}
        </PeerContext.Provider>
    );
};