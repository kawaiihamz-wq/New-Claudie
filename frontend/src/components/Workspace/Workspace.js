import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatPanel from './ChatPanel';
import OutputPanel from './OutputPanel';
import ModelSwitcher from './ModelSwitcher';
import Sidebar from './Sidebar';

const Workspace = () => {
  const { user, logout } = useAuth();
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [taskType, setTaskType] = useState('general');
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [outputContent, setOutputContent] = useState(null);
  const [outputType, setOutputType] = useState('text');

  // Available models with their configurations
  const models = [
    { id: 'gpt-4o', name: 'GPT-4O', provider: 'openai', color: 'green' },
    { id: 'gpt-4o-mini', name: 'GPT-4O Mini', provider: 'openai', color: 'green' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', color: 'purple' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', color: 'purple' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', color: 'blue' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', color: 'blue' }
  ];

  const taskTypes = [
    { id: 'general', name: 'General Chat', icon: '💬' },
    { id: 'code', name: 'Code Assistant', icon: '👨‍💻' },
    { id: 'summarize', name: 'Summarize', icon: '📄' },
    { id: 'review', name: 'Code Review', icon: '🔍' },
    { id: 'image', name: 'Image Generation', icon: '🎨' },
    { id: 'video', name: 'Video Generation', icon: '🎬' }
  ];

  const handleOutputUpdate = (content, type = 'text') => {
    setOutputContent(content);
    setOutputType(type);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        setConversations={setConversations}
        currentConversation={currentConversation}
        setCurrentConversation={setCurrentConversation}
        user={user}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Claudie AI Workspace</h1>
                  <p className="text-sm text-gray-500">Your intelligent assistant</p>
                </div>
              </div>
            </div>

            {/* Model Switcher */}
            <ModelSwitcher
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              taskTypes={taskTypes}
              selectedTaskType={taskType}
              onTaskTypeChange={setTaskType}
            />
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel - Left Side */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="mr-2">{taskTypes.find(t => t.id === taskType)?.icon}</span>
                Chat Panel
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {taskTypes.find(t => t.id === taskType)?.name}
              </p>
            </div>
            <ChatPanel
              currentConversation={currentConversation}
              selectedModel={selectedModel}
              taskType={taskType}
              onOutputUpdate={handleOutputUpdate}
              setConversations={setConversations}
            />
          </div>

          {/* Output Panel - Right Side */}
          <div className="w-1/2 flex flex-col bg-gray-50">
            <div className="px-4 py-3 bg-white border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="mr-2">📋</span>
                Output Panel
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Generated content, code, and media
              </p>
            </div>
            <OutputPanel
              content={outputContent}
              type={outputType}
              taskType={taskType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;