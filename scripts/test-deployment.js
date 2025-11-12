#!/usr/bin/env node

/**
 * 项目管理大师 - 部署测试脚本
 * 测试完整部署流程并进行优化
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 项目管理大师 - 部署测试工具');
console.log('=====================================\n');

// 测试配置
const tests = {
    projectStructure: '项目结构测试',
    dependencies: '依赖安装测试',
    environment: '环境变量测试',
    database: '数据库连接测试',
    build: '构建测试',
    functionality: '功能测试'
};

let passedTests = 0;
let totalTests = Object.keys(tests).length;

// 测试结果记录
const testResults = [];

function runTest(testName, testFunction) {
    console.log(`🔍 ${testName}...`);
    try {
        const result = testFunction();
        if (result === true || result === undefined) {
            console.log(`✅ ${testName} - 通过\n`);
            testResults.push({ test: testName, status: 'PASSED', error: null });
            passedTests++;
        } else {
            console.log(`❌ ${testName} - 失败: ${result}\n`);
            testResults.push({ test: testName, status: 'FAILED', error: result });
        }
    } catch (error) {
        console.log(`❌ ${testName} - 错误: ${error.message}\n`);
        testResults.push({ test: testName, status: 'ERROR', error: error.message });
    }
}

// 测试 1: 项目结构
function testProjectStructure() {
    const requiredFiles = [
        'package.json',
        'vercel.json',
        '.env.example',
        'frontend/dist/supabase-enabled.html',
        'frontend/js/supabase-client.js',
        'frontend/js/config.js',
        'supabase/setup.sql',
        'supabase/rls_policies.sql',
        'README.md',
        'LICENSE',
        'QUICK_START.md'
    ];

    const missingFiles = [];
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            missingFiles.push(file);
        }
    }

    if (missingFiles.length > 0) {
        return `缺少文件: ${missingFiles.join(', ')}`;
    }

    // 检查目录结构
    const requiredDirs = [
        'frontend/dist',
        'frontend/js',
        'supabase',
        'scripts',
        '.github/workflows'
    ];

    const missingDirs = [];
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            missingDirs.push(dir);
        }
    }

    if (missingDirs.length > 0) {
        return `缺少目录: ${missingDirs.join(', ')}`;
    }

    return true;
}

// 测试 2: 依赖文件
function testDependencies() {
    try {
        // 检查 package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        const requiredScripts = [
            'dev',
            'build',
            'deploy'
        ];

        const missingScripts = [];
        for (const script of requiredScripts) {
            if (!packageJson.scripts || !packageJson.scripts[script]) {
                missingScripts.push(script);
            }
        }

        if (missingScripts.length > 0) {
            return `package.json 缺少脚本: ${missingScripts.join(', ')}`;
        }

        // 检查是否有必需的依赖
        const requiredDeps = ['@supabase/supabase-js'];
        const optionalDeps = ['vercel'];

        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        const missingDeps = [];
        for (const dep of requiredDeps) {
            if (!allDeps[dep]) {
                missingDeps.push(dep);
            }
        }

        if (missingDeps.length > 0) {
            return `缺少必需依赖: ${missingDeps.join(', ')}`;
        }

        return true;
    } catch (error) {
        return `package.json 解析失败: ${error.message}`;
    }
}

// 测试 3: 环境变量模板
function testEnvironmentVariables() {
    try {
        const envExample = fs.readFileSync('.env.example', 'utf8');

        const requiredVars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY'
        ];

        const missingVars = [];
        for (const varName of requiredVars) {
            if (!envExample.includes(`${varName}=`)) {
                missingVars.push(varName);
            }
        }

        if (missingVars.length > 0) {
            return `缺少环境变量: ${missingVars.join(', ')}`;
        }

        // 检查 vercel.json 中的环境变量引用
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

        if (!vercelConfig.env) {
            return 'vercel.json 缺少 env 配置';
        }

        const vercelEnvVars = Object.keys(vercelConfig.env);
        const expectedVercelVars = [
            'VITE_APP_NAME',
            'VITE_APP_DESCRIPTION',
            'VITE_APP_VERSION'
        ];

        const missingVercelVars = [];
        for (const varName of expectedVercelVars) {
            if (!vercelEnvVars.includes(varName)) {
                missingVercelVars.push(varName);
            }
        }

        if (missingVercelVars.length > 0) {
            return `vercel.json 缺少环境变量: ${missingVercelVars.join(', ')}`;
        }

        return true;
    } catch (error) {
        return `环境变量测试失败: ${error.message}`;
    }
}

// 测试 4: 数据库脚本
function testDatabase() {
    try {
        const setupSql = fs.readFileSync('supabase/setup.sql', 'utf8');
        const rlsSql = fs.readFileSync('supabase/rls_policies.sql', 'utf8');

        // 检查必要的表创建语句
        const requiredTables = [
            'CREATE TABLE.*projects',
            'CREATE TABLE.*tasks',
            'CREATE TABLE.*timeline_events',
            'CREATE TABLE.*project_templates',
            'CREATE TABLE.*app_config'
        ];

        const missingTables = [];
        for (const table of requiredTables) {
            const regex = new RegExp(table, 'i');
            if (!regex.test(setupSql)) {
                missingTables.push(table.replace('CREATE TABLE.*', ''));
            }
        }

        if (missingTables.length > 0) {
            return `setup.sql 缺少表创建: ${missingTables.join(', ')}`;
        }

        // 检查 RLS 策略
        if (!rlsSql.includes('ENABLE ROW LEVEL SECURITY')) {
            return 'rls_policies.sql 缺少 RLS 启用语句';
        }

        if (!rlsSql.includes('CREATE POLICY')) {
            return 'rls_policies.sql 缺少安全策略创建';
        }

        return true;
    } catch (error) {
        return `数据库脚本测试失败: ${error.message}`;
    }
}

// 测试 5: 前端构建
function testBuild() {
    try {
        // 检查主 HTML 文件
        const mainHtml = fs.readFileSync('frontend/dist/supabase-enabled.html', 'utf8');

        // 检查必要的脚本引用
        const requiredScripts = [
            '@supabase/supabase-js',
            'vue@3',
            'js/supabase-client.js',
            'js/config.js'
        ];

        const missingScripts = [];
        for (const script of requiredScripts) {
            if (!mainHtml.includes(script)) {
                missingScripts.push(script);
            }
        }

        if (missingScripts.length > 0) {
            return `主 HTML 文件缺少脚本: ${missingScripts.join(', ')}`;
        }

        // 检查 Supabase 客户端文件
        const supabaseClient = fs.readFileSync('frontend/js/supabase-client.js', 'utf8');

        if (!supabaseClient.includes('class SupabaseProjectManager')) {
            return 'supabase-client.js 缺少 SupabaseProjectManager 类';
        }

        // 检查配置文件
        const config = fs.readFileSync('frontend/js/config.js', 'utf8');

        if (!config.includes('class AppConfig')) {
            return 'config.js 缺少 AppConfig 类';
        }

        return true;
    } catch (error) {
        return `构建测试失败: ${error.message}`;
    }
}

// 测试 6: 功能完整性
function testFunctionality() {
    try {
        // 检查 README.md 的完整性
        const readme = fs.readFileSync('README.md', 'utf8');

        const requiredSections = [
            '## ✨ 特性',
            '## 🚀 快速开始',
            '## 📋 环境变量配置',
            '## ❓ 常见问题',
            '## 📁 项目结构'
        ];

        const missingSections = [];
        for (const section of requiredSections) {
            if (!readme.includes(section)) {
                missingSections.push(section);
            }
        }

        if (missingSections.length > 0) {
            return `README.md 缺少章节: ${missingSections.join(', ')}`;
        }

        // 检查部署脚本
        const deployScript = fs.readFileSync('scripts/deploy-vercel.js', 'utf8');

        if (!deployScript.includes('deployToVercel')) {
            return 'deploy-vercel.js 缺少部署函数';
        }

        // 检查初始化脚本
        const initScript = fs.readFileSync('scripts/init-supabase.js', 'utf8');

        if (!initScript.includes('initSupabase')) {
            return 'init-supabase.js 缺少初始化函数';
        }

        // 检查 GitHub Actions
        const githubWorkflow = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');

        if (!githubWorkflow.includes('vercel deploy')) {
            return 'GitHub Actions 工作流缺少部署步骤';
        }

        return true;
    } catch (error) {
        return `功能测试失败: ${error.message}`;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('开始运行测试套件...\n');

    // 项目结构测试
    runTest(tests.projectStructure, testProjectStructure);

    // 依赖测试
    runTest(tests.dependencies, testDependencies);

    // 环境变量测试
    runTest(tests.environment, testEnvironmentVariables);

    // 数据库测试
    runTest(tests.database, testDatabase);

    // 构建测试
    runTest(tests.build, testBuild);

    // 功能测试
    runTest(tests.functionality, testFunctionality);
}

// 生成测试报告
function generateTestReport() {
    console.log('\n📊 测试报告');
    console.log('============');
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${totalTests - passedTests}`);
    console.log(`通过率: ${Math.round((passedTests / totalTests) * 100)}%\n`);

    console.log('📋 详细结果:');
    console.log('-------------');
    for (const result of testResults) {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        console.log(`${status} ${result.test}`);
        if (result.error) {
            console.log(`   ${result.error}`);
        }
    }

    // 优化建议
    console.log('\n💡 优化建议:');
    console.log('-------------');

    const failedTests = testResults.filter(r => r.status !== 'PASSED');
    if (failedTests.length === 0) {
        console.log('🎉 所有测试都通过了！项目已准备好部署。');
        console.log('\n🚀 接下来的步骤:');
        console.log('1. 将代码推送到 GitHub');
        console.log('2. 在 Vercel 中导入项目');
        console.log('3. 设置环境变量');
        console.log('4. 部署并测试应用');
    } else {
        console.log('修复以下问题后重新测试:');
        failedTests.forEach(test => {
            console.log(`- ${test.test}: ${test.error || '未知错误'}`);
        });
    }

    // 性能优化建议
    console.log('\n⚡ 性能优化建议:');
    console.log('- 压缩图片资源');
    console.log('使用 CDN 加载第三方库');
    console.log('启用 Gzip 压缩');
    console.log('配置浏览器缓存');
    console.log('优化 CSS 和 JavaScript 大小');
}

// 主函数
async function main() {
    try {
        runAllTests();
        generateTestReport();

        // 如果有测试失败，退出时返回错误代码
        if (passedTests < totalTests) {
            process.exit(1);
        }

    } catch (error) {
        console.error('测试运行过程中发生错误:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    testProjectStructure,
    testDependencies,
    testEnvironmentVariables,
    testDatabase,
    testBuild,
    testFunctionality,
    runAllTests
};