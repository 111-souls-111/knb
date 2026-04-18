import React, { useState, useCallback, useEffect } from "react";
import * as handpose from '@tensorflow-models/handpose';
import * as tf from "@tensorflow/tfjs";

export const useHandGesture = () => {
    const [model, setModel] = useState(null); //хранение модели
    const [isModelLoading, setModelLoading] = useState(true); //загрузка модели
    const [gesture, setGesture] = useState("none"); //жест

    useEffect(() => {
        const loadModel = async() => {
            try {
                await tf.ready(); //инициализация
                const handModel = await handpose.load(); //загрузка модели
                setModel(handModel);
                setModelLoading(false);

            } catch (error) {
                setModelLoading(false);

            }
        }
        loadModel()
    }, []);

    const detectGesture = useCallback((landmarks) => {
        if (!landmarks || landmarks.length === 0) return "none";
        //кончики пальцев
        const thumbTip = landmarks[4]; // большой палец
        const indexTip = landmarks[8]; // указательный
        const middleTip = landmarks[12]; // средний
        const ringTip = landmarks[16]; // безымянный
        const pinkyTip = landmarks[20]; // мизинец

        //основания пальцев
        const thumbBase = landmarks[2];
        const indexBase = landmarks[5];
        const middleBase = landmarks[9];
        const ringBase = landmarks[13];
        const pinkyBase = landmarks[17];

        //определяю выпрямленные пальцы по Y
        const isIndexExtended = indexTip[1] < indexBase[1];
        const isMiddleExtended = middleTip[1] < middleBase[1]
        const isPinkyExtended = pinkyTip[1] < pinkyBase[1]
        const isRingExtended = ringTip[1] < ringBase[1]

        const isThumbExtended = thumbTip[0] > thumbBase[0] // по иксу

        const extendedCount = [
            isThumbExtended,
            isIndexExtended,
            isMiddleExtended,
            isRingExtended,
            isPinkyExtended
        ].filter(Boolean).length;


        if (extendedCount === 0) return "rock";
        if (extendedCount === 5) return "paper"
        if (extendedCount === 2 && isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) return "scissors"
        return "none"

    }, []);

    const analyzeGesture = useCallback(async(video) => {
        if (!model || !video) return "none";

        try {
            const predictions = await model.estimateHands(video) //отправляем видно и ждем рез (ынутри массив точек, увренность и рамка вокруш руки)
            if (predictions.length > 0) { // >0 рука найдена <0 не найдена
                const landmarks = predictions[0].landmarks; //берем точки первой руки
                const detectedGesture = detectGesture(landmarks);
                setGesture(detectedGesture); //

                return detectedGesture
            } else {
                setGesture("none")
                return "none"
            }



        } catch (error) {
            console.error('Ошибка распознавания:', error);
            return 'none';

        }
    }, [model, detectGesture])

    return {
        isModelLoading,
        gesture,
        analyzeGesture
    };
};