import { useState, useRef, useCallback, useMemo } from "react";


export const useCamera = () => {
    //позже положу сюда камеру, UseRef чтобы каждый раз заново не отрисовывать
    const webcamRef = useRef(null)
    const [isCameraReady, setCameraReady] = useState(false); //готовность камеры
    const [cameraError, setCameraError] = useState(null); //ошибка


    //параметры для камеры
    const videoConstraints = {
        width: 640,
        height: 480,
        facingmode: 'user'
    };
    //когда ошибка при подготовке камеры
    const handleError = useCallback((error) => {
        setCameraError(error.message)
        setCameraReady(false)
    }, []);
    //когда камера готова
    const handleUserMedia = useCallback(() => {
        setCameraError()
        setCameraReady(true)
    }, []);
    return {
        webcamRef,
        isCameraReady,
        cameraError,
        handleError,
        handleUserMedia,
        videoConstraints
    }
}