
import React from 'react';

const tenantSitePageConfig = {
  home: {
    name: '首页',
    sections: [
      { id: 'carousel', name: '轮播图', fields: [
        { id: 'title', label: '标题', type: 'text' },
        { id: 'description', label: '描述', type: 'textarea' },
        { id: 'image_url', label: '图片', type: 'image' },
      ]},
      { id: 'announcements', name: '滚动公告', fields: [
        { id: 'text', label: '公告文本', type: 'text' },
      ]},
      { id: 'hot_games', name: '热门推荐 (首页)', fields: [
        { id: 'title', label: '游戏标题', type: 'text' },
        { id: 'description', label: '游戏描述', type: 'text' },
        { id: 'path', label: '路径', type: 'text' },
        { id: 'iconUrl', label: '图标链接 (URL)', type: 'text' },
        { id: 'info', label: '提示信息', type: 'text' },
      ], batchImport: true },
    ],
  },
  games: {
    name: '游戏',
    sections: [
        { id: 'game_categories', name: '游戏分类', fields: [
            { id: 'name', label: '菜单名称', type: 'text' },
            { id: 'slug', label: '菜单ID (英文, 唯一)', type: 'text' },
            { id: 'icon', label: '菜单图标', type: 'icon' },
        ], batchImport: false },
        { id: 'game_cards', name: '游戏卡片', fields: [
            { id: 'title', label: '游戏标题', type: 'text' },
            { id: 'category', label: '所属分类', type: 'select', optionsSource: 'game_categories' },
            { id: 'description', label: '游戏描述', type: 'text' },
            { id: 'path', label: '路径', type: 'text' },
            { id: 'iconUrl', label: '图标链接 (URL)', type: 'text' },
            { id: 'info', label: '提示信息', type: 'text' },
        ], batchImport: true },
    ],
  },
};

const mainSitePageConfig = {
  ...tenantSitePageConfig,
  social: {
    name: '朋友圈',
    sections: [
      { id: 'pinned_ads', name: '置顶广告', fields: [
        { id: 'title', label: '广告标题', type: 'text' },
        { id: 'link_url', label: '跳转链接', type: 'text' },
        { id: 'background_image_url', label: '背景图', type: 'image' },
      ]},
    ],
  },
  my_page: {
    name: '我的页面',
    sections: [
      { id: 'pg_live_stream', name: '精彩PG直播', fields: [
        { id: 'title', label: '标题', type: 'text' },
        { id: 'description', label: '描述', type: 'textarea' },
        { id: 'link_url', label: '跳转链接', type: 'text' },
        { id: 'image_url', label: '封面图片', type: 'image', hint: '推荐尺寸: 1200x200px' },
      ]},
    ],
  },
};


export const pageConfig = import.meta.env.VITE_TENANT_ID ? tenantSitePageConfig : mainSitePageConfig;
