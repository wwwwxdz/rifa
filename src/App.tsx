import { HashRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context";
import { RaffleWheel } from "./pages";

function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RaffleWheel />} />
        </Routes>
      </HashRouter>
    </SettingsProvider>
  );
}

export default App;
