import React, { useState } from 'react';
import { 
  DocumentDuplicateIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  DocumentTextIcon,
  MusicalNoteIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const OutputPanel = ({ content, type, taskType }) => {
  const [copiedContent, setCopiedContent] = useState('');

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedContent(text);
      setTimeout(() => setCopiedContent(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const extractCodeBlocks = (content) => {
    if (!content) return [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    return matches.map(match => ({
      language: match[1] || 'text',
      code: match[2].trim()
    }));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'code':
        return <CodeBracketIcon className="w-5 h-5" />;
      case 'image':
        return <PhotoIcon className="w-5 h-5" />;
      case 'video':
        return <VideoCameraIcon className="w-5 h-5" />;
      case 'audio':
        return <MusicalNoteIcon className="w-5 h-5" />;
      case 'document':
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'code':
        return 'Code Output';
      case 'image':
        return 'Image Generation';
      case 'video':
        return 'Video Generation';
      case 'audio':
        return 'Audio Content';
      case 'document':
        return 'Document';
      default:
        return 'Text Output';
    }
  };

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {getIcon(type)}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Output will appear here
          </h3>
          <p className="text-gray-500 text-sm">
            {taskType === 'code' && 'Generated code will be displayed with syntax highlighting'}
            {taskType === 'image' && 'Generated images will be shown here'}
            {taskType === 'video' && 'Generated videos will be displayed here'}
            {(taskType === 'general' || taskType === 'summarize' || taskType === 'review') && 'AI responses and generated content will appear here'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2 text-gray-700">
          {getIcon(type)}
          <span className="font-medium">{getTypeLabel(type)}</span>
        </div>
        <button
          onClick={() => copyToClipboard(content)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          <span>{copiedContent === content ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {type === 'code' && (
          <div className="space-y-4">
            {extractCodeBlocks(content).length > 0 ? (
              extractCodeBlocks(content).map((block, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-200 text-sm rounded-t-lg">
                    <span className="font-medium">{block.language}</span>
                    <button
                      onClick={() => copyToClipboard(block.code)}
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedContent === block.code ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={block.language}
                    style={tomorrow}
                    className="rounded-b-lg"
                    showLineNumbers
                  >
                    {block.code}
                  </SyntaxHighlighter>
                </div>
              ))
            ) : (
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-gray-100 text-sm whitespace-pre-wrap overflow-x-auto">
                  {content}
                </pre>
              </div>
            )}
          </div>
        )}

        {type === 'image' && (
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8 border-2 border-dashed border-purple-300">
              <PhotoIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Image Generation Placeholder</h3>
              <p className="text-gray-600 mb-4">Prompt: "{content}"</p>
              <p className="text-sm text-gray-500">
                Image generation will be implemented when API keys are configured.
                This area will display the generated images.
              </p>
            </div>
          </div>
        )}

        {type === 'video' && (
          <div className="text-center">
            <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-lg p-8 border-2 border-dashed border-red-300">
              <VideoCameraIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Video Generation Placeholder</h3>
              <p className="text-gray-600 mb-4">Prompt: "{content}"</p>
              <p className="text-sm text-gray-500">
                Video generation will be implemented when API keys are configured.
                This area will display the generated videos.
              </p>
            </div>
          </div>
        )}

        {(type === 'text' || type === 'document') && (
          <div className="prose max-w-none">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          </div>
        )}

        {type === 'audio' && (
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-8 border-2 border-dashed border-blue-300">
              <MusicalNoteIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Audio Content</h3>
              <p className="text-gray-600 mb-4">Content: "{content}"</p>
              <p className="text-sm text-gray-500">
                Audio player and controls will be displayed here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;