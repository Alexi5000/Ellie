import React, { useState, useRef, useEffect } from 'react';
import { Message, VoiceState } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  voiceState: VoiceState;
  onPlayAudio?: (audioUrl: string) => void;
  onClearConversation?: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  voiceState,
  onPlayAudio,
  onClearConversation,
  className = ''
}) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handlePlayAudio = async (message: Message) => {
    if (!message.audioUrl || !onPlayAudio) return;

    try {
      // Stop currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      setPlayingAudioId(message.id);
      onPlayAudio(message.audioUrl);

      // Create audio element for playback control
      const audio = new Audio(message.audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
      };

      audio.onerror = () => {
        setPlayingAudioId(null);
        console.error('Error playing audio for message:', message.id);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudioId(null);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingAudioId(null);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  };

  const getMessageIcon = (type: 'user' | 'assistant') => {
    if (type === 'user') {
      return (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </div>
      );
    }
  };

  const renderTypingIndicator = () => {
    if (voiceState !== VoiceState.PROCESSING) return null;

    return (
      <div className="flex items-start space-x-3 mb-4">
        {getMessageIcon('assistant')}
        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Ellie is thinking...</p>
        </div>
      </div>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.type === 'user';
    const isPlaying = playingAudioId === message.id;

    return (
      <div
        key={message.id}
        data-testid={`message-${index}`}
        className={`flex items-start space-x-3 mb-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
      >
        {getMessageIcon(message.type)}
        
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div
            className={`inline-block rounded-lg px-4 py-3 max-w-xs lg:max-w-md ${
              isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            
            {/* Audio controls for assistant messages */}
            {!isUser && message.audioUrl && onPlayAudio && (
              <div className="mt-2 flex items-center space-x-2">
                <button
                  onClick={() => isPlaying ? handleStopAudio() : handlePlayAudio(message)}
                  className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
                >
                  {isPlaying ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{isPlaying ? 'Stop' : 'Play'}</span>
                </button>
                
                {/* Audio confidence indicator */}
                {message.metadata.confidence && (
                  <span className="text-xs text-gray-500">
                    {Math.round(message.metadata.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Timestamp and metadata */}
          <div className={`mt-1 text-xs text-gray-500 ${isUser ? 'text-right' : ''}`}>
            <span>{formatTimestamp(message.timestamp)}</span>
            {message.metadata.processingTime && (
              <span className="ml-2">
                ({message.metadata.processingTime}ms)
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Ellie</h3>
            <p className="text-sm text-gray-500">AI Legal Assistant</p>
          </div>
        </div>
        
        {/* Clear conversation button */}
        {messages.length > 0 && onClearConversation && (
          <button
            onClick={onClearConversation}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Message count for testing */}
        <div data-testid="message-count" className="sr-only">{messages.length}</div>
        
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Welcome to Ellie</h4>
            <p className="text-gray-600 max-w-sm mx-auto">
              Hi! I'm Ellie, your AI legal assistant. Tap the microphone button to start our conversation.
            </p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        
        {/* Typing indicator - shows regardless of message count */}
        {renderTypingIndicator()}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice state indicator */}
      <div className="px-4 py-2 bg-white border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            voiceState === VoiceState.IDLE ? 'bg-gray-400' :
            voiceState === VoiceState.LISTENING ? 'bg-blue-500 animate-pulse' :
            voiceState === VoiceState.PROCESSING ? 'bg-yellow-500 animate-pulse' :
            voiceState === VoiceState.SPEAKING ? 'bg-green-500 animate-pulse' :
            'bg-red-500'
          }`} />
          <span data-testid="voice-state" className="text-xs text-gray-600 capitalize">
            {voiceState === VoiceState.PROCESSING ? 'Processing...' : 
             voiceState === VoiceState.SPEAKING ? 'Speaking...' :
             voiceState === VoiceState.LISTENING ? 'Listening...' :
             voiceState === VoiceState.ERROR ? 'Error' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Hidden audio element for accessibility */}
      <div className="sr-only">
        <p id="chat-description">
          Conversation with Ellie, your AI legal assistant. Messages are displayed chronologically with timestamps.
          Audio playback is available for assistant responses.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;