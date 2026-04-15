import { useState, useRef, useCallBack, useEffect } from "react";


export const useCamera = () => {
    //позже положу сюда камеру UseRef чтобы каждый раз заново не отрисовывать
    const webcamRef = useRef(null)
    const [isCameraReady, seyIsCameraReady] = useState(false); //готовность камеры
    const [cameraError, setCameraError] = useState(null); //ошибка


    //параметры для камеры
    const videoConstraints = {
        width: 640,
        height: 480,
        facingmode: 'User'
    };
    //когда ошибка при подготовке камеры
    const handleError = useCallBack((error) => {
        setCameraError(error.message)
        setCameraReady(false)
    }, []);
    //когда камера готова
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