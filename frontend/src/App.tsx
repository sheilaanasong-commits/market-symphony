import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Game from "./pages/Game";
import About from "./pages/About";

export default function App() {
  return (
    <>
      <nav className="nav">
        <NavLink to="/">Market Symphony</NavLink>
        <NavLink to="/studio">Studio</NavLink>
        <NavLink to="/jeu">Devine le krach</NavLink>
        <NavLink to="/a-propos">À propos</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/jeu" element={<Game />} />
        <Route path="/a-propos" element={<About />} />
      </Routes>
    </>
  );
}
