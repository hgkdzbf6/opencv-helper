import React, { useState, useCallback } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface ResizablePanelProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  position: 'left' | 'right';
  title?: string;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  width: initialWidth,
  minWidth = 200,
  maxWidth = 500,
  position,
  title,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();

    const startX = e.pageX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (position === 'left') {
        const newWidth = startWidth + (e.pageX - startX);
        setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
      } else {
        const newWidth = startWidth - (e.pageX - startX);
        setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, minWidth, maxWidth, position]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <div
        className={`flex ${position === 'right' ? 'flex-row-reverse' : 'flex-row'}`}
        style={{ width: isCollapsed ? 'auto' : width }}
      >
        <div className={`flex-1 bg-white border-${position === 'left' ? 'r' : 'l'} border-gray-200 overflow-hidden`}>
          {!isCollapsed && children}
        </div>
        <div
          className={`w-1 cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors
            ${isResizing ? 'bg-blue-500' : ''}`}
          onMouseDown={startResizing}
        />
        <div className="flex items-center px-2 bg-white">
          <Button
            type="text"
            icon={isCollapsed ? 
              (position === 'left' ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />) : 
              (position === 'left' ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />)
            }
            onClick={toggleCollapse}
          />
        </div>
      </div>
    </>
  );
};

export default ResizablePanel; 