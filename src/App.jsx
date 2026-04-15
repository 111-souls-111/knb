import React  from 'react';
import { CameraView } from './Components/Camera';
import styles from './App.module.css';

function App() {
  return (
 <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          ✊ Камень-Ножницы-Бумага ✌️
        </h1>
        <p className={styles.subtitle}>
          Покажите жест в камеру!
        </p>
      </header>
      
      <main className={styles.main}>
        <CameraView />
      </main>
      
      <footer className={styles.footer}>
        <p>Сделайте жест: 👊 Камень | ✋ Бумага | ✌️ Ножницы</p>
      </footer>
    </div>
  );
}

export default App;
