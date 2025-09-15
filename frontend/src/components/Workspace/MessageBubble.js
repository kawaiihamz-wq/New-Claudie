import React from 'react';
import { UserCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getModelBadge = (model) => {
    if (!model) return null;
    
    let color = 'bg-gray-100 text-gray-800';
    let provider = 'AI';
    
    if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')) {
      color = 'bg-green-100 text-green-800';
      provider = 'GPT';
    } else if (model.startsWith('claude')) {
      color = 'bg-purple-100 text-purple-800';
      provider = 'CLAUDE';
    } else if (model.startsWith('gemini')) {
      color = 'bg-blue-100 text-blue-800';
      provider = 'GEMINI';
    } else if (model.includes('image')) {
      color = 'bg-pink-100 text-pink-800';
      provider = 'IMG';
    } else if (model.includes('video')) {
      color = 'bg-red-100 text-red-800';
      provider = 'VID';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {provider}
      </span>
    );
  };

  const renderContent = (content) => {
    // Check if content contains code blocks
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    if (matches.length === 0) {
      // No code blocks, render as plain text with line breaks
      return content.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }

    // Has code blocks, render with syntax highlighting
    let lastIndex = 0;
    const elements = [];

    matches.forEach((match, index) => {
      const [fullMatch, language, code] = match;
      const matchStart = match.index;
      
      // Add text before the code block
      if (matchStart > lastIndex) {
        const textBefore = content.slice(lastIndex, matchStart);
        elements.push(
          <span key={`text-${index}`}>
            {textBefore.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < textBefore.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }

      // Add the code block
      elements.push(
        <div key={`code-${index}`} className="my-3">
          <SyntaxHighlighter
            language={language || 'text'}
            style={tomorrow}
            className="rounded-lg text-sm"
            showLineNumbers={code.split('\n').length > 5}
          >
            {code.trim()}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = matchStart + fullMatch.length;
    });

    // Add remaining text after the last code block
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      elements.push(
        <span key="text-end">
          {remainingText.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < remainingText.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Message */}
        <div className={`
          px-4 py-3 rounded-2xl shadow-sm
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-md' 
            : 'bg-white border border-gray-200 rounded-bl-md'
          }
        `}>
          {/* Model badge for assistant messages */}
          {!isUser && message.model_used && (
            <div className="mb-2">
              {getModelBadge(message.model_used)}
            </div>
          )}

          {/* Content */}
          <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-900'}`}>
            {renderContent(message.content)}
          </div>

          {/* Timestamp */}
          <div className={`text-xs mt-2 ${isUser ? 'text-primary-100' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;