import React from "react";
import Webcam from 'react-webcam';
import { useCamera } from "../../Hooks/useCamera";
import styles from "./CameraView.module.css";

const CameraView = () => {
    const {        
        webcamRef,
        isCameraReady,
        cameraError,
        handleError,
        handleUserMedia,
        videoConstraints
    } = useCamera();
        
    
    return(
        <div className={styles.CameraContainer}>
            <div className={styles.videoWpapper}>
                <Webcam 
                key = "webcam-instance"
                audio = {false}
                ref = {webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia ={handleUserMedia}
                onError={handleError}
                className ={styles.video}
                />

                {
                !isCameraReady && !cameraError && (
                    <div className={styles.overlay}>
                        <div className={styles.loader}></div>
                        <p>Запрос доступа к камере...</p>
                    </div>
                )
                }

                {cameraError && (<div className={styles.ErrorOverlay}>
                    <p>ошибка {cameraError}</p>
                    <button onClick={() => window.location.reload()} className={styles.retryButton}>Попробовать снова</button>
                </div>)}

                <div className={styles.info}>
                    <p className={isCameraReady ? styles.ready : styles.notReady}>
                        {isCameraReady ? '✅ Камера готова' : '⏳ Ожидание камеры...'}
                    </p>
                </div>
            </div>
        </div>

        );
};

export default CameraView;