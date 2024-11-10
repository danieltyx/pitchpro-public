import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import FileUpload from './routers/FileUpload';
import Editor from './routers/Editor';
import PresentationViewNew from './routers/PresentationViewNew';
import CombinedPresentationView from './routers/CombinedPresentationView';



function App() {
  return (
    <Routes>
        <Route path="/" element={<FileUpload />} />
        <Route path="/editor" element={<Editor/>} />
        <Route path="/PresentationView" element={<CombinedPresentationView/>} />
    </Routes>
  );
}

export default App;
