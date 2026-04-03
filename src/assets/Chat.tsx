import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaChevronLeft, FaShare, FaCamera, FaUserCircle } from 'react-icons/fa';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  imageUrl?: string;
  audioUrl?: string;
}

const Chat: React.FC = () => {
  const { eventId, participantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [participantPhoto, setParticipantPhoto] = useState("");
  const [participantLocation, setParticipantLocation] = useState("");

  useEffect(() => {
    // Get participant info from location state
    if (location.state) {
      setParticipantPhoto(location.state.participantPhoto || "");
      setParticipantLocation(location.state.participantLocation || "Delta, Agbor");
    }

    // Persistent Timer - 15 hours from first chat open
    const chatKey = `chatTimer_${eventId}_${participantId}`;
    const TOTAL_DURATION = 15 * 60 * 60 * 1000;

    let startTime = localStorage.getItem(chatKey);
    if (!startTime) {
      const now = Date.now();
      localStorage.setItem(chatKey, now.toString());
      startTime = now.toString();
    }

    const startTimestamp = parseInt(startTime);
    const updateTimer = () => {
      const elapsed = Date.now() - startTimestamp;
      const remainingMs = TOTAL_DURATION - elapsed;
      
      if (remainingMs <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        localStorage.removeItem(chatKey);
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [eventId, participantId, location.state]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!eventId || !participantId) return;

    const chatId = [eventId, participantId].sort().join('_');
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(3));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = [];
      snapshot.forEach((doc) => {
        messagesList.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(messagesList.reverse());
      setLoading(false);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [eventId, participantId]);

  const sendMessage = async () => {
    if (isExpired || timeLeft <= 0 || !newMessage.trim()) {
      alert("Chat session has expired!");
      return;
    }

    const chatId = [eventId, participantId].sort().join('_');
    const messagesRef = collection(db, `chats/${chatId}/messages`);

    try {
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: "currentUser",
        timestamp: serverTimestamp(),
        read: false
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSendingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const chatId = [eventId, participantId].sort().join('_');
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        
        await addDoc(messagesRef, {
          text: "📷 Photo",
          imageUrl: base64Image,
          senderId: "currentUser",
          timestamp: serverTimestamp()
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to send image");
    } finally {
      setSendingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const takePhoto = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100vw',
      minHeight: '100vh',
      background: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderBottom: '1px solid #e8eef5',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Top Row: Back Arrow, TALKING STAGE, LINKS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          width: '100%'
        }}>
          <button
            onClick={() => navigate(`/gallery/${eventId}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#1e4fa3',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 0'
            }}
          >
            <FaChevronLeft size={18} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>LINKUP</span>
          </button>
          
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#333',
            letterSpacing: '1px',
            textAlign: 'center'
          }}>
            TALKING STAGE
          </div>
          
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#1e4fa3',
            padding: '8px 0'
          }}>
            LINKS
          </div>
        </div>
        
        {/* Candy&Classy under it */}
        <div style={{
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#333',
            padding: '4px 12px',
            borderRadius: '50px'
          }}>
            (Candy&Classy)
          </span>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '8px'
        }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '10px 20px',
              background: 'white',
              borderRadius: '50px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: '1px solid #e8eef5'
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: timeLeft <= 0 ? '#e74c3c' : '#000',
                fontFamily: 'monospace',
                letterSpacing: '2px'
              }}
            >
              {timeLeft <= 0 ? 'EXPIRED' : formatTime(timeLeft)}
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#7f8c8d',
              marginTop: '6px',
              fontWeight: '500'
            }}
          >
            Time Left
          </div>
        </div>
      </div>

      {/* Person Profile Picture */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        background: 'white',
        borderBottom: '1px solid #e8eef5',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: '#e8eef5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          {participantPhoto ? (
            <img src={participantPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <FaUserCircle size={70} color="#1e4fa3" />
          )}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#1e4fa3',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {participantLocation}
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#f5f7fb',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            Loading messages...
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.senderId === 'currentUser' ? 'flex-end' : 'flex-start',
                  animation: 'slideIn 0.3s ease-out',
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  {message.senderId !== 'currentUser' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#e8eef5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {participantPhoto ? (
                        <img src={participantPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FaUserCircle size={32} color="#1e4fa3" />
                      )}
                    </div>
                  )}
                  
                  <div style={{
                    background: message.senderId === 'currentUser' ? '#1e4fa3' : 'white',
                    color: message.senderId === 'currentUser' ? 'white' : '#333',
                    padding: '10px 14px',
                    borderRadius: message.senderId === 'currentUser' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Shared"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '150px',
                          borderRadius: '12px',
                          marginBottom: '5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(message.imageUrl, '_blank')}
                      />
                    )}
                    {message.text && message.text !== "📷 Photo" && (
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{message.text}</p>
                    )}
                    {message.text === "📷 Photo" && <span>📷 Photo</span>}
                  </div>
                  
                  {message.senderId === 'currentUser' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#1e4fa3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <FaUserCircle size={32} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Area */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderTop: '1px solid #e8eef5',
        position: 'sticky',
        bottom: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%'
        }}>
          {/* Camera Icon */}
          <button
            onClick={takePhoto}
            disabled={sendingImage}
            style={{
              background: 'none',
              border: 'none',
              cursor: sendingImage ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              color: '#1e4fa3',
              padding: '8px',
              opacity: sendingImage ? 0.5 : 1,
              flexShrink: 0
            }}
          >
            <FaCamera />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Say Something..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '25px',
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s ease',
              background: '#f5f7fb',
              boxSizing: 'border-box',
              minWidth: 0
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            style={{
              background: 'none',
              border: 'none',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              color: newMessage.trim() ? '#1e4fa3' : '#bdc3c7',
              padding: '8px',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
          >
            <FaShare />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default Chat;