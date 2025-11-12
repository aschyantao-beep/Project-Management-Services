#!/usr/bin/env node

/**
 * 项目管理大师 - Vercel 一键部署脚本
 * 使用方法: node scripts/deploy-vercel.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 项目管理大师 - Vercel 部署工具');
console.log('=====================================\n');

// 检查必要的工具
function checkRequirements() {
    console.log('🔍 检查部署环境...');

    try {
        // 检查 Node.js
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Node.js: ${nodeVersion}`);

        // 检查 npm
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(`✅ npm: ${npmVersion}`);

        // 检查 git
        const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Git: ${gitVersion}`);

        return true;
    } catch (error) {
        console.log('❌ 环境检查失败，请确保已安装 Node.js、npm 和 Git');
        return false;
    }
}

// 检查项目结构
function checkProjectStructure() {
    console.log('\n📁 检查项目结构...');

    const requiredFiles = [
        'package.json',
        'vercel.json',
        '.env.example',
        'frontend/dist/index.html',
        'supabase/setup.sql',
        'supabase/rls_policies.sql'
    ];

    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ 缺少文件: ${file}`);
            return false;
        }
    }

    return true;
}

// 安装依赖
function installDependencies() {
    console.log('\n📦 安装依赖包...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ 依赖安装完成');
        return true;
    } catch (error) {
        console.log('❌ 依赖安装失败');
        return false;
    }
}

// 构建前端
function buildFrontend() {
    console.log('\n🔨 构建前端应用...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ 前端构建完成');
        return true;
    } catch (error) {
        console.log('❌ 前端构建失败');
        return false;
    }
}

// 检查环境变量
function checkEnvironmentVariables() {
    console.log('\n🔧 检查环境变量...');

    // 检查 .env 文件
    if (fs.existsSync('.env')) {
        console.log('✅ 找到 .env 文件');

        const envContent = fs.readFileSync('.env', 'utf8');
        const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

        for (const varName of requiredVars) {
            if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
                console.log(`✅ ${varName} 已配置`);
            } else {
                console.log(`⚠️  ${varName} 需要配置`);
            }
        }
    } else {
        console.log('⚠️  未找到 .env 文件，请复制 .env.example 并填入配置');
    }

    return true;
}

// 部署到 Vercel
function deployToVercel() {
    console.log('\n🚀 开始部署到 Vercel...');

    try {
        // 检查是否已安装 Vercel CLI
        try {
            execSync('vercel --version', { stdio: 'pipe' });
        } catch (error) {
            console.log('📥 安装 Vercel CLI...');
            execSync('npm install -g vercel', { stdio: 'inherit' });
        }

        // 部署
        console.log('📤 正在部署...');
        execSync('vercel --prod', { stdio: 'inherit' });

        console.log('\n🎉 部署完成！');
        return true;
    } catch (error) {
        console.log('❌ 部署失败:', error.message);
        return false;
    }
}

// 显示部署后信息
function showPostDeployInfo() {
    console.log('\n📋 部署后检查清单:');
    console.log('1. 确认在 Vercel 中设置了正确的环境变量');
    console.log('2. 访问 Supabase 并运行数据库设置脚本');
    console.log('3. 测试应用是否正常工作');
    console.log('4. 配置自定义域名（如果需要）');

    console.log('\n📚 有用的链接:');
    console.log('- Vercel 控制台: https://vercel.com/dashboard');
    console.log('- Supabase 控制台: https://supabase.com/dashboard');
    console.log('- 项目文档: README.md');

    console.log('\n🎯 下一步:');
    console.log('1. 在 Vercel 中设置环境变量');
    console.log('2. 在 Supabase 中运行 SQL 脚本');
    console.log('3. 分享你的应用链接！');
}

// 主函数
async function main() {
    try {
        // 环境检查
        if (!checkRequirements()) {
            process.exit(1);
        }

        // 项目结构检查
        if (!checkProjectStructure()) {
            console.log('\n❌ 项目结构不完整，请确保所有必需文件都存在');
            process.exit(1);
        }

        // 安装依赖
        if (!installDependencies()) {
            process.exit(1);
        }

        // 检查环境变量
        checkEnvironmentVariables();

        // 构建前端
        if (!buildFrontend()) {
            process.exit(1);
        }

        // 部署到 Vercel
        if (!deployToVercel()) {
            process.exit(1);
        }

        // 显示部署后信息
        showPostDeployInfo();

    } catch (error) {
        console.error('❌ 部署过程中发生错误:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    checkRequirements,
    checkProjectStructure,
    installDependencies,
    buildFrontend,
    deployToVercel
};