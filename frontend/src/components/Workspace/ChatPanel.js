import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import MessageBubble from './MessageBubble';

const ChatPanel = ({ 
  currentConversation, 
  selectedModel, 
  taskType, 
  onOutputUpdate,
  setConversations 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    
    try {
      setMessagesLoading(true);
      const response = await api.get(`/conversations/${currentConversation.id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentConversation || loading) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage = {
        id: Date.now().toString(),
        content: messageText,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          content: messageText,
          conversation_id: currentConversation.id,
          model: selectedModel,
          task_type: taskType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      let assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        model_used: selectedModel,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage.content += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });

                // Update output panel with content
                onOutputUpdate(assistantMessage.content, getOutputType(assistantMessage.content, taskType));
              }
              
              if (data.done) {
                // Update conversation timestamp
                setConversations(prev => 
                  prev.map(conv => 
                    conv.id === currentConversation.id 
                      ? { ...conv, updated_at: new Date().toISOString() }
                      : conv
                  )
                );
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getOutputType = (content, taskType) => {
    if (taskType === 'code' || content.includes('```')) {
      return 'code';
    }
    if (taskType === 'image') {
      return 'image';
    }
    if (taskType === 'video') {
      return 'video';
    }
    return 'text';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageGenerate = async () => {
    if (!currentConversation) return;
    
    const prompt = inputValue.trim() || 'Generate a creative image';
    setInputValue('');
    setLoading(true);

    try {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        content: `🎨 Image generation request: ${prompt}`,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // For now, show placeholder response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you want to generate an image with the prompt: "${prompt}". Image generation will be available once the API keys are configured. For now, this is a placeholder response.`,
        role: 'assistant',
        model_used: 'image-generator',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onOutputUpdate(prompt, 'image');
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoGenerate = async () => {
    if (!currentConversation) return;
    
    const prompt = inputValue.trim() || 'Generate a creative video';
    setInputValue('');
    setLoading(true);

    try {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        content: `🎬 Video generation request: ${prompt}`,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // For now, show placeholder response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you want to generate a video with the prompt: "${prompt}". Video generation will be available once the API keys are configured. For now, this is a placeholder response.`,
        role: 'assistant',
        model_used: 'video-generator',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onOutputUpdate(prompt, 'video');
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start a New Conversation</h3>
          <p className="text-gray-500 text-sm">
            Select "New Chat" from the sidebar to begin chatting with Claudie AI
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type your message for ${taskType === 'general' ? 'general chat' : taskType}...`}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="absolute bottom-3 right-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Action Buttons */}
          {(taskType === 'image' || taskType === 'video') && (
            <div className="flex space-x-2">
              {taskType === 'image' && (
                <button
                  type="button"
                  onClick={handleImageGenerate}
                  disabled={loading}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  Generate Image
                </button>
              )}
              {taskType === 'video' && (
                <button
                  type="button"
                  onClick={handleVideoGenerate}
                  disabled={loading}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  <VideoCameraIcon className="w-4 h-4 mr-2" />
                  Generate Video
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;