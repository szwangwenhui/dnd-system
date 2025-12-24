/**
 * Supabase 配置文件
 * DND公测版
 */

(function() {
  'use strict';

  // Supabase 配置
  const SUPABASE_URL = 'https://liiibkgarmcqwgcvojrt.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_3d-C4kJ-Pt9pFWynpw8FQQ_8rWMKk_E';

  // 等待 Supabase SDK 加载
  const initSupabase = () => {
    if (typeof window.supabase === 'undefined') {
      console.error('[Supabase] SDK 未加载');
      return null;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] 客户端初始化完成');
    return client;
  };

  // 初始化客户端
  window.supabaseClient = initSupabase();

  // 导出配置（供其他模块使用）
  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };

  console.log('[DND2] config/supabase.js 加载完成');
})();
