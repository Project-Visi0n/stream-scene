import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from './pages/Home';
import About from './pages/About';
import Users from './pages/Users';

const App = () => {
  return (
    <Router>
      <nav className="bg-gray-800 text-white p-4 flex gap-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/about" className="hover:underline">About</Link>
        <Link to="/users" className="hover:underline">Users</Link>
      </nav>

      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;