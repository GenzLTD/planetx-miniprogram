#!/usr/bin/env node

/**
 * 类型迁移工具
 * 帮助将 miniprogram 中的类型导入从 '../types/index' 迁移到 '@looma/shared-core'
 */

const fs = require('fs');
const path = require('path');

// 类型映射表
const TYPE_MAPPINGS = {
  // 从 miniprogram/types/index.ts 到 @looma/shared-core 的映射
  'Tier': 'Tier',
  'Role': 'Role',
  'User': 'User',
  'UserProfile': 'UserProfile',
  'AuthResponse': 'AuthResponse',
  'QuotaRecord': 'QuotaRecord',
  'QuotaResponse': 'QuotaResponse',
  'Identity': 'PlanetXIdentity',
  'IDENTITY_LABELS': 'IDENTITY_LABELS',
  'TraitKey': 'PlanetXTraitKey',
  'PersonalityType': 'PlanetXPersonalityType',
  'QuizOption': 'PlanetXQuizOption',
  'QuizQuestion': 'PlanetXQuizQuestion',
  'MissionId': 'PlanetXMissionId',
  'Fleet': 'PlanetXFleet',
  'RankName': 'PlanetXRankName',
  'getRankName': 'getPlanetXRankName',
  'GameProfile': 'GameProfile',
  'DocSource': 'DocSource',
  'ChatMessage': 'ChatMessage',
  'AskResponse': 'AskResponse',
  'RESOURCE_ASK': 'RESOURCE_ASK',
  'RESOURCE_JOB_MATCH': 'RESOURCE_JOB_MATCH',
  'RESOURCE_RESUME_PARSE': 'RESOURCE_RESUME_PARSE',
  'QUOTA_LIMITS': 'QUOTA_LIMITS',
  'BRAND': 'BRAND',
  'AppEvent': 'AppEvent', // 注意：这个在 shared-core 中没有，需要保持或使用兼容层
};

// 需要特殊处理的文件
const SPECIAL_FILES = {
  'utils/store.ts': {
    // store.ts 需要特殊的 GameProfile 适配
    imports: [
      "import type { User, GameProfile, Identity, PersonalityType, MissionId, Fleet } from '@looma/shared-core'",
      "import { hydratePersonality } from '@looma/shared-core'",
    ],
    replacements: [
      {
        from: "import type { User, GameProfile, Identity, PersonalityType, MissionId, Fleet } from '../types/index'",
        to: "import type { User, Identity, PersonalityType, MissionId, Fleet } from '@looma/shared-core'",
      },
      {
        from: "import { hydratePersonality } from '../constants/quiz'",
        to: "import { hydratePersonality } from '@looma/shared-core'",
      },
    ],
  },
  'utils/api.ts': {
    imports: [
      "import { createPlatformAwareApiClient, createMiniApiClient, wxStorageAdapter } from '@looma/shared-core'",
      "import { createAuthApi, createGameApi, createChatApi, createQuotaApi, createReferralApi, createComplianceApi } from '@looma/shared-core'",
    ],
  },
};

function migrateFile(filePath) {
  console.log(`处理文件: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let migratedContent = content;
  
  // 检查是否有来自 '../types/index' 的导入
  const typeImportRegex = /import\s+(?:type\s+)?{[^}]*}\s+from\s+['"]\.\.\/types\/index['"]/g;
  const typeImports = content.match(typeImportRegex);
  
  if (typeImports) {
    console.log(`  找到类型导入: ${typeImports.length} 个`);
    
    for (const importStatement of typeImports) {
      // 提取导入的符号
      const importMatch = importStatement.match(/import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]\.\.\/types\/index['"]/);
      if (!importMatch) continue;
      
      const symbols = importMatch[1].split(',').map(s => s.trim()).filter(s => s);
      console.log(`    导入的符号: ${symbols.join(', ')}`);
      
      // 映射到 shared-core
      const mappedSymbols = symbols.map(symbol => {
        if (symbol.startsWith('type ')) {
          const typeName = symbol.replace('type ', '').trim();
          const mapped = TYPE_MAPPINGS[typeName] || typeName;
          return `type ${mapped}`;
        }
        return TYPE_MAPPINGS[symbol] || symbol;
      });
      
      // 创建新的导入语句
      const newImport = `import { ${mappedSymbols.join(', ')} } from '@looma/shared-core'`;
      
      // 替换导入
      migratedContent = migratedContent.replace(importStatement, newImport);
      console.log(`    替换为: ${newImport}`);
    }
  }
  
  // 检查是否有来自 '../constants/quiz' 的导入
  const quizImportRegex = /import\s+{[^}]*}\s+from\s+['"]\.\.\/constants\/quiz['"]/g;
  const quizImports = migratedContent.match(quizImportRegex);
  
  if (quizImports) {
    console.log(`  找到 quiz 常量导入: ${quizImports.length} 个`);
    migratedContent = migratedContent.replace(quizImportRegex, "import { hydratePersonality } from '@looma/shared-core'");
  }
  
  // 特殊文件处理
  const relativePath = path.relative(__dirname, filePath).replace('../', '');
  if (SPECIAL_FILES[relativePath]) {
    console.log(`  应用特殊处理规则`);
    const specialRules = SPECIAL_FILES[relativePath];
    
    if (specialRules.replacements) {
      specialRules.replacements.forEach(replacement => {
        migratedContent = migratedContent.replace(replacement.from, replacement.to);
      });
    }
  }
  
  // 如果内容有变化，写入文件
  if (migratedContent !== content) {
    fs.writeFileSync(filePath, migratedContent, 'utf8');
    console.log(`  文件已更新`);
  } else {
    console.log(`  无需更改`);
  }
  
  console.log();
}

function findTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和 typings 目录
        if (item !== 'node_modules' && item !== 'typings') {
          traverse(fullPath);
        }
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function main() {
  const miniprogramDir = path.join(__dirname, '..');
  const tsFiles = findTsFiles(miniprogramDir);
  
  console.log(`找到 ${tsFiles.length} 个 TypeScript 文件`);
  console.log('='.repeat(50));
  
  let migratedCount = 0;
  
  for (const file of tsFiles) {
    try {
      migrateFile(file);
      migratedCount++;
    } catch (error) {
      console.error(`处理文件失败 ${file}:`, error.message);
    }
  }
  
  console.log('='.repeat(50));
  console.log(`迁移完成: ${migratedCount}/${tsFiles.length} 个文件已处理`);
  console.log('');
  console.log('下一步:');
  console.log('1. 运行 TypeScript 类型检查: npm run typecheck');
  console.log('2. 修复任何类型错误');
  console.log('3. 测试应用程序功能');
  console.log('4. 删除 miniprogram/types/index.ts (如果不再需要)');
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, findTsFiles };