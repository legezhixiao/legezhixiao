import React, { useState, useMemo } from 'react';
import { Input, List, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { GraphNode, GraphRelationship } from '../../types/graph';

interface SearchPanelProps {
  nodes: GraphNode[];
  links: GraphRelationship[];
  onNodeSelect: (node: GraphNode) => void;
  onLinkSelect: (link: GraphRelationship) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  nodes,
  links,
  onNodeSelect,
  onLinkSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];

    const term = searchTerm.toLowerCase();
    
    const matchedNodes = nodes.filter(node => 
      node.name.toLowerCase().includes(term) ||
      node.type.toLowerCase().includes(term)
    ).map(node => ({
      type: 'node',
      data: node,
      key: `node-${node.id}`
    }));

    const matchedLinks = links.filter(link =>
      link.type.toLowerCase().includes(term)
    ).map(link => ({
      type: 'link',
      data: link,
      key: `link-${link.startNodeId}-${link.endNodeId}`
    }));

    return [...matchedNodes, ...matchedLinks];
  }, [nodes, links, searchTerm]);

  const handleItemClick = (item: any) => {
    if (item.type === 'node') {
      onNodeSelect(item.data);
    } else {
      onLinkSelect(item.data);
    }
  };

  return (
    <div className="search-panel" style={{
      position: 'absolute',
      left: 16,
      top: 16,
      width: 300,
      background: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <Input
        placeholder="搜索节点或关系..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      
      {filteredItems.length > 0 && (
        <List
          size="small"
          style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto' }}
          dataSource={filteredItems}
          renderItem={item => (
            <List.Item
              onClick={() => handleItemClick(item)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Tag color={item.type === 'node' ? '#108ee9' : '#87d068'}>
                  {item.type === 'node' ? '节点' : '关系'}
                </Tag>
                <div style={{ marginLeft: 8, flex: 1 }}>
                  {item.type === 'node' ? (
                    <>
                      <div>{(item.data as GraphNode).name}</div>
                      <small style={{ color: '#999' }}>{(item.data as GraphNode).type}</small>
                    </>
                  ) : (
                    <div>{(item.data as GraphRelationship).type}</div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};
