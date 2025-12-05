import { GameProvider } from '@/context/GameContext';
import Game from './pages/Game';

function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}

export default App;