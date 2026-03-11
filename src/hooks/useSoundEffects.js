import { useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const useSoundEffects = () => {
    // We get theme/settings from redux if we wanted to add a mute toggle later
    const isMuted = useSelector(state => state.theme?.soundMuted || false);

    const successSound = useRef(null);
    const notificationSound = useRef(null);
    const popSound = useRef(null);

    useEffect(() => {
        // Preload sounds
        // Since we don't have actual files in public/sounds/ right now, 
        // we'll synthesize them using the Web Audio API for a guaranteed clean result
        // without needing external assets.
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                
                // --- SUCCESS / TASK COMPLETE SOUND ---
                const createSuccessSound = () => {
                    if (ctx.state === 'suspended') ctx.resume();
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    // Quick sweep up
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                    
                    // Volume envelope
                    gainNode.gain.setValueAtTime(0, ctx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.3);
                };
                
                // --- NOTIFICATION DING ---
                const createDingSound = () => {
                    if (ctx.state === 'suspended') ctx.resume();
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.type = 'bell'; // simulated with sine and specific envelope
                    if (!osc.type) osc.type = 'sine';
                    
                    osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
                    
                    // Sharp attack, long release
                    gainNode.gain.setValueAtTime(0, ctx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.8);
                };

                // --- POP SOUND (General interactions) ---
                const createPopSound = () => {
                    if (ctx.state === 'suspended') ctx.resume();
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                    
                    gainNode.gain.setValueAtTime(0, ctx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.1);
                };

                successSound.current = createSuccessSound;
                notificationSound.current = createDingSound;
                popSound.current = createPopSound;
            }
        } catch (e) {
            console.warn("Web Audio API not supported, sounds disabled.");
        }
    }, []);

    const playSuccess = useCallback(() => {
        if (!isMuted && successSound.current) {
            try { successSound.current(); } catch (e) { /* ignore */ }
        }
    }, [isMuted]);

    const playNotification = useCallback(() => {
        if (!isMuted && notificationSound.current) {
            try { notificationSound.current(); } catch (e) { /* ignore */ }
        }
    }, [isMuted]);

    const playPop = useCallback(() => {
        if (!isMuted && popSound.current) {
            try { popSound.current(); } catch (e) { /* ignore */ }
        }
    }, [isMuted]);

    return {
        playSuccess,
        playNotification,
        playPop
    };
};

export default useSoundEffects;
