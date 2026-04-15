import { useState, useCallback, useEffect } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs';

export const useHandGesture = () => {
    const [model, setModel] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [gesture, setGesture] = useState('none');

    // Загрузка модели при монтировании
    useEffect(() => {
        const loadModel = async() => {
            try {
                await tf.ready();
                const handModel = await handpose.load();
                setModel(handModel);
                setIsModelLoading(false);
                console.log('✅ Модель HandPose загружена');
            } catch (error) {
                console.error('❌ Ошибка загрузки модели:', error);
                setIsModelLoading(false);
            }
        };

        loadModel();
    }, []);

    // Функция распознавания жеста по точкам
    const detectGesture = useCallback((landmarks) => {
        if (!landmarks || landmarks.length === 0) return 'none';

        // Получаем координаты кончиков пальцев
        const thumbTip = landmarks[4]; // большой палец
        const indexTip = landmarks[8]; // указательный
        const middleTip = landmarks[12]; // средний
        const ringTip = landmarks[16]; // безымянный
        const pinkyTip = landmarks[20]; // мизинец

        // Получаем координаты оснований пальцев
        const thumbBase = landmarks[2];
        const indexBase = landmarks[5];
        const middleBase = landmarks[9];
        const ringBase = landmarks[13];
        const pinkyBase = landmarks[17];

        // Определяем, какие пальцы выпрямлены
        // (кончик выше основания = палец выпрямлен)
        const isIndexExtended = indexTip[1] < indexBase[1];
        const isMiddleExtended = middleTip[1] < middleBase[1];
        const isRingExtended = ringTip[1] < ringBase[1];
        const isPinkyExtended = pinkyTip[1] < pinkyBase[1];

        // Для большого пальца своя логика (по оси X)
        const isThumbExtended = thumbTip[0] > thumbBase[0];

        const extendedCount = [
            isThumbExtended,
            isIndexExtended,
            isMiddleExtended,
            isRingExtended,
            isPinkyExtended
        ].filter(Boolean).length;

        // Логика определения жеста
        if (extendedCount === 0) return 'rock'; // ✊ Камень
        if (extendedCount === 2 && isIndexExtended && isMiddleExtended) return 'scissors'; // ✌️ Ножницы
        if (extendedCount === 5) return 'paper'; // ✋ Бумага

        return 'none';
    }, []);

    // Анализ видео с камеры
    const analyzeGesture = useCallback(async(video) => {
        if (!model || !video) return 'none';

        try {
            const predictions = await model.estimateHands(video);

            if (predictions.length > 0) {
                const handLandmarks = predictions[0].landmarks;
                const detectedGesture = detectGesture(handLandmarks);
                setGesture(detectedGesture);
                return detectedGesture;
            } else {
                setGesture('none');
                return 'none';
            }
        } catch (error) {
            console.error('Ошибка распознавания:', error);
            return 'none';
        }
    }, [model, detectGesture]);

    return {
        isModelLoading,
        gesture,
        analyzeGesture
    };
};