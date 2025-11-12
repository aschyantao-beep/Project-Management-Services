/**
 * 项目管理大师 - 配置管理模块
 * 处理环境变量和应用配置
 */

class AppConfig {
    constructor() {
        this.config = this.loadConfig();
        this.supabaseClient = null;
        this.supabaseManager = null;
        this.appConfigData = null;
    }

    /**
     * 从环境变量加载配置
     */
    loadConfig() {
        return {
            // Supabase 配置
            supabase: {
                url: import.meta.env?.VITE_SUPABASE_URL || this.getFallbackSupabaseUrl(),
                anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || this.getFallbackSupabaseKey()
            },

            // 应用信息
            app: {
                name: import.meta.env?.VITE_APP_NAME || '项目管理大师',
                description: import.meta.env?.VITE_APP_DESCRIPTION || '基于Web的现代化项目管理工具',
                version: import.meta.env?.VITE_APP_VERSION || '2.0.0',
                vercelUrl: import.meta.env?.VITE_VERCEL_URL || window.location.host
            },

            // 主题颜色
            theme: {
                primary: import.meta.env?.VITE_PRIMARY_COLOR || '#007bff',
                secondary: import.meta.env?.VITE_SECONDARY_COLOR || '#6c757d',
                success: import.meta.env?.VITE_SUCCESS_COLOR || '#28a745',
                danger: import.meta.env?.VITE_DANGER_COLOR || '#dc3545',
                warning: import.meta.env?.VITE_WARNING_COLOR || '#ffc107',
                info: import.meta.env?.VITE_INFO_COLOR || '#17a2b8'
            },

            // 品牌资源
            brand: {
                logoUrl: import.meta.env?.VITE_APP_LOGO_URL || '',
                faviconUrl: import.meta.env?.VITE_APP_FAVICON_URL || '',
                customCssUrl: import.meta.env?.VITE_CUSTOM_CSS_URL || ''
            },

            // 开发配置
            debug: {
                enabled: import.meta.env?.VITE_DEBUG_MODE === 'true',
                showApiCalls: import.meta.env?.VITE_SHOW_API_CALLS === 'true'
            }
        };
    }

    /**
     * 获取备用 Supabase URL
     * 这里提供一个演示环境的URL，用户需要替换为自己的
     */
    getFallbackSupabaseUrl() {
        // 从 localStorage 或 URL 参数中获取
        const savedUrl = localStorage.getItem('supabase_url');
        if (savedUrl) return savedUrl;

        // 从 URL 参数中获取（用于临时演示）
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('supabase_url') || '';
    }

    /**
     * 获取备用 Supabase Key
     */
    getFallbackSupabaseKey() {
        const savedKey = localStorage.getItem('supabase_anon_key');
        if (savedKey) return savedKey;

        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('supabase_anon_key') || '';
    }

    /**
     * 初始化配置
     */
    async init() {
        try {
            // 设置应用标题和元数据
            this.updatePageMetadata();

            // 设置主题颜色
            this.applyThemeColors();

            // 加载自定义CSS
            await this.loadCustomCSS();

            // 初始化 Supabase
            if (this.config.supabase.url && this.config.supabase.anonKey) {
                await this.initSupabase();

                // 从数据库加载应用配置
                await this.loadAppConfigFromDB();
            } else {
                console.warn('未配置 Supabase 连接信息');
                this.showConfigurationNeeded();
            }

            // 设置调试模式
            if (this.config.debug.enabled) {
                this.enableDebugMode();
            }

            return true;
        } catch (error) {
            console.error('配置初始化失败:', error);
            return false;
        }
    }

    /**
     * 更新页面元数据
     */
    updatePageMetadata() {
        document.title = this.config.app.name;

        // 更新或创建 meta 标签
        this.setMetaTag('description', this.config.app.description);
        this.setMetaTag('application-name', this.config.app.name);

        // 设置 favicon
        if (this.config.brand.faviconUrl) {
            this.setFavicon(this.config.brand.faviconUrl);
        }
    }

