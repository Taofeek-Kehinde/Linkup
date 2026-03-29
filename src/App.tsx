import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DateQr from "./assets/DateQr";
import Picture from "./assets/Picture";
import Lollipop from "./assets/Lolipop.tsx";
import Gallery from "./assets/Gallery";
import Chat from "./assets/Chat";
import { AdminLock, LinkupGenerator } from "./admin-lock/admin";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page - shows QR code for the event */}
        <Route path="/" element={<DateQr />} />
        
        {/* Catch any route with eventId parameter for DateQr */}
        <Route path="/event/:eventId" element={<DateQr />} />
        
        {/* Picture page - take photo with front camera */}
        <Route path="/picture/:eventId" element={<Picture />} />
        
        {/* Lollipop page - choose chocolate/lollipop and location */}
        <Route path="/lollipop/:eventId" element={<Lollipop />} />
        
        {/* Gallery page - view all participants and chat */}
        <Route path="/gallery/:eventId" element={<Gallery />} />
        
        {/* Chat page - 1-on-1 messaging with timer */}
        <Route path="/chat/:eventId/:participantId" element={<Chat />} />
        
        {/* Admin page with encryption lock */}
        <Route 
          path="/admin" 
          element={
            <AdminLock>
              <LinkupGenerator />
            </AdminLock>
          } 
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<DateQr />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;