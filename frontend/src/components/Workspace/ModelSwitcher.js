import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const ModelSwitcher = ({ 
  models, 
  selectedModel, 
  onModelChange, 
  taskTypes, 
  selectedTaskType, 
  onTaskTypeChange 
}) => {
  const currentModel = models.find(m => m.id === selectedModel);
  const currentTaskType = taskTypes.find(t => t.id === selectedTaskType);

  const getModelBadgeColor = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Task Type Selector */}
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <span className="mr-2">{currentTaskType?.icon}</span>
          {currentTaskType?.name}
          <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-md">
            <div className="py-1">
              {taskTypes.map((taskType) => (
                <Menu.Item key={taskType.id}>
                  {({ active }) => (
                    <button
                      onClick={() => onTaskTypeChange(taskType.id)}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } ${
                        selectedTaskType === taskType.id ? 'bg-primary-50 text-primary-700' : ''
                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                    >
                      <span className="mr-3">{taskType.icon}</span>
                      {taskType.name}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Model Selector with Badge */}
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <CpuChipIcon className="mr-2 h-4 w-4" />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mr-2 ${getModelBadgeColor(currentModel?.color)}`}>
            {currentModel?.provider.toUpperCase()}
          </span>
          {currentModel?.name}
          <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-md">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Available Models
              </div>
              {models.map((model) => (
                <Menu.Item key={model.id}>
                  {({ active }) => (
                    <button
                      onClick={() => onModelChange(model.id)}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } ${
                        selectedModel === model.id ? 'bg-primary-50 text-primary-700' : ''
                      } group flex items-center px-4 py-3 text-sm w-full text-left`}
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mr-3 ${getModelBadgeColor(model.color)}`}>
                        {model.provider.toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{model.provider}</div>
                      </div>
                      {selectedModel === model.id && (
                        <svg className="ml-auto h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default ModelSwitcher;