    /**
     * 设置 meta 标签
     */
    setMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`) ||
                   document.querySelector(`meta[property="${name}"]`);

        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }

        meta.content = content;
    }

    /**
     * 设置 favicon
     */
    setFavicon(url) {
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = url;
    }

    /**
     * 应用主题颜色
     */
    applyThemeColors() {
        const root = document.documentElement;
        const theme = this.config.theme;

        // 设置 CSS 变量
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--success-color', theme.success);
        root.style.setProperty('--danger-color', theme.danger);
        root.style.setProperty('--warning-color', theme.warning);
        root.style.setProperty('--info-color', theme.info);

        // 设置 Bootstrap 颜色变量（如果使用）
        root.style.setProperty('--bs-primary', theme.primary);
        root.style.setProperty('--bs-secondary', theme.secondary);
        root.style.setProperty('--bs-success', theme.success);
        root.style.setProperty('--bs-danger', theme.danger);
        root.style.setProperty('--bs-warning', theme.warning);
        root.style.setProperty('--bs-info', theme.info);
    }

    /**
     * 加载自定义CSS
     */
    async loadCustomCSS() {
        if (!this.config.brand.customCssUrl) return;

        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.config.brand.customCssUrl;
            document.head.appendChild(link);

            console.log('自定义CSS加载成功:', this.config.brand.customCssUrl);
        } catch (error) {
            console.error('自定义CSS加载失败:', error);
        }
    }

    /**
     * 初始化 Supabase
     */
    async initSupabase() {
        if (!window.SupabaseProjectManager) {
            console.error('SupabaseProjectManager 类未加载');
            return false;
        }

        this.supabaseManager = new SupabaseProjectManager(
            this.config.supabase.url,
            this.config.supabase.anonKey
        );

        const connected = await this.supabaseManager.testConnection();
        if (!connected) {
            throw new Error('Supabase 连接失败');
        }

        console.log('Supabase 初始化成功');
        return true;
    }

    /**
     * 从数据库加载应用配置
     */
    async loadAppConfigFromDB() {
        if (!this.supabaseManager) return;

        try {
            this.appConfigData = await this.supabaseManager.getAppConfig();

            // 应用数据库中的配置
            if (this.appConfigData) {
                this.config.app.name = this.appConfigData.instance_name;
                this.config.app.description = this.appConfigData.description;

                if (this.appConfigData.theme_colors) {
                    Object.assign(this.config.theme, this.appConfigData.theme_colors);
                    this.applyThemeColors();
                }

                if (this.appConfigData.logo_url) {
                    this.config.brand.logoUrl = this.appConfigData.logo_url;
                }

                if (this.appConfigData.favicon_url) {
                    this.config.brand.faviconUrl = this.appConfigData.favicon_url;
                    this.setFavicon(this.appConfigData.favicon_url);
                }

                if (this.appConfigData.custom_css) {
                    // 应用内联自定义CSS
                    const style = document.createElement('style');
                    style.textContent = this.appConfigData.custom_css;
                    document.head.appendChild(style);
                }

                // 更新页面元数据
                this.updatePageMetadata();
            }
        } catch (error) {
            console.error('从数据库加载配置失败:', error);
        }
    }

    /**
     * 显示需要配置的提示
     */
    showConfigurationNeeded() {
        const configDiv = document.createElement('div');
        configDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;

        configDiv.innerHTML = `
            <strong>需要配置数据库</strong><br>
            请设置 SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量<br>
            <a href="#" onclick="showSetupGuide()" style="color: white; text-decoration: underline;">查看配置指南</a>
            <button onclick="this.parentElement.remove()" style="margin-left: 20px; padding: 5px 15px; border: none; background: white; color: #ff6b6b; border-radius: 3px; cursor: pointer;">×</button>
        `;

        document.body.appendChild(configDiv);

        // 显示设置指南的函数
        window.showSetupGuide = () => {
            alert(`配置指南：

1. 访问 https://supabase.com 并创建账号
2. 创建新项目
3. 在 SQL Editor 中运行项目中的 supabase/setup.sql 文件
4. 在项目设置 > API 中获取 URL 和 anon key
5. 在 Vercel 部署时设置环境变量：
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

或者在本地创建 .env 文件并填入这些值。`);
        };
    }

    /**
     * 启用调试模式
     */
    enableDebugMode() {
        console.log('调试模式已启用');
        console.log('当前配置:', this.config);

        // 在页面中显示调试信息
        if (this.config.debug.showApiCalls) {
            this.addDebugPanel();
        }
    }

    /**
     * 添加调试面板
     */
    addDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9998;
            max-height: 200px;
            overflow-y: auto;
        `;

        debugPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">调试信息</div>
            <div id="debug-content">等待API调用...</div>
            <button onclick="this.parentElement.style.display='none'" style="position: absolute; top: 5px; right: 5px; border: none; background: none; color: white; cursor: pointer;">×</button>
        `;

        document.body.appendChild(debugPanel);

        // 日志API调用
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options] = args;
            const start = Date.now();

            try {
                const response = await originalFetch(...args);
                const duration = Date.now() - start;

                this.addDebugLog(`${options?.method || 'GET'} ${url.split('?')[0]} - ${response.status} (${duration}ms)`);

                return response;
            } catch (error) {
                const duration = Date.now() - start;
                this.addDebugLog(`${options?.method || 'GET'} ${url.split('?')[0]} - ERROR (${duration}ms): ${error.message}`);
                throw error;
            }
        };
    }

    /**
     * 添加调试日志
     */
    addDebugLog(message) {
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            const logEntry = document.createElement('div');
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            debugContent.appendChild(logEntry);
            debugContent.scrollTop = debugContent.scrollHeight;
        }
    }

    /**
     * 获取配置值
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
    }

    /**
     * 获取 Supabase 管理器实例
     */
    getSupabaseManager() {
        return this.supabaseManager;
    }

    /**
     * 获取应用配置数据
     */
    getAppConfigData() {
        return this.appConfigData;
    }

    /**
     * 检查是否已配置
     */
    isConfigured() {
        return !!(this.config.supabase.url && this.config.supabase.anonKey);
    }

    /**
     * 保存配置到 localStorage
     */
    saveToLocalStorage(supabaseUrl, supabaseKey) {
        localStorage.setItem('supabase_url', supabaseUrl);
        localStorage.setItem('supabase_anon_key', supabaseKey);

        // 重新加载配置
        this.config.supabase.url = supabaseUrl;
        this.config.supabase.anonKey = supabaseKey;

        // 重新初始化 Supabase
        this.initSupabase();
    }
}

// 创建全局配置实例
window.appConfig = new AppConfig();

// 导出配置管理器
export default window.appConfig;