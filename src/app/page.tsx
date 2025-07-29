'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './connect4.module.css';
// import confetti from 'canvas-confetti';
import {Fireworks} from 'fireworks-js';

const ROWS = 6;
const COLS = 7;

export default function Home() {
  const [board, setBoard] = useState<number[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [playerNames, setPlayerNames] = useState({ 1: '', 2: '' });
  const [playerColors, setPlayerColors] = useState({ 1: '#ff0000', 2: '#ffff00' });
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [started, setStarted] = useState(false);
  const [lastMove, setLastMove] = useState<{ row: number, col: number } | null>(null);
  const [lastWinner, setLastWinner] = useState<number | null>(null);

  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const victoryAudioRef = useRef<HTMLAudioElement | null>(null);
  const dropAudioRef = useRef<HTMLAudioElement | null>(null);
  const fireWorksAudioRef = useRef<HTMLAudioElement | null>(null);
  const fireworksRef = useRef<HTMLDivElement | null>(null);
  const fwInstanceRef = useRef<Fireworks | null>(null);
  

  useEffect(() => {
    initBoard();

    if(fireWorksAudioRef.current) {

      fireWorksAudioRef.current.pause();
      fireWorksAudioRef.current.currentTime = 0;
    }
  }, []);


  // plays music when game is started and ends it when game is over
  useEffect(() => {

    if(started && !gameOver) {

      if(!gameAudioRef.current) {

        const gameAudio = new Audio('audio/thinIceOST.mp3');

        gameAudio.loop = true; 
        gameAudio.volume = 0.2; 
        gameAudioRef.current = gameAudio;
      }

      gameAudioRef.current.play().catch((e) => console.log("Autoplay Blocked: ", e));
    }

    else if(gameOver && gameAudioRef.current) {

      gameAudioRef.current.pause();
      gameAudioRef.current.currentTime = 0;
    }
  }, [started, gameOver]);


  // Plays victory and fireworks audio, and launches fireworks when winner is declared

  useEffect(() => {

    if(gameOver && winner) {

      if(!victoryAudioRef.current) {
        victoryAudioRef.current = new Audio('audio/winner.mp3');
      }

      if(!fireWorksAudioRef.current) {

        fireWorksAudioRef.current = new Audio('audio/fireworks.mp3');
        fireWorksAudioRef.current.volume = 0.5;
      }

      // We will need to pause the game music in order to not interfere with victory and fireworks audio

      if(gameAudioRef.current) {
        gameAudioRef.current.pause();
        gameAudioRef.current.currentTime = 0;
      }

      victoryAudioRef.current.play().catch((e) => 
        console.log('Victory audio autoplay blocked: ', e)
      );

      fireWorksAudioRef.current.play().catch((e) => 
        console.log('Fireworks audio autoplay blocked: ', e)
      );
    

      // Fireworks Away!

      launchFireworks();
    }

  }, [gameOver, winner]);
  

const launchFireworks = () => {

  if(fireworksRef.current) {

    // reset any previous fireworks instances 

    if(fwInstanceRef.current) {

      fwInstanceRef.current.stop();
      fwInstanceRef.current = null;
    }

    // clears div container to ensure fresh rendering
    fireworksRef.current.innerHTML = '';

    const options = {

      rocketsPoint: {min: 20, max: 80}, 
      
      hue: {
        min: 0,
        max: 360, 
      }, 

      acceleration: 1.05,
      friction: 0.98,
      gravitiy: 1.5, 
      particles: 100,
      traceLength: 5, 
      traceSpeed: 10, 
      explosion: 5, 
      autoresize: true, 
      brightness: {
        min: 50, 
        max: 80,
      },

      decay: {
        min: 0.015, 
        max: 0.03, 
      },

      delay: {
        min: 15, 
        max: 30,
      },

      boundaries: {

        top: 0,
        bottom: window.innerHeight, 
        left: 0,
        right: window.innerWidth,
      },
    };

    const fw = new Fireworks(fireworksRef.current, options);
    fwInstanceRef.current = fw; 
    fw.start();

    setTimeout(() => {

      fw.stop();
    }, 4500);
  }
};

 const initBoard = () => {
  const newBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  setBoard(newBoard);
  setGameOver(false);
  setWinner(null);
  setCurrentPlayer(lastWinner ?? 1); // last winner starts a new game 

  // Resetting audio to default values 

  if(victoryAudioRef.current) {
    victoryAudioRef.current.pause();
    victoryAudioRef.current.currentTime = 0;
  }
  if(gameAudioRef.current) {
    gameAudioRef.current.currentTime = 0;
  }

  fwInstanceRef.current?.stop();
  fwInstanceRef.current = null;

};


const handleMove = (col: number) => {
  if (gameOver) return;

  const newBoard = [...board.map(row => [...row])];
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r][col] === 0) {
      newBoard[r][col] = currentPlayer;
      setBoard(newBoard);
      setLastMove({ row: r, col });

      const coinDropAudio = new Audio('audio/coinDrop.mp3');

      coinDropAudio.volume = 0.3;
      coinDropAudio.play().catch(e => console.log("Coin Drop Audio is blocked: ", e));

      if (checkWin(newBoard, r, col)) {
        setWinner(currentPlayer);
        setLastWinner(currentPlayer); // Stores who won
        setGameOver(true);
        setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
      } else if (isDraw(newBoard)) {
        setGameOver(true);
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
      break;
    }
  }
};



  const isDraw = (board: number[][]) =>
    board.every(row => row.every(cell => cell !== 0));

  const checkWin = (b: number[][], row: number, col: number) => {
    const player = b[row][col];
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1],
    ];

    for (let [dr, dc] of directions) {
      let count = 1;
      count += countDir(b, row, col, dr, dc, player);
      count += countDir(b, row, col, -dr, -dc, player);
      if (count >= 4) return true;
    }
    return false;
  };

  const countDir = (b: number[][], r: number, c: number, dr: number, dc: number, p: number) => {
    let count = 0;
    let row = r + dr;
    let col = c + dc;

    while (row >= 0 && row < ROWS && col >= 0 && col < COLS && b[row][col] === p) {
      count++;
      row += dr;
      col += dc;
    }
    return count;
  };

  const startGame = () => {
    if (!playerNames[1] || !playerNames[2]) return alert("Enter both names!");
    document.documentElement.style.setProperty('--player1-color', playerColors[1]);
    document.documentElement.style.setProperty('--player2-color', playerColors[2]);
    initBoard();
    setStarted(true);
  };

  const restart = () => {
    initBoard();
  };

  const resetAll = () => {
    setStarted(false);
    setScores({ 1: 0, 2: 0 });
    setPlayerNames({ 1: '', 2: '' });
  };

  return (
    <main>

    <div ref={fireworksRef} className={styles.fireworksContainer} />
      {!started ? (
        <>
          <div className={styles.title}>Connect 4</div>
          <p className={styles.description}>A fun 2 player game written in TypeScript using the NextJS framework</p>

          <div className={styles.inputGroup}>
            <input
              className={styles.input}
              type="text"
              placeholder="Player 1 Name"
              value={playerNames[1]}
              onChange={e => setPlayerNames(prev => ({ ...prev, 1: e.target.value }))}
            />
            <input
              type="color"
              className="colorPicker"
              value={playerColors[1]}
              onChange={e => setPlayerColors(prev => ({ ...prev, 1: e.target.value }))}
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              className={styles.input}
              type="text"
              placeholder="Player 2 Name"
              value={playerNames[2]}
              onChange={e => setPlayerNames(prev => ({ ...prev, 2: e.target.value }))}
            />
            <input
              type="color"
              className="colorPicker"
              value={playerColors[2]}
              onChange={e => setPlayerColors(prev => ({ ...prev, 2: e.target.value }))}
            />
          </div>

          <button className={styles.btn} onClick={startGame}>Start Game</button>
        </>
      ) : (
        <>
          <div className={styles.scoreboard}>
            {playerNames[1]}: {scores[1]} | {playerNames[2]}: {scores[2]}
          </div>

          <div className={styles.message}>
          {gameOver ? (
            winner ? (
              `${playerNames[winner]} wins! 🎉`
            ) : (
              "It's a draw!"
            )
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'center', color: 'white' }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: playerColors[currentPlayer],
                  border: '2px solid #333',
                }}
              ></span>
              {playerNames[currentPlayer]}'s turn
            </span>
          )}
        </div>



        <div className={styles.board}>
      {board.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          const isLast =
            lastMove && lastMove.row === rIdx && lastMove.col === cIdx;
          return (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`${styles.cell} ${
                cell === 1 ? styles.player1 : cell === 2 ? styles.player2 : ''
              } ${isLast ? styles.animatedDrop : ''}`}
              onClick={() => handleMove(cIdx)}
            />
          );
        })
      )}
    </div>


          <div className={styles.controls}>
            <button className={styles.btn} onClick={restart}>Restart Round</button>
            <button className={styles.btn} onClick={resetAll}>Reset All</button>
          </div>
        </>
      )}
    </main>
  );
}
