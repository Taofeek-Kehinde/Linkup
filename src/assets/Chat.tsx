import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaArrowLeft, FaPaperPlane, FaMicrophone, FaCamera, FaStop, FaUserCircle, FaEllipsisH } from 'react-icons/fa';

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
  const [timeLeft, setTimeLeft] = useState(15 * 60 * 60); // 15 hours in seconds
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setParticipantName] = useState("");
  const [participantPhoto, setParticipantPhoto] = useState("");
  const [, setEventTitle] = useState("");
  const [participantLocation, setParticipantLocation] = useState("");

  useEffect(() => {
    // Get participant info from location state
    if (location.state) {
      setParticipantName(location.state.participantName || "LINKUP User");
      setParticipantPhoto(location.state.participantPhoto || "");
      setEventTitle(location.state.eventName || "LINK UP Event");
      setParticipantLocation(location.state.participantLocation || "Location");
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch messages with 3 message limit
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
    if (!newMessage.trim()) return;

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          const chatId = [eventId, participantId].sort().join('_');
          const messagesRef = collection(db, `chats/${chatId}/messages`);
          
          await addDoc(messagesRef, {
            text: "🎤 Voice message",
            audioUrl: base64Audio,
            senderId: "currentUser",
            timestamp: serverTimestamp()
          });
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
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
      minHeight: '100vh',
      background: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header - Exactly as in image */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #e8eef5',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => navigate(`/gallery/${eventId}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#1e4fa3',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaArrowLeft />
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '18px', 
              margin: 0, 
              color: '#1e4fa3',
              fontWeight: '600',
              letterSpacing: '1px'
            }}>
              <FaEllipsisH style={{ fontSize: '14px', marginRight: '4px', display: 'inline' }} />
              LINKUP
              <FaEllipsisH style={{ fontSize: '14px', marginLeft: '4px', display: 'inline' }} />
            </h1>
            <p style={{ 
              fontSize: '11px', 
              margin: '2px 0 0', 
              color: '#7f8c8d',
              fontWeight: '500'
            }}>
              LINKS • TALKINGSTAGE
            </p>
          </div>
          
          <div style={{ width: '24px' }} />
        </div>
        
        {/* Event Name and Location Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#333',
            background: '#f0f0f0',
            padding: '4px 12px',
            borderRadius: '50px'
          }}>
            (Candy&Classy)
          </span>
          <span style={{
            fontSize: '12px',
            color: '#7f8c8d'
          }}>
            {participantLocation}
          </span>
        </div>
      </div>

      {/* Timer Display - Centered with TimeLeft */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        background: 'white',
        margin: '0',
        borderBottom: '1px solid #e8eef5'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#e74c3c',
          fontFamily: 'monospace',
          letterSpacing: '2px'
        }}>
          ({formatTime(timeLeft)})
        </div>
        <span style={{
          fontSize: '12px',
          color: '#7f8c8d',
          marginLeft: '8px',
          fontWeight: '500'
        }}>
          TimeLeft
        </span>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#f5f7fb'
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
                  animation: 'slideIn 0.3s ease-out'
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
                    wordWrap: 'break-word'
                  }}>
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Shared"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '12px',
                          marginBottom: '5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(message.imageUrl, '_blank')}
                      />
                    )}
                    {message.audioUrl && (
                      <audio controls style={{ maxWidth: '200px' }}>
                        <source src={message.audioUrl} type="audio/webm" />
                      </audio>
                    )}
                    {message.text && message.text !== "🎤 Voice message" && message.text !== "📷 Photo" && (
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{message.text}</p>
                    )}
                    {message.text === "🎤 Voice message" && <span>🎤 Voice message</span>}
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

      {/* Message Input Area - Exactly as in image */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderTop: '1px solid #e8eef5',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Camera Icon - Left */}
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
              opacity: sendingImage ? 0.5 : 1
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

          {/* Message Input - Center */}
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
              background: '#f5f7fb'
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
              transition: 'all 0.3s ease'
            }}
          >
            <FaPaperPlane />
          </button>

          {/* Voice Recorder - Right */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              color: isRecording ? '#e74c3c' : '#1e4fa3',
              padding: '8px',
              animation: isRecording ? 'pulse 1s infinite' : 'none'
            }}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
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
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Chat;