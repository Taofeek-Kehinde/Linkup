import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query,  getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { FaChevronLeft, FaUserCircle } from 'react-icons/fa';

interface ChatUser {
  id: string;
  participantId: string;
  participantPhoto: string;
  participantLocation: string;
  lastMessage: string;
  lastMessageTime: any;
  timeLeft: number;
}

const AllChat: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    const fetchEventName = async () => {
      if (eventId) {
        try {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) {
            setEventName(eventDoc.data().eventName || "Candy & Classy");
          }
        } catch (err) {
          console.error("Error fetching event:", err);
        }
      }
    };
    fetchEventName();
  }, [eventId]);

  useEffect(() => {
    const fetchChatUsers = async () => {
      if (!eventId) return;

      try {
        // Get all participants for this event (excluding current user)
        const participantsRef = collection(db, `events/${eventId}/participants`);
        const participantsSnapshot = await getDocs(participantsRef);
        
        const users: ChatUser[] = [];
        
        // For each participant, get their latest message
        for (const participantDoc of participantsSnapshot.docs) {
          const participantData = participantDoc.data();
          const participantId = participantDoc.id;
          
          // Get current user ID from session
          const currentUserId = sessionStorage.getItem('currentUserId');
          
          // Skip if it's the current user
          if (participantId === currentUserId) continue;
          
          // Get the latest message from this chat
          const chatId = [eventId, participantId].sort().join('_');
          const messagesRef = collection(db, `chats/${chatId}/messages`);
          const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
          const messagesSnapshot = await getDocs(messagesQuery);
          
          let lastMessage = "No messages yet";
          let lastMessageTime = null;
          
          if (!messagesSnapshot.empty) {
            const lastMsgDoc = messagesSnapshot.docs[0];
            const lastMsgData = lastMsgDoc.data();
            lastMessage = lastMsgData.text || "📷 Photo";
            lastMessageTime = lastMsgData.timestamp;
          }
          
          // Calculate time left for this chat (15 hours from first message)
          const chatKey = `chatTimer_${eventId}_${participantId}`;
          const TOTAL_DURATION = 15 * 60 * 60 * 1000;
          let timeLeft = 15 * 60 * 60; // 15 hours in seconds
          
          const startTime = localStorage.getItem(chatKey);
          if (startTime) {
            const elapsed = Date.now() - parseInt(startTime);
            const remainingMs = TOTAL_DURATION - elapsed;
            if (remainingMs > 0) {
              timeLeft = Math.floor(remainingMs / 1000);
            } else {
              timeLeft = 0;
            }
          }
          
          users.push({
            id: participantId,
            participantId: participantId,
            participantPhoto: participantData.photoUrl || "",
            participantLocation: participantData.location || "Unknown Location",
            lastMessage: lastMessage,
            lastMessageTime: lastMessageTime,
            timeLeft: timeLeft
          });
        }
        
        // Sort users by last message time (most recent first)
        users.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
        });
        
        setChatUsers(users);
      } catch (err) {
        console.error("Error fetching chat users:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatUsers();
  }, [eventId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUserClick = (user: ChatUser) => {
    navigate(`/chat/${eventId}/${user.participantId}`, {
      state: {
        participantName: user.participantLocation,
        participantPhoto: user.participantPhoto,
        eventName: eventName,
        participantLocation: user.participantLocation
      }
    });
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e8eef5',
            borderTopColor: '#1e4fa3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#1e4fa3' }}>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '100vw',
      minHeight: '100vh',
      background: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      overflowX: 'hidden'
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '8px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#1e4fa3',
              display: 'flex',
              alignItems: 'center',
              padding: '8px 0'
            }}
          >
            <FaChevronLeft />
          </button>
          
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e4fa3',
              margin: 0
            }}>
              Candy & Classy
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#7f8c8d',
              margin: '4px 0 0'
            }}>
              ({chatUsers.length} {chatUsers.length === 1 ? 'Link' : 'Links'})
            </p>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div style={{
        flex: 1,
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {chatUsers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#7f8c8d'
          }}>
            <FaUserCircle size={60} color="#bdc3c7" />
            <p style={{ marginTop: '16px' }}>No conversations yet</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Start chatting with someone from the gallery!</p>
          </div>
        ) : (
          chatUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                background: 'white',
                borderBottom: '1px solid #e8eef5',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              {/* Profile Picture */}
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#e8eef5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                marginRight: '12px'
              }}>
                {user.participantPhoto ? (
                  <img 
                    src={user.participantPhoto} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <FaUserCircle size={50} color="#1e4fa3" />
                )}
              </div>
              
              {/* Chat Info */}
              <div style={{
                flex: 1,
                minWidth: 0
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '4px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {user.participantLocation}
                  </span>
                  {user.timeLeft > 0 && user.timeLeft < 15 * 60 * 60 && (
                    <span style={{
                      fontSize: '11px',
                      color: '#e74c3c',
                      fontFamily: 'monospace',
                      fontWeight: '500'
                    }}>
                      {formatTime(user.timeLeft)}
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: '#7f8c8d',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '70%'
                  }}>
                    {user.lastMessage.length > 40 
                      ? user.lastMessage.substring(0, 40) + '...' 
                      : user.lastMessage}
                  </p>
                  {user.timeLeft > 0 && (
                    <span style={{
                      fontSize: '10px',
                      color: '#27ae60',
                      marginLeft: '8px'
                    }}>
                      Time left
                    </span>
                  )}
                  {user.timeLeft === 0 && (
                    <span style={{
                      fontSize: '10px',
                      color: '#e74c3c',
                      marginLeft: '8px'
                    }}>
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AllChat;