import { useState, useRef, useCallBack, useEffect } from "react";


export const useCamera = () => {
    const webcamRef = useRef(null)
    const [isCameraReady, seyIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    const videoConstraints = {
        width: 640,
        height: 480,
        facingmode: 'User'
    };

    const handleError = useCallBack((error) => {
        setCameraError(error.message)
        setCameraReady(false)
    }, []);

    const handleUserMedia = useCallBack(() => {
        setCameraError(null)
        setCameraReady(true)
    }, []);
    return (
        webcamRef,
        isCameraReady,
        cameraError,
        handleError,
        handleUserMedia,
        videoConstraints


    )
}