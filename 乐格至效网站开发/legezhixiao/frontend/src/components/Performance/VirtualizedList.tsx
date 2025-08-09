import React, { memo, useMemo, useState, useCallback } from 'react';
import { Spin, Empty, Input, Select, Button, List } from 'antd';
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  searchPlaceholder?: string;
  filterOptions?: Array<{ label: string; value: string; filterFn: (item: T) => boolean }>;
  sortOptions?: Array<{ label: string; value: string; sortFn: (a: T, b: T) => number }>;
  onItemClick?: (item: T, index: number) => void;
  emptyDescription?: string;
  className?: string;
  pageSize?: number;
}

function VirtualizedListComponent<T>({
  data,
  renderItem,
  itemHeight = 50,
  containerHeight = 400,
  loading = false,
  searchable = false,
  filterable = false,
  sortable = false,
  searchPlaceholder = '搜索...',
  filterOptions = [],
  sortOptions = [],
  onItemClick,
  emptyDescription = '暂无数据',
  className = '',
  pageSize = 50,
}: VirtualizedListProps<T>) {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [activeSort, setActiveSort] = useState<string>('');

  // 搜索过滤逻辑
  const searchFilter = useCallback(
    (item: T) => {
      if (!searchable || !searchText) return true;
      
      const searchStr = searchText.toLowerCase();
      const itemStr = JSON.stringify(item).toLowerCase();
      return itemStr.includes(searchStr);
    },
    [searchable, searchText]
  );

  // 应用过滤器
  const applyFilter = useCallback(
    (item: T) => {
      if (!filterable || !activeFilter) return true;
      
      const filterOption = filterOptions.find(opt => opt.value === activeFilter);
      return filterOption ? filterOption.filterFn(item) : true;
    },
    [filterable, activeFilter, filterOptions]
  );

  // 处理后的数据（搜索、过滤、排序）
  const processedData = useMemo(() => {
    let result = data.filter(item => searchFilter(item) && applyFilter(item));

    // 应用排序
    if (sortable && activeSort) {
      const sortOption = sortOptions.find(opt => opt.value === activeSort);
      if (sortOption) {
        result = [...result].sort(sortOption.sortFn);
      }
    }

    return result;
  }, [data, searchFilter, applyFilter, sortable, activeSort, sortOptions]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setActiveFilter(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setActiveSort(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchText('');
    setActiveFilter('');
    setActiveSort('');
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: containerHeight }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`virtualized-list-container ${className}`}>
      {/* 控制栏 */}
      {(searchable || filterable || sortable) && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {searchable && (
            <Search
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
          )}
          
          {filterable && filterOptions.length > 0 && (
            <Select
              placeholder="选择过滤器"
              value={activeFilter}
              onChange={handleFilterChange}
              style={{ width: 150 }}
              allowClear
            >
              {filterOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <FilterOutlined style={{ marginRight: 4 }} />
                  {option.label}
                </Option>
              ))}
            </Select>
          )}
          
          {sortable && sortOptions.length > 0 && (
            <Select
              placeholder="选择排序"
              value={activeSort}
              onChange={handleSortChange}
              style={{ width: 150 }}
              allowClear
            >
              {sortOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <SortAscendingOutlined style={{ marginRight: 4 }} />
                  {option.label}
                </Option>
              ))}
            </Select>
          )}
          
          {(searchText || activeFilter || activeSort) && (
            <Button onClick={clearFilters} size="small">
              清除筛选
            </Button>
          )}
          
          <span style={{ color: '#666', fontSize: '12px' }}>
            共 {processedData.length} 项
          </span>
        </div>
      )}

      {/* 优化的列表 - 使用分页来处理大数据集 */}
      {processedData.length === 0 ? (
        <Empty 
          description={emptyDescription}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <div style={{ height: containerHeight, overflowY: 'auto' }}>
          <List
            dataSource={processedData}
            pagination={{
              pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
              pageSizeOptions: ['20', '50', '100', '200'],
            }}
            renderItem={(item: T, index: number) => (
              <List.Item
                style={{ 
                  minHeight: itemHeight,
                  cursor: onItemClick ? 'pointer' : 'default',
                  padding: '8px 16px',
                }}
                onClick={onItemClick ? () => onItemClick(item, index) : undefined}
              >
                {renderItem(item, index)}
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
}

// 为了支持泛型，使用 memo 包装
export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;

// 预设配置的组件
export const VirtualizedNodeList = memo<VirtualizedListProps<any>>(({ data, ...props }) => (
  <VirtualizedList
    data={data}
    itemHeight={60}
    containerHeight={500}
    searchable
    filterable
    sortable
    searchPlaceholder="搜索节点..."
    filterOptions={[
      { label: '人物', value: 'character', filterFn: (item) => item.type === 'character' },
      { label: '地点', value: 'location', filterFn: (item) => item.type === 'location' },
      { label: '事件', value: 'event', filterFn: (item) => item.type === 'event' },
      { label: '概念', value: 'concept', filterFn: (item) => item.type === 'concept' },
    ]}
    sortOptions={[
      { label: '按名称', value: 'name', sortFn: (a, b) => (a.name || '').localeCompare(b.name || '') },
      { label: '按创建时间', value: 'created', sortFn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() },
      { label: '按更新时间', value: 'updated', sortFn: (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime() },
    ]}
    {...props}
  />
));

VirtualizedNodeList.displayName = 'VirtualizedNodeList';

export const VirtualizedChapterList = memo<VirtualizedListProps<any>>(({ data, ...props }) => (
  <VirtualizedList
    data={data}
    itemHeight={80}
    containerHeight={600}
    searchable
    sortable
    searchPlaceholder="搜索章节..."
    sortOptions={[
      { label: '按章节号', value: 'chapter', sortFn: (a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0) },
      { label: '按标题', value: 'title', sortFn: (a, b) => (a.title || '').localeCompare(b.title || '') },
      { label: '按字数', value: 'wordCount', sortFn: (a, b) => (b.wordCount || 0) - (a.wordCount || 0) },
      { label: '按更新时间', value: 'updated', sortFn: (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime() },
    ]}
    {...props}
  />
));

VirtualizedChapterList.displayName = 'VirtualizedChapterList';
