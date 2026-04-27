import React, { useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useCamera } from '../../Hooks/useCamera';
import { useHandGesture } from '../../Hooks/UseHandGesture';
import GameArea from '../Game/GameArea';
import styles from './CameraView.module.css';

const CameraView = () => {
    const { 
        webcamRef, 
        isCameraReady, 
        cameraError, 
        handleError, 
        handleUserMedia, 
        videoConstraints 
    } = useCamera();
    
    const { isModelLoading, gesture, analyzeGesture } = useHandGesture();
    const [currentGesture, setCurrentGesture] = useState('none');

    // Запускаем анализ кадра каждые 100мс
    useEffect(() => {
        if (!isCameraReady || !webcamRef.current) return;
        
        const interval = setInterval(async () => {
            const video = webcamRef.current.video;
            if (video && video.readyState === 4) {
                const detected = await analyzeGesture(video);
                if (detected !== 'none') {
                    setCurrentGesture(detected);
                }
            }
        }, 100);
        
        return () => clearInterval(interval);
    }, [isCameraReady, webcamRef, analyzeGesture]);

    // Отображение жеста
    const getGestureDisplay = () => {
        const displays = {
            'rock': { emoji: '👊', text: 'Камень' },
            'paper': { emoji: '✋', text: 'Бумага' },
            'scissors': { emoji: '✌️', text: 'Ножницы' },
            'none': { emoji: '❓', text: 'Покажите жест' }
        };
        return displays[currentGesture] || displays.none;
    };

    const gestureDisplay = getGestureDisplay();

    return (
        <div className={styles.twoColumnsContainer}>
            {/* Левая колонка */}
            <div className={styles.leftColumn}>
                <div className={styles.videoWrapper}>
                    <Webcam
                        key="webcam-instance"
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        onUserMedia={handleUserMedia}
                        onError={handleError}
                        className={styles.video}
                    />
                    
                    {(isModelLoading || !isCameraReady) && (
                        <div className={styles.overlay}>
                            <div className={styles.loader}></div>
                            <p>
                                {!isCameraReady
                                    ? '🔄 Загрузка модели распознавания...' 
                                    : '📷 Запрос доступа к камере...'}
                            </p>
                        </div>
                    )}
                    
                    {cameraError && (
                        <div className={styles.errorOverlay}>
                            <p>⚠️ Ошибка: {cameraError}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className={styles.retryButton}
                            >
                                Попробовать снова
                            </button>
                        </div>
                    )}
                </div>
                
                <div className={styles.gestureCard}>
                    <div className={styles.gestureEmoji}>
                        {gestureDisplay.emoji}
                    </div>
                    <div className={styles.gestureText}>
                        {gestureDisplay.text}
                    </div>
                </div>
                
                <div className={styles.statusContainer}>
                    <span className={isCameraReady ? styles.statusOk : styles.statusWait}>
                        {isCameraReady ? '✅ Камера' : '⏳ Камера'}
                    </span>
                    <span className={!isModelLoading ? styles.statusOk : styles.statusWait}>
                        {!isModelLoading ? '🧠 ИИ' : '⏳ ИИ'}
                    </span>
                </div>
            </div>
            
            {/* Правая колонка */}
            <div className={styles.rightColumn}>
                <GameArea isCameraReady={isCameraReady} webcamRef={webcamRef} />
            </div>
        </div>
    );
};

export default CameraView;