import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import './App.css';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import BigProductCard from './pages/BigProductPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './components/Cart/Cart';
import Footer from './components/Footer/Footer';
function App() {
  return (
    <Router>
      <div className="App">
        <Header/>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/product" element={<BigProductCard />}/>
          <Route path="/profile" element={<ProfilePage />}/>
          <Route path="/favorites" element={<FavoritesPage />}/>
          <Route path="/cart" element={<CartPage />} />
        </Routes>
        <Footer/>
      </div>
    </Router>
  );
}

export default App